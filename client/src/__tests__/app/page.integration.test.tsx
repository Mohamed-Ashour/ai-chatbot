import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPage from '@/app/page'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props} data-testid="motion-div">
        {children}
      </div>
    ),
    header: ({ children, className, ...props }: any) => (
      <header className={className} {...props}>
        {children}
      </header>
    ),
    button: ({ children, onClick, disabled, className, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    ),
    h2: ({ children, className, ...props }: any) => (
      <h2 className={className} {...props}>
        {children}
      </h2>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
  },
}))

// Mock the useChat hook
const mockUseChat = {
  messages: [],
  connectionStatus: 'disconnected' as const,
  sendMessage: jest.fn(),
  isTyping: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  userName: null,
  hasValidSession: false,
  isRestoringSession: false,
}

jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn(() => mockUseChat),
}))

// Mock child components to focus on integration behavior
jest.mock('@/components/MessageList', () => ({
  MessageList: ({ messages, isTyping }: any) => (
    <div data-testid="message-list">
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid="message">
          {msg.isUser ? 'User: ' : 'AI: '}{msg.content}
        </div>
      ))}
      {isTyping && <div data-testid="typing">Typing...</div>}
    </div>
  ),
}))

jest.mock('@/components/MessageInput', () => ({
  MessageInput: ({ onSendMessage, disabled, placeholder }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e: any) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            onSendMessage(e.target.value.trim())
            e.target.value = ''
          }
        }}
      />
    </div>
  ),
}))

jest.mock('@/components/ConnectionStatus', () => ({
  ConnectionStatus: ({ status }: any) => (
    <div data-testid="connection-status" data-status={status}>
      Status: {status}
    </div>
  ),
}))

jest.mock('@/components/WelcomeModal', () => ({
  WelcomeModal: ({ isOpen, onConnect, isConnecting, onClose }: any) =>
    isOpen ? (
      <div data-testid="welcome-modal">
        <input
          data-testid="name-input"
          placeholder="Enter your name..."
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && e.target.value.trim() && !isConnecting) {
              onConnect(e.target.value.trim())
            }
          }}
        />
        <button
          data-testid="connect-button"
          onClick={() => {
            const input = document.querySelector('[data-testid="name-input"]') as HTMLInputElement
            if (input?.value.trim() && !isConnecting) {
              onConnect(input.value.trim())
            }
          }}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Start Chatting'}
        </button>
        {onClose && (
          <button data-testid="close-modal" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    ) : null,
}))

jest.mock('@/components/SessionRestoreLoader', () => ({
  SessionRestoreLoader: () => (
    <div data-testid="session-restore-loader">
      Restoring session...
    </div>
  ),
}))

const { useChat } = require('@/hooks/useChat')

