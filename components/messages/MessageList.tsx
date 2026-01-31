'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { Message } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Edit2, Trash2, Smile } from 'lucide-react';

interface MessageListProps {
  channelId: string;
}

export default function MessageList({ channelId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (channelId) {
      loadCurrentUser();
      loadMessages();
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [channelId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages = (messagesData || []).map((msg: any) => ({
        ...msg,
        user: msg.user,
      }));

      setMessages(formattedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!channelId) return;

      try {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (!lastMessage) {
            // If no messages, try to reload all
            loadMessages();
            return prev;
          }

          // Fetch new messages
          supabase
            .from('messages')
            .select(`
              *,
              user:users(id, username, avatar_url)
            `)
            .eq('channel_id', channelId)
            .gt('created_at', lastMessage.created_at)
            .order('created_at', { ascending: true })
            .then(({ data: newMessages }) => {
              if (newMessages && newMessages.length > 0) {
                const formatted = newMessages.map((msg: any) => ({
                  ...msg,
                  user: msg.user,
                }));
                setMessages((current) => {
                  const existingIds = new Set(current.map(m => m.id));
                  const unique = formatted.filter(m => !existingIds.has(m.id));
                  if (unique.length > 0) {
                    const updated = [...current, ...unique];
                    setTimeout(scrollToBottom, 100);
                    return updated;
                  }
                  return current;
                });
              }
            })
            .catch((error) => {
              console.error('Error polling messages:', error);
            });
          return prev;
        });
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: editContent, updated_at: new Date().toISOString() } : msg
        )
      );
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl font-semibold mb-2">Welcome to the beginning of this channel</p>
          <p className="text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
        const showTimestamp =
          index === 0 ||
          new Date(message.created_at).getTime() -
            new Date(messages[index - 1].created_at).getTime() >
            300000; // 5 minutes

        const isOwnMessage = message.user_id === currentUserId;
        const isEditing = editingId === message.id;

        return (
          <div key={message.id} className="flex space-x-4 group hover:bg-gray-800/50 px-2 py-1 rounded">
            {showAvatar ? (
              <img
                src={message.user?.avatar_url || `https://ui-avatars.com/api/?name=${message.user?.username}`}
                alt={message.user?.username}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-white">{message.user?.username}</span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {message.updated_at !== message.created_at && (
                    <span className="text-xs text-gray-500">(edited)</span>
                  )}
                </div>
              )}
              {showTimestamp && !showAvatar && (
                <div className="text-xs text-gray-400 mb-1">
                  {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              )}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap break-words">{message.content}</p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((url, i) => (
                    <div key={i}>
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={url}
                          alt="Attachment"
                          className="max-w-md rounded-md"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {url.split('/').pop()}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isOwnMessage && !isEditing && (
                <div className="flex items-center space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(message)}
                    className="text-gray-400 hover:text-white"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
