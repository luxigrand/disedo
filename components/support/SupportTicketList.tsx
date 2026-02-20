'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Filter, Search } from 'lucide-react'
import SupportTicketModal from './SupportTicketModal'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  assigned_to: string | null
}

export default function SupportTicketList({ isStaff }: { isStaff: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTickets()

    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter, isStaff])

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isStaff) {
        query = query.eq('user_id', user.id)
      }

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      urgent: 'text-red-400',
    }
    return colors[priority] || colors.medium
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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    }
    return labels[priority] || priority
  }

  return (
    <div className="flex flex-1 flex-col bg-[#36393f]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225]">
        <h2 className="text-white font-semibold">Destek Ticket'ları</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-[#202225] space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#72767d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              loadTickets()
            }}
            placeholder="Ticket ara..."
            className="flex-1 bg-[#202225] text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === status
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#202225] text-[#dcddde] hover:bg-[#2a2d31]'
              }`}
            >
              {status === 'all' ? 'Tümü' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-[#72767d]">Yükleniyor...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-[#72767d]">
            <p>Henüz ticket yok</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
            >
              İlk Ticket'ı Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <a
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className="block bg-[#2f3136] rounded-lg p-4 hover:bg-[#393c43] transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-white font-semibold flex-1">{ticket.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className={`text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[#dcddde] line-clamp-2 mb-2">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#72767d]">
                  <span>
                    {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </span>
                  {ticket.assigned_to && (
                    <span className="text-[#5865f2]">Atanmış</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <SupportTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTicketCreated={() => {
            setShowCreateModal(false)
            loadTickets()
          }}
        />
      )}
    </div>
  )
}
