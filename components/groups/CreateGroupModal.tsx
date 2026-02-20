'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Users, Lock, Globe } from 'lucide-react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (groupId: string) => void
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description || null,
          owner_id: user.id,
          is_private: formData.is_private,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add owner as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Create default channel
      const { error: channelError } = await supabase
        .from('group_channels')
        .insert({
          group_id: group.id,
          name: 'genel',
          type: 'text',
        })

      if (channelError) throw channelError

      onGroupCreated(group.id)
      setFormData({ name: '', description: '', is_private: true })
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Grup oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Yeni Grup Oluştur</h2>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
              Grup Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Grup adı"
              required
              className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Grup açıklaması (opsiyonel)"
              rows={3}
              className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
              Gizlilik
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-[#202225] rounded-lg cursor-pointer hover:bg-[#2a2d31] transition-colors">
                <input
                  type="radio"
                  checked={formData.is_private}
                  onChange={() => setFormData({ ...formData, is_private: true })}
                  className="text-[#5865f2]"
                />
                <Lock className="w-5 h-5 text-[#72767d]" />
                <div>
                  <div className="text-white font-medium">Özel Grup</div>
                  <div className="text-xs text-[#72767d]">Sadece davet edilenler katılabilir</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-[#202225] rounded-lg cursor-pointer hover:bg-[#2a2d31] transition-colors">
                <input
                  type="radio"
                  checked={!formData.is_private}
                  onChange={() => setFormData({ ...formData, is_private: false })}
                  className="text-[#5865f2]"
                />
                <Globe className="w-5 h-5 text-[#72767d]" />
                <div>
                  <div className="text-white font-medium">Herkese Açık Grup</div>
                  <div className="text-xs text-[#72767d]">Herkes katılabilir</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#202225]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
