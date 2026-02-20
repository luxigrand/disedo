'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface LinkPreviewProps {
  url: string
}

interface PreviewData {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simple link preview - in production, use a backend service
    const domain = new URL(url).hostname
    setPreview({
      title: domain,
      description: url,
      siteName: domain,
    })
    setLoading(false)
  }, [url])

  if (loading) {
    return (
      <div className="mt-2 border border-[#202225] rounded-lg overflow-hidden bg-[#2f3136]">
        <div className="p-3">
          <div className="animate-pulse">
            <div className="h-4 bg-[#40444b] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[#40444b] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 border border-[#202225] rounded-lg overflow-hidden bg-[#2f3136] hover:bg-[#36393f] transition-colors block group"
    >
      {preview?.image && (
        <div className="w-full h-40 bg-[#202225] overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="p-3">
        {preview?.siteName && (
          <div className="text-xs text-[#72767d] mb-1 uppercase">{preview.siteName}</div>
        )}
        {preview?.title && (
          <div className="text-sm font-semibold text-white mb-1 group-hover:text-[#5865f2] transition-colors">
            {preview.title}
          </div>
        )}
        {preview?.description && (
          <div className="text-xs text-[#dcddde] line-clamp-2">{preview.description}</div>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-[#5865f2]">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{url}</span>
        </div>
      </div>
    </a>
  )
}
