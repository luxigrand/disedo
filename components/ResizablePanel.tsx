'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth: number
  storageKey: string
  position: 'left' | 'right'
  onResize?: (width: number) => void
}

export default function ResizablePanel({
  children,
  defaultWidth,
  storageKey,
  position,
  onResize,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Load saved width from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setWidth(parsed)
      }
    }
  }, [storageKey])

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, width.toString())
    onResize?.(width)
  }, [width, storageKey, onResize])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const delta = position === 'left' 
      ? e.clientX - startXRef.current
      : startXRef.current - e.clientX
    
    const newWidth = Math.max(1, startWidthRef.current + delta) // Minimum 1px
    setWidth(newWidth)
  }, [isResizing, position])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={panelRef}
      className="relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="h-full w-full overflow-hidden">
        {children}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 bottom-0 cursor-col-resize z-[100] ${
          position === 'right' ? 'right-0' : 'left-0'
        }`}
        style={{ 
          cursor: 'col-resize',
          width: '10px',
          marginLeft: position === 'left' ? '-5px' : '0',
          marginRight: position === 'right' ? '-5px' : '0',
        }}
        title="Sürükleyerek boyutu değiştirin"
      >
        <div className={`absolute top-0 bottom-0 w-full bg-transparent hover:bg-[#5865f2]/30 transition-all ${
          position === 'right' ? 'right-0' : 'left-0'
        } ${isResizing ? 'bg-[#5865f2]/50' : ''}`} />
      </div>
    </div>
  )
}
