'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeModalProps {
  isOpen: boolean
  onConnect: (name: string) => void
  isConnecting: boolean
  onClose?: () => void
}

export function WelcomeModal({ isOpen, onConnect, isConnecting, onClose }: WelcomeModalProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && !isConnecting) {
      onConnect(name.trim())
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
          >
            {/* Close Button */}
            {onClose && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </motion.button>
            )}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
              >
                Welcome to AI Chat
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-400"
              >
                Enter your name to start chatting with our AI assistant
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    disabled={isConnecting}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg",
                      "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      "transition-colors duration-200",
                      isConnecting && "opacity-50 cursor-not-allowed"
                    )}
                    autoFocus
                  />
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: !name.trim() || isConnecting ? 1 : 1.02 }}
                whileTap={{ scale: !name.trim() || isConnecting ? 1 : 0.98 }}
                type="submit"
                disabled={!name.trim() || isConnecting}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200",
                  name.trim() && !isConnecting
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                )}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Connecting...
                  </div>
                ) : (
                  'Start Chatting'
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400"
            >
              By continuing, you agree to our terms of service
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}