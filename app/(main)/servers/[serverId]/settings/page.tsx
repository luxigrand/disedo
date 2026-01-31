'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Server } from '@/lib/types';

export default function ServerSettingsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const [serverId, setServerId] = useState<string>('');
  const [server, setServer] = useState<Server | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    params.then((p) => {
      setServerId(p.serverId);
      loadServer(p.serverId);
    });
  }, [params]);

  const loadServer = async (id: string) => {
    try {
      const { data: serverData } = await supabase
        .from('servers')
        .select('*')
        .eq('id', id)
        .single();

      if (serverData) {
        setServer(serverData);
        setName(serverData.name);
      }
    } catch (error) {
      console.error('Error loading server:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serverId) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify ownership
      if (server?.owner_id !== user.id) {
        throw new Error('Only server owners can update settings');
      }

      const { error: updateError } = await supabase
        .from('servers')
        .update({ name: name.trim() })
        .eq('id', serverId);

      if (updateError) throw updateError;

      router.push(`/app/servers/${serverId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (server?.owner_id !== user.id) {
        throw new Error('Only server owners can delete servers');
      }

      const { error: deleteError } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId);

      if (deleteError) throw deleteError;

      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to delete server');
    } finally {
      setLoading(false);
    }
  };

  if (!server) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold text-white">Server Settings</h2>
        </div>
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Server Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={100}
            />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 rounded-md border border-red-600 bg-red-600/10 px-4 py-2 text-red-400 hover:bg-red-600/20 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Server</span>
          </button>
        </div>
      </div>
    </div>
  );
}
