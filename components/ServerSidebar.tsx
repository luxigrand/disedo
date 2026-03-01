'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Hash } from 'lucide-react'
import AllServersModal from './servers/AllServersModal'

interface Server {
  id: string
  name: string
  icon_url: string | null
}

export default function ServerSidebar({
  selectedServer,
  onSelectServer,
}: {
  selectedServer: string | null
  onSelectServer: (serverId: string) => void
}) {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllServersModal, setShowAllServersModal] = useState(false)

  useEffect(() => {
    loadServers()

    // Subscribe to server changes
    const channel = supabase
      .channel('servers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servers',
        },
        () => {
          loadServers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadServers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membersData, error: membersError } = await supabase
        .from('server_members')
        .select('server_id')
        .eq('user_id', user.id)

      if (membersError) throw membersError

      const serverIds = membersData?.map((m) => m.server_id) || []

      if (serverIds.length === 0) {
        setServers([])
        setLoading(false)
        return
      }

      const { data: serversData, error: serversError } = await supabase
        .from('servers')
        .select('*')
        .in('id', serverIds)
        .order('created_at', { ascending: true })

      if (serversError) throw serversError

      setServers(serversData || [])
      
      // Auto-select first server if none selected
      if (!selectedServer && serversData && serversData.length > 0) {
        onSelectServer(serversData[0].id)
      }
    } catch (error) {
      console.error('Error loading servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateServer = async () => {
    const name = prompt('Sunucu adı:')
    if (!name) return

    const password = prompt('Sunucu şifresi (boş bırakabilirsiniz):')
    // password null ise boş string, undefined ise null olarak kaydet
    const serverPassword = password === '' ? null : password || null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name,
          owner_id: user.id,
          password: serverPassword,
        })
        .select()
        .single()

      if (serverError) throw serverError

      // Add owner as member
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Create default channel
      const { error: channelError } = await supabase
        .from('channels')
        .insert({
          server_id: server.id,
          name: 'genel',
          type: 'text',
        })

      if (channelError) throw channelError

      onSelectServer(server.id)
    } catch (error) {
      console.error('Error creating server:', error)
      alert('Sunucu oluşturulurken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-[#202225] flex flex-col items-center py-3">
        <div className="w-12 h-12 rounded-full bg-[#36393f] animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#202225] flex flex-col items-center py-3 gap-2 overflow-y-auto">
      {/* Home/DMs button - Tüm Sunucular */}
      <button
        onClick={() => setShowAllServersModal(true)}
        className="w-12 h-12 rounded-full bg-[#5865f2] hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-white font-semibold hover:bg-[#4752c4]"
        title="Tüm Sunucular"
      >
        <Hash className="w-6 h-6" />
      </button>

      <div className="w-8 h-0.5 bg-[#40444b] my-1"></div>

      {/* Server list */}
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => onSelectServer(server.id)}
          className={`w-12 h-12 rounded-full hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-white font-semibold ${
            selectedServer === server.id
              ? 'bg-[#5865f2] rounded-2xl'
              : 'bg-[#36393f] hover:bg-[#5865f2]'
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
            <span className="text-lg">
              {server.name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      ))}

      {/* Add server button */}
      <button
        onClick={handleCreateServer}
        className="w-12 h-12 rounded-full bg-[#36393f] hover:rounded-2xl hover:bg-[#43b581] transition-all duration-200 flex items-center justify-center text-[#43b581] hover:text-white"
        title="Sunucu Ekle"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* All Servers Modal */}
      <AllServersModal
        isOpen={showAllServersModal}
        onClose={() => setShowAllServersModal(false)}
        onSelectServer={onSelectServer}
      />
    </div>
  )
}
