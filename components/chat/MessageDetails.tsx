'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Edit2, Trash2, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import MessageReactions from './MessageReactions'
import MessageReplies from './MessageReplies'

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  edited_at: string | null
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageDetailsProps {
  message: Message
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onReply: (replyToMessageId: string) => void
}

export default function MessageDetails({
  message,
  isOpen,
  onClose,
  currentUserId,
  onReply,
}: MessageDetailsProps) {
  if (!isOpen) return null

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: tr })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#2f3136] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2f3136] border-b border-[#202225] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Mesaj Detayları</h2>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Message Content */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {message.user_profile?.avatar_url ? (
                <img
                  src={message.user_profile.avatar_url}
                  alt={message.user_profile.display_name || message.user_profile.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                  {(message.user_profile?.display_name || message.user_profile?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-white font-semibold">
                  {message.user_profile?.display_name || message.user_profile?.username || 'Bilinmeyen'}
                </div>
                {message.user_profile?.display_name && (
                  <div className="text-sm text-[#72767d]">
                    @{message.user_profile.username}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[#dcddde] text-lg">{message.content}</p>
          </div>

          {/* Timestamps */}
          <div className="space-y-2 text-sm text-[#72767d]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Gönderildi: {formatDate(message.created_at)}</span>
            </div>
            {message.edited_at && (
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>Düzenlendi: {formatDate(message.edited_at)}</span>
              </div>
            )}
          </div>

          {/* Reactions */}
          <div>
            <h3 className="text-sm font-semibold text-[#b9bbbe] mb-2">Tepkiler</h3>
            <MessageReactions messageId={message.id} currentUserId={currentUserId} />
          </div>

          {/* Replies */}
          <div>
            <h3 className="text-sm font-semibold text-[#b9bbbe] mb-2">Yanıtlar</h3>
            <MessageReplies
              messageId={message.id}
              replyToMessageId={message.id}
              onReply={onReply}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
