'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <motion.div
      data-testid="motion-div"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex gap-4 mb-6 px-4"
    >
      {/* Avatar */}
      <motion.div
        data-testid="motion-div"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-white bg-gradient-to-br from-emerald-400 to-cyan-400 text-white ring-emerald-200"
      >
        <Bot size={20} className="drop-shadow-sm" />
      </motion.div>

      {/* Typing Bubble */}
      <motion.div
        data-testid="motion-div"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="max-w-[75%] px-5 py-4 rounded-3xl shadow-lg relative backdrop-blur-sm bg-white/90 text-gray-800 mr-2 border border-gray-100 shadow-xl"
      >
        {/* Message tail */}
        <div className="absolute w-3 h-3 transform rotate-45 bg-white -left-1 top-4 border-l border-b border-gray-100" />
        
        {/* Sender name */}
        <div className="text-xs font-semibold mb-2 tracking-wide text-emerald-600">
          AI Assistant
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">
            Thinking
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                data-testid="motion-div"
                className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 rounded-3xl -z-10" />
      </motion.div>
    </motion.div>
  )
}