describe('ChatPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock to default state
    useChat.mockReturnValue({
      ...mockUseChat,
      messages: [],
      connectionStatus: 'disconnected',
      userName: null,
      hasValidSession: false,
      isRestoringSession: false,
      sendMessage: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    })
  })

  describe('Initial Loading State', () => {
    it('should show session restore loader when restoring session', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        isRestoringSession: true,
      })

      render(<ChatPage />)

      expect(screen.getByTestId('session-restore-loader')).toBeInTheDocument()
      expect(screen.queryByText('AI Chatbot')).not.toBeInTheDocument()
    })

    it('should show main interface after session restoration', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        isRestoringSession: false,
      })

      render(<ChatPage />)

      expect(screen.queryByTestId('session-restore-loader')).not.toBeInTheDocument()
      expect(screen.getByText('AI Chatbot')).toBeInTheDocument()
    })
  })

  describe('Disconnected State', () => {
    it('should show welcome screen when disconnected and no valid session', () => {
      render(<ChatPage />)

      expect(screen.getByText('Ready to Chat?')).toBeInTheDocument()
      expect(screen.getByText('Get Started')).toBeInTheDocument()
      expect(screen.queryByTestId('message-list')).not.toBeInTheDocument()
      expect(screen.queryByTestId('message-input')).not.toBeInTheDocument()
    })

    it('should open welcome modal when Get Started is clicked', async () => {
      const user = userEvent.setup()
      render(<ChatPage />)

      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('welcome-modal')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your name...')).toBeInTheDocument()
    })

    it('should show connection status as disconnected', () => {
      render(<ChatPage />)

      const connectionStatus = screen.getByTestId('connection-status')
      expect(connectionStatus).toHaveAttribute('data-status', 'disconnected')
    })
  })

  describe('Connection Flow', () => {
    it('should call connect when user submits name in welcome modal', async () => {
      const mockConnect = jest.fn()
      useChat.mockReturnValue({
        ...mockUseChat,
        connect: mockConnect,
      })

      const user = userEvent.setup()
      render(<ChatPage />)

      // Open modal
      await user.click(screen.getByText('Get Started'))

      // Enter name and connect
      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'John Doe')
      await user.click(screen.getByTestId('connect-button'))

      expect(mockConnect).toHaveBeenCalledWith('John Doe')
    })

    it('should show connecting state', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connecting',
        userName: 'John Doe',
      })

      render(<ChatPage />)

      const connectionStatus = screen.getByTestId('connection-status')
      expect(connectionStatus).toHaveAttribute('data-status', 'connecting')
      expect(screen.getByText('Welcome back,')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should close modal when connected', () => {
      // Start with disconnected state
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'disconnected',
        userName: null,
      })

      const { rerender } = render(<ChatPage />)

      // Open modal first (simulate opening before connection)
      fireEvent.click(screen.getByText('Get Started'))
      expect(screen.queryByTestId('welcome-modal')).toBeInTheDocument()

      // Simulate connection
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
      })

      rerender(<ChatPage />)

      // Modal should be closed after connection
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument()
    })
  })

  describe('Connected State', () => {
    beforeEach(() => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
        hasValidSession: true,
      })
    })

    it('should show chat interface when connected', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.getByTestId('message-input')).toBeInTheDocument()
      expect(screen.getByText('Welcome back,')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Ready to Chat?')).not.toBeInTheDocument()
    })

    it('should show logout button when connected', () => {
      render(<ChatPage />)

      // Find button with LogOut icon (svg with specific path)
      const logoutButton = document.querySelector('button svg[viewBox="0 0 24 24"]')
      expect(logoutButton).toBeInTheDocument()
    })

    it('should call disconnect when logout button is clicked', async () => {
      const mockDisconnect = jest.fn()
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
        disconnect: mockDisconnect,
      })

      const user = userEvent.setup()
      render(<ChatPage />)

      // Find and click logout button (it has LogOut icon)
      const buttons = screen.getAllByRole('button')
      const logoutButton = buttons.find(button => 
        button.innerHTML.includes('svg') || button.querySelector('svg')
      )
      
      if (logoutButton) {
        await user.click(logoutButton)
        expect(mockDisconnect).toHaveBeenCalled()
      }
    })

    it('should enable message input when connected', () => {
      render(<ChatPage />)

      const messageInput = screen.getByTestId('message-input-field')
      expect(messageInput).not.toBeDisabled()
      expect(messageInput).toHaveAttribute('placeholder', 'Type your message...')
    })

    it('should call sendMessage when user sends a message', async () => {
      const mockSendMessage = jest.fn()
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
        sendMessage: mockSendMessage,
      })

      const user = userEvent.setup()
      render(<ChatPage />)

      const messageInput = screen.getByTestId('message-input-field')
      await user.type(messageInput, 'Hello AI!')
      await user.keyboard('{Enter}')

      expect(mockSendMessage).toHaveBeenCalledWith('Hello AI!')
    })
  })

  describe('Chat Messages', () => {
    it('should display messages correctly', () => {
      const messages = [
        { id: '1', content: 'Hello AI!', isUser: true, timestamp: new Date() },
        { id: '2', content: 'Hello human!', isUser: false, timestamp: new Date() },
      ]

      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
        messages,
      })

      render(<ChatPage />)

      expect(screen.getByText('User: Hello AI!')).toBeInTheDocument()
      expect(screen.getByText('AI: Hello human!')).toBeInTheDocument()
    })

    it('should show typing indicator when AI is typing', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
        isTyping: true,
      })

      render(<ChatPage />)

      expect(screen.getByTestId('typing')).toBeInTheDocument()
    })
  })

  describe('Session with Valid State', () => {
    it('should show chat interface for valid session even when disconnected', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'disconnected',
        userName: 'John Doe',
        hasValidSession: true,
      })

      render(<ChatPage />)

      expect(screen.getByTestId('message-list')).toBeInTheDocument()
      expect(screen.getByTestId('message-input')).toBeInTheDocument()
      expect(screen.getByText('Welcome back,')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should disable input when disconnected but show interface', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'disconnected',
        userName: 'John Doe',
        hasValidSession: true,
      })

      render(<ChatPage />)

      const messageInput = screen.getByTestId('message-input-field')
      expect(messageInput).toBeDisabled()
      expect(messageInput).toHaveAttribute('placeholder', 'Reconnecting...')
    })
  })

  describe('Error State', () => {
    it('should show error connection status', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'error',
      })

      render(<ChatPage />)

      const connectionStatus = screen.getByTestId('connection-status')
      expect(connectionStatus).toHaveAttribute('data-status', 'error')
    })
  })

  describe('Modal Management', () => {
    it('should not show modal when connection status is connected', () => {
      useChat.mockReturnValue({
        ...mockUseChat,
        connectionStatus: 'connected',
        userName: 'John Doe',
      })

      render(<ChatPage />)

      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument()
    })

    it('should close modal manually using close button', async () => {
      const user = userEvent.setup()
      render(<ChatPage />)

      // Open modal
      await user.click(screen.getByText('Get Started'))
      expect(screen.getByTestId('welcome-modal')).toBeInTheDocument()

      // Close modal
      await user.click(screen.getByTestId('close-modal'))
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('should render header with correct elements', () => {
      render(<ChatPage />)

      expect(screen.getByText('AI Chatbot')).toBeInTheDocument()
      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    })

    it('should render toaster for notifications', () => {
      render(<ChatPage />)

      expect(screen.getByTestId('toaster')).toBeInTheDocument()
    })

    it('should have proper layout structure', () => {
      render(<ChatPage />)

      // Should have main container with proper classes
      const mainContainer = document.querySelector('.h-screen')
      expect(mainContainer).toBeInTheDocument()
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-screen')

      // Should have header
      const header = document.querySelector('header')
      expect(header).toBeInTheDocument()
    })
  })
})