'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (!message.trim() || disabled || isLoading) return

    const messageToSend = message.trim()
    setMessage('')
    setIsLoading(true)

    // Reset textarea height and overflow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.overflowY = 'hidden'
    }

    try {
      onSendMessage(messageToSend)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea and manage scrollbar
    const textarea = e.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 120)
    textarea.style.height = `${newHeight}px`
    
    // Show scrollbar only when content exceeds max height
    if (textarea.scrollHeight > 120) {
      textarea.style.overflowY = 'auto'
    } else {
      textarea.style.overflowY = 'hidden'
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-white/20 p-6">
      <div className="flex gap-4 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                'w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-3xl resize-none shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300',
                'placeholder-gray-400 text-gray-800 font-medium',
                'transition-all duration-300',
                'hover:border-gray-200 hover:shadow-md',
                'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                minHeight: '52px',
                maxHeight: '128px'
              }}
            />
          </div>
        </div>

        <motion.button
          whileHover={{
            scale: disabled || isLoading ? 1 : 1.05,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
          }}
          whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
          onClick={handleSubmit}
          disabled={disabled || isLoading || !message.trim()}
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-lg',
            message.trim() && !disabled && !isLoading
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-300/50 hover:shadow-xl'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <motion.div
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
          >
            {isLoading ? (
              <Loader2 size={22} />
            ) : (
              <Send size={22} className="ml-0.5" />
            )}
          </motion.div>
        </motion.button>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center font-medium">
        Press <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">Enter</kbd> to send,
        <kbd className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono ml-1">Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}