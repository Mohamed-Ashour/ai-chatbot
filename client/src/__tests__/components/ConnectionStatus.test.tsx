import { render, screen } from '@testing-library/react'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { ConnectionStatus as ConnectionStatusType } from '@/types/chat'

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
}))

describe('ConnectionStatus Component', () => {
  it('should render connected status correctly', () => {
    render(<ConnectionStatus status="connected" />)

    expect(screen.getByText('Connected')).toBeInTheDocument()
    
    // Check for WiFi icon (it should be in the document)
    const container = screen.getByText('Connected').closest('div')
    expect(container).toHaveClass('text-green-600')
    expect(container).toHaveClass('bg-green-50')
    expect(container).toHaveClass('border-green-200')
  })

  it('should render connecting status correctly', () => {
    render(<ConnectionStatus status="connecting" />)

    expect(screen.getByText('Connecting...')).toBeInTheDocument()
    
    const container = screen.getByText('Connecting...').closest('div')
    expect(container).toHaveClass('text-yellow-600')
    expect(container).toHaveClass('bg-yellow-50')
    expect(container).toHaveClass('border-yellow-200')
  })

  it('should render error status correctly', () => {
    render(<ConnectionStatus status="error" />)

    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    
    const container = screen.getByText('Connection Error').closest('div')
    expect(container).toHaveClass('text-red-600')
    expect(container).toHaveClass('bg-red-50')
    expect(container).toHaveClass('border-red-200')
  })

  it('should render disconnected status correctly', () => {
    render(<ConnectionStatus status="disconnected" />)

    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    
    const container = screen.getByText('Disconnected').closest('div')
    expect(container).toHaveClass('text-gray-600')
    expect(container).toHaveClass('bg-gray-50')
    expect(container).toHaveClass('border-gray-200')
  })

  it('should handle unknown status gracefully', () => {
    // Type assertion to test unknown status
    render(<ConnectionStatus status={'unknown' as ConnectionStatusType} />)

    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    
    const container = screen.getByText('Disconnected').closest('div')
    expect(container).toHaveClass('text-gray-600')
  })

  it('should apply correct CSS classes for layout', () => {
    render(<ConnectionStatus status="connected" />)

    const container = screen.getByText('Connected').closest('div')
    expect(container).toHaveClass('flex', 'items-center', 'gap-2', 'px-3', 'py-2', 'rounded-lg', 'border', 'text-sm', 'font-medium')
  })
})