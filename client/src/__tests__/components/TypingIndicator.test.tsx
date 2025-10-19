import { render, screen } from '@testing-library/react'
import { TypingIndicator } from '@/components/TypingIndicator'

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

describe('TypingIndicator Component', () => {
  it('should render typing indicator with correct structure', () => {
    render(<TypingIndicator />)

    // Check for the AI Assistant label
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    
    // Check for the "Thinking" text
    expect(screen.getByText('Thinking')).toBeInTheDocument()
  })

  it('should have correct styling classes', () => {
    render(<TypingIndicator />)

    // Check for container structure
    const containers = screen.getAllByTestId('motion-div')
    expect(containers.length).toBeGreaterThan(0)

    // Check for AI Assistant label styling
    const aiLabel = screen.getByText('AI Assistant')
    expect(aiLabel).toHaveClass('text-xs', 'font-semibold', 'mb-2', 'tracking-wide', 'text-emerald-600')

    // Check for thinking text styling
    const thinkingText = screen.getByText('Thinking')
    expect(thinkingText).toHaveClass('text-sm', 'text-gray-600', 'font-medium')
  })

  it('should render animated dots', () => {
    render(<TypingIndicator />)

    // Check that we have the animated dots structure
    const dotsContainer = screen.getByText('Thinking').nextSibling
    expect(dotsContainer).toBeInTheDocument()
  })

  it('should render with bot avatar styling', () => {
    render(<TypingIndicator />)

    // The component should have the bot avatar styling classes
    const containers = screen.getAllByTestId('motion-div')
    
    // Find the avatar container (should have specific classes for bot styling)
    const avatarContainer = containers.find(container => 
      container.className.includes('from-emerald-400') && 
      container.className.includes('to-cyan-400')
    )
    
    expect(avatarContainer).toBeTruthy()
  })

  it('should render with message bubble styling', () => {
    render(<TypingIndicator />)

    // Check for message bubble styling
    const containers = screen.getAllByTestId('motion-div')
    
    // Find the bubble container
    const bubbleContainer = containers.find(container => 
      container.className.includes('bg-white/90') && 
      container.className.includes('rounded-3xl')
    )
    
    expect(bubbleContainer).toBeTruthy()
  })

  it('should have consistent styling with Message component', () => {
    render(<TypingIndicator />)

    // Check for consistent classes that should match the Message component
    const aiLabel = screen.getByText('AI Assistant')
    expect(aiLabel).toHaveClass('text-emerald-600') // Should match AI message styling

    // Check for message bubble consistency
    const containers = screen.getAllByTestId('motion-div')
    const bubbleContainer = containers.find(container => 
      container.className.includes('shadow-lg') && 
      container.className.includes('border-gray-100')
    )
    
    expect(bubbleContainer).toBeTruthy()
  })
})