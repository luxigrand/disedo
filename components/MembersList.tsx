'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Member {
  id: string
  user_id: string
  role: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
    status: string
  }
}

export default function MembersList({ serverId }: { serverId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()

    const channel = supabase
      .channel(`members-${serverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_members',
          filter: `server_id=eq.${serverId}`,
        },
        () => {
          loadMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serverId])

  const loadMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('server_members')
        .select('id, user_id, role')
        .eq('server_id', serverId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true })

      if (error) throw error

      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name, avatar_url, status')
            .eq('user_id', member.user_id)
            .single()

          return {
            ...member,
            user_profile: profile ? {
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              status: profile.status,
            } : {
              username: 'Bilinmeyen',
              display_name: null,
              avatar_url: null,
              status: 'offline',
            },
          }
        })
      )

      // Group by role
      const grouped = membersWithProfiles.reduce((acc, member) => {
        const role = member.role || 'member'
        if (!acc[role]) {
          acc[role] = []
        }
        acc[role].push(member)
        return acc
      }, {} as Record<string, Member[]>)

      // Flatten with role order: owner, admin, moderator, member
      const ordered = [
        ...(grouped.owner || []),
        ...(grouped.admin || []),
        ...(grouped.moderator || []),
        ...(grouped.member || []),
      ]

      setMembers(ordered)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Sahip',
      admin: 'Yönetici',
      moderator: 'Moderatör',
      member: 'Üye',
    }
    return labels[role] || 'Üye'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: '#43b581',
      away: '#faa61a',
      busy: '#f04747',
      offline: '#747f8d',
    }
    return colors[status] || colors.offline
  }

  if (loading) {
    return (
      <div className="w-60 bg-[#2f3136] p-4">
        <div className="text-[#72767d] text-sm">Yükleniyor...</div>
      </div>
    )
  }

  // Group members by role for display
  const groupedMembers = members.reduce((acc, member) => {
    const role = member.role || 'member'
    if (!acc[role]) {
      acc[role] = []
    }
    acc[role].push(member)
    return acc
  }, {} as Record<string, Member[]>)

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#202225]">
        <h3 className="text-xs font-semibold text-[#8e9297] uppercase">
          Üyeler — {members.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {Object.entries(groupedMembers).map(([role, roleMembers]) => (
          <div key={role} className="mb-4">
            <div className="px-2 py-1 text-xs font-semibold text-[#8e9297] uppercase">
              {getRoleLabel(role)} — {roleMembers.length}
            </div>
            <div className="space-y-1">
              {roleMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-2 py-1.5 rounded flex items-center gap-2 hover:bg-[#393c43] group"
                >
                  <div className="relative flex-shrink-0">
                    {member.user_profile?.avatar_url ? (
                      <img
                        src={member.user_profile.avatar_url}
                        alt={member.user_profile.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
                        {member.user_profile?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2f3136]"
                      style={{
                        backgroundColor: getStatusColor(
                          member.user_profile?.status || 'offline'
                        ),
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#dcddde] truncate">
                      {member.user_profile?.display_name || member.user_profile?.username || 'Bilinmeyen'}
                    </div>
                    {member.user_profile?.display_name && (
                      <div className="text-xs text-[#72767d] truncate">
                        @{member.user_profile.username}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
