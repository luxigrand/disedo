'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface ServerSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  serverId: string
}

export default function ServerSettingsModal({
  isOpen,
  onClose,
  serverId,
}: ServerSettingsModalProps) {
  const [serverName, setServerName] = useState('')
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && serverId) {
      loadServerData()
    }
  }, [isOpen, serverId])

  const loadServerData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load server data
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .select('name, password, owner_id')
        .eq('id', serverId)
        .single()

      if (serverError) throw serverError

      setServerName(server.name)
      setCurrentPassword(server.password)
      setIsOwner(server.owner_id === user.id)

      // Check if server has password
      if (server.password) {
        setPassword('********') // Show placeholder for existing password
      }
    } catch (error) {
      console.error('Error loading server data:', error)
      alert('Sunucu bilgileri yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!isOwner) {
      alert('Sadece sunucu sahibi ayarları değiştirebilir')
      return
    }

    setSaving(true)
    try {
      const updateData: { name?: string; password?: string | null } = {}

      // Update name if changed
      if (serverName.trim()) {
        updateData.name = serverName.trim()
      }

      // Update password
      if (password === '') {
        // Empty password means remove password
        updateData.password = null
      } else if (password !== '********') {
        // New password entered
        updateData.password = password
      }
      // If password is '********', don't update it (user didn't change it)

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('servers')
          .update(updateData)
          .eq('id', serverId)

        if (error) throw error

        alert('Sunucu ayarları güncellendi')
        onClose()
      }
    } catch (error) {
      console.error('Error saving server settings:', error)
      alert('Sunucu ayarları güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Sunucu Ayarları</h2>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-[#b9bbbe]">Yükleniyor...</div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                Sunucu Adı *
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Sunucu adı"
                required
                disabled={!isOwner}
                className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                Sunucu Şifresi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === '********') {
                    setPassword('')
                  }
                }}
                placeholder={currentPassword ? "Yeni şifre girin (değiştirmek için) veya boş bırakın (kaldırmak için)" : "Şifre (boş bırakabilirsiniz)"}
                disabled={!isOwner}
                className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[#72767d]">
                {currentPassword
                  ? 'Şifreyi kaldırmak için alanı boş bırakın. Değiştirmek için yeni şifre girin.'
                  : 'Sunucuya erişim için şifre belirleyin. Boş bırakırsanız şifre olmayacak.'}
              </p>
            </div>

            {!isOwner && (
              <div className="p-3 bg-[#202225] rounded-lg text-sm text-[#b9bbbe]">
                Sadece sunucu sahibi ayarları değiştirebilir.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#202225]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#b9bbbe] hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!isOwner || saving || !serverName.trim()}
                className="px-4 py-2 text-sm font-medium bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
