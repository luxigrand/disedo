'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { MoreVertical, Edit2, Trash2, Reply, Info, X } from 'lucide-react'
import MessageReactions from '@/components/chat/MessageReactions'
import MessageReplies from '@/components/chat/MessageReplies'
import MessageDetails from '@/components/chat/MessageDetails'
import LinkPreview from '@/components/chat/LinkPreview'
import EmojiPicker from '@/components/chat/EmojiPicker'
import ChannelInfoPanel from '@/components/chat/ChannelInfoPanel'

interface Message {
  id: string
  content: string
  created_at: string
  updated_at: string
  edited_at?: string | null
  user_id: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function ChatArea({ channelId }: { channelId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [channelName, setChannelName] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showChannelInfo, setShowChannelInfo] = useState(false)
  const [serverId, setServerId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMessages()
    loadChannelInfo()
    getCurrentUser()

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadMessageWithProfile(payload.new as Message).then((msg) => {
              setMessages((prev) => [...prev, msg])
            })
          } else if (payload.eventType === 'UPDATE') {
            loadMessageWithProfile(payload.new as Message).then((msg) => {
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
      .from('channels')
      .select('name, server_id')
      .eq('id', channelId)
      .single()

    if (data) {
      setChannelName(data.name)
      setServerId(data.server_id)
    }
  }

  const loadMessageWithProfile = async (message: Message): Promise<Message> => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', message.user_id)
      .single()

    return {
      ...message,
      edited_at: message.edited_at || null,
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
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
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
          .from('messages')
          .update({
            content: newMessage,
            updated_at: new Date().toISOString(),
            edited_at: new Date().toISOString(),
          })
          .eq('id', editingMessageId)
          .eq('user_id', currentUser.id)

        if (error) throw error
        setEditingMessageId(null)
      } else {
        const messageContent = replyingTo
          ? `[Yanıt: ${replyingTo}]\n${newMessage}`
          : newMessage

        const { error } = await supabase.from('messages').insert({
          channel_id: channelId,
          user_id: currentUser.id,
          content: messageContent,
        })

        if (error) throw error
        setReplyingTo(null)
      }

      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilirken bir hata oluştu')
    }
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id)
    setNewMessage(message.content)
    inputRef.current?.focus()
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('messages')
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
    <div className="flex flex-1 flex-col bg-[#36393f] relative">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm">
        <div className="flex items-center">
          <span className="text-[#96989d] mr-2">#</span>
          <h2 className="text-white font-semibold">{channelName}</h2>
        </div>
        <button
          onClick={() => setShowChannelInfo(!showChannelInfo)}
          className="p-1.5 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white transition-colors"
          title="Kanal Bilgileri"
        >
          <Info className="w-5 h-5" />
        </button>
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
                  600000 // 10 minutes

              return (
                <div
                  key={message.id}
                  className="group flex gap-4 px-4 py-1 hover:bg-[#32353b] rounded"
                  onMouseEnter={() => setHoveredMessageId(message.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  {showAvatar ? (
                    <div className="flex-shrink-0">
                      {message.user_profile?.avatar_url ? (
                        <img
                          src={message.user_profile.avatar_url}
                          alt={message.user_profile.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold">
                          {message.user_profile?.username?.charAt(0).toUpperCase() || '?'}
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
                        {message.user_profile?.display_name && (
                          <span className="text-[#72767d] text-xs">
                            @{message.user_profile.username}
                          </span>
                        )}
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
                      <div className="flex-1 min-w-0">
                        <p className="text-[#dcddde] break-words">
                          {message.content}
                        </p>
                        {message.edited_at && (
                          <span className="text-xs text-[#72767d] italic">(düzenlendi)</span>
                        )}
                        {/* Link Preview */}
                        {message.content.match(/https?:\/\/[^\s]+/g)?.map((url, idx) => (
                          <LinkPreview key={idx} url={url} />
                        ))}
                        {/* Reactions */}
                        <MessageReactions
                          messageId={message.id}
                          currentUserId={currentUser?.id || ''}
                        />
                        {/* Replies */}
                        <MessageReplies
                          messageId={message.id}
                          replyToMessageId={message.id}
                          onReply={(replyToId) => {
                            setReplyingTo(replyToId)
                            inputRef.current?.focus()
                          }}
                        />
                      </div>
                      {hoveredMessageId === message.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedMessage(message)
                              setShowMessageDetails(true)
                            }}
                            className="p-1 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white"
                            title="Detaylar"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(message.id)
                              inputRef.current?.focus()
                            }}
                            className="p-1 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white"
                            title="Yanıtla"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                          {currentUser?.id === message.user_id && (
                            <>
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
                            </>
                          )}
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
        {replyingTo && (
          <div className="mb-2 px-3 py-2 bg-[#2f3136] rounded flex items-center justify-between">
            <span className="text-sm text-[#72767d]">
              {messages.find((m) => m.id === replyingTo)?.user_profile?.display_name || 'Mesaj'} mesajına yanıt veriyorsun
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[#72767d] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#40444b] rounded-lg px-2">
            <EmojiPicker
              onSelect={(emoji) => {
                setNewMessage((prev) => prev + emoji)
                inputRef.current?.focus()
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={editingMessageId ? 'Mesajı düzenle...' : replyingTo ? 'Yanıt yaz...' : `#${channelName} kanalına mesaj gönder`}
              className="flex-1 bg-transparent text-white py-2 focus:outline-none focus:ring-0 placeholder-[#72767d]"
            />
          </div>
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

      {/* Message Details Modal */}
      {selectedMessage && (
        <MessageDetails
          message={selectedMessage}
          isOpen={showMessageDetails}
          onClose={() => {
            setShowMessageDetails(false)
            setSelectedMessage(null)
          }}
          currentUserId={currentUser?.id || ''}
          onReply={(replyToId) => {
            setReplyingTo(replyToId)
            setShowMessageDetails(false)
            setSelectedMessage(null)
            inputRef.current?.focus()
          }}
        />
      )}

      {/* Channel Info Panel */}
      {showChannelInfo && serverId && (
        <div className="absolute right-0 top-0 bottom-0 z-10">
          <ChannelInfoPanel
            channelId={channelId}
            isOpen={showChannelInfo}
            onClose={() => setShowChannelInfo(false)}
            currentUserId={currentUser?.id || ''}
            serverId={serverId}
          />
        </div>
      )}
    </div>
  )
}
