'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, User, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomLinksEditor from '@/components/profile/CustomLinksEditor'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale/tr'

interface UserProfile {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  custom_links: any[]
  profile_link: string | null
  status: string
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadProfile()
    getCurrentUser()
  }, [slug])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('profile_link', slug)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: '#43b581',
      away: '#faa61a',
      busy: '#f04747',
      offline: '#747f8d',
    }
    return colors[status] || colors.offline
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      online: 'Çevrimiçi',
      away: 'Uzakta',
      busy: 'Meşgul',
      offline: 'Çevrimdışı',
    }
    return labels[status] || 'Çevrimdışı'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Profil Bulunamadı</h1>
          <p className="text-[#72767d] mb-4">Bu profil mevcut değil veya silinmiş olabilir.</p>
          <button
            onClick={() => router.push('/app')}
            className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  const displayName = profile.display_name || profile.username
  const isOwnProfile = currentUser?.id === profile.user_id

  return (
    <div className="min-h-screen bg-[#202225]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[#b9bbbe] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri</span>
        </button>

        {/* Profile Header */}
        <div className="bg-[#2f3136] rounded-lg p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-4xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#2f3136]"
                style={{ backgroundColor: getStatusColor(profile.status) }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                {isOwnProfile && (
                  <span className="px-2 py-1 bg-[#5865f2] text-white text-xs rounded">
                    Sen
                  </span>
                )}
              </div>
              <p className="text-[#72767d] mb-4">@{profile.username}</p>
              <div className="flex items-center gap-4 text-sm text-[#72767d]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(profile.status) }}
                  />
                  <span>{getStatusLabel(profile.status)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Links */}
        {profile.custom_links && profile.custom_links.length > 0 && (
          <div className="bg-[#2f3136] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Linkler
            </h2>
            <CustomLinksEditor links={profile.custom_links} onLinksChange={() => {}} readOnly />
          </div>
        )}

        {/* About Section */}
        <div className="bg-[#2f3136] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Hakkında</h2>
          <p className="text-[#dcddde]">
            {isOwnProfile
              ? 'Bu senin profilin. Profil düzenle butonundan görünen ismini ve linklerini güncelleyebilirsin.'
              : 'Bu kullanıcı henüz bir açıklama eklememiş.'}
          </p>
        </div>
      </div>
    </div>
  )
}
