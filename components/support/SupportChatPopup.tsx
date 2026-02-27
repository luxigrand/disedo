'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SupportChatPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportChatPopup({ isOpen, onClose }: SupportChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reset messages when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      // Start with a welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Merhaba! Disedo destek ekibine hoş geldiniz. Size nasıl yardımcı olabilirim?',
          timestamp: new Date(),
        },
      ])
      setError(null)
      // Focus input when popup opens
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // Clear messages when popup closes
      setMessages([])
      setInputMessage('')
      setError(null)
    }
  }, [isOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)
    setError(null)

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Call API
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const resetAt = data.resetAt ? new Date(data.resetAt) : null
          const waitTime = resetAt
            ? Math.ceil((resetAt.getTime() - Date.now()) / 1000)
            : 60

          throw new Error(
            data.error || `Çok fazla istek gönderdiniz. Lütfen ${waitTime} saniye sonra tekrar deneyin.`
          )
        }

        throw new Error(data.error || 'Bir hata oluştu. Lütfen tekrar deneyin.')
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.')

      // Remove the user message if there was an error (optional - you might want to keep it)
      // setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      // Refocus input after sending
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Chat Popup */}
      <div className="relative w-full max-w-md h-[600px] bg-[#36393f] rounded-t-lg shadow-2xl flex flex-col pointer-events-auto mr-6 mb-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#202225] flex items-center justify-between bg-[#2f3136] rounded-t-lg">
          <div>
            <h2 className="text-lg font-semibold text-white">Destek Merkezi</h2>
            <p className="text-xs text-[#72767d]">AI Destekli Yardım</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#b9bbbe] hover:text-white transition-colors p-1 hover:bg-[#202225] rounded"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#5865f2] text-white'
                    : 'bg-[#2f3136] text-[#dcddde]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#2f3136] text-[#dcddde] rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#202225] p-4 bg-[#2f3136]">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın... (Enter ile gönder, Shift+Enter ile satır atla)"
              disabled={loading}
              rows={3}
              maxLength={2000}
              className="flex-1 bg-[#202225] text-white px-4 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#5865f2] disabled:opacity-50 disabled:cursor-not-allowed placeholder-[#72767d]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
              aria-label="Gönder"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-[#72767d] mt-2 text-right">
            {inputMessage.length}/2000
          </p>
        </div>
      </div>
    </div>
  )
}
