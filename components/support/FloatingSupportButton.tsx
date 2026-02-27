'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import SupportChatPopup from './SupportChatPopup'

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Support Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-[#40444b] hover:bg-[#36393f]'
            : 'bg-[#5865f2] hover:bg-[#4752c4]'
        }`}
        aria-label="Destek Merkezi"
        title="Destek Merkezi"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Support Chat Popup */}
      <SupportChatPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
