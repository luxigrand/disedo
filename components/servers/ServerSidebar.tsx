'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Server } from '@/lib/types';
import { Plus, Hash } from 'lucide-react';
import Link from 'next/link';

export default function ServerSidebar() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: members } = await supabase
        .from('server_members')
        .select('server_id')
        .eq('user_id', user.id);

      if (!members || members.length === 0) {
        setLoading(false);
        return;
      }

      const serverIds = members.map(m => m.server_id);
      const { data: serversData } = await supabase
        .from('servers')
        .select('*')
        .in('id', serverIds)
        .order('created_at');

      setServers(serversData || []);
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = () => {
    router.push('/app/create-server');
  };

  if (loading) {
    return (
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3 space-y-2">
        <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-3 space-y-2 overflow-y-auto">
      <button
        onClick={handleCreateServer}
        className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 flex items-center justify-center transition-colors group"
        title="Create Server"
      >
        <Plus className="w-6 h-6 text-green-500 group-hover:text-white" />
      </button>

      <div className="w-12 h-0.5 bg-gray-700" />

      {servers.map((server) => {
        const isActive = pathname?.includes(`/servers/${server.id}`);
        return (
          <Link
            key={server.id}
            href={`/app/servers/${server.id}`}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:rounded-2xl ${
              isActive
                ? 'bg-blue-600 rounded-2xl'
                : 'bg-gray-700 hover:bg-blue-600 hover:rounded-2xl'
            }`}
            title={server.name}
          >
            {server.icon_url ? (
              <img
                src={server.icon_url}
                alt={server.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-lg">
                {server.name.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
