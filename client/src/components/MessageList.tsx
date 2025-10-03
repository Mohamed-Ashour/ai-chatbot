'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Message } from './Message'
import { TypingIndicator } from './TypingIndicator'
import { Message as MessageType } from '@/types/chat'

interface MessageListProps {
  messages: MessageType[]
  isTyping?: boolean
}

export function MessageList({ messages, isTyping = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200/50"
          >
            <svg
              className="w-10 h-10 text-white drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Start a conversation
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Send a message to begin chatting with the AI assistant.
            Ask anything you&apos;d like to know!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto py-6 px-2"
    >
      <div className="max-w-4xl mx-auto min-h-0">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
          />
        ))}
        
        <AnimatePresence>
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}