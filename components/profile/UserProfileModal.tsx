'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, User, Link2, Save, Copy, Check } from 'lucide-react'

interface UserProfile {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  custom_links: any[]
  profile_link: string | null
  status: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    custom_links: [] as Array<{ type: string; label: string; url: string }>,
  })

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile()
    }
  }, [isOpen, userId])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          display_name: data.display_name || '',
          custom_links: Array.isArray(data.custom_links) ? data.custom_links : [],
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.display_name || null,
          custom_links: formData.custom_links,
        })
        .eq('user_id', userId)

      if (error) throw error

      await loadProfile()
      alert('Profil güncellendi!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Profil güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = () => {
    setFormData({
      ...formData,
      custom_links: [...formData.custom_links, { type: 'website', label: '', url: '' }],
    })
  }

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      custom_links: formData.custom_links.filter((_, i) => i !== index),
    })
  }

  const handleLinkChange = (index: number, field: string, value: string) => {
    const updated = [...formData.custom_links]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, custom_links: updated })
  }

  const copyProfileLink = async () => {
    if (profile?.profile_link) {
      const url = `${window.location.origin}/profile/${profile.profile_link}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2f3136] border-b border-[#202225] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Profil Düzenle</h2>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-[#72767d]">Yükleniyor...</div>
          ) : (
            <>
              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Görünen İsim (Display Name)
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Görünen isminiz (opsiyonel)"
                  className="w-full bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                />
                <p className="text-xs text-[#72767d] mt-1">
                  Bu isim mesajlarda ve profilinizde görünecektir. Boş bırakırsanız kullanıcı adınız kullanılır.
                </p>
              </div>

              {/* Profile Link */}
              {profile?.profile_link && (
                <div>
                  <label className="block text-sm font-semibold text-[#b9bbbe] mb-2">
                    <Link2 className="w-4 h-4 inline mr-2" />
                    Profil Linki
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/profile/${profile.profile_link}`}
                      readOnly
                      className="flex-1 bg-[#202225] text-white px-4 py-2 rounded-lg"
                    />
                    <button
                      onClick={copyProfileLink}
                      className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Kopyalandı!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Kopyala
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#b9bbbe]">
                    <Link2 className="w-4 h-4 inline mr-2" />
                    Özel Linkler
                  </label>
                  <button
                    onClick={handleAddLink}
                    className="text-sm text-[#5865f2] hover:text-[#4752c4] transition-colors"
                  >
                    + Link Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.custom_links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={link.type}
                        onChange={(e) => handleLinkChange(index, 'type', e.target.value)}
                        className="bg-[#202225] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                      >
                        <option value="website">Website</option>
                        <option value="twitter">Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="github">GitHub</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="youtube">YouTube</option>
                        <option value="discord">Discord</option>
                        <option value="other">Diğer</option>
                      </select>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                        placeholder="Etiket (örn: Kişisel Blog)"
                        className="flex-1 bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-[#202225] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                      />
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.custom_links.length === 0 && (
                    <p className="text-sm text-[#72767d] text-center py-4">
                      Henüz link eklenmemiş. Yukarıdaki butona tıklayarak ekleyebilirsiniz.
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#202225]">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
