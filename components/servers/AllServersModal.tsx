'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Loader2, Lock, User } from 'lucide-react'

interface ServerWithOwner {
  id: string
  name: string
  icon_url: string | null
  owner_id: string
  created_at: string
  password: string | null
  owner: {
    username: string
    display_name: string | null
    avatar_url: string | null
    email?: string
  } | null
}

interface AllServersModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectServer?: (serverId: string) => void
}

export default function AllServersModal({
  isOpen,
  onClose,
  onSelectServer,
}: AllServersModalProps) {
  const [servers, setServers] = useState<ServerWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordPrompt, setPasswordPrompt] = useState<{
    serverId: string
    serverName: string
  } | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:43',message:'useEffect triggered',data:{isOpen},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (isOpen) {
      loadAllServers()
    }
  }, [isOpen])

  const loadAllServers = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:49',message:'loadAllServers called',data:{isOpen},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setLoading(true)
      setError(null)

      // Tüm sunucuları çek
      // Not: password kolonu migration ile eklenmeli, yoksa hata verir
      const { data: serversData, error: serversError } = await supabase
        .from('servers')
        .select('id, name, icon_url, owner_id, created_at, password')
        .order('created_at', { ascending: false })

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:59',message:'Initial query result',data:{hasError:!!serversError,errorMessage:serversError?.message,hasData:!!serversData,dataLength:serversData?.length},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (serversError) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:61',message:'Error detected, checking if password column issue',data:{errorMessage:serversError.message,includesPassword:serversError.message?.includes('password'),includesColumn:serversError.message?.includes('column')},timestamp:Date.now(),runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Eğer password kolonu yoksa, sadece diğer kolonları çek
        if (serversError.message?.includes('password') || serversError.message?.includes('column')) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:64',message:'Fallback path triggered - querying without password column',data:{},timestamp:Date.now(),runId:'initial',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('servers')
            .select('id, name, icon_url, owner_id, created_at')
            .order('created_at', { ascending: false })
          
          if (fallbackError) throw fallbackError
          
          if (!fallbackData || fallbackData.length === 0) {
            setServers([])
            setLoading(false)
            return
          }

          // Get current user to check if we can show email
          const { data: { user: currentUser } } = await supabase.auth.getUser()

          // Her sunucu için sahip bilgisini çek
          const serversWithOwners = await Promise.all(
            fallbackData.map(async (server) => {
              const { data: ownerProfile, error: ownerError } = await supabase
                .from('user_profiles')
                .select('username, display_name, avatar_url')
                .eq('user_id', server.owner_id)
                .single()

              // Get owner email - only if it's the current user
              let ownerEmail = null
              if (!ownerError && currentUser && currentUser.id === server.owner_id) {
                ownerEmail = currentUser.email || null
              }

              return {
                ...server,
                password: null, // Password kolonu yok
                owner: ownerError
                  ? null
                  : {
                      ...ownerProfile,
                      email: ownerEmail,
                    },
              }
            })
          )
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:108',message:'Fallback successful, servers loaded',data:{serversCount:serversWithOwners.length},timestamp:Date.now(),runId:'initial',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setServers(serversWithOwners)
          setLoading(false)
          setError('Not: Password özelliği için migration çalıştırılmalı. Şimdilik şifre koruması yok.')
          return
        }
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:115',message:'Error not related to password column, throwing',data:{errorMessage:serversError.message},timestamp:Date.now(),runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw serversError
      }

      if (!serversData || serversData.length === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:120',message:'No servers found',data:{},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setServers([])
        setLoading(false)
        return
      }

      // Get current user to check if we can show email
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Her sunucu için sahip bilgisini çek
      const serversWithOwners = await Promise.all(
        serversData.map(async (server) => {
          const { data: ownerProfile, error: ownerError } = await supabase
            .from('user_profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', server.owner_id)
            .single()

          // Get owner email - only if it's the current user
          let ownerEmail = null
          if (!ownerError && currentUser && currentUser.id === server.owner_id) {
            ownerEmail = currentUser.email || null
          }

          return {
            ...server,
            owner: ownerError
              ? null
              : {
                  ...ownerProfile,
                  email: ownerEmail,
                },
          }
        })
      )

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:130',message:'Successfully loaded servers with owners',data:{serversCount:serversWithOwners.length},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setServers(serversWithOwners)
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:133',message:'Error caught in catch block',data:{errorMessage:err?.message,errorName:err?.name},timestamp:Date.now(),runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Error loading servers:', err)
      setError(err.message || 'Sunucular yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleServerClick = (server: ServerWithOwner) => {
    // Eğer sunucu şifre korumalıysa, şifre iste
    if (server.password) {
      setPasswordPrompt({
        serverId: server.id,
        serverName: server.name,
      })
      setPasswordInput('')
      setPasswordError(null)
      return
    }

    // Şifre yoksa direkt giriş yap
    if (onSelectServer) {
      onSelectServer(server.id)
    }
    onClose()
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordPrompt) return

    setPasswordError(null)

    // Şifreyi kontrol et
    const server = servers.find((s) => s.id === passwordPrompt.serverId)
    if (!server) {
      setPasswordError('Sunucu bulunamadı.')
      return
    }

    if (passwordInput !== server.password) {
      setPasswordError('Yanlış şifre!')
      setPasswordInput('')
      return
    }

    // Şifre doğru, sunucuya giriş yap
    if (onSelectServer) {
      onSelectServer(server.id)
    }
    setPasswordPrompt(null)
    setPasswordInput('')
    onClose()
  }

  // #region agent log
  if (isOpen) {
    fetch('http://127.0.0.1:7244/ingest/e4b184f0-875c-4890-a7a5-15aa59879e2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/servers/AllServersModal.tsx:154',message:'Modal rendering',data:{isOpen,serversCount:servers.length,loading,hasError:!!error},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#202225] flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#202225] flex items-center justify-between bg-[#2f3136]">
        <div>
          <h2 className="text-2xl font-semibold text-white">Tüm Sunucular</h2>
          <p className="text-sm text-[#72767d] mt-1">
            {servers.length} sunucu bulundu
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#b9bbbe] hover:text-white transition-colors p-2 hover:bg-[#202225] rounded"
          aria-label="Kapat"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#5865f2]" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#72767d]">Henüz sunucu bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => handleServerClick(server)}
                  className="p-6 bg-[#2f3136] hover:bg-[#393c43] rounded-lg transition-colors text-left group border border-[#202225] hover:border-[#5865f2]"
                >
                  <div className="flex flex-col gap-4">
                    {/* Server Icon and Name */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {server.icon_url ? (
                          <img
                            src={server.icon_url}
                            alt={server.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-2xl">
                            {server.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                          {server.name}
                        </h3>
                        {server.password && (
                          <div className="flex items-center gap-1 text-[#72767d] text-xs">
                            <Lock className="w-3 h-3" />
                            <span>Şifre Korumalı</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center gap-3 pt-2 border-t border-[#202225]">
                      <User className="w-4 h-4 text-[#72767d] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#72767d] mb-1">Sahip:</div>
                        {server.owner ? (
                          <div className="flex items-center gap-2">
                            {server.owner.avatar_url ? (
                              <img
                                src={server.owner.avatar_url}
                                alt={server.owner.username}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center">
                                <span className="text-[10px] text-white font-semibold">
                                  {server.owner.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-[#dcddde] font-medium truncate">
                                {server.owner.display_name || server.owner.username}
                              </div>
                              {server.owner.email && (
                                <div className="text-xs text-[#72767d] truncate">
                                  {server.owner.email}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#72767d]">Bilinmeyen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>

      {/* Password Prompt Modal */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-[#36393f] rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Şifre Gerekli</h3>
                <p className="text-xs text-[#72767d] mt-1">
                  {passwordPrompt.serverName} sunucusuna erişmek için şifre girin
                </p>
              </div>
              <button
                onClick={() => {
                  setPasswordPrompt(null)
                  setPasswordInput('')
                  setPasswordError(null)
                }}
                className="text-[#b9bbbe] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="serverPassword" className="block text-xs font-semibold text-[#b9bbbe] mb-2 uppercase tracking-wide">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#72767d]" />
                  <input
                    id="serverPassword"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-[#202225] border border-[#202225] rounded text-white placeholder-[#72767d] focus:outline-none focus:border-[#5865f2] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordPrompt(null)
                    setPasswordInput('')
                    setPasswordError(null)
                  }}
                  className="flex-1 px-4 py-2 bg-[#40444b] hover:bg-[#36393f] text-white rounded transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
