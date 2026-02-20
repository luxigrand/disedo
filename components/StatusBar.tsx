'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Wifi, WifiOff, Users, Activity, Bell } from 'lucide-react'

interface StatusBarProps {
  serverId?: string | null
  channelId?: string | null
}

export default function StatusBar({ serverId, channelId }: StatusBarProps) {
  const [onlineCount, setOnlineCount] = useState(0)
  const [ping, setPing] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [channelName, setChannelName] = useState<string | null>(null)

  useEffect(() => {
    // Ping measurement
    const measurePing = async () => {
      const start = Date.now()
      try {
        const { error } = await supabase.from('servers').select('id').limit(1)
        if (!error) {
          const latency = Date.now() - start
          setPing(latency)
        }
      } catch (error) {
        setPing(null)
      }
    }

    measurePing()
    const pingInterval = setInterval(measurePing, 5000)

    // Connection status monitoring
    const checkConnection = () => {
      setIsConnected(navigator.onLine)
    }

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)

    // Load online count
    if (serverId) {
      loadOnlineCount()
      const countInterval = setInterval(loadOnlineCount, 10000)
      return () => {
        clearInterval(pingInterval)
        clearInterval(countInterval)
        window.removeEventListener('online', checkConnection)
        window.removeEventListener('offline', checkConnection)
      }
    }

    return () => {
      clearInterval(pingInterval)
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
    }
  }, [serverId])

  useEffect(() => {
    if (channelId) {
      loadChannelName()
    } else {
      setChannelName(null)
    }
  }, [channelId])

  const loadOnlineCount = async () => {
    if (!serverId) return

    try {
      const { data: members, error } = await supabase
        .from('server_members')
        .select('user_id')
        .eq('server_id', serverId)

      if (error) throw error

      const userIds = members?.map((m) => m.user_id) || []

      if (userIds.length === 0) {
        setOnlineCount(0)
        return
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('status')
        .in('user_id', userIds)
        .eq('status', 'online')

      if (!profilesError) {
        setOnlineCount(profiles?.length || 0)
      }
    } catch (error) {
      console.error('Error loading online count:', error)
    }
  }

  const loadChannelName = async () => {
    if (!channelId) return

    try {
      const { data, error } = await supabase
        .from('channels')
        .select('name')
        .eq('id', channelId)
        .single()

      if (!error && data) {
        setChannelName(data.name)
      }
    } catch (error) {
      console.error('Error loading channel name:', error)
    }
  }

  const getPingColor = (pingValue: number | null) => {
    if (pingValue === null) return 'text-[#72767d]'
    if (pingValue < 100) return 'text-[#43b581]'
    if (pingValue < 200) return 'text-[#faa61a]'
    return 'text-[#f04747]'
  }

  return (
    <div className="h-6 bg-[#18191c] border-t border-[#202225] px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#43b581]" />
              <span className="text-[#43b581]">Bağlı</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-[#f04747]" />
              <span className="text-[#f04747]">Bağlantı Yok</span>
            </>
          )}
        </div>

        {/* Ping */}
        {ping !== null && (
          <div className="flex items-center gap-1.5">
            <Activity className={`w-3.5 h-3.5 ${getPingColor(ping)}`} />
            <span className={getPingColor(ping)}>{ping}ms</span>
          </div>
        )}

        {/* Online Count */}
        {serverId && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#43b581]" />
            <span className="text-[#dcddde]">{onlineCount} çevrimiçi</span>
          </div>
        )}

        {/* Active Channel */}
        {channelName && (
          <div className="text-[#72767d]">
            #{channelName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        {notificationCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#5865f2]" />
            <span className="text-[#5865f2] font-semibold">{notificationCount}</span>
          </div>
        )}

        {/* System Status */}
        <div className="text-[#72767d]">
          Disedo v0.1.0
        </div>
      </div>
    </div>
  )
}
