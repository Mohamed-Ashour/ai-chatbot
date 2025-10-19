import { render, screen } from '@testing-library/react'
import { Message } from '@/components/Message'
import { Message as MessageType } from '@/types/chat'

// Mock framer-motion to avoid animation issues in tests
interface MockMotionProps {
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: MockMotionProps) => (
      <div className={className} {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}))

// Mock react-markdown to avoid markdown processing complexity in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>
  }
})

// Mock utils
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  formatTimestamp: jest.fn((date: Date) => {
    // Mock timestamp formatting for consistent tests
    if (date.getTime() === new Date('2024-01-15T12:00:00Z').getTime()) {
      return 'Just now'
    }
    return '5m ago'
  }),
  cn: jest.requireActual('@/lib/utils').cn,
}))

// Mock highlight.js CSS import
jest.mock('highlight.js/styles/github-dark.css', () => ({}))

describe('Message Component', () => {
  const createMessage = (overrides: Partial<MessageType> = {}): MessageType => ({
    id: 'test-id',
    content: 'Test message content',
    timestamp: new Date('2024-01-15T12:00:00Z'),
    isUser: false,
    ...overrides,
  })

  it('should render user message correctly', () => {
    const userMessage = createMessage({
      content: 'Hello, AI!',
      isUser: true,
    })

    render(<Message message={userMessage} />)

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument()
    expect(screen.getByText('Just now')).toBeInTheDocument()
  })

  it('should render AI message correctly', () => {
    const aiMessage = createMessage({
      content: 'Hello, human!',
      isUser: false,
    })

    render(<Message message={aiMessage} />)

    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('Hello, human!')).toBeInTheDocument()
    expect(screen.getByText('Just now')).toBeInTheDocument()
  })

  it('should apply correct styling for user messages', () => {
    const userMessage = createMessage({
      content: 'User message',
      isUser: true,
    })

    render(<Message message={userMessage} />)

    // Check for user-specific styling
    const containers = screen.getAllByTestId('motion-div')
    const messageContainer = containers.find(container =>
      container.className.includes('flex-row-reverse')
    )
    expect(messageContainer).toBeTruthy()

    // Check for user label styling
    const userLabel = screen.getByText('You')
    expect(userLabel).toHaveClass('text-blue-100')

    // Check for user bubble styling classes exist in document
    expect(document.body.innerHTML).toContain('from-blue-500')
    expect(document.body.innerHTML).toContain('to-purple-600')
  })

  it('should apply correct styling for AI messages', () => {
    const aiMessage = createMessage({
      content: 'AI message',
      isUser: false,
    })

    render(<Message message={aiMessage} />)

    // Check for AI-specific styling
    const containers = screen.getAllByTestId('motion-div')
    const messageContainer = containers.find(container =>
      container.className.includes('flex-row')
    )
    expect(messageContainer).toBeTruthy()

    // Check for AI label styling
    const aiLabel = screen.getByText('AI Assistant')
    expect(aiLabel).toHaveClass('text-emerald-600')

    // Check for AI bubble styling classes exist in document
    expect(document.body.innerHTML).toContain('bg-white/90')
    expect(document.body.innerHTML).toContain('from-emerald-400')
  })

  it('should render markdown content', () => {
    const messageWithMarkdown = createMessage({
      content: '# Hello\n\nThis is **bold** text.',
      isUser: false,
    })

    render(<Message message={messageWithMarkdown} />)

    // Check that markdown component is rendered
    const markdownContent = screen.getByTestId('markdown-content')
    expect(markdownContent).toBeInTheDocument()
    // Since our mock just renders the content as-is, check for the content
    expect(markdownContent).toHaveTextContent('# Hello')
    expect(markdownContent).toHaveTextContent('This is **bold** text.')
  })

  it('should display formatted timestamp', () => {
    const message = createMessage({
      timestamp: new Date('2024-01-15T12:00:00Z'),
    })

    render(<Message message={message} />)

    expect(screen.getByText('Just now')).toBeInTheDocument()
  })

  it('should have proper accessibility structure', () => {
    const message = createMessage({
      content: 'Accessible message',
      isUser: true,
    })

    render(<Message message={message} />)

    // Should have proper avatar representation
    const userAvatar = document.querySelector('[data-testid="motion-div"]')
    expect(userAvatar).toBeInTheDocument()

    // Should have proper message structure
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Accessible message')).toBeInTheDocument()
    expect(screen.getByText('Just now')).toBeInTheDocument()
  })

  it('should handle long messages', () => {
    const longMessage = createMessage({
      content: 'This is a very long message that should wrap properly and not break the layout. '.repeat(10),
      isUser: false,
    })

    render(<Message message={longMessage} />)

    const messageContent = screen.getByTestId('markdown-content')
    expect(messageContent).toBeInTheDocument()
    // Remove trailing whitespace for comparison since textContent normalizes
    expect(messageContent).toHaveTextContent(longMessage.content.trim())
  })

  it('should handle different timestamp formats', () => {
    const oldMessage = createMessage({
      timestamp: new Date('2024-01-15T11:55:00Z'), // Different timestamp
    })

    render(<Message message={oldMessage} />)

    expect(screen.getByText('5m ago')).toBeInTheDocument()
  })

  it('should have correct container structure', () => {
    const message = createMessage({
      content: 'Test content',
      isUser: true,
    })

    render(<Message message={message} />)

    const containers = screen.getAllByTestId('motion-div')
    expect(containers.length).toBeGreaterThan(0)

    // Should have main container with flex layout
    const mainContainer = containers.find(container =>
      container.className.includes('flex') && container.className.includes('gap-4')
    )
    expect(mainContainer).toBeTruthy()
  })

  it('should show appropriate avatar icons', () => {
    const userMessage = createMessage({ isUser: true })
    const { rerender } = render(<Message message={userMessage} />)

    // Check for user avatar (User icon should be rendered)
    expect(document.body.innerHTML).toContain('from-blue-500')
    expect(document.body.innerHTML).toContain('to-purple-600')

    const aiMessage = createMessage({ isUser: false })
    rerender(<Message message={aiMessage} />)

    // Check for AI avatar (Bot icon should be rendered)
    expect(document.body.innerHTML).toContain('from-emerald-400')
    expect(document.body.innerHTML).toContain('to-cyan-400')
  })

  it('should have proper message bubble positioning', () => {
    const userMessage = createMessage({ isUser: true })
    const { rerender } = render(<Message message={userMessage} />)

    const containers = screen.getAllByTestId('motion-div')
    
    // User messages should have flex-row-reverse for right alignment
    const userContainer = containers.find(container =>
      container.className.includes('flex-row-reverse')
    )
    expect(userContainer).toBeTruthy()

    const aiMessage = createMessage({ isUser: false })
    rerender(<Message message={aiMessage} />)

    const aiContainers = screen.getAllByTestId('motion-div')
    
    // AI messages should have flex-row for left alignment
    const aiContainer = aiContainers.find(container =>
      container.className.includes('flex-row') && !container.className.includes('flex-row-reverse')
    )
    expect(aiContainer).toBeTruthy()
  })

  it('should render empty message gracefully', () => {
    const emptyMessage = createMessage({
      content: '',
      isUser: true,
    })

    render(<Message message={emptyMessage} />)

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
  })
})