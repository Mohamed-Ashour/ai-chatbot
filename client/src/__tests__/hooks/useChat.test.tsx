import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

// Mock session functions
jest.mock('@/lib/session', () => ({
  saveSession: jest.fn(),
  loadSession: jest.fn(),
  clearSession: jest.fn(),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'mock-id'),
}))

import { toast } from 'react-hot-toast'
import * as sessionLib from '@/lib/session'

const mockToast = toast as jest.Mocked<typeof toast>
const mockSession = sessionLib as jest.Mocked<typeof sessionLib>

// Store mock WebSocket instances
const mockWebSocketInstances: MockWebSocket[] = []

// Create a more sophisticated WebSocket mock
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState: number = MockWebSocket.CONNECTING
  onopen: ((this: WebSocket, ev: Event) => unknown) | null = null
  onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null
  onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null
  onerror: ((this: WebSocket, ev: Event) => unknown) | null = null
  connectionStartTime: number = Date.now()

  constructor(url: string) {
    this.url = url
    // Store instance for test access
    mockWebSocketInstances.push(this)
    // Store creation time to track connection duration
    this.connectionStartTime = Date.now()
    // Don't auto-open the connection, let tests control this
    // This allows testing the 'connecting' state
  }
  
  // Helper method to manually open connection in tests
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    if (this.onopen) {
      this.onopen(new Event('open') as Event)
    }
  }

  send = jest.fn()
  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      const closeEvent = {
        code: code || 1000,
        reason: reason || '',
        wasClean: true,
      } as CloseEvent
      this.onclose(closeEvent as CloseEvent)
    }
  })

  // Helper methods for testing
  simulateMessage(data: string) {
    if (this.onmessage) {
      const messageEvent = { data } as MessageEvent
      this.onmessage(messageEvent as MessageEvent)
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error') as Event)
    }
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      const closeEvent = {
        code,
        reason,
        wasClean: code === 1000,
      } as CloseEvent
      this.onclose(closeEvent as CloseEvent)
    }
  }
}

// Replace global WebSocket with our mock - need to override the jest.setup.ts mock
Object.defineProperty(global, 'WebSocket', {
  writable: true,
  value: MockWebSocket
})

// Helper function to wait for session restoration to complete
const waitForSessionRestore = async (result: { current: ReturnType<typeof useChat> }) => {
  // According to Jest docs, use waitFor without act for state changes
  await waitFor(
    () => {
      expect(result.current.isRestoringSession).toBe(false)
    },
    { timeout: 5000, interval: 50 }
  )
}

// Helper function to get the current WebSocket mock instance
const getMockWebSocket = (): MockWebSocket | undefined => {
  return mockWebSocketInstances[mockWebSocketInstances.length - 1]
}

// Helper function to connect and open WebSocket
const connectAndOpen = async (result: { current: ReturnType<typeof useChat> }, name = 'John Doe') => {
  // Start the connection
  await act(async () => {
    await result.current.connect(name)
  })

  // Wait for WebSocket to be created
  await waitFor(() => {
    const ws = getMockWebSocket()
    expect(ws).toBeDefined()
  }, { timeout: 4000 })

  const mockWs = getMockWebSocket()!

  // Simulate WebSocket opening
  await act(async () => {
    mockWs.simulateOpen()
  })

  // Wait for connection status to update
  await waitFor(() => {
    expect(result.current.connectionStatus).toBe('connected')
  })

  return mockWs
}

