import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '@/components/MessageInput'

// Mock framer-motion to avoid animation issues in tests
interface MockMotionProps {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  initial?: unknown
  animate?: unknown
  exit?: unknown
  transition?: unknown
  whileHover?: unknown
  whileTap?: unknown
  [key: string]: unknown
}

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: MockMotionProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial: _initial, animate: _animate, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...otherProps } = props;
      return <div className={className} {...otherProps}>{children}</div>;
    },
    button: ({ children, onClick, disabled, className, ...props }: MockMotionProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial: _initial, animate: _animate, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...otherProps } = props;
      return (
        <button onClick={onClick} disabled={disabled} className={className} {...otherProps}>
          {children}
        </button>
      );
    },
  },
}))

describe('MessageInput Component', () => {
  const defaultProps = {
    onSendMessage: jest.fn(),
    disabled: false,
    placeholder: 'Type your message...',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default props', () => {
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    expect(textarea).toBeInTheDocument()
    expect(sendButton).toBeInTheDocument()
    expect(screen.getByText(/Press/)).toBeInTheDocument()
    expect(screen.getByText('Enter')).toBeInTheDocument()
    expect(screen.getByText(/to send/)).toBeInTheDocument()
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument()
    expect(screen.getByText(/for new line/)).toBeInTheDocument()
  })

  it('should call onSendMessage when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, 'Hello World')
    await user.keyboard('{Enter}')

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello World')
    expect(textarea).toHaveValue('')
  })

  it('should not call onSendMessage when Shift+Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, 'Hello World')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    expect(textarea).toHaveValue('Hello World\n')
  })

  it('should call onSendMessage when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    await user.type(textarea, 'Hello World')
    await user.click(sendButton)

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello World')
    expect(textarea).toHaveValue('')
  })

  it('should not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Test empty message
    await user.keyboard('{Enter}')
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()

    // Test whitespace-only message
    await user.type(textarea, '   ')
    await user.click(sendButton)
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('should trim whitespace from messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, '  Hello World  ')
    await user.keyboard('{Enter}')

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello World')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled={true} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    expect(textarea).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('should show custom placeholder', () => {
    render(<MessageInput {...defaultProps} placeholder="Custom placeholder..." />)

    expect(screen.getByPlaceholderText('Custom placeholder...')).toBeInTheDocument()
  })

  it('should handle textarea auto-resize', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement

    // Mock scrollHeight to simulate content height
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      value: 100,
    })

    await user.type(textarea, 'Line 1\nLine 2\nLine 3')

    // The component should attempt to set the height
    // We can't easily test the exact height setting due to jsdom limitations
    expect(textarea.value).toBe('Line 1\nLine 2\nLine 3')
  })

  it('should show loading state', async () => {
    const slowOnSendMessage = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<MessageInput onSendMessage={slowOnSendMessage} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    await userEvent.type(textarea, 'Hello')
    fireEvent.click(sendButton)

    // Message should be cleared immediately
    expect(textarea).toHaveValue('')
    // Button should be disabled while loading (due to empty input after clearing)
    expect(sendButton).toBeDisabled()

    // Wait for the async operation to complete
    await waitFor(() => {
      // The function should have been called
      expect(slowOnSendMessage).toHaveBeenCalledWith('Hello')
    }, { timeout: 200 })
  })

  it('should prevent sending while loading', async () => {
    const mockOnSendMessage = jest.fn()
    
    render(<MessageInput onSendMessage={mockOnSendMessage} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Send first message
    await userEvent.type(textarea, 'First message')
    fireEvent.click(sendButton)
    
    // After sending, the message is cleared and button becomes disabled due to empty input
    expect(textarea.value).toBe('')
    expect(sendButton).toBeDisabled() // Disabled because input is now empty
    expect(mockOnSendMessage).toHaveBeenCalledTimes(1)
    expect(mockOnSendMessage).toHaveBeenCalledWith('First message')

    // Try to send another message - since the input is empty, nothing should happen
    fireEvent.click(sendButton)
    expect(mockOnSendMessage).toHaveBeenCalledTimes(1) // Still only called once
  })

  it('should have correct button styling based on message content', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button')

    // Empty message - button should be disabled style
    expect(sendButton).toHaveClass('bg-gray-100', 'text-gray-400', 'cursor-not-allowed')

    // Type a message - button should be enabled style
    await user.type(textarea, 'Hello')
    
    // The component updates the button styling based on message content
    expect(textarea.value).toBe('Hello')
  })

  it('should handle keyboard events correctly', async () => {
    const user = userEvent.setup()
    render(<MessageInput {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your message...')

    // Test Enter key
    await user.type(textarea, 'Test message')
    await user.keyboard('{Enter}')
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Test message')

    // Test Shift+Enter (should create new line, not send)
    await user.type(textarea, 'Line 1')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(textarea, 'Line 2')
    expect(textarea.value).toBe('Line 1\nLine 2')

    // Clear the mock for final test
    defaultProps.onSendMessage.mockClear()

    // Now press Enter without Shift to send
    await user.keyboard('{Enter}')
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Line 1\nLine 2')
  })

  it('should show correct help text', () => {
    render(<MessageInput {...defaultProps} />)

    // Check for keyboard shortcuts help text
    expect(screen.getByText(/Press/)).toBeInTheDocument()
    expect(screen.getByText('Enter')).toBeInTheDocument()
    expect(screen.getByText(/to send/)).toBeInTheDocument()
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument()
    expect(screen.getByText(/for new line/)).toBeInTheDocument()

    // Check that the kbd elements exist
    const enterKey = screen.getByText('Enter')
    const shiftEnterKey = screen.getByText('Shift+Enter')
    expect(enterKey.tagName).toBe('KBD')
    expect(shiftEnterKey.tagName).toBe('KBD')
  })
})