-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Servers table
CREATE TABLE IF NOT EXISTS public.servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  attachments TEXT[]
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#99aab5',
  permissions JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Server members table
CREATE TABLE IF NOT EXISTS public.server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(server_id, user_id)
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- DM messages table
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dm_id UUID NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  attachments TEXT[]
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON public.channels(server_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON public.server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_dm_id ON public.dm_messages(dm_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at ON public.dm_messages(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Users: Users can read all, update own
CREATE POLICY "Users can read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Servers: Members can read, owners can modify
CREATE POLICY "Server members can read servers" ON public.servers FOR SELECT 
  USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.server_members WHERE server_id = servers.id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Server owners can update servers" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Server owners can delete servers" ON public.servers FOR DELETE USING (auth.uid() = owner_id);

-- Channels: Server members can read, owners/admins can modify
CREATE POLICY "Server members can read channels" ON public.channels FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = channels.server_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.server_members WHERE server_id = channels.server_id AND user_id = auth.uid())
  );
CREATE POLICY "Server owners can manage channels" ON public.channels FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = channels.server_id AND owner_id = auth.uid())
  );

-- Messages: Server members can read/write
CREATE POLICY "Server members can read messages" ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      JOIN public.channels c ON c.server_id = sm.server_id
      WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.servers s
      JOIN public.channels c ON c.server_id = s.id
      WHERE c.id = messages.channel_id AND s.owner_id = auth.uid()
    )
  );
CREATE POLICY "Server members can send messages" ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    (EXISTS (
      SELECT 1 FROM public.server_members sm
      JOIN public.channels c ON c.server_id = sm.server_id
      WHERE c.id = messages.channel_id AND sm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.servers s
      JOIN public.channels c ON c.server_id = s.id
      WHERE c.id = messages.channel_id AND s.owner_id = auth.uid()
    ))
  );
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- Server members: Members can read, owners can manage
CREATE POLICY "Server members can read members" ON public.server_members FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = server_members.server_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.server_members WHERE server_id = server_members.server_id AND user_id = auth.uid())
  );
CREATE POLICY "Server owners can manage members" ON public.server_members FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = server_members.server_id AND owner_id = auth.uid())
  );

-- Roles: Server members can read, owners can manage
CREATE POLICY "Server members can read roles" ON public.roles FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = roles.server_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.server_members WHERE server_id = roles.server_id AND user_id = auth.uid())
  );
CREATE POLICY "Server owners can manage roles" ON public.roles FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.servers WHERE id = roles.server_id AND owner_id = auth.uid())
  );

-- Friendships: Users can manage their own friendships
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Direct messages: Participants can read
CREATE POLICY "DM participants can read DMs" ON public.direct_messages FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create DMs" ON public.direct_messages FOR INSERT 
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DM messages: Participants can read/write
CREATE POLICY "DM participants can read messages" ON public.dm_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_messages 
      WHERE id = dm_messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
CREATE POLICY "DM participants can send messages" ON public.dm_messages FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.direct_messages 
      WHERE id = dm_messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
CREATE POLICY "Users can update own DM messages" ON public.dm_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own DM messages" ON public.dm_messages FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'offline'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
