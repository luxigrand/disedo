'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
        <p className="text-center text-[#72767d] text-sm mt-6">
          Disedo © 2024
        </p>
      </div>
    </div>
  )
}
