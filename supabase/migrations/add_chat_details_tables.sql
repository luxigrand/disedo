-- Add columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Message replies table
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reply_to_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread messages (messages in a thread)
CREATE TABLE IF NOT EXISTS thread_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pinned messages table
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- Channel info table
CREATE TABLE IF NOT EXISTS channel_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL UNIQUE REFERENCES channels(id) ON DELETE CASCADE,
  description TEXT,
  rules TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their server channels"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE m.id = message_reactions.message_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE m.id = message_reactions.message_id
      AND sm.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for message_replies
CREATE POLICY "Users can view replies in their server channels"
  ON message_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE m.id = message_replies.message_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create replies"
  ON message_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE m.id = message_replies.message_id
      AND sm.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- RLS Policies for message_threads
CREATE POLICY "Users can view threads in their server channels"
  ON message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE m.id = message_threads.message_id
      AND sm.user_id = auth.uid()
    )
  );

-- RLS Policies for thread_messages
CREATE POLICY "Users can view thread messages"
  ON thread_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      JOIN messages m ON m.id = mt.message_id
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE mt.id = thread_messages.thread_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create thread messages"
  ON thread_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads mt
      JOIN messages m ON m.id = mt.message_id
      JOIN channels c ON c.id = m.channel_id
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE mt.id = thread_messages.thread_id
      AND sm.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- RLS Policies for pinned_messages
CREATE POLICY "Users can view pinned messages in their server channels"
  ON pinned_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = pinned_messages.channel_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can pin messages"
  ON pinned_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = pinned_messages.channel_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin', 'moderator')
    )
    AND auth.uid() = pinned_by
  );

CREATE POLICY "Admins can unpin messages"
  ON pinned_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = pinned_messages.channel_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin', 'moderator')
    )
  );

-- RLS Policies for channel_info
CREATE POLICY "Users can view channel info of their servers"
  ON channel_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = channel_info.channel_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update channel info"
  ON channel_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      JOIN server_members sm ON sm.server_id = c.server_id
      WHERE c.id = channel_info.channel_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE message_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE thread_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_reply_to ON message_replies(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_message_id ON message_threads(message_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_channel_id ON pinned_messages(channel_id);
