'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SupportTicketList from '@/components/support/SupportTicketList'
import SupportStaffPanel from '@/components/support/SupportStaffPanel'

export default function SupportPage() {
  const [user, setUser] = useState<any>(null)
  const [isStaff, setIsStaff] = useState(false)
  const router = useRouter()

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
      <SupportTicketList isStaff={isStaff} />
      {isStaff && <SupportStaffPanel />}
    </div>
  )
}
