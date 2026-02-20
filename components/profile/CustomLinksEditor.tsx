'use client'

import { Link2, ExternalLink } from 'lucide-react'

interface CustomLink {
  type: string
  label: string
  url: string
}

interface CustomLinksEditorProps {
  links: CustomLink[]
  onLinksChange: (links: CustomLink[]) => void
  readOnly?: boolean
}

export default function CustomLinksEditor({
  links,
  onLinksChange,
  readOnly = false,
}: CustomLinksEditorProps) {
  const getLinkIcon = (type: string) => {
    const icons: Record<string, string> = {
      website: '🌐',
      twitter: '🐦',
      instagram: '📷',
      github: '💻',
      linkedin: '💼',
      youtube: '📺',
      discord: '💬',
      other: '🔗',
    }
    return icons[type] || '🔗'
  }

  const getLinkColor = (type: string) => {
    const colors: Record<string, string> = {
      website: 'text-blue-400',
      twitter: 'text-blue-300',
      instagram: 'text-pink-400',
      github: 'text-gray-300',
      linkedin: 'text-blue-500',
      youtube: 'text-red-400',
      discord: 'text-indigo-400',
      other: 'text-gray-400',
    }
    return colors[type] || 'text-gray-400'
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-4 text-[#72767d] text-sm">
        <Link2 className="w-5 h-5 mx-auto mb-2 opacity-50" />
        <p>Henüz link eklenmemiş</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-[#202225] hover:bg-[#2a2d31] rounded-lg transition-colors group"
        >
          <span className="text-2xl">{getLinkIcon(link.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {link.label || link.type}
            </div>
            <div className="text-xs text-[#72767d] truncate">{link.url}</div>
          </div>
          <ExternalLink className="w-4 h-4 text-[#72767d] group-hover:text-white transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  )
}
