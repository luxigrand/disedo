import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's first server or redirect to create one
  const { data: servers } = await supabase
    .from('server_members')
    .select('server_id')
    .eq('user_id', user.id)
    .limit(1);

  if (servers && servers.length > 0) {
    const { data: channels } = await supabase
      .from('channels')
      .select('id')
      .eq('server_id', servers[0].server_id)
      .order('position')
      .limit(1);

    if (channels && channels.length > 0) {
      redirect(`/app/servers/${servers[0].server_id}/channels/${channels[0].id}`);
    } else {
      redirect(`/app/servers/${servers[0].server_id}`);
    }
  }

  // No servers, show welcome/create server page
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Disedo</h1>
        <p className="text-gray-400 mb-8">Create or join a server to get started</p>
        <a
          href="/app/create-server"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Create Server
        </a>
      </div>
    </div>
  );
}
