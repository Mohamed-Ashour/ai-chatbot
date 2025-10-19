import { render, screen } from '@testing-library/react'
import { SessionRestoreLoader } from '@/components/SessionRestoreLoader'

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
    h1: ({ children, className, ...props }: MockMotionProps) => (
      <h1 className={className} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, className, ...props }: MockMotionProps) => (
      <h2 className={className} {...props}>
        {children}
      </h2>
    ),
    header: ({ children, className, ...props }: MockMotionProps) => (
      <header className={className} {...props}>
        {children}
      </header>
    ),
    p: ({ children, className, ...props }: MockMotionProps) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
    span: ({ children, className, ...props }: MockMotionProps) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))
describe('SessionRestoreLoader Component', () => {
  it('should render loading screen with correct content', () => {
    render(<SessionRestoreLoader />)

    expect(screen.getByText('AI Chatbot')).toBeInTheDocument()
    expect(screen.getByText('Restoring your session...')).toBeInTheDocument()
    expect(screen.getByText('Restoring Session')).toBeInTheDocument()
    expect(screen.getByText('Loading your chat history and reconnecting...')).toBeInTheDocument()
    expect(screen.getByText('This usually takes just a few seconds')).toBeInTheDocument()
  })

  it('should have proper layout structure', () => {
    render(<SessionRestoreLoader />)

    // Check for full screen container
    const fullscreenContainer = document.querySelector('.h-screen')
    expect(fullscreenContainer).toBeInTheDocument()
    expect(fullscreenContainer).toHaveClass('flex', 'flex-col', 'h-screen')

    // Check for gradient background
    expect(fullscreenContainer).toHaveClass('bg-gradient-to-br', 'from-indigo-50', 'via-white', 'to-cyan-50')
  })

  it('should render animated background elements', () => {
    render(<SessionRestoreLoader />)

    // Check for background animation elements
    const backgroundContainer = document.querySelector('.absolute.inset-0')
    expect(backgroundContainer).toBeInTheDocument()
    expect(backgroundContainer).toHaveClass('overflow-hidden', 'pointer-events-none')

    // Check for animated blob elements
    const blobs = document.querySelectorAll('.animate-blob')
    expect(blobs.length).toBeGreaterThan(0)
  })

  it('should render header with loading state', () => {
    render(<SessionRestoreLoader />)

    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('relative', 'z-10')

    expect(screen.getByText('AI Chatbot')).toHaveClass(
      'text-xl',
      'font-bold',
      'bg-gradient-to-r',
      'from-indigo-600',
      'to-purple-600',
      'bg-clip-text',
      'text-transparent'
    )

    expect(screen.getByText('Restoring your session...')).toHaveClass(
      'text-sm',
      'text-gray-600',
      'font-medium'
    )
  })

  it('should render animated loading icon', () => {
    render(<SessionRestoreLoader />)

    // Check for animated AI icon
    const motionDivs = screen.getAllByTestId('motion-div')
    const animatedIcon = motionDivs.find(div =>
      div.className.includes('from-indigo-500') && 
      div.className.includes('to-pink-500') &&
      div.className.includes('rounded-3xl')
    )
    expect(animatedIcon).toBeTruthy()
  })

  it('should render loading dots animation', () => {
    render(<SessionRestoreLoader />)

    // Check for loading dots container
    const motionDivs = screen.getAllByTestId('motion-div')
    expect(motionDivs.length).toBeGreaterThan(0)

    // The loading animation should be present
    const loadingContainer = motionDivs.find(div =>
      div.className.includes('flex') && div.className.includes('justify-center')
    )
    expect(loadingContainer).toBeTruthy()
  })

  it('should have proper styling for main content', () => {
    render(<SessionRestoreLoader />)

    expect(screen.getByText('Restoring Session')).toHaveClass(
      'text-3xl',
      'font-bold',
      'bg-gradient-to-r',
      'from-indigo-600',
      'via-purple-600',
      'to-pink-600',
      'bg-clip-text',
      'text-transparent',
      'mb-4'
    )

    expect(screen.getByText('Loading your chat history and reconnecting...')).toHaveClass(
      'text-lg',
      'text-gray-600',
      'mb-8',
      'leading-relaxed'
    )

    expect(screen.getByText('This usually takes just a few seconds')).toHaveClass(
      'text-sm',
      'text-gray-500',
      'mt-6'
    )
  })

  it('should render centered content layout', () => {
    render(<SessionRestoreLoader />)

    const centerContainer = document.querySelector('.flex-1.flex.items-center.justify-center')
    expect(centerContainer).toBeInTheDocument()

    const contentContainer = screen.getByText('Restoring Session').closest('div')
    expect(contentContainer).toHaveClass('text-center', 'max-w-lg')
  })

  it('should render with consistent branding', () => {
    render(<SessionRestoreLoader />)

    // Should have consistent AI branding in header
    const aiIcon = document.querySelector('.w-12.h-12')
    expect(aiIcon).toBeInTheDocument()
    expect(aiIcon).toHaveClass(
      'bg-gradient-to-br',
      'from-indigo-500',
      'via-purple-500',
      'to-pink-500',
      'rounded-2xl'
    )

    // Should have consistent color scheme throughout
    const titleElement = screen.getByText('AI Chatbot')
    expect(titleElement).toHaveClass('from-indigo-600', 'to-purple-600')
  })

  it('should have proper z-index layering', () => {
    render(<SessionRestoreLoader />)

    // Background should be behind content
    const backgroundLayer = document.querySelector('.absolute.inset-0')
    expect(backgroundLayer).toHaveClass('pointer-events-none')

    // Header should be above background
    const header = document.querySelector('header')
    expect(header).toHaveClass('relative', 'z-10')

    // Main content should be above background
    const mainContent = document.querySelector('.relative.z-10.flex-1')
    expect(mainContent).toBeInTheDocument()
  })
})