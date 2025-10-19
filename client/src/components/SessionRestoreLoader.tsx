'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Loader2 } from 'lucide-react'

export function SessionRestoreLoader() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-4 w-72 h-72 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 -right-4 w-72 h-72 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-pink-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header with loading state */}
      <motion.header
        data-testid="motion-div"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg shadow-gray-100/50"
      >
        <div className="flex items-center gap-4">
          <motion.div
            data-testid="motion-div"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/50"
          >
            <span className="text-white font-bold text-lg drop-shadow-sm">AI</span>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Chatbot
            </h1>
            <motion.p
              data-testid="motion-div"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-600 font-medium"
            >
              Restoring your session...
            </motion.p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            data-testid="motion-div"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="p-3 text-indigo-600 bg-indigo-50 rounded-xl"
          >
            <Loader2 size={20} />
          </motion.div>
        </div>
      </motion.header>

      {/* Loading content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <motion.div
            data-testid="motion-div"
            animate={{ 
              y: [0, -12, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-300/50"
          >
            <MessageCircle className="text-white text-2xl drop-shadow-md" size={32} />
          </motion.div>
          
          <motion.h2
            data-testid="motion-div"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
          >
            Restoring Session
          </motion.h2>
          
          <motion.p
            data-testid="motion-div"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 mb-8 leading-relaxed"
          >
            Loading your chat history and reconnecting...
          </motion.p>

          {/* Loading animation */}
          <motion.div
            data-testid="motion-div"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                data-testid="motion-div"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              />
            ))}
          </motion.div>

          <motion.p
            data-testid="motion-div"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-gray-500 mt-6"
          >
            This usually takes just a few seconds
          </motion.p>
        </div>
      </div>
    </div>
  )
}