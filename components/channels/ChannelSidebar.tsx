'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Channel, Server } from '@/lib/types';
import { Hash, Mic, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ChannelSidebar() {
  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const serverId = params?.serverId as string;

  useEffect(() => {
    if (serverId) {
      loadServerData();
    }
  }, [serverId]);

  const loadServerData = async () => {
    try {
      const { data: serverData } = await supabase
        .from('servers')
        .select('*')
        .eq('id', serverId)
        .single();

      setServer(serverData);

      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position');

      setChannels(channelsData || []);
    } catch (error) {
      console.error('Error loading server data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !server) {
    return (
      <div className="w-60 bg-gray-800 flex flex-col">
        <div className="h-12 border-b border-gray-700 px-4 flex items-center">
          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  return (
    <div className="w-60 bg-gray-800 flex flex-col">
      {/* Server Header */}
      <div className="h-12 border-b border-gray-700 px-4 flex items-center justify-between shadow-sm">
        <h2 className="font-semibold text-white truncate">{server.name}</h2>
        <button
          onClick={() => router.push(`/app/servers/${serverId}/settings`)}
          className="text-gray-400 hover:text-white"
          title="Server Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div className="mb-4">
            <div className="px-2 py-1 flex items-center justify-between group">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Text Channels
              </span>
              <button
                onClick={() => router.push(`/app/servers/${serverId}/create-channel?type=text`)}
                className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Create Text Channel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {textChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/app/servers/${serverId}/channels/${channel.id}`}
                  className="flex items-center px-2 py-1 rounded hover:bg-gray-700 text-gray-300 hover:text-white group"
                >
                  <Hash className="w-4 h-4 mr-1.5" />
                  <span className="flex-1 truncate">{channel.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div>
            <div className="px-2 py-1 flex items-center justify-between group">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Voice Channels
              </span>
              <button
                onClick={() => router.push(`/app/servers/${serverId}/create-channel?type=voice`)}
                className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Create Voice Channel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {voiceChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/app/servers/${serverId}/channels/${channel.id}/voice`}
                  className="flex items-center px-2 py-1 rounded hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  <Mic className="w-4 h-4 mr-1.5" />
                  <span className="flex-1 truncate">{channel.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No channels message */}
        {channels.length === 0 && (
          <div className="px-2 py-4 text-center text-gray-400 text-sm">
            No channels yet. Create one to get started!
          </div>
        )}
      </div>

      {/* User Panel Placeholder */}
      <div className="h-12 border-t border-gray-700 px-2 flex items-center">
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-700" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">User</div>
            <div className="text-xs text-gray-400">#0000</div>
          </div>
        </div>
      </div>
    </div>
  );
}
