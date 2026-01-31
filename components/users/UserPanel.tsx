'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserPanel() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await supabase
        .from('users')
        .update({ status: 'offline' })
        .eq('id', user.id);
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="h-12 border-t border-gray-700 px-2 flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-12 border-t border-gray-700 px-2 flex items-center justify-between bg-gray-800">
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <div className="relative">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
            alt={user.username}
            className="w-8 h-8 rounded-full"
          />
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
              user.status === 'online'
                ? 'bg-green-500'
                : user.status === 'away'
                ? 'bg-yellow-500'
                : user.status === 'busy'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{user.username}</div>
          <div className="text-xs text-gray-400 capitalize">{user.status}</div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => router.push('/app/settings')}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
