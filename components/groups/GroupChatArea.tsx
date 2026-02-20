'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { Edit2, Trash2, Hash } from 'lucide-react'

interface GroupMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function GroupChatArea({ channelId, groupId }: { channelId: string; groupId: string }) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [channelName, setChannelName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMessages()
    loadChannelInfo()
    getCurrentUser()

    const channel = supabase
      .channel(`group-messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadMessageWithProfile(payload.new as GroupMessage).then((msg) => {
              setMessages((prev) => [...prev, msg])
            })
          } else if (payload.eventType === 'UPDATE') {
            loadMessageWithProfile(payload.new as GroupMessage).then((msg) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? msg : m))
              )
            })
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) =>
              prev.filter((m) => m.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadChannelInfo = async () => {
    const { data } = await supabase
      .from('group_channels')
      .select('name')
      .eq('id', channelId)
      .single()

    if (data) {
      setChannelName(data.name)
    }
  }

  const loadMessageWithProfile = async (message: GroupMessage): Promise<GroupMessage> => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', message.user_id)
      .single()

    return {
      ...message,
      user_profile: profile ? {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      } : { username: 'Bilinmeyen', display_name: null, avatar_url: null },
    }
  }

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(loadMessageWithProfile)
      )

      setMessages(messagesWithProfiles)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    try {
      if (editingMessageId) {
        const { error } = await supabase
          .from('group_messages')
          .update({ content: newMessage, updated_at: new Date().toISOString() })
          .eq('id', editingMessageId)
          .eq('user_id', currentUser.id)

        if (error) throw error
        setEditingMessageId(null)
      } else {
        const { error } = await supabase.from('group_messages').insert({
          channel_id: channelId,
          user_id: currentUser.id,
          content: newMessage,
        })

        if (error) throw error
      }

      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilirken bir hata oluştu')
    }
  }

  const handleEditMessage = (message: GroupMessage) => {
    setEditingMessageId(message.id)
    setNewMessage(message.content)
    inputRef.current?.focus()
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', currentUser?.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Mesaj silinirken bir hata oluştu')
    }
  }

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm', { locale: tr })
    } else {
      return format(messageDate, 'dd MMM yyyy HH:mm', { locale: tr })
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[#36393f]">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center border-b border-[#202225] shadow-sm">
        <Hash className="w-5 h-5 text-[#96989d] mr-2" />
        <h2 className="text-white font-semibold">{channelName}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#72767d]">Henüz mesaj yok. İlk mesajı sen gönder!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const showAvatar =
                index === 0 ||
                messages[index - 1].user_id !== message.user_id ||
                new Date(message.created_at).getTime() -
                  new Date(messages[index - 1].created_at).getTime() >
                  600000

              return (
                <div
                  key={message.id}
                  className="group flex gap-4 px-4 py-1 hover:bg-[#32353b] rounded"
                >
                  {showAvatar ? (
                    <div className="flex-shrink-0">
                      {message.user_profile?.avatar_url ? (
                        <img
                          src={message.user_profile.avatar_url}
                          alt={message.user_profile.display_name || message.user_profile.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                          {(message.user_profile?.display_name || message.user_profile?.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-10"></div>
                  )}

                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">
                          {message.user_profile?.display_name || message.user_profile?.username || 'Bilinmeyen'}
                        </span>
                        <span className="text-[#72767d] text-xs">
                          {formatMessageDate(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      {!showAvatar && (
                        <span className="text-[#72767d] text-xs mt-1 min-w-[60px]">
                          {formatMessageDate(message.created_at)}
                        </span>
                      )}
                      <p className="text-[#dcddde] break-words flex-1">
                        {message.content}
                      </p>
                      {currentUser?.id === message.user_id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditMessage(message)}
                            className="p-1 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-red-400"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-4 border-t border-[#202225]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={editingMessageId ? 'Mesajı düzenle...' : `#${channelName} kanalına mesaj gönder`}
            className="flex-1 bg-[#40444b] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-0 placeholder-[#72767d]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            {editingMessageId ? 'Güncelle' : 'Gönder'}
          </button>
          {editingMessageId && (
            <button
              type="button"
              onClick={() => {
                setEditingMessageId(null)
                setNewMessage('')
              }}
              className="px-4 py-2 bg-[#40444b] text-white rounded-lg hover:bg-[#36393f] transition-colors"
            >
              İptal
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
