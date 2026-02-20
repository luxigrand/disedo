'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Reply, X } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'

interface Reply {
  id: string
  content: string
  user_id: string
  created_at: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageRepliesProps {
  messageId: string
  replyToMessageId: string
  onReply: (replyToMessageId: string) => void
}

export default function MessageReplies({
  messageId,
  replyToMessageId,
  onReply,
}: MessageRepliesProps) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [showReplies, setShowReplies] = useState(false)

  useEffect(() => {
    if (showReplies) {
      loadReplies()
    }
  }, [showReplies, messageId])

  const loadReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('message_replies')
        .select('*')
        .eq('message_id', messageId)
        .eq('reply_to_message_id', replyToMessageId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const repliesWithProfiles = await Promise.all(
        (data || []).map(async (reply) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', reply.user_id)
            .single()

          return {
            ...reply,
            user_profile: profile || {
              username: 'Bilinmeyen',
              display_name: null,
              avatar_url: null,
            },
          }
        })
      )

      setReplies(repliesWithProfiles)
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  if (replies.length === 0 && !showReplies) {
    return (
      <button
        onClick={() => setShowReplies(true)}
        className="mt-1 text-xs text-[#5865f2] hover:text-[#4752c4] flex items-center gap-1"
      >
        <Reply className="w-3 h-3" />
        Yanıtla
      </button>
    )
  }

  return (
    <div className="mt-2 border-l-2 border-[#5865f2] pl-3 ml-2">
      {replies.length > 0 && (
        <div className="space-y-2 mb-2">
          {replies.map((reply) => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">
                  {reply.user_profile?.display_name || reply.user_profile?.username || 'Bilinmeyen'}
                </span>
                <span className="text-xs text-[#72767d]">
                  {format(new Date(reply.created_at), 'HH:mm', { locale: tr })}
                </span>
              </div>
              <p className="text-[#dcddde]">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onReply(replyToMessageId)}
          className="text-xs text-[#5865f2] hover:text-[#4752c4] flex items-center gap-1"
        >
          <Reply className="w-3 h-3" />
          Yanıtla
        </button>
        {showReplies && (
          <button
            onClick={() => setShowReplies(false)}
            className="text-xs text-[#72767d] hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Gizle
          </button>
        )}
      </div>
    </div>
  )
}
