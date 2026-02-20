'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface SupportTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onTicketCreated: () => void
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
}: SupportTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'open',
        })

      if (error) throw error

      setFormData({ title: '', description: '', priority: 'medium' })
      onTicketCreated()
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('Ticket oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Yeni Destek Ticket'ı</h2>
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
              Başlık *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ticket başlığı"
              required
              className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
              Açıklama *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Sorununuzu detaylı olarak açıklayın..."
              rows={6}
              required
              className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
              Öncelik
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="urgent">Acil</option>
            </select>
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
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Oluşturuluyor...' : 'Ticket Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
