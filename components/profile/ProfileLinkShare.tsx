'use client'

import { useState } from 'react'
import { Copy, Check, Share2, X } from 'lucide-react'

interface ProfileLinkShareProps {
  profileLink: string
  username: string
}

export default function ProfileLinkShare({ profileLink, username }: ProfileLinkShareProps) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profileLink}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username} - Disedo Profili`,
          text: `${username} profilini görüntüle`,
          url: fullUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowShare(!showShare)}
        className="p-2 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white transition-colors"
        title="Profil Linkini Paylaş"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showShare && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#2f3136] border border-[#202225] rounded-lg shadow-xl p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Profil Linkini Paylaş</h3>
            <button
              onClick={() => setShowShare(false)}
              className="text-[#72767d] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 bg-[#202225] text-white text-sm px-3 py-2 rounded"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopyala
                </>
              )}
            </button>
          </div>

          {navigator.share && (
            <button
              onClick={shareProfile}
              className="w-full px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Paylaş
            </button>
          )}
        </div>
      )}
    </div>
  )
}
