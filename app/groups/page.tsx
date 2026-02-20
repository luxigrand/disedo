'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GroupsSidebar from '@/components/groups/GroupsSidebar'
import GroupChatArea from '@/components/groups/GroupChatArea'

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    if (selectedGroup) {
      loadChannels()
    }
  }, [selectedGroup])

  const loadChannels = async () => {
    if (!selectedGroup) return

    try {
      const { data, error } = await supabase
        .from('group_channels')
        .select('*')
        .eq('group_id', selectedGroup)
        .order('position', { ascending: true })

      if (error) throw error

      setChannels(data || [])

      if (data && data.length > 0 && !selectedChannel) {
        const firstTextChannel = data.find((c) => c.type === 'text')
        if (firstTextChannel) {
          setSelectedChannel(firstTextChannel.id)
        }
      }
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#202225]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#202225]">
      {/* Groups Sidebar */}
      <GroupsSidebar
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />

      {/* Channels Sidebar */}
      {selectedGroup && (
        <div className="w-60 bg-[#2f3136] flex flex-col h-full">
          <div className="h-12 px-4 flex items-center border-b border-[#202225]">
            <h2 className="text-sm font-semibold text-white">Kanallar</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => channel.type === 'text' && setSelectedChannel(channel.id)}
                className={`w-full px-2 py-1.5 rounded flex items-center gap-1.5 text-sm ${
                  selectedChannel === channel.id
                    ? 'bg-[#393c43] text-white'
                    : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
                }`}
              >
                <span>#</span>
                <span className="flex-1 text-left truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <GroupChatArea channelId={selectedChannel} groupId={selectedGroup || ''} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[#36393f]">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-[#dcddde]">
                Bir kanal seç
              </h2>
              <p className="text-[#72767d]">
                Sohbete başlamak için soldan bir kanal seç
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