describe('useChat Hook', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    // Clear mock WebSocket instances
    mockWebSocketInstances.length = 0
    
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockSession.saveSession.mockClear()
    mockSession.loadSession.mockClear()
    mockSession.clearSession.mockClear()
    // Set default mock behavior for no session
    mockSession.loadSession.mockReturnValue(null)
    // Use modern Jest timer implementation
    jest.useFakeTimers({ advanceTimers: true })
  })

  afterEach(async () => {
    // Clean up any open WebSocket connections
    await act(async () => {
      mockWebSocketInstances.forEach(ws => {
        if (ws.readyState !== MockWebSocket.CLOSED) {
          ws.simulateClose()
        }
      })
    })
    mockWebSocketInstances.length = 0
    
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should have correct initial state when no session exists', async () => {
      mockSession.loadSession.mockReturnValue(null)

      const { result } = renderHook(() => useChat())

      expect(result.current.messages).toEqual([])
      expect(result.current.connectionStatus).toBe('disconnected')
      expect(result.current.isTyping).toBe(false)
      expect(result.current.userName).toBe(null)
      expect(result.current.hasValidSession).toBe(false)
      // isRestoringSession starts as true but quickly becomes false when no session exists
      expect(result.current.isRestoringSession).toBe(true)
    })

    it('should finish session restoration when no session exists', async () => {
      mockSession.loadSession.mockReturnValue(null)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.isRestoringSession).toBe(false)
    })
  })

  describe('Session Restoration', () => {
    it('should restore valid session with chat history', async () => {
      const mockSessionData = {
        token: 'test-token',
        userName: 'John Doe',
        timestamp: Date.now(),
      }
      
      const mockHistory = [
        {
          id: 'msg1',
          msg: 'Hello',
          timestamp: new Date().toISOString(),
          source: 'user' as const,
        },
        {
          id: 'msg2',
          msg: 'Hi there!',
          timestamp: new Date().toISOString(),
          source: 'assistant' as const,
        },
      ]

      mockSession.loadSession.mockReturnValue(mockSessionData)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockHistory }),
      } as Response)

      const { result } = renderHook(() => useChat())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(result.current.userName).toBe('John Doe')
        expect(result.current.hasValidSession).toBe(true)
        expect(result.current.messages).toHaveLength(2)
      })

      expect(result.current.messages[0].content).toBe('Hello')
      expect(result.current.messages[1].content).toBe('Hi there!')
      expect(mockToast.success).toHaveBeenCalledWith(
        'Welcome back, John Doe! (2 messages restored)'
      )
    })

    it('should handle expired token during session restoration', async () => {
      const mockSessionData = {
        token: 'expired-token',
        userName: 'John Doe',
        timestamp: Date.now(),
      }

      mockSession.loadSession.mockReturnValue(mockSessionData)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Session expired or does not exist' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.userName).toBe(null)
        expect(result.current.hasValidSession).toBe(false)
        expect(mockSession.clearSession).toHaveBeenCalled()
      })
    })
  })

  describe('Connection Management', () => {
    it('should connect successfully with valid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())
      await waitForSessionRestore(result)

      const mockWs = await connectAndOpen(result, 'John Doe')

      expect(result.current.connectionStatus).toBe('connected')
      expect(result.current.userName).toBe('John Doe')
      expect(mockSession.saveSession).toHaveBeenCalledWith('new-token', 'John Doe')
      expect(mockToast.success).toHaveBeenCalledWith('Connected to chat server')
      expect(mockWs.url).toBe('ws://localhost:8000/chat?token=new-token')
    })

    it('should handle connection errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)

      await act(async () => {
        result.current.connect('John Doe')
      })

      await waitFor(() => expect(result.current.connectionStatus).toBe('error'))

      expect(mockToast.error).toHaveBeenCalledWith('Failed to connect to chat')
    })

    it('should disconnect and clean up properly', async () => {
      // First connect
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())
      await waitForSessionRestore(result)

      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      expect(result.current.connectionStatus).toBe('connected')
      
      // Now disconnect
      await act(async () => {
        result.current.disconnect()
      })

      expect(result.current.connectionStatus).toBe('disconnected')
      expect(result.current.userName).toBe(null)
      expect(result.current.hasValidSession).toBe(false)
      expect(mockWs.close).toHaveBeenCalledWith(1000, 'User disconnected')
    })
  })

  describe('Message Handling', () => {
    it('should send messages when connected', async () => {
      // Setup connected state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        result.current.sendMessage('Hello, World!')
      })

      expect(mockWs.send).toHaveBeenCalledWith('Hello, World!')
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('Hello, World!')
      expect(result.current.messages[0].isUser).toBe(true)
      expect(result.current.isTyping).toBe(true)
    })

    it('should handle incoming messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        mockWs.simulateMessage('AI Response')
      })

      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('AI Response')
      expect(result.current.messages[0].isUser).toBe(false)
      expect(result.current.isTyping).toBe(false)
    })

    it('should not send messages when disconnected', async () => {
      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)

      act(() => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.messages).toHaveLength(0)
      expect(mockToast.error).toHaveBeenCalledWith('Not connected to chat server')
    })

    it('should not send empty messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      act(() => {
        result.current.sendMessage('   ')
      })

      expect(mockWs.send).not.toHaveBeenCalled()
      expect(result.current.messages).toHaveLength(0)
    })
  })

  describe('WebSocket Error Handling', () => {
    it('should handle WebSocket errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        mockWs.simulateError()
      })

      expect(result.current.connectionStatus).toBe('error')
      expect(mockToast.error).toHaveBeenCalledWith('Connection error occurred')
    })

    it('should handle token expiration (WebSocket close code 1008)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        mockWs.simulateClose(1008, 'Token expired')
      })

      expect(result.current.connectionStatus).toBe('disconnected')
      expect(result.current.userName).toBe(null)
      expect(result.current.hasValidSession).toBe(false)
      expect(mockSession.clearSession).toHaveBeenCalled()
      expect(mockToast.error).toHaveBeenCalledWith('Your session has expired. Please sign in again.')
    })

    it('should attempt reconnection on unexpected disconnection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      const initialInstanceCount = mockWebSocketInstances.length

      // Use real time for this test since the hook uses Date.now() internally
      jest.useRealTimers()
      
      // Wait a bit to ensure the connection is established for more than 1 second
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Back to fake timers for the rest of the test
      jest.useFakeTimers({ advanceTimers: true })

      await act(async () => {
        mockWs.simulateClose(1006, 'Unexpected close') // Not a clean close
      })

      expect(mockToast.error).toHaveBeenCalledWith('Connection lost. Attempting to reconnect...')

      // Should attempt reconnection after 3 seconds
      await act(async () => {
        jest.advanceTimersByTime(3000)
      })

      // A new WebSocket should have been created
      await waitFor(() => {
        expect(mockWebSocketInstances.length).toBe(initialInstanceCount + 1)
      })
    })

    it('should not reconnect on clean disconnection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      const instanceCountBeforeClose = mockWebSocketInstances.length

      await act(async () => {
        mockWs.simulateClose(1000, 'Normal closure') // Clean close
      })

      // Should not show reconnection message
      expect(mockToast.error).not.toHaveBeenCalledWith('Connection lost. Attempting to reconnect...')

      // Wait a bit to ensure no reconnection happens
      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      // No new WebSocket should have been created
      expect(mockWebSocketInstances.length).toBe(instanceCountBeforeClose)
    })
  })

  describe('Typing Indicator', () => {
    it('should show typing indicator when sending message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.isTyping).toBe(true)
    })

    it('should hide typing indicator on response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()

      await act(async () => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.isTyping).toBe(true)

      await act(async () => {
        mockWs.simulateMessage('Response')
      })

      expect(result.current.isTyping).toBe(false)
    })

    it('should hide typing indicator after timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as Response)

      const { result } = renderHook(() => useChat())

      await waitForSessionRestore(result)
      
      const mockWs = await connectAndOpen(result, 'John Doe')
      expect(mockWs).toBeDefined()
      
      await act(async () => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.isTyping).toBe(true)

      // Advance time by 10 seconds (typing timeout)
      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => expect(result.current.isTyping).toBe(false))
    })
  })
})
