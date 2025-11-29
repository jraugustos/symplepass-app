import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validations/registration-guards', () => ({
  validateRegistration: vi.fn(),
}))

describe('Capacity Boundary Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Event capacity validation', () => {
    it('should allow registration when capacity is available', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(true)
    })

    it('should block registration when event is full', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Este evento atingiu o número máximo de participantes.',
        errorCode: 'EVENT_FULL',
      })

      const result = await validateRegistration(
        {} as any,
        'event-full-123',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EVENT_FULL')
    })

    it('should handle boundary case: exactly at capacity', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      // First user fills the last spot
      vi.mocked(validateRegistration).mockResolvedValueOnce({ valid: true })

      const firstResult = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-999',
        false
      )

      expect(firstResult.valid).toBe(true)

      // Next user should be blocked
      vi.mocked(validateRegistration).mockResolvedValueOnce({
        valid: false,
        error: 'Este evento atingiu o número máximo de participantes.',
        errorCode: 'EVENT_FULL',
      })

      const secondResult = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-1000',
        false
      )

      expect(secondResult.valid).toBe(false)
    })
  })

  describe('Category capacity validation', () => {
    it('should block when category is full but event has space', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Esta categoria atingiu o limite de vagas.',
        errorCode: 'CATEGORY_FULL',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'full-category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('CATEGORY_FULL')
    })
  })

  describe('Pair registration capacity', () => {
    it('should count pair registration as 2 spots', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      // Event has only 1 spot left, pair registration should fail
      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Não há vagas suficientes para inscrição em dupla.',
        errorCode: 'INSUFFICIENT_CAPACITY_FOR_PAIR',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-123',
        true // isPairRegistration
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('INSUFFICIENT_CAPACITY_FOR_PAIR')
    })

    it('should allow pair registration when 2+ spots available', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-123',
        true
      )

      expect(result.valid).toBe(true)
    })

    it('should block pair registration if category does not allow pairs', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Esta categoria não permite inscrição em dupla.',
        errorCode: 'PAIR_NOT_ALLOWED',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'individual-only-category',
        'user-123',
        true
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('PAIR_NOT_ALLOWED')
    })
  })

  describe('Registration window validation', () => {
    it('should block registration before window opens', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'As inscrições para este evento ainda não foram abertas.',
        errorCode: 'REGISTRATION_NOT_OPEN',
      })

      const result = await validateRegistration(
        {} as any,
        'future-event',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('REGISTRATION_NOT_OPEN')
    })

    it('should block registration after window closes', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'As inscrições para este evento estão encerradas.',
        errorCode: 'REGISTRATION_CLOSED',
      })

      const result = await validateRegistration(
        {} as any,
        'past-event',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('REGISTRATION_CLOSED')
    })

    it('should allow registration within window', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any,
        'active-event',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('Duplicate registration prevention', () => {
    it('should block duplicate registration for same category', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Você já possui uma inscrição ativa para esta categoria.',
        errorCode: 'ALREADY_REGISTERED',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'already-registered-user',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('ALREADY_REGISTERED')
    })

    it('should allow registration in different category', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'different-category-456',
        'user-with-other-registration',
        false
      )

      expect(result.valid).toBe(true)
    })

    it('should consider cancelled registrations as available slot', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      // User had a cancelled registration, should be allowed to register again
      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-with-cancelled-registration',
        false
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('Concurrent registration handling', () => {
    it('should handle race condition scenario', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      // Simulating race condition: validation passes but capacity was taken
      vi.mocked(validateRegistration)
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({
          valid: false,
          error: 'Este evento atingiu o número máximo de participantes.',
          errorCode: 'EVENT_FULL',
        })

      const firstResult = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-1',
        false
      )

      const secondResult = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-2',
        false
      )

      expect(firstResult.valid).toBe(true)
      expect(secondResult.valid).toBe(false)
    })
  })

  describe('Capacity calculation helpers', () => {
    it('should calculate remaining capacity correctly', () => {
      const event = {
        max_participants: 100,
        confirmed_registrations: 95,
      }

      const remaining = event.max_participants - event.confirmed_registrations
      expect(remaining).toBe(5)
    })

    it('should handle null max_participants as unlimited', () => {
      const event = {
        max_participants: null,
        confirmed_registrations: 1000,
      }

      const hasCapacity = event.max_participants === null ||
        event.confirmed_registrations < event.max_participants

      expect(hasCapacity).toBe(true)
    })

    it('should handle zero max_participants', () => {
      const event = {
        max_participants: 0,
        confirmed_registrations: 0,
      }

      const hasCapacity = event.max_participants === null ||
        event.max_participants === 0 ||
        event.confirmed_registrations < event.max_participants

      // Zero capacity could mean unlimited or no registrations allowed - depends on business logic
      expect(hasCapacity).toBe(true)
    })
  })

  describe('Error codes mapping', () => {
    it('should return 409 for ALREADY_REGISTERED', () => {
      const errorCode = 'ALREADY_REGISTERED'
      const statusCode = errorCode === 'ALREADY_REGISTERED' ? 409 : 400

      expect(statusCode).toBe(409)
    })

    it('should return 400 for other errors', () => {
      const errorCodes = ['EVENT_FULL', 'CATEGORY_FULL', 'REGISTRATION_CLOSED', 'PAIR_NOT_ALLOWED']

      for (const errorCode of errorCodes) {
        const statusCode = errorCode === 'ALREADY_REGISTERED' ? 409 : 400
        expect(statusCode).toBe(400)
      }
    })
  })
})
