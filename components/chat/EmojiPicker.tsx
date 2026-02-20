'use client'

import { useState } from 'react'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

const commonEmojis = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '👏',
  '🎉', '💯', '✅', '❌', '⭐', '💡', '🚀', '🎯',
  '😊', '😍', '🤔', '😴', '🤮', '💪', '🙏', '🎊'
]

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-[#393c43] rounded text-[#b9bbbe] hover:text-white transition-colors"
        title="Emoji Ekle"
      >
        <Smile className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-[#2f3136] border border-[#202225] rounded-lg shadow-xl p-3 w-64 z-50">
            <div className="grid grid-cols-6 gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji)
                    setIsOpen(false)
                  }}
                  className="p-2 hover:bg-[#393c43] rounded text-2xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#202225]">
              <input
                type="text"
                placeholder="Emoji ara..."
                className="w-full bg-[#202225] text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    onSelect(e.currentTarget.value)
                    setIsOpen(false)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
