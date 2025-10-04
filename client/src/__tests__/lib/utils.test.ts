import { cn, formatTimestamp, generateId } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3')
    })

    it('should resolve tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })
  })

  describe('formatTimestamp', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "Just now" for recent timestamps', () => {
      const recent = new Date('2024-01-15T11:59:30Z') // 30 seconds ago
      expect(formatTimestamp(recent)).toBe('Just now')
    })

    it('should return minutes ago for timestamps within an hour', () => {
      const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z')
      expect(formatTimestamp(fiveMinutesAgo)).toBe('5m ago')

      const thirtyMinutesAgo = new Date('2024-01-15T11:30:00Z')
      expect(formatTimestamp(thirtyMinutesAgo)).toBe('30m ago')
    })

    it('should return hours ago for timestamps within a day', () => {
      const twoHoursAgo = new Date('2024-01-15T10:00:00Z')
      expect(formatTimestamp(twoHoursAgo)).toBe('2h ago')

      const twelveHoursAgo = new Date('2024-01-15T00:00:00Z')
      expect(formatTimestamp(twelveHoursAgo)).toBe('12h ago')
    })

    it('should return date for timestamps older than a day', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z')
      expect(formatTimestamp(yesterday)).toBe('1/14/2024')

      const lastWeek = new Date('2024-01-08T12:00:00Z')
      expect(formatTimestamp(lastWeek)).toBe('1/8/2024')
    })

    it('should handle edge cases', () => {
      const exactlyOneMinute = new Date('2024-01-15T11:59:00Z')
      expect(formatTimestamp(exactlyOneMinute)).toBe('1m ago')

      const exactlyOneHour = new Date('2024-01-15T11:00:00Z')
      expect(formatTimestamp(exactlyOneHour)).toBe('1h ago')

      const exactlyOneDay = new Date('2024-01-14T12:00:00Z')
      expect(formatTimestamp(exactlyOneDay)).toBe('1/14/2024')
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(1000)
    })

    it('should generate IDs with reasonable length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(10)
      expect(id.length).toBeLessThan(30)
    })

    it('should only contain alphanumeric characters', () => {
      const id = generateId()
      expect(id).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })
})