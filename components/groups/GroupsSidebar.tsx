'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Plus, Hash } from 'lucide-react'
import CreateGroupModal from './CreateGroupModal'

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  is_private: boolean
}

export default function GroupsSidebar({
  selectedGroup,
  onSelectGroup,
}: {
  selectedGroup: string | null
  onSelectGroup: (groupId: string) => void
}) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadGroups()

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        () => {
          loadGroups()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membersData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      const groupIds = membersData?.map((m) => m.group_id) || []

      if (groupIds.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: true })

      setGroups(groupsData || [])

      if (!selectedGroup && groupsData && groupsData.length > 0) {
        onSelectGroup(groupsData[0].id)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-60 bg-[#2f3136] p-4">
        <div className="text-[#72767d] text-sm">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225]">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4" />
          Gruplar
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-[#b9bbbe] hover:text-white transition-colors"
          title="Grup Oluştur"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-[#72767d] text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Henüz grup yok</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg text-sm transition-colors"
            >
              Grup Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors ${
                  selectedGroup === group.id
                    ? 'bg-[#393c43] text-white'
                    : 'text-[#96989d] hover:bg-[#393c43] hover:text-[#dcddde]'
                }`}
              >
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt={group.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-left truncate">{group.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={(groupId) => {
            setShowCreateModal(false)
            onSelectGroup(groupId)
          }}
        />
      )}
    </div>
  )
}
