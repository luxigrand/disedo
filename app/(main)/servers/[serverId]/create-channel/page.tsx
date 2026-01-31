'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateChannelPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const [serverId, setServerId] = useState<string>('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    params.then((p) => setServerId(p.serverId));
    const typeParam = searchParams?.get('type');
    if (typeParam === 'voice') {
      setType('voice');
    }
  }, [params, searchParams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serverId) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current max position
      const { data: channels } = await supabase
        .from('channels')
        .select('position')
        .eq('server_id', serverId)
        .eq('type', type)
        .order('position', { ascending: false })
        .limit(1);

      const position = channels && channels.length > 0 ? channels[0].position + 1 : 0;

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          type,
          position,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      if (type === 'text') {
        router.push(`/app/servers/${serverId}/channels/${channel.id}`);
      } else {
        router.push(`/app/servers/${serverId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-xl">
        <div>
          <Link
            href={`/app/servers/${serverId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h2 className="text-3xl font-bold text-white">Create Channel</h2>
          <p className="mt-2 text-sm text-gray-400">
            Create a {type} channel for your server.
          </p>
        </div>
        <form onSubmit={handleCreate} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Channel Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                  type === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setType('voice')}
                className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                  type === 'voice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Voice
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Channel Name
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-600 bg-gray-700 px-3 text-gray-400">
                #
              </span>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-r-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="new-channel"
                maxLength={100}
                pattern="[a-z0-9-]+"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Channel names must be lowercase and contain only letters, numbers, and hyphens.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href={`/app/servers/${serverId}`}
              className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-center font-medium text-white hover:bg-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
