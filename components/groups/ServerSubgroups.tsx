'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Plus, ChevronRight, Settings, X } from 'lucide-react'

interface Subgroup {
  id: string
  name: string
  description: string | null
  parent_group_id: string | null
  member_count?: number
}

interface ServerSubgroupsProps {
  serverId: string
  currentUserId: string
}

export default function ServerSubgroups({ serverId, currentUserId }: ServerSubgroupsProps) {
  const [subgroups, setSubgroups] = useState<Subgroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSubgroupName, setNewSubgroupName] = useState('')
  const [newSubgroupDesc, setNewSubgroupDesc] = useState('')

  useEffect(() => {
    loadSubgroups()
    checkAdminStatus()
  }, [serverId, currentUserId])

  const checkAdminStatus = async () => {
    try {
      const { data: member } = await supabase
        .from('server_members')
        .select('role')
        .eq('server_id', serverId)
        .eq('user_id', currentUserId)
        .single()

      setIsAdmin(member?.role === 'owner' || member?.role === 'admin' || member?.role === 'moderator')
    } catch (error) {
      setIsAdmin(false)
    }
  }

  const loadSubgroups = async () => {
    try {
      const { data, error } = await supabase
        .from('server_subgroups')
        .select('*')
        .eq('server_id', serverId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const subgroupsWithCounts = await Promise.all(
        (data || []).map(async (subgroup) => {
          const { data: members } = await supabase
            .from('server_subgroup_members')
            .select('id', { count: 'exact' })
            .eq('subgroup_id', subgroup.id)

          return {
            ...subgroup,
            member_count: members?.length || 0,
          }
        })
      )

      setSubgroups(subgroupsWithCounts)
    } catch (error) {
      console.error('Error loading subgroups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubgroup = async () => {
    if (!newSubgroupName.trim()) return

    try {
      const { error } = await supabase
        .from('server_subgroups')
        .insert({
          server_id: serverId,
          name: newSubgroupName,
          description: newSubgroupDesc || null,
        })

      if (error) throw error

      // Add creator as admin member
      const { data: newSubgroup } = await supabase
        .from('server_subgroups')
        .select('id')
        .eq('server_id', serverId)
        .eq('name', newSubgroupName)
        .single()

      if (newSubgroup) {
        await supabase
          .from('server_subgroup_members')
          .insert({
            subgroup_id: newSubgroup.id,
            user_id: currentUserId,
            role: 'admin',
          })
      }

      setNewSubgroupName('')
      setNewSubgroupDesc('')
      setShowCreateModal(false)
      loadSubgroups()
    } catch (error) {
      console.error('Error creating subgroup:', error)
      alert('Alt grup oluşturulurken bir hata oluştu')
    }
  }

  const handleJoinSubgroup = async (subgroupId: string) => {
    try {
      const { error } = await supabase
        .from('server_subgroup_members')
        .insert({
          subgroup_id: subgroupId,
          user_id: currentUserId,
          role: 'member',
        })

      if (error) throw error
      loadSubgroups()
    } catch (error) {
      console.error('Error joining subgroup:', error)
      alert('Alt gruba katılırken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-[#72767d] text-sm">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#8e9297] uppercase flex items-center gap-2">
          <Users className="w-4 h-4" />
          Alt Gruplar
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-[#5865f2] hover:text-[#4752c4] transition-colors"
            title="Alt Grup Oluştur"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {subgroups.length === 0 ? (
        <div className="text-center py-4 text-[#72767d] text-sm">
          <p>Henüz alt grup yok</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded text-xs transition-colors"
            >
              Alt Grup Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {subgroups.map((subgroup) => (
            <div
              key={subgroup.id}
              className="bg-[#202225] rounded p-3 hover:bg-[#2a2d31] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-[#72767d]" />
                    <h4 className="text-sm font-semibold text-white">{subgroup.name}</h4>
                  </div>
                  {subgroup.description && (
                    <p className="text-xs text-[#72767d] mb-2">{subgroup.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#72767d]">
                    <span>{subgroup.member_count || 0} üye</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinSubgroup(subgroup.id)}
                  className="px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  Katıl
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Subgroup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#2f3136] rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Yeni Alt Grup</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#b9bbbe] hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                  Alt Grup Adı *
                </label>
                <input
                  type="text"
                  value={newSubgroupName}
                  onChange={(e) => setNewSubgroupName(e.target.value)}
                  placeholder="Alt grup adı"
                  className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newSubgroupDesc}
                  onChange={(e) => setNewSubgroupDesc(e.target.value)}
                  placeholder="Alt grup açıklaması (opsiyonel)"
                  rows={3}
                  className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#202225]">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateSubgroup}
                  disabled={!newSubgroupName.trim()}
                  className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
