'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Hash, Users, Settings, Pin, Info as InfoIcon, Edit2 } from 'lucide-react'
import PinnedMessages from './PinnedMessages'

interface ChannelInfo {
  id: string
  channel_id: string
  description: string | null
  rules: string | null
  settings: any
}

interface ChannelInfoPanelProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  serverId: string
}

export default function ChannelInfoPanel({
  channelId,
  isOpen,
  onClose,
  currentUserId,
  serverId,
}: ChannelInfoPanelProps) {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)
  const [channelName, setChannelName] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    rules: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
      checkAdminStatus()
    }
  }, [isOpen, channelId, serverId, currentUserId])

  const loadData = async () => {
    try {
      // Load channel name
      const { data: channelData } = await supabase
        .from('channels')
        .select('name')
        .eq('id', channelId)
        .single()

      if (channelData) {
        setChannelName(channelData.name)
      }

      // Load channel info
      const { data: infoData } = await supabase
        .from('channel_info')
        .select('*')
        .eq('channel_id', channelId)
        .single()

      if (infoData) {
        setChannelInfo(infoData)
        setFormData({
          description: infoData.description || '',
          rules: infoData.rules || '',
        })
      } else {
        // Create default channel info
        const { data: newInfo } = await supabase
          .from('channel_info')
          .insert({
            channel_id: channelId,
            description: null,
            rules: null,
            settings: {},
          })
          .select()
          .single()

        if (newInfo) {
          setChannelInfo(newInfo)
        }
      }

      // Load member count
      const { data: members } = await supabase
        .from('server_members')
        .select('id', { count: 'exact' })
        .eq('server_id', serverId)

      setMemberCount(members?.length || 0)
    } catch (error) {
      console.error('Error loading channel info:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('channel_info')
        .update({
          description: formData.description || null,
          rules: formData.rules || null,
          updated_at: new Date().toISOString(),
        })
        .eq('channel_id', channelId)

      if (error) throw error

      await loadData()
      setEditing(false)
    } catch (error) {
      console.error('Error saving channel info:', error)
      alert('Kanal bilgileri güncellenirken bir hata oluştu')
    }
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-[#2f3136] flex flex-col h-full border-l border-[#202225]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225]">
        <h2 className="text-sm font-semibold text-white">Kanal Bilgileri</h2>
        <button
          onClick={onClose}
          className="text-[#b9bbbe] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-[#72767d]">Yükleniyor...</div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Channel Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-[#72767d]" />
                <h3 className="text-lg font-semibold text-white">{channelName}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#72767d]">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{memberCount} üye</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#8e9297] uppercase flex items-center gap-2">
                  <InfoIcon className="w-4 h-4" />
                  Açıklama
                </h4>
                {isAdmin && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-[#5865f2] hover:text-[#4752c4]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kanal açıklaması..."
                    className="w-full bg-[#202225] text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm rounded transition-colors"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        loadData()
                      }}
                      className="px-3 py-1.5 bg-[#40444b] hover:bg-[#36393f] text-white text-sm rounded transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#dcddde]">
                  {channelInfo?.description || 'Henüz açıklama eklenmemiş.'}
                </p>
              )}
            </div>

            {/* Rules */}
            {isAdmin && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#8e9297] uppercase">Kurallar</h4>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs text-[#5865f2] hover:text-[#4752c4]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editing ? (
                  <div className="space-y-2">
                    <textarea
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder="Kanal kuralları..."
                      className="w-full bg-[#202225] text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                      rows={5}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-[#dcddde] whitespace-pre-line">
                    {channelInfo?.rules || 'Henüz kural eklenmemiş.'}
                  </div>
                )}
              </div>
            )}

            {/* Pinned Messages */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pin className="w-4 h-4 text-[#8e9297]" />
                <h4 className="text-xs font-semibold text-[#8e9297] uppercase">
                  Pin'lenmiş Mesajlar
                </h4>
              </div>
              <PinnedMessages channelId={channelId} isAdmin={isAdmin} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
