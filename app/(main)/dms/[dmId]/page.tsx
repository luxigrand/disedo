'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DMMessage, DirectMessage, User } from '@/lib/types';
import { format } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import ServerSidebar from '@/components/servers/ServerSidebar';
import DMSidebar from '@/components/dms/DMSidebar';
import UserPanel from '@/components/users/UserPanel';

export default function DMPage() {
  const params = useParams();
  const dmId = params?.dmId as string;
  const [dm, setDm] = useState<DirectMessage & { otherUser?: User } | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const messagesEndRef = useState<HTMLDivElement | null>(null)[0];

  useEffect(() => {
    if (dmId) {
      loadCurrentUser();
      loadDM();
      loadMessages();
      startPolling();
    }
  }, [dmId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadDM = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dmData } = await supabase
        .from('direct_messages')
        .select(`
          *,
          user1:users!direct_messages_user1_id_fkey(id, username, avatar_url, status),
          user2:users!direct_messages_user2_id_fkey(id, username, avatar_url, status)
        `)
        .eq('id', dmId)
        .single();

      if (dmData) {
        const otherUser = dmData.user1_id === user.id ? dmData.user2 : dmData.user1;
        setDm({ ...dmData, otherUser });
      }
    } catch (error) {
      console.error('Error loading DM:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData } = await supabase
        .from('dm_messages')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .eq('dm_id', dmId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesData) {
        const formatted = messagesData.map((msg: any) => ({
          ...msg,
          user: msg.user,
        }));
        setMessages(formatted);
        setTimeout(() => {
          const el = document.getElementById('messages-end');
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      if (!dmId) return;

      try {
        const lastMessage = messages[messages.length - 1];
        const query = supabase
          .from('dm_messages')
          .select(`
            *,
            user:users(id, username, avatar_url)
          `)
          .eq('dm_id', dmId)
          .order('created_at', { ascending: true });

        if (lastMessage) {
          query.gt('created_at', lastMessage.created_at);
        }

        const { data: newMessages } = await query;

        if (newMessages && newMessages.length > 0) {
          const formatted = newMessages.map((msg: any) => ({
            ...msg,
            user: msg.user,
          }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map(m => m.id));
            const unique = formatted.filter(m => !existingIds.has(m.id));
            return [...prev, ...unique];
          });
          setTimeout(() => {
            const el = document.getElementById('messages-end');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !dmId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('dm_messages').insert({
        dm_id: dmId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      setContent('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEdit = (message: DMMessage) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('dm_messages')
        .update({ content: editContent })
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: editContent } : msg))
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
      const { error } = await supabase.from('dm_messages').delete().eq('id', messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading || !dm) {
    return (
      <div className="flex h-screen w-full">
        <ServerSidebar />
        <DMSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
        <UserPanel />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      <DMSidebar />
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="h-12 border-b border-gray-700 px-4 flex items-center shadow-sm">
          <div className="relative mr-3">
            <img
              src={dm.otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${dm.otherUser?.username}`}
              alt={dm.otherUser?.username}
              className="w-8 h-8 rounded-full"
            />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                dm.otherUser?.status === 'online'
                  ? 'bg-green-500'
                  : dm.otherUser?.status === 'away'
                  ? 'bg-yellow-500'
                  : dm.otherUser?.status === 'busy'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>
          <h1 className="font-semibold text-white">{dm.otherUser?.username}</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
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
          <div id="messages-end" />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
          <div className="flex items-end space-x-4">
            <div className="flex-1 rounded-lg bg-gray-700 border border-gray-600 focus-within:border-gray-500">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`Message @${dm.otherUser?.username}`}
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none max-h-40"
                style={{ minHeight: '44px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!content.trim()}
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
      <UserPanel />
    </div>
  );
}
