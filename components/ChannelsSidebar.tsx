'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Hash, Volume2, ChevronDown, Plus, Settings } from 'lucide-react'
import UserControlPanel from './UserControlPanel'
import ServerSubgroups from '@/components/groups/ServerSubgroups'
import ServerSettingsModal from './servers/ServerSettingsModal'

interface Category {
  id: string
  name: string
  position: number
}

interface Channel {
  id: string
  name: string
  type: 'text' | 'voice'
  category_id: string | null
  position: number
}

export default function ChannelsSidebar({
  serverId,
  selectedChannel,
  onSelectChannel,
}: {
  serverId: string
  selectedChannel: string | null
  onSelectChannel: (channelId: string) => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [serverName, setServerName] = useState('')
  const [user, setUser] = useState<any>(null)
  const [showSubgroups, setShowSubgroups] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel(`channels-${serverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `server_id=eq.${serverId}`,
        },
        () => {
          loadData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `server_id=eq.${serverId}`,
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serverId])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const loadData = async () => {
    try {
      // Load server name
      const { data: serverData } = await supabase
        .from('servers')
        .select('name')
        .eq('id', serverId)
        .single()

      if (serverData) {
        setServerName(serverData.name)
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true })

      setCategories(categoriesData || [])

      // Load channels
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true })

      setChannels(channelsData || [])

      // Auto-select first text channel if none selected
      if (!selectedChannel && channelsData) {
        const firstTextChannel = channelsData.find((c) => c.type === 'text')
        if (firstTextChannel) {
          onSelectChannel(firstTextChannel.id)
        }
      }
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const handleCreateChannel = async (type: 'text' | 'voice') => {
    const name = prompt(`${type === 'text' ? 'Metin' : 'Ses'} kanalı adı:`)
    if (!name) return

    try {
      const maxPosition = channels
        .filter((c) => c.type === type && !c.category_id)
        .reduce((max, c) => Math.max(max, c.position), -1)

      const { error } = await supabase.from('channels').insert({
        server_id: serverId,
        name,
        type,
        position: maxPosition + 1,
      })

      if (error) throw error
    } catch (error) {
      console.error('Error creating channel:', error)
      alert('Kanal oluşturulurken bir hata oluştu')
    }
  }

  const getChannelsByCategory = (categoryId: string | null) => {
    return channels
      .filter((c) => c.category_id === categoryId)
      .sort((a, b) => a.position - b.position)
  }

  const uncategorizedChannels = getChannelsByCategory(null)

  return (
    <div className="w-full bg-[#2f3136] flex flex-col h-full">
      {/* Server header */}
      <div className="h-12 px-4 flex items-center justify-between shadow-md border-b border-[#202225]">
        <h2 className="text-white font-semibold text-sm truncate">{serverName}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-[#b9bbbe] hover:text-white transition-colors"
            title="Sunucu Ayarları"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button className="text-[#b9bbbe] hover:text-white">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {/* Categories */}
        {categories.map((category) => {
          const categoryChannels = getChannelsByCategory(category.id)
          if (categoryChannels.length === 0) return null

          return (
            <div key={category.id} className="mb-4">
              <div className="px-2 py-1 flex items-center justify-between group">
                <button className="text-[#8e9297] text-xs font-semibold uppercase hover:text-[#dcddde] flex items-center gap-1">
                  <ChevronDown className="w-3 h-3" />
                  {category.name}
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {categoryChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => channel.type === 'text' && onSelectChannel(channel.id)}
                    className={`w-full px-2 py-1.5 rounded flex items-center gap-1.5 text-sm group ${
                      selectedChannel === channel.id
                        ? 'bg-[#393c43] text-white'
                        : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
                    }`}
                  >
                    {channel.type === 'text' ? (
                      <Hash className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span className="flex-1 text-left truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Uncategorized channels */}
        {uncategorizedChannels.length > 0 && (
          <div className="mb-4">
            <div className="space-y-0.5">
              {uncategorizedChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => channel.type === 'text' && onSelectChannel(channel.id)}
                  className={`w-full px-2 py-1.5 rounded flex items-center gap-1.5 text-sm group ${
                    selectedChannel === channel.id
                      ? 'bg-[#393c43] text-white'
                      : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
                  }`}
                >
                  {channel.type === 'text' ? (
                    <Hash className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span className="flex-1 text-left truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add channel buttons */}
        <div className="px-2 py-1 flex items-center gap-2 text-[#96989d] text-sm">
          <button
            onClick={() => handleCreateChannel('text')}
            className="hover:text-white flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Metin Kanalı</span>
          </button>
        </div>
        <div className="px-2 py-1 flex items-center gap-2 text-[#96989d] text-sm">
          <button
            onClick={() => handleCreateChannel('voice')}
            className="hover:text-white flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Ses Kanalı</span>
          </button>
        </div>

        {/* Server Subgroups */}
        <div className="px-2 py-2 border-t border-[#202225] mt-2">
          <button
            onClick={() => setShowSubgroups(!showSubgroups)}
            className="w-full px-2 py-1.5 rounded flex items-center gap-1.5 text-sm text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showSubgroups ? 'rotate-180' : ''}`} />
            <span>Alt Gruplar</span>
          </button>
          {showSubgroups && user && (
            <div className="mt-2">
              <ServerSubgroups serverId={serverId} currentUserId={user.id} />
            </div>
          )}
        </div>
      </div>

      {/* User control panel */}
      {user && <UserControlPanel user={user} />}

      {/* Server Settings Modal */}
      <ServerSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        serverId={serverId}
      />
    </div>
  )
}
