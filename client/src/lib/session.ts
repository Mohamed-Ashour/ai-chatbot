interface SessionData {
  token: string
  userName: string
  timestamp: number
}

const SESSION_KEY = 'chatbot-session'
const SESSION_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds (matches server expiry)

export const saveSession = (token: string, userName: string): void => {
  if (typeof window === 'undefined') return

  const sessionData: SessionData = {
    token,
    userName,
    timestamp: Date.now()
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error)
  }
}

export const loadSession = (): SessionData | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const sessionData: SessionData = JSON.parse(stored)
    
    // Check if session has expired
    if (Date.now() - sessionData.timestamp > SESSION_EXPIRY) {
      clearSession()
      return null
    }

    return sessionData
  } catch (error) {
    console.warn('Failed to load session from localStorage:', error)
    clearSession() // Clear corrupted data
    return null
  }
}

export const clearSession = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error)
  }
}

export const isSessionValid = (): boolean => {
  const session = loadSession()
  return session !== null
}