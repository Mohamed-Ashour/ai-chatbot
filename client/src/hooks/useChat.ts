'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Message, ConnectionStatus } from '@/types/chat'
import { generateId } from '@/lib/utils'
import { saveSession, loadSession, clearSession } from '@/lib/session'

// Server message format
interface ServerMessage {
  id?: string
  msg: string
  timestamp: string
  source: 'user' | 'assistant'
}

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'


export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [hasValidSession, setHasValidSession] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(true) // Start as true to check for session
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const manuallyClosed = useRef<boolean>(false)

  const handleTokenExpiration = useCallback(() => {
    console.log('Token expired - disconnecting user and clearing session')
    
    // Clear session data
    clearSession()
    setHasValidSession(false)
    setToken(null)
    setUserName(null)
    setMessages([])
    setConnectionStatus('disconnected')
    setIsRestoringSession(false)
    
    // Close WebSocket if open
    if (ws.current) {
      ws.current.close(1000, 'Token expired')
      ws.current = null
    }
    
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    toast.error('Your session has expired. Please sign in again.')
  }, [])

  const cleanup = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [])

  const getChatToken = async (name: string): Promise<string> => {
    try {
      const response = await fetch(`${SERVER_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `name=${encodeURIComponent(name)}`
      })

      if (!response.ok) {
        throw new Error('Failed to get chat token')
      }

      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Error getting token:', error)
      throw error
    }
  }

  const getChatHistory = async (token: string): Promise<{ messages: Message[], tokenExpired: boolean }> => {
    try {
      const response = await fetch(`${SERVER_URL}/chat_history?token=${encodeURIComponent(token)}`)
      
      if (!response.ok) {
        if (response.status === 400) {
          // Check if it's specifically a token expiration (server returns "Session expired or does not exist")
          const errorData = await response.json().catch(() => ({ detail: '' }))
          const isTokenExpired = errorData.detail?.includes('expired') || errorData.detail?.includes('does not exist')
          
          if (isTokenExpired) {
            console.log('Token expired - session no longer valid')
            return { messages: [], tokenExpired: true }
          }
        }
        throw new Error('Failed to get chat history')
      }

      const data = await response.json()
      console.log('Chat history loaded:', data.messages?.length || 0, 'messages')
      
      // Convert server message format to frontend format
      const messages: Message[] = data.messages?.map((msg: ServerMessage) => ({
        id: msg.id || generateId(),
        content: msg.msg,
        timestamp: new Date(msg.timestamp),
        isUser: msg.source === 'user' // Use source field to determine if message is from user
      })) || []
      
      return { messages, tokenExpired: false }
    } catch (error) {
      console.error('Error getting chat history:', error)
      return { messages: [], tokenExpired: false } // Return empty array on error
    }
  }

  const connectWebSocket = useCallback((chatToken: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')
    const connectionStartTime = Date.now()
    
    try {
      ws.current = new WebSocket(`${WS_URL}/chat?token=${chatToken}`)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setConnectionStatus('connected')
        toast.success('Connected to chat server')
        // Clear any reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.current.onmessage = (event) => {
        console.log('Message received:', event.data)
        
        // Clear typing indicator
        setIsTyping(false)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }

        const message: Message = {
          id: generateId(),
          content: event.data,
          timestamp: new Date(),
          isUser: false
        }

        setMessages(prev => [...prev, message])
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        toast.error('Connection error occurred')
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        // Check if closure was due to token expiration or authentication issues
        const connectionDuration = Date.now() - connectionStartTime
        const wasQuickClose = connectionDuration < 1000 // Closed within 1 second
        
        // Server uses 1008 (WS_1008_POLICY_VIOLATION) for invalid/expired tokens
        // or 1006 (Abnormal Closure) when connection is abruptly closed due to auth issues
        // Also treat quick 1006 closures as auth failures (token expired before connection established)
        if (event.code === 1008 || (event.code === 1006 && wasQuickClose)) {
          console.log(`WebSocket closed due to token/auth issues (code ${event.code}, duration: ${connectionDuration}ms)`, event.reason)
          // Treat both 1008 and quick 1006 as token expiration
          handleTokenExpiration()
          return
        }
        
        // Only attempt to reconnect if it wasn't a clean close and wasn't manually closed
        if (event.code !== 1000 && !manuallyClosed.current && chatToken) {
          toast.error('Connection lost. Attempting to reconnect...')
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(chatToken)
          }, 3000)
        }
      }

    } catch (error) {
      console.error('Error creating WebSocket:', error)
      setConnectionStatus('error')
      toast.error('Failed to connect to chat server')
    }
  }, [handleTokenExpiration])

  // Initialize session on mount and auto-reconnect
  useEffect(() => {
    const restoreSessionWithHistory = async () => {
      try {
        // Small delay to allow initial render to complete
        await new Promise(resolve => setTimeout(resolve, 0))
        const session = loadSession()
        if (session) {
          console.log('Restoring session for:', session.userName)
          
          setToken(session.token)
          setUserName(session.userName)
          setHasValidSession(true)
          setConnectionStatus('connecting')
          
          try {
            // Load chat history first
            const { messages: history, tokenExpired } = await getChatHistory(session.token)
            
            if (tokenExpired) {
              // Token has expired, handle it
              handleTokenExpiration()
              return
            }
            
            if (history.length > 0) {
              setMessages(history)
              console.log(`Loaded ${history.length} messages from chat history`)
            } else {
              console.log('No chat history found for this session')
            }
            
            // Then automatically reconnect with stored session
            manuallyClosed.current = false
            connectWebSocket(session.token)
            
            const historyText = history.length > 0 ? ` (${history.length} messages restored)` : ''
            toast.success(`Welcome back, ${session.userName}!${historyText}`)
          } catch (error) {
            console.error('Error restoring session:', error)
            // Clear invalid session
            clearSession()
            setHasValidSession(false)
            setToken(null)
            setUserName(null)
            setConnectionStatus('disconnected')
            toast.error('Failed to restore session')
          }
        }
      } finally {
        // Session restoration complete (whether successful or not)
        setIsRestoringSession(false)
      }
    }
    
    restoreSessionWithHistory()
  }, [connectWebSocket, handleTokenExpiration])

  const connect = useCallback(async (name: string) => {
    try {
      // Reset manual disconnect flag when starting a new connection
      manuallyClosed.current = false
      
      setConnectionStatus('connecting')
      const chatToken = await getChatToken(name)
      setToken(chatToken)
      setUserName(name)
      
      // Save session to localStorage
      saveSession(chatToken, name)
      setHasValidSession(true)
      
      connectWebSocket(chatToken)
    } catch (error) {
      console.error('Error connecting to chat:', error)
      setConnectionStatus('error')
      toast.error('Failed to connect to chat')
    }
  }, [connectWebSocket])

  const disconnect = useCallback(() => {
    // Set manual disconnect flag to prevent reconnection
    manuallyClosed.current = true
    
    // Close WebSocket with clean close code if still connected
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close(1000, 'User disconnected')
    }
    
    cleanup()
    setConnectionStatus('disconnected')
    setToken(null)
    setUserName(null)
    setMessages([])
    setIsTyping(false)
    
    // Clear saved session
    clearSession()
    setHasValidSession(false)
    
    toast.success('Disconnected from chat')
  }, [cleanup])


  const sendMessage = useCallback((content: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected to chat server')
      return
    }

    if (!content.trim()) {
      return
    }

    // Add user message to the list immediately
    const userMessage: Message = {
      id: generateId(),
      content: content.trim(),
      timestamp: new Date(),
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])

    // Send message to server
    ws.current.send(content.trim())

    // Show typing indicator
    setIsTyping(true)
    
    // Set timeout to hide typing indicator if no response
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 10000) // 10 seconds timeout
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    messages,
    connectionStatus,
    sendMessage,
    isTyping,
    connect,
    disconnect,
    userName,
    hasValidSession,
    isRestoringSession
  }
}