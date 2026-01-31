import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ServerSidebar from '@/components/servers/ServerSidebar';
import ChannelSidebar from '@/components/channels/ChannelSidebar';
import UserPanel from '@/components/users/UserPanel';

export default async function ServerPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify user is member of server
  const { data: member } = await supabase
    .from('server_members')
    .select('id')
    .eq('server_id', serverId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect('/app');
  }

  // Get first channel or redirect
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', serverId)
    .order('position')
    .limit(1);

  if (channels && channels.length > 0) {
    redirect(`/app/servers/${serverId}/channels/${channels[0].id}`);
  }

  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      <ChannelSidebar />
      <div className="flex-1 flex flex-col bg-gray-900 items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl font-semibold mb-2">No channels yet</p>
          <p className="text-sm">Create a channel to get started!</p>
        </div>
      </div>
      <UserPanel />
    </div>
  );
}
