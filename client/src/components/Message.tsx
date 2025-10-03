'use client'

import { motion } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Message as MessageType } from '@/types/chat'
import { formatTimestamp, cn } from '@/lib/utils'

// Import highlight.js theme
import 'highlight.js/styles/github-dark.css'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const isUser = message.isUser

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        'flex gap-4 mb-6 px-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-white',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-blue-200'
            : 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-white ring-emerald-200'
        )}
      >
        {isUser ? (
          <User size={20} className="drop-shadow-sm" />
        ) : (
          <Bot size={20} className="drop-shadow-sm" />
        )}
      </motion.div>

      {/* Message Bubble */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={cn(
          'max-w-[75%] px-5 py-4 rounded-3xl shadow-lg relative backdrop-blur-sm',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white ml-2'
            : 'bg-white/90 text-gray-800 mr-2 border border-gray-100 shadow-xl'
        )}
      >
        {/* Message tail */}
        <div className={cn(
          'absolute w-3 h-3 transform rotate-45',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 -right-1 top-4'
            : 'bg-white -left-1 top-4 border-l border-b border-gray-100'
        )} />
        
        {/* Sender name */}
        <div className={cn(
          'text-xs font-semibold mb-2 tracking-wide',
          isUser
            ? 'text-blue-100'
            : 'text-emerald-600'
        )}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        
        {/* Message content with markdown support */}
        <div className={cn(
          'text-[15px] leading-relaxed break-words font-medium markdown-content',
          isUser
            ? 'text-white markdown-user'
            : 'text-gray-700 markdown-ai'
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => (
                <h1 className={cn(
                  'text-xl font-bold mb-3 mt-2',
                  isUser ? 'text-white' : 'text-gray-800'
                )}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className={cn(
                  'text-lg font-semibold mb-2 mt-2',
                  isUser ? 'text-white' : 'text-gray-800'
                )}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={cn(
                  'text-base font-semibold mb-2 mt-2',
                  isUser ? 'text-white' : 'text-gray-800'
                )}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-2 last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className={cn(
                  'list-disc list-inside mb-2 space-y-1',
                  isUser ? 'text-white' : 'text-gray-700'
                )}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className={cn(
                  'list-decimal list-inside mb-2 space-y-1',
                  isUser ? 'text-white' : 'text-gray-700'
                )}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="mb-1">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className={cn(
                  'border-l-4 pl-4 my-2 italic',
                  isUser
                    ? 'border-blue-200 text-blue-100'
                    : 'border-gray-300 text-gray-600'
                )}>
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className={cn(
                    'px-1.5 py-0.5 rounded text-sm font-mono',
                    isUser
                      ? 'bg-blue-700/30 text-blue-100'
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {children}
                  </code>
                ) : (
                  <code className={className}>
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg my-2 overflow-x-auto text-sm">
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className={cn(
                  'font-bold',
                  isUser ? 'text-white' : 'text-gray-800'
                )}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className={cn(
                  'italic',
                  isUser ? 'text-blue-100' : 'text-gray-600'
                )}>
                  {children}
                </em>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'underline hover:no-underline transition-colors',
                    isUser
                      ? 'text-blue-200 hover:text-white'
                      : 'text-blue-600 hover:text-blue-800'
                  )}
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className={cn(
                    'min-w-full border-collapse text-sm',
                    isUser ? 'text-white' : 'text-gray-700'
                  )}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className={cn(
                  'border px-3 py-2 font-semibold text-left',
                  isUser
                    ? 'border-blue-300 bg-blue-700/20'
                    : 'border-gray-300 bg-gray-50'
                )}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className={cn(
                  'border px-3 py-2',
                  isUser
                    ? 'border-blue-300'
                    : 'border-gray-300'
                )}>
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div className={cn(
          'text-xs mt-3 opacity-70 font-medium',
          isUser
            ? 'text-blue-100'
            : 'text-gray-500'
        )}>
          {formatTimestamp(message.timestamp)}
        </div>
        
        {/* Subtle glow effect for AI messages */}
        {!isUser && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 rounded-3xl -z-10" />
        )}
      </motion.div>
    </motion.div>
  )
}
