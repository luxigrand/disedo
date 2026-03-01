'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, X } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const router = useRouter()

  // Handle footer click to open admin modal
  const handleFooterClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)
    
    // Reset counter after 3 seconds if not reached 8
    setTimeout(() => {
      if (newCount < 8) {
        setClickCount(0)
      }
    }, 3000)

    if (newCount >= 8) {
      setClickCount(0)
      setShowAdminModal(true)
      setAdminPassword('')
      setError(null)
    }
  }

  // Handle admin password submission (shortcut login)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (adminPassword !== '132412') {
      setError('Yanlış şifre!')
      setAdminPassword('')
      return
    }

    setAdminLoading(true)
    setError(null)

    try {
      // Arka planda admin@admin.com / 150412 ile giriş yap
      const realAdminEmail = 'admin@admin.com'
      const realAdminPassword = '150412'

      // Önce giriş yapmayı dene
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: realAdminEmail,
        password: realAdminPassword,
      })

      // Eğer kullanıcı yoksa, oluştur
      if (signInError && (signInError.message.includes('Invalid login') || signInError.message.includes('Invalid credentials'))) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: realAdminEmail,
          password: realAdminPassword,
        })

        if (signUpError) throw signUpError

        // Kayıt sonrası otomatik giriş
        const { data: signInData, error: signInError2 } = await supabase.auth.signInWithPassword({
          email: realAdminEmail,
          password: realAdminPassword,
        })

        if (signInError2) throw signInError2
        data = signInData
      } else if (signInError) {
        throw signInError
      }

      if (data.user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setShowAdminModal(false)
          setAdminPassword('')
          window.location.href = '/app'
        } else {
          throw new Error('Session oluşturulamadı.')
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err)
      setError(err.message || 'Giriş başarısız.')
      setAdminLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.user) {
          // Verify session is set
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Use window.location for hard redirect to ensure cookies are sent
            window.location.href = '/app'
          } else {
            throw new Error('Session oluşturulamadı. Lütfen tekrar deneyin.')
          }
        }
      } else {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          // After sign up, automatically sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) throw signInError

          // Verify session is set
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Use window.location for hard redirect to ensure cookies are sent
            window.location.href = '/app'
          } else {
            throw new Error('Session oluşturulamadı. Lütfen tekrar deneyin.')
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#202225] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#36393f] rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h1>
            <p className="text-[#b9bbbe] text-sm">
              {isLogin
                ? 'Devam etmek için giriş yapın'
                : 'Yeni bir hesap oluşturun'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#b9bbbe] mb-2 uppercase tracking-wide">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#72767d]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#202225] border border-[#202225] rounded text-white placeholder-[#72767d] focus:outline-none focus:border-[#5865f2] transition-colors"
                  placeholder="ornek@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#b9bbbe] mb-2 uppercase tracking-wide">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#72767d]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-[#202225] border border-[#202225] rounded text-white placeholder-[#72767d] focus:outline-none focus:border-[#5865f2] transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <span>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
              }}
              className="text-sm text-[#5865f2] hover:underline"
              disabled={loading}
            >
              {isLogin
                ? 'Hesabınız yok mu? Kayıt olun'
                : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p 
          className="text-center text-[#72767d] text-sm mt-6 cursor-pointer hover:text-[#b9bbbe] transition-colors"
          onClick={handleFooterClick}
          title=""
        >
          Disedo © 2024-2026
        </p>
      </div>

      {/* Admin Modal (Shortcut Login) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#36393f] rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Kısayol Girişi</h2>
              <button
                onClick={() => {
                  setShowAdminModal(false)
                  setAdminPassword('')
                  setError(null)
                }}
                className="text-[#b9bbbe] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="adminPassword" className="block text-xs font-semibold text-[#b9bbbe] mb-2 uppercase tracking-wide">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#72767d]" />
                  <input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-[#202225] border border-[#202225] rounded text-white placeholder-[#72767d] focus:outline-none focus:border-[#5865f2] transition-colors"
                    placeholder="••••••••"
                    disabled={adminLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading || !adminPassword}
                className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {adminLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Giriş yapılıyor...</span>
                  </>
                ) : (
                  <span>Giriş Yap</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
