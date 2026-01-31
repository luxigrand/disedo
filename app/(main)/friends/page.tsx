'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Friendship, User } from '@/lib/types';
import { UserPlus, Check, X, Ban, MessageSquare } from 'lucide-react';
import ServerSidebar from '@/components/servers/ServerSidebar';
import DMSidebar from '@/components/dms/DMSidebar';
import UserPanel from '@/components/users/UserPanel';

export default function FriendsPage() {
  const [friends, setFriends] = useState<(Friendship & { friend?: User })[]>([]);
  const [pending, setPending] = useState<(Friendship & { friend?: User })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  useEffect(() => {
    loadFriends();
    startPolling();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load accepted friends
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:users!friendships_friend_id_fkey(id, username, avatar_url, status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsData) {
        setFriends(friendsData);
      }

      // Load pending requests
      const { data: pendingData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:users!friendships_friend_id_fkey(id, username, avatar_url, status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (pendingData) {
        setPending(pendingData);
      }

      // Load incoming requests
      const { data: incomingData } = await supabase
        .from('friendships')
        .select(`
          *,
          user:users!friendships_user_id_fkey(id, username, avatar_url, status)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (incomingData) {
        const formatted = incomingData.map((f: any) => ({
          ...f,
          friend: f.user,
        }));
        setPending((prev) => [...prev, ...formatted]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(() => {
      loadFriends();
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);

      setSearchResults(users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

      if (error) throw error;

      loadFriends();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      loadFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);

      if (error) throw error;

      loadFriends();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleBlock = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update or create blocked friendship
      const { error } = await supabase
        .from('friendships')
        .upsert({
          user_id: user.id,
          friend_id: friendId,
          status: 'blocked',
        });

      if (error) throw error;

      loadFriends();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleCreateDM = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingDM } = await supabase
        .from('direct_messages')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)
        .single();

      if (existingDM) {
        router.push(`/app/dms/${existingDM.id}`);
      } else {
        const { data: newDM } = await supabase
          .from('direct_messages')
          .insert({
            user1_id: user.id,
            user2_id: friendId,
          })
          .select()
          .single();

        if (newDM) {
          router.push(`/app/dms/${newDM.id}`);
        }
      }
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  if (loading) {
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
          <h1 className="font-semibold text-white">Friends</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Search */}
          <div>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search for users by username..."
                className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-gray-400 capitalize">{user.status}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Pending Requests</h2>
              <div className="space-y-2">
                {pending.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={friendship.friend?.avatar_url || `https://ui-avatars.com/api/?name=${friendship.friend?.username}`}
                        alt={friendship.friend?.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{friendship.friend?.username}</div>
                        <div className="text-sm text-gray-400">
                          {friendship.user_id === currentUserId
                            ? 'Outgoing request'
                            : 'Incoming request'}
                        </div>
                      </div>
                    </div>
                    {friendship.user_id !== currentUserId && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(friendship.id)}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(friendship.id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              All Friends ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No friends yet. Search for users to add them!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-md hover:bg-gray-750"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={friendship.friend?.avatar_url || `https://ui-avatars.com/api/?name=${friendship.friend?.username}`}
                          alt={friendship.friend?.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                            friendship.friend?.status === 'online'
                              ? 'bg-green-500'
                              : friendship.friend?.status === 'away'
                              ? 'bg-yellow-500'
                              : friendship.friend?.status === 'busy'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white">{friendship.friend?.username}</div>
                        <div className="text-sm text-gray-400 capitalize">
                          {friendship.friend?.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateDM(friendship.friend_id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleBlock(friendship.friend_id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                        title="Block"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <UserPanel />
    </div>
  );
}
