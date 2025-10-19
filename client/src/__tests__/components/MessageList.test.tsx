import { render, screen } from '@testing-library/react'
import { MessageList } from '@/components/MessageList'
import { Message } from '@/types/chat'

// Mock framer-motion to avoid animation issues in tests
interface MockMotionProps {
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: MockMotionProps) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock child components
jest.mock('@/components/Message', () => ({
  Message: ({ message }: { message: Message }) => (
    <div data-testid="message-component" data-message-id={message.id}>
      {message.isUser ? 'User: ' : 'AI: '}{message.content}
    </div>
  ),
}))

jest.mock('@/components/TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">AI is typing...</div>,
}))

// Mock useEffect to avoid scrollIntoView issues
const mockScrollIntoView = jest.fn()
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: mockScrollIntoView,
})

describe('MessageList Component', () => {
  const createMessage = (overrides: Partial<Message> = {}): Message => ({
    id: `msg-${Math.random()}`,
    content: 'Test message',
    timestamp: new Date('2024-01-15T12:00:00Z'),
    isUser: false,
    ...overrides,
  })

  beforeEach(() => {
    mockScrollIntoView.mockClear()
  })

  it('should render empty state when no messages', () => {
    render(<MessageList messages={[]} isTyping={false} />)

    expect(screen.getByText('Start a conversation')).toBeInTheDocument()
    expect(screen.getByText(/Send a message to begin chatting/)).toBeInTheDocument()
    expect(screen.getByText(/Ask anything you'd like to know/)).toBeInTheDocument()
  })

  it('should not render empty state when typing indicator is shown', () => {
    render(<MessageList messages={[]} isTyping={true} />)

    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument()
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('should render messages correctly', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Hello AI', isUser: true }),
      createMessage({ id: 'msg2', content: 'Hello human!', isUser: false }),
      createMessage({ id: 'msg3', content: 'How are you?', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={false} />)

    expect(screen.getAllByTestId('message-component')).toHaveLength(3)
    expect(screen.getByText('User: Hello AI')).toBeInTheDocument()
    expect(screen.getByText('AI: Hello human!')).toBeInTheDocument()
    expect(screen.getByText('User: How are you?')).toBeInTheDocument()
  })

  it('should render typing indicator when isTyping is true', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Hello', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={true} />)

    expect(screen.getByTestId('message-component')).toBeInTheDocument()
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })

  it('should not render typing indicator when isTyping is false', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Hello', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={false} />)

    expect(screen.getByTestId('message-component')).toBeInTheDocument()
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('should handle isTyping prop default value', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Hello', isUser: true }),
    ]

    render(<MessageList messages={messages} />)

    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('should scroll to bottom when messages change', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'First message', isUser: true }),
    ]

    const { rerender } = render(<MessageList messages={messages} isTyping={false} />)

    // Should call scrollIntoView on initial render
    expect(mockScrollIntoView).toHaveBeenCalled()

    mockScrollIntoView.mockClear()

    // Add new message
    const updatedMessages = [
      ...messages,
      createMessage({ id: 'msg2', content: 'Second message', isUser: false }),
    ]

    rerender(<MessageList messages={updatedMessages} isTyping={false} />)

    // Should call scrollIntoView when messages change
    expect(mockScrollIntoView).toHaveBeenCalled()
  })

  it('should scroll to bottom when typing status changes', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Hello', isUser: true }),
    ]

    const { rerender } = render(<MessageList messages={messages} isTyping={false} />)

    mockScrollIntoView.mockClear()

    rerender(<MessageList messages={messages} isTyping={true} />)

    // Should call scrollIntoView when isTyping changes
    expect(mockScrollIntoView).toHaveBeenCalled()
  })

  it('should render empty state with correct styling', () => {
    render(<MessageList messages={[]} isTyping={false} />)

    const emptyStateContainer = screen.getByText('Start a conversation').closest('div')
    expect(emptyStateContainer).toHaveClass('text-center')

    expect(screen.getByText('Start a conversation')).toHaveClass(
      'text-2xl',
      'font-bold',
      'bg-gradient-to-r',
      'from-indigo-600',
      'to-purple-600',
      'bg-clip-text',
      'text-transparent',
      'mb-3'
    )
  })

  it('should have correct container structure', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Test message', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={false} />)

    // Check for scrollable container
    const scrollContainer = document.querySelector('.overflow-y-auto')
    expect(scrollContainer).toBeInTheDocument()
    expect(scrollContainer).toHaveClass('flex-1', 'overflow-y-auto', 'py-6', 'px-2')

    // Check for max-width container
    const contentContainer = document.querySelector('.max-w-4xl')
    expect(contentContainer).toBeInTheDocument()
    expect(contentContainer).toHaveClass('max-w-4xl', 'mx-auto', 'min-h-0')
  })

  it('should render messages in correct order', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'First', isUser: true }),
      createMessage({ id: 'msg2', content: 'Second', isUser: false }),
      createMessage({ id: 'msg3', content: 'Third', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={false} />)

    const messageComponents = screen.getAllByTestId('message-component')
    expect(messageComponents).toHaveLength(3)
    
    expect(messageComponents[0]).toHaveAttribute('data-message-id', 'msg1')
    expect(messageComponents[1]).toHaveAttribute('data-message-id', 'msg2')
    expect(messageComponents[2]).toHaveAttribute('data-message-id', 'msg3')
  })

  it('should render with proper scroll behavior', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Message 1', isUser: true }),
      createMessage({ id: 'msg2', content: 'Message 2', isUser: false }),
    ]

    render(<MessageList messages={messages} isTyping={false} />)

    // Should call scrollIntoView with correct options
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    })
  })

  it('should handle empty message array gracefully', () => {
    render(<MessageList messages={[]} />)

    expect(screen.getByText('Start a conversation')).toBeInTheDocument()
    expect(screen.queryByTestId('message-component')).not.toBeInTheDocument()
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('should render animated elements with correct motion properties', () => {
    render(<MessageList messages={[]} isTyping={false} />)

    // Check for motion divs in empty state
    const motionDivs = screen.getAllByTestId('motion-div')
    expect(motionDivs.length).toBeGreaterThan(0)

    // The animated icon in empty state should be present
    const iconContainer = motionDivs.find(div => 
      div.className.includes('from-indigo-400') && div.className.includes('to-purple-500')
    )
    expect(iconContainer).toBeTruthy()
  })

  it('should maintain proper layout structure', () => {
    const messages = [
      createMessage({ id: 'msg1', content: 'Test', isUser: true }),
    ]

    render(<MessageList messages={messages} isTyping={true} />)

    // Should have main container
    const mainContainer = document.querySelector('.flex-1')
    expect(mainContainer).toBeInTheDocument()

    // Should have inner container with messages
    const messagesContainer = document.querySelector('.max-w-4xl')
    expect(messagesContainer).toBeInTheDocument()

    // Should have both message and typing indicator
    expect(screen.getByTestId('message-component')).toBeInTheDocument()
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
  })
})