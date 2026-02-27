'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'
import { Send, Edit2, CheckCircle, XCircle } from 'lucide-react'

interface Ticket {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  assigned_to: string | null
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface TicketMessage {
  id: string
  content: string
  user_id: string
  is_staff: boolean
  created_at: string
  user_profile?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function SupportTicketView({ ticketId, isStaff }: { ticketId: string; isStaff: boolean }) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadTicket()
    loadMessages()
    getCurrentUser()

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (error) throw error

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupportTicketView.tsx:80',message:'Ticket data loaded',data:{hasUserId:!!data?.user_id,userIdType:typeof data?.user_id,allKeys:data ? Object.keys(data) : []},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Load user profile for ticket creator
      if (data?.user_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', data.user_id)
          .single()

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SupportTicketView.tsx:95',message:'User profile loaded for ticket',data:{hasProfile:!!profile,username:profile?.username,displayName:profile?.display_name},timestamp:Date.now(),runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        setTicket({
          ...data,
          user_profile: profile || {
            username: 'Bilinmeyen',
            display_name: null,
            avatar_url: null,
          },
        })
      } else {
        setTicket(data)
      }
    } catch (error) {
      console.error('Error loading ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', msg.user_id)
            .single()

          return {
            ...msg,
            user_profile: profile || {
              username: 'Bilinmeyen',
              display_name: null,
              avatar_url: null,
            },
          }
        })
      )

      setMessages(messagesWithProfiles)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    try {
      // Check if user is staff
      const { data: staff } = await supabase
        .from('support_staff')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .single()

      const { error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: currentUser.id,
          content: newMessage,
          is_staff: !!staff,
        })

      if (error) throw error

      // Update ticket status if staff replied
      if (staff && ticket?.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', ticketId)
      }

      setNewMessage('')
      loadTicket()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilirken bir hata oluştu')
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)

      if (error) throw error
      loadTicket()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#36393f]">
        <div className="text-[#72767d]">Yükleniyor...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#36393f]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Ticket Bulunamadı</h2>
          <p className="text-[#72767d]">Bu ticket mevcut değil veya erişim yetkiniz yok.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-500/20 text-green-400',
      in_progress: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-purple-500/20 text-purple-400',
      closed: 'bg-gray-500/20 text-gray-400',
    }
    return colors[status] || colors.open
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Açık',
      in_progress: 'Devam Ediyor',
      resolved: 'Çözüldü',
      closed: 'Kapalı',
    }
    return labels[status] || status
  }

  return (
    <div className="flex flex-1 flex-col bg-[#36393f]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225]">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold">{ticket.title}</h2>
          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
            {getStatusLabel(ticket.status)}
          </span>
        </div>
        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateStatus('resolved')}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Çözüldü
            </button>
            <button
              onClick={() => handleUpdateStatus('closed')}
              className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded text-sm transition-colors flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Kapat
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial Description */}
        <div className="bg-[#2f3136] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {ticket.user_profile?.avatar_url ? (
              <img
                src={ticket.user_profile.avatar_url}
                alt={ticket.user_profile.display_name || ticket.user_profile.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
                {(ticket.user_profile?.display_name || ticket.user_profile?.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-white">
                {ticket.user_profile?.display_name || ticket.user_profile?.username || 'Bilinmeyen'}
              </div>
              <div className="text-xs text-[#72767d]">
                {format(new Date(ticket.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
              </div>
            </div>
          </div>
          <p className="text-[#dcddde]">{ticket.description}</p>
        </div>

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-4 ${
              message.is_staff
                ? 'bg-[#5865f2]/20 border border-[#5865f2]/30 ml-8'
                : 'bg-[#2f3136] mr-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
                {(message.user_profile?.display_name || message.user_profile?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {message.user_profile?.display_name || message.user_profile?.username || 'Bilinmeyen'}
                  {message.is_staff && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[#5865f2] text-white text-xs rounded">
                      Personel
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#72767d]">
                  {format(new Date(message.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </div>
              </div>
            </div>
            <p className="text-[#dcddde]">{message.content}</p>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 border-t border-[#202225]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-1 bg-[#40444b] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-0 placeholder-[#72767d]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Gönder
          </button>
        </form>
      </div>
    </div>
  )
}
