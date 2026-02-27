'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useQueryState } from 'nuqs'
import ServerSidebar from '@/components/ServerSidebar'
import ChannelsSidebar from '@/components/ChannelsSidebar'
import ChatArea from '@/components/ChatArea'
import MembersList from '@/components/MembersList'
import StatusBar from '@/components/StatusBar'

function AppPageContent() {
  const [selectedServer, setSelectedServerState] = useQueryState('server')
  const [selectedChannel, setSelectedChannelState] = useQueryState('channel')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Wrapper functions to match component signatures
  const setSelectedServer = (serverId: string) => {
    setSelectedServerState(serverId)
  }

  const setSelectedChannel = (channelId: string) => {
    setSelectedChannelState(channelId)
  }

  useEffect(() => {
    console.log('🔵 [APP] Component mount oldu, user kontrolü başlatılıyor...')
    
    const checkUser = async (retryCount = 0) => {
      console.log(`🔵 [APP] getUser() çağrılıyor... (retry: ${retryCount})`)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('🔵 [APP] getUser() sonucu:', { 
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        error: userError?.message 
      })

      // Also check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔵 [APP] getSession() sonucu:', { 
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionExpiresAt: session?.expires_at,
        error: sessionError?.message 
      })

      if (!user && retryCount < 5) {
        // Retry more times with increasing delays in case session is still being established
        const delay = retryCount === 0 ? 300 : 500 * retryCount
        console.log(`⚠️ [APP] User bulunamadı, ${delay}ms sonra tekrar deneniyor... (retry ${retryCount + 1}/5)`)
        setTimeout(() => checkUser(retryCount + 1), delay)
      } else if (!user) {
        console.error('❌ [APP] User bulunamadı (tüm denemeler başarısız), /login sayfasına yönlendiriliyor...')
        // Use window.location to force full page reload
        window.location.href = '/login'
      } else {
        console.log('✅ [APP] User bulundu, state güncelleniyor:', { 
          userId: user.id,
          email: user.email 
        })
        setUser(user)
      }
    }

    checkUser()

    console.log('🔵 [APP] onAuthStateChange listener kuruluyor...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔵 [APP] Auth state değişti:', { 
        event,
        hasSession: !!session,
        sessionUserId: session?.user?.id 
      })
      
      if (!session) {
        if (event === 'SIGNED_OUT') {
          console.error('❌ [APP] SIGNED_OUT event, /login sayfasına yönlendiriliyor...')
          router.push('/login')
        }
      } else {
        console.log('✅ [APP] Session mevcut, user state güncelleniyor')
        setUser(session.user)
      }
    })

    return () => {
      console.log('🔵 [APP] Component unmount, subscription temizleniyor...')
      subscription.unsubscribe()
    }
  }, [router])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#202225]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#202225]">
      {/* Server Sidebar */}
      <ServerSidebar
        selectedServer={selectedServer}
        onSelectServer={setSelectedServer}
      />

      {/* Channels Sidebar */}
      {selectedServer && (
        <ChannelsSidebar
          serverId={selectedServer}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <ChatArea channelId={selectedChannel} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[#36393f]">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-[#dcddde]">
                Bir kanal seç
              </h2>
              <p className="text-[#72767d]">
                Sohbete başlamak için soldan bir kanal seç
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      {selectedServer && <MembersList serverId={selectedServer} />}

      {/* Status Bar */}
      <StatusBar serverId={selectedServer} channelId={selectedChannel} />
    </div>
  )
}

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

export default function AppPage() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/app/page.tsx:148',message:'AppPage wrapper rendered',data:{hasSuspense:true},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#202225]">
        <div className="text-white">Yükleniyor...</div>
      </div>
    }>
      <AppPageContent />
    </Suspense>
  )
}
