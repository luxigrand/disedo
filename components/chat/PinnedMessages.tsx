'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pin, X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'

interface PinnedMessage {
  id: string
  message_id: string
  pinned_by: string
  pinned_at: string
  message?: {
    content: string
    user_id: string
    created_at: string
    user_profile?: {
      username: string
      display_name: string | null
    }
  }
}

interface PinnedMessagesProps {
  channelId: string
  isAdmin: boolean
}

export default function PinnedMessages({ channelId, isAdmin }: PinnedMessagesProps) {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPinnedMessages()

    const channel = supabase
      .channel(`pinned-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pinned_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          loadPinnedMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  const loadPinnedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('pinned_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const messagesWithContent = await Promise.all(
        (data || []).map(async (pinned) => {
          const { data: message } = await supabase
            .from('messages')
            .select('content, user_id, created_at')
            .eq('id', pinned.message_id)
            .single()

          if (message) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('username, display_name')
              .eq('user_id', message.user_id)
              .single()

            return {
              ...pinned,
              message: {
                ...message,
                user_profile: profile || {
                  username: 'Bilinmeyen',
                  display_name: null,
                },
              },
            }
          }

          return pinned
        })
      )

      setPinnedMessages(messagesWithContent)
    } catch (error) {
      console.error('Error loading pinned messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnpin = async (pinnedId: string) => {
    if (!confirm('Bu mesajı pin\'den kaldırmak istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('id', pinnedId)

      if (error) throw error
    } catch (error) {
      console.error('Error unpinning message:', error)
      alert('Mesaj pin\'den kaldırılırken bir hata oluştu')
    }
  }

  if (loading) {
    return <div className="text-sm text-[#72767d]">Yükleniyor...</div>
  }

  if (pinnedMessages.length === 0) {
    return (
      <div className="text-sm text-[#72767d]">
        Henüz pin'lenmiş mesaj yok.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pinnedMessages.map((pinned) => (
        <div
          key={pinned.id}
          className="bg-[#202225] rounded p-3 hover:bg-[#2a2d31] transition-colors group"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Pin className="w-3 h-3 text-[#faa61a] flex-shrink-0" />
              <span className="text-xs text-[#72767d]">
                {pinned.message?.user_profile?.display_name || pinned.message?.user_profile?.username || 'Bilinmeyen'}
              </span>
              <span className="text-xs text-[#72767d]">
                {format(new Date(pinned.message?.created_at || pinned.pinned_at), 'dd MMM HH:mm', { locale: tr })}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleUnpin(pinned.id)}
                className="opacity-0 group-hover:opacity-100 text-[#72767d] hover:text-red-400 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-sm text-[#dcddde] line-clamp-2">
            {pinned.message?.content || 'Mesaj yüklenemedi'}
          </p>
        </div>
      ))}
    </div>
  )
}
