import { saveSession, loadSession, clearSession, isSessionValid } from '@/lib/session'

// Mock localStorage from setup file
const mockLocalStorage = (window as unknown as { localStorage: typeof localStorage }).localStorage

describe('session management', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('saveSession', () => {
    it('should save session data to localStorage', () => {
      const token = 'test-token-123'
      const userName = 'John Doe'
      
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      saveSession(token, userName)

      const expectedSessionData = JSON.stringify({
        token,
        userName,
        timestamp: mockDate.getTime(),
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chatbot-session',
        expectedSessionData
      )
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      // Mock console.warn to avoid console output in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // The function should not throw and should call console.warn
      saveSession('token', 'user')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save session to localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle server-side rendering (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error - Temporarily deleting window for SSR testing
      delete global.window

      // Should not throw when window is undefined
      saveSession('token', 'user')

      global.window = originalWindow
    })
  })

  describe('loadSession', () => {
    it('should load valid session data from localStorage', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      const sessionData = {
        token: 'test-token-123',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - 30000, // 30 seconds ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData))

      const result = loadSession()

      expect(result).toEqual(sessionData)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chatbot-session')
    })

    it('should return null if no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = loadSession()

      expect(result).toBeNull()
    })

    it('should return null and clear expired session', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      const expiredSessionData = {
        token: 'expired-token',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - (2 * 60 * 60 * 1000), // 2 hours ago (expired)
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData))

      const result = loadSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot-session')
    })

    it('should handle corrupted session data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data')
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = loadSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot-session')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load session from localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle server-side rendering (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error - Temporarily deleting window for SSR testing
      delete global.window

      const result = loadSession()

      expect(result).toBeNull()

      global.window = originalWindow
    })

    it('should handle localStorage access errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = loadSession()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load session from localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      clearSession()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chatbot-session')
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Failed to remove item')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Function should handle errors gracefully without throwing
      clearSession()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear session from localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle server-side rendering (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error - Temporarily deleting window for SSR testing
      delete global.window

      // Should handle SSR gracefully without throwing
      clearSession()

      global.window = originalWindow
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      const sessionData = {
        token: 'test-token-123',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - 30000, // 30 seconds ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData))

      expect(isSessionValid()).toBe(true)
    })

    it('should return false for no session', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      expect(isSessionValid()).toBe(false)
    })

    it('should return false for expired session', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      const expiredSessionData = {
        token: 'expired-token',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - (2 * 60 * 60 * 1000), // 2 hours ago (expired)
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData))

      expect(isSessionValid()).toBe(false)
    })

    it('should return false for corrupted session data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data')

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      expect(isSessionValid()).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('session expiry logic', () => {
    it('should use 1 hour expiry time', () => {
      const mockDate = new Date('2024-01-15T12:00:00Z')
      jest.setSystemTime(mockDate)

      // Session exactly 1 hour old should be expired
      const expiredSessionData = {
        token: 'test-token',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - (60 * 60 * 1000 + 1000), // 1 hour and 1 second ago (expired)
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData))

      const result = loadSession()
      expect(result).toBeNull()

      // Session 59 minutes old should be valid
      const validSessionData = {
        token: 'test-token',
        userName: 'John Doe',
        timestamp: mockDate.getTime() - (59 * 60 * 1000), // 59 minutes ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSessionData))

      const validResult = loadSession()
      expect(validResult).toEqual(validSessionData)
    })
  })
})