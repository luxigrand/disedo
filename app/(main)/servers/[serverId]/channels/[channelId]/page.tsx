import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ServerSidebar from '@/components/servers/ServerSidebar';
import ChannelSidebar from '@/components/channels/ChannelSidebar';
import MessageList from '@/components/messages/MessageList';
import MessageInput from '@/components/messages/MessageInput';
import UserPanel from '@/components/users/UserPanel';

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = await params;
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

  // Verify channel exists and belongs to server
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .eq('server_id', serverId)
    .single();

  if (!channel) {
    redirect(`/app/servers/${serverId}`);
  }

  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      <ChannelSidebar />
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Channel Header */}
        <div className="h-12 border-b border-gray-700 px-4 flex items-center shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">#</span>
            <h1 className="font-semibold text-white">{channel.name}</h1>
          </div>
        </div>

        {/* Messages Area */}
        <MessageList channelId={channelId} />

        {/* Message Input */}
        <MessageInput channelId={channelId} />
      </div>
      <UserPanel />
    </div>
  );
}
