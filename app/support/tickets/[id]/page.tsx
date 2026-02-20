'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import SupportTicketView from '@/components/support/SupportTicketView'
import { ArrowLeft } from 'lucide-react'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Check if user is staff
    const { data: staff } = await supabase
      .from('support_staff')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    setIsStaff(!!staff)
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#202225]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#202225]">
      <div className="flex flex-1 flex-col">
        <div className="h-12 px-4 flex items-center border-b border-[#202225] bg-[#2f3136]">
          <button
            onClick={() => router.push('/support')}
            className="mr-4 text-[#b9bbbe] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold">Ticket Detayı</h1>
        </div>
        <SupportTicketView ticketId={ticketId} isStaff={isStaff} />
      </div>
    </div>
  )
}
