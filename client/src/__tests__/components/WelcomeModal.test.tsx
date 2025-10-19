import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeModal } from '@/components/WelcomeModal'

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
    div: ({ children, className, onClick, ...props }: MockMotionProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial: _initial, animate: _animate, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...otherProps } = props;
      return (
        <div className={className} onClick={onClick} {...otherProps}>
          {children}
        </div>
      );
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
    h1: ({ children, className, ...props }: MockMotionProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial: _initial, animate: _animate, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...otherProps } = props;
      return (
        <h1 className={className} {...otherProps}>
          {children}
        </h1>
      );
    },
    p: ({ children, className, ...props }: MockMotionProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial: _initial, animate: _animate, exit: _exit, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, ...otherProps } = props;
      return (
        <p className={className} {...otherProps}>
          {children}
        </p>
      );
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('WelcomeModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onConnect: jest.fn(),
    isConnecting: false,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when isOpen is true', () => {
    render(<WelcomeModal {...defaultProps} />)

    expect(screen.getByText('Welcome to AI Chat')).toBeInTheDocument()
    expect(screen.getByText('Enter your name to start chatting with our AI assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your name...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Chatting' })).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(<WelcomeModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Welcome to AI Chat')).not.toBeInTheDocument()
  })

  it('should call onConnect with trimmed name when form is submitted', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Start Chatting' })

    await user.type(nameInput, '  John Doe  ')
    await user.click(submitButton)

    expect(defaultProps.onConnect).toHaveBeenCalledWith('John Doe')
  })

  it('should call onConnect when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')

    await user.type(nameInput, 'Jane Smith')
    await user.keyboard('{Enter}')

    expect(defaultProps.onConnect).toHaveBeenCalledWith('Jane Smith')
  })

  it('should not call onConnect with empty or whitespace-only name', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Start Chatting' })

    // Test empty name
    await user.click(submitButton)
    expect(defaultProps.onConnect).not.toHaveBeenCalled()

    // Test whitespace-only name
    await user.type(nameInput, '   ')
    await user.click(submitButton)
    expect(defaultProps.onConnect).not.toHaveBeenCalled()
  })

  it('should show connecting state when isConnecting is true', () => {
    render(<WelcomeModal {...defaultProps} isConnecting={true} />)

    expect(screen.getByText('Connecting...')).toBeInTheDocument()
    expect(screen.queryByText('Start Chatting')).not.toBeInTheDocument()
    
    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Connecting...' })
    
    expect(nameInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('should disable form elements when isConnecting is true', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} isConnecting={true} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Connecting...' })

    expect(nameInput).toBeDisabled()
    expect(submitButton).toBeDisabled()

    // Try to interact with disabled elements
    await user.type(nameInput, 'Test')
    expect(nameInput).toHaveValue('')

    await user.click(submitButton)
    expect(defaultProps.onConnect).not.toHaveBeenCalled()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    // Find the close button by looking for buttons that aren't the main submit button
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(button => 
      !button.textContent?.includes('Start Chatting') && 
      !button.textContent?.includes('Connecting')
    )!
    await user.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should not render close button when onClose is not provided', () => {
    render(<WelcomeModal {...defaultProps} onClose={undefined} />)

    // Look for X button (close button)
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(button => button.textContent === '')
    expect(closeButton).toBeUndefined()
  })

  it('should have correct button styling based on form state', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Start Chatting' })

    // Empty name - button should be disabled style
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveClass('cursor-not-allowed')

    // Type a name - button should be enabled
    await user.type(nameInput, 'John')
    expect(submitButton).not.toBeDisabled()
  })

  it('should focus on name input when modal opens', () => {
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    expect(nameInput).toHaveFocus()
  })

  it('should update name state when typing', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')

    await user.type(nameInput, 'Test User')
    expect(nameInput).toHaveValue('Test User')
  })

  it('should prevent form submission when connecting', async () => {
    render(<WelcomeModal {...defaultProps} isConnecting={true} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    
    // Even if we manage to type (which should be prevented), form shouldn't submit
    fireEvent.change(nameInput, { target: { value: 'Test' } })
    fireEvent.submit(nameInput.closest('form')!)

    expect(defaultProps.onConnect).not.toHaveBeenCalled()
  })

  it('should show terms of service text', () => {
    render(<WelcomeModal {...defaultProps} />)

    expect(screen.getByText('By continuing, you agree to our terms of service')).toBeInTheDocument()
  })

  it('should have proper modal structure and styling', () => {
    render(<WelcomeModal {...defaultProps} />)

    // Check for backdrop
    const backdrop = document.querySelector('.fixed.inset-0')
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveClass('bg-black/50', 'backdrop-blur-sm')

    // Check for modal content structure
    const modalContent = document.querySelector('.bg-white.rounded-2xl.shadow-2xl')
    expect(modalContent).toBeInTheDocument()
  })

  it('should handle form validation correctly', async () => {
    const user = userEvent.setup()
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const submitButton = screen.getByRole('button', { name: 'Start Chatting' })

    // Initially disabled
    expect(submitButton).toBeDisabled()

    // Type valid name
    await user.type(nameInput, 'Valid Name')
    expect(submitButton).not.toBeDisabled()

    // Clear input
    await user.clear(nameInput)
    expect(submitButton).toBeDisabled()

    // Type only spaces
    await user.type(nameInput, '   ')
    expect(submitButton).toBeDisabled()
  })

  it('should maintain accessibility features', () => {
    render(<WelcomeModal {...defaultProps} />)

    const nameInput = screen.getByPlaceholderText('Enter your name...')
    const label = screen.getByText('Your Name')

    // Check for proper labeling
    expect(label).toBeInTheDocument()
    expect(nameInput).toHaveAttribute('id', 'name')
    expect(label.closest('label')).toHaveAttribute('for', 'name')
  })

  it('should show loading spinner when connecting', () => {
    render(<WelcomeModal {...defaultProps} isConnecting={true} />)

    // Check for loading spinner (should be present in connecting state)
    const connectingButton = screen.getByRole('button', { name: 'Connecting...' })
    expect(connectingButton).toBeInTheDocument()
    
    // Check for spinner classes or structure
    expect(connectingButton.innerHTML).toContain('animate-spin')
  })

  it('should handle rapid state changes gracefully', async () => {
    const { rerender } = render(<WelcomeModal {...defaultProps} />)

    // Rapidly change connecting state
    rerender(<WelcomeModal {...defaultProps} isConnecting={true} />)
    expect(screen.getByText('Connecting...')).toBeInTheDocument()

    rerender(<WelcomeModal {...defaultProps} isConnecting={false} />)
    expect(screen.getByText('Start Chatting')).toBeInTheDocument()

    // Rapidly toggle modal
    rerender(<WelcomeModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Welcome to AI Chat')).not.toBeInTheDocument()

    rerender(<WelcomeModal {...defaultProps} isOpen={true} />)
    expect(screen.getByText('Welcome to AI Chat')).toBeInTheDocument()
  })
})