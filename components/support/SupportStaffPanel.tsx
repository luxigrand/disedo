'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, UserPlus, X } from 'lucide-react'

interface Staff {
  user_id: string
  role: string
  availability: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function SupportStaffPanel() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('support_staff')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const staffWithProfiles = await Promise.all(
        (data || []).map(async (s) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', s.user_id)
            .single()

          return {
            ...s,
            user_profile: profile || {
              username: 'Bilinmeyen',
              display_name: null,
              avatar_url: null,
            },
          }
        })
      )

      setStaff(staffWithProfiles)
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    // In a real app, you'd look up user by email
    // For now, this is a placeholder
    alert('Personel ekleme özelliği geliştirilme aşamasında')
    setShowAddModal(false)
  }

  const handleRemoveStaff = async (userId: string) => {
    if (!confirm('Bu personeli kaldırmak istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('support_staff')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      loadStaff()
    } catch (error) {
      console.error('Error removing staff:', error)
      alert('Personel kaldırılırken bir hata oluştu')
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      support: 'Destek',
      admin: 'Yönetici',
      supervisor: 'Süpervizör',
    }
    return labels[role] || role
  }

  const getAvailabilityColor = (availability: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-400',
      busy: 'text-yellow-400',
      away: 'text-orange-400',
      offline: 'text-gray-400',
    }
    return colors[availability] || colors.offline
  }

  if (loading) {
    return (
      <div className="w-80 bg-[#2f3136] p-4">
        <div className="text-[#72767d] text-sm">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-[#2f3136] flex flex-col h-full">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225]">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4" />
          Destek Personeli
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-[#b9bbbe] hover:text-white transition-colors"
          title="Personel Ekle"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {staff.length === 0 ? (
          <div className="text-center py-8 text-[#72767d] text-sm">
            <p>Henüz personel yok</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div
                key={s.user_id}
                className="bg-[#202225] rounded p-3 hover:bg-[#2a2d31] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {s.user_profile?.avatar_url ? (
                    <img
                      src={s.user_profile.avatar_url}
                      alt={s.user_profile.display_name || s.user_profile.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
                      {(s.user_profile?.display_name || s.user_profile?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {s.user_profile?.display_name || s.user_profile?.username || 'Bilinmeyen'}
                    </div>
                    <div className="text-xs text-[#72767d]">
                      {getRoleLabel(s.role)}
                    </div>
                    <div className={`text-xs ${getAvailabilityColor(s.availability)}`}>
                      {s.availability === 'available' ? 'Müsait' : s.availability === 'busy' ? 'Meşgul' : s.availability === 'away' ? 'Uzakta' : 'Çevrimdışı'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(s.user_id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#2f3136] rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Personel Ekle</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#b9bbbe] hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="personel@example.com"
                  className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#202225]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddStaff}
                  className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
