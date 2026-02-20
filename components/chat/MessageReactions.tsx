'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  user_id: string
  count?: number
  users?: string[]
}

interface MessageReactionsProps {
  messageId: string
  currentUserId: string
}

export default function MessageReactions({ messageId, currentUserId }: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, Reaction>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReactions()

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          loadReactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageId])

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)

      if (error) throw error

      // Group by emoji
      const grouped: Record<string, Reaction> = {}
      data?.forEach((reaction) => {
        if (!grouped[reaction.emoji]) {
          grouped[reaction.emoji] = {
            id: reaction.id,
            emoji: reaction.emoji,
            user_id: reaction.user_id,
            count: 1,
            users: [reaction.user_id],
          }
        } else {
          grouped[reaction.emoji].count!++
          grouped[reaction.emoji].users!.push(reaction.user_id)
        }
      })

      setReactions(grouped)
    } catch (error) {
      console.error('Error loading reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleReaction = async (emoji: string) => {
    try {
      // Check if user already reacted
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)
        .single()

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji,
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const hasUserReacted = (emoji: string) => {
    return reactions[emoji]?.users?.includes(currentUserId) || false
  }

  if (loading || Object.keys(reactions).length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.values(reactions).map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction.emoji)}
          className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs transition-colors ${
            hasUserReacted(reaction.emoji)
              ? 'bg-[#5865f2]/30 border border-[#5865f2] text-white'
              : 'bg-[#393c43] hover:bg-[#40444b] text-[#dcddde]'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  )
}
