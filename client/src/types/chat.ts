export interface Message {
  id: string
  content: string
  timestamp: Date
  isUser: boolean
  isTyping?: boolean
}

export interface ChatSession {
  token: string
  messages: Message[]
  name: string
  sessionStart: string
}

export interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'