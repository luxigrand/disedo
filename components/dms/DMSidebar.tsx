'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DirectMessage, User } from '@/lib/types';
import { MessageSquare, Plus, User as UserIcon } from 'lucide-react';

export default function DMSidebar() {
  const [dms, setDms] = useState<(DirectMessage & { otherUser?: User })[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadDMs();
    loadFriends();
    const cleanup = startPolling();
    return cleanup;
  }, []);

  const loadDMs = async () => {
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
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dmData) {
        const formatted = dmData.map((dm: any) => {
          const otherUser = dm.user1_id === user.id ? dm.user2 : dm.user1;
          return {
            ...dm,
            otherUser,
          };
        });
        setDms(formatted);
      }
    } catch (error) {
      console.error('Error loading DMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:users!friendships_friend_id_fkey(id, username, avatar_url, status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendships) {
        const friendUsers = friendships.map((f: any) => f.friend).filter(Boolean);
        setFriends(friendUsers);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const startPolling = () => {
    const interval = setInterval(() => {
      loadDMs();
      loadFriends();
    }, 3000);

    return () => {
      if (interval) clearInterval(interval);
    };
  };

  const handleCreateDM = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if DM already exists
      const { data: existingDM } = await supabase
        .from('direct_messages')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)
        .single();

      if (existingDM) {
        router.push(`/app/dms/${existingDM.id}`);
        return;
      }

      // Create new DM
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
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="h-12 border-b border-gray-700 px-4 flex items-center">
          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-gray-800 flex flex-col">
      <div className="h-12 border-b border-gray-700 px-4 flex items-center justify-between shadow-sm">
        <h2 className="font-semibold text-white">Direct Messages</h2>
        <button
          onClick={() => router.push('/app/friends')}
          className="text-gray-400 hover:text-white"
          title="Friends"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {dms.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              Messages
            </div>
            <div className="space-y-1">
              {dms.map((dm) => {
                const isActive = pathname?.includes(`/dms/${dm.id}`);
                return (
                  <button
                    key={dm.id}
                    onClick={() => router.push(`/app/dms/${dm.id}`)}
                    className={`w-full flex items-center px-2 py-1 rounded hover:bg-gray-700 text-gray-300 hover:text-white group ${
                      isActive ? 'bg-gray-700 text-white' : ''
                    }`}
                  >
                    <div className="relative mr-2">
                      <img
                        src={dm.otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${dm.otherUser?.username}`}
                        alt={dm.otherUser?.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
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
                    <span className="flex-1 truncate text-left">{dm.otherUser?.username}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {friends.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              Friends
            </div>
            <div className="space-y-1">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleCreateDM(friend.id)}
                  className="w-full flex items-center px-2 py-1 rounded hover:bg-gray-700 text-gray-300 hover:text-white group"
                >
                  <div className="relative mr-2">
                    <img
                      src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`}
                      alt={friend.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
                        friend.status === 'online'
                          ? 'bg-green-500'
                          : friend.status === 'away'
                          ? 'bg-yellow-500'
                          : friend.status === 'busy'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <span className="flex-1 truncate text-left">{friend.username}</span>
                  <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}

        {dms.length === 0 && friends.length === 0 && (
          <div className="px-2 py-4 text-center text-gray-400 text-sm">
            No direct messages yet. Add friends to start chatting!
          </div>
        )}
      </div>
    </div>
  );
}
