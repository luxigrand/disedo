'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Mic, MicOff, Headphones, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UserProfileModal from '@/components/profile/UserProfileModal'

export default function UserControlPanel({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [headphonesMuted, setHeadphonesMuted] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setProfile(data)
    } else {
      // Create profile if doesn't exist
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Kullanıcı',
        })
        .select()
        .single()

      if (newProfile) {
        setProfile(newProfile)
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Kullanıcı'
  const username = profile?.username || user?.email?.split('@')[0] || 'Kullanıcı'
  const avatarUrl = profile?.avatar_url

  return (
    <div className="h-14 bg-[#292b2f] px-2 flex items-center justify-between border-t border-[#202225]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-semibold">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#43b581] border-2 border-[#292b2f]"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {displayName}
          </div>
          <div className="text-xs text-[#b9bbbe]">Çevrimiçi</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowProfileModal(true)}
          className="p-1.5 rounded hover:bg-[#393c43] text-[#b9bbbe] hover:text-white transition-colors"
          title="Profil Düzenle"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMicMuted(!micMuted)}
          className={`p-1.5 rounded hover:bg-[#393c43] transition-colors ${
            micMuted ? 'text-red-400' : 'text-[#b9bbbe] hover:text-white'
          }`}
          title={micMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setHeadphonesMuted(!headphonesMuted)}
          className={`p-1.5 rounded hover:bg-[#393c43] transition-colors ${
            headphonesMuted ? 'text-red-400' : 'text-[#b9bbbe] hover:text-white'
          }`}
          title={headphonesMuted ? 'Kulaklığı Aç' : 'Kulaklığı Kapat'}
        >
          {headphonesMuted ? (
            <Headphones className="w-5 h-5" />
          ) : (
            <Headphones className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleSignOut}
          className="p-1.5 rounded hover:bg-[#393c43] text-[#b9bbbe] hover:text-white transition-colors"
          title="Ayarlar / Çıkış"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={user.id}
        />
      )}
    </div>
  )
}
