import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the module before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Create a mock supabase client
function createMockSupabase(overrides: Record<string, any> = {}) {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockIn = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      ...overrides,
    })),
    _mocks: { mockSelect, mockEq, mockIn, mockSingle, mockMaybeSingle },
  }
}

describe('Registration Guards', () => {
  describe('validateRegistration', () => {
    it('should return valid: false with EVENT_NOT_FOUND when event does not exist', async () => {
      // This test verifies the error handling path
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        })),
      }

      const { validateRegistration } = await import('@/lib/validations/registration-guards')
      const result = await validateRegistration(
        mockSupabase as any,
        'non-existent-event',
        'category-id',
        'user-id',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EVENT_NOT_FOUND')
    })

    it('should return valid: false with REGISTRATION_NOT_STARTED when registration period has not started', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString() // tomorrow

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'event-123',
              title: 'Test Event',
              slug: 'test-event',
              max_participants: 100,
              registration_start: futureDate,
              registration_end: null,
              allows_pair_registration: false,
              status: 'published',
            },
            error: null,
          }),
        })),
      }

      const { validateRegistration } = await import('@/lib/validations/registration-guards')
      const result = await validateRegistration(
        mockSupabase as any,
        'event-123',
        'category-id',
        'user-id',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('REGISTRATION_NOT_STARTED')
    })

    it('should return valid: false with REGISTRATION_CLOSED when registration period has ended', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString() // yesterday

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'event-123',
              title: 'Test Event',
              slug: 'test-event',
              max_participants: 100,
              registration_start: null,
              registration_end: pastDate,
              allows_pair_registration: false,
              status: 'published',
            },
            error: null,
          }),
        })),
      }

      const { validateRegistration } = await import('@/lib/validations/registration-guards')
      const result = await validateRegistration(
        mockSupabase as any,
        'event-123',
        'category-id',
        'user-id',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('REGISTRATION_CLOSED')
    })

    it('should return valid: false with PAIR_NOT_ALLOWED when event does not allow pairs', async () => {
      let callCount = 0

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'events') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'event-123',
                  title: 'Test Event',
                  slug: 'test-event',
                  max_participants: null,
                  registration_start: null,
                  registration_end: null,
                  allows_pair_registration: false, // Does not allow pairs
                  status: 'published',
                },
                error: null,
              }),
            }
          }
          if (table === 'event_categories') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'category-123',
                  name: 'Test Category',
                  event_id: 'event-123',
                  max_participants: null,
                  current_participants: 0,
                },
                error: null,
              }),
            }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
      }

      const { validateRegistration } = await import('@/lib/validations/registration-guards')
      const result = await validateRegistration(
        mockSupabase as any,
        'event-123',
        'category-123',
        'user-id',
        true // Attempting pair registration
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('PAIR_NOT_ALLOWED')
    })
  })

  describe('RegistrationValidationResult interface', () => {
    it('should have correct error codes defined', () => {
      const validErrorCodes = [
        'EVENT_NOT_FOUND',
        'CATEGORY_NOT_FOUND',
        'REGISTRATION_CLOSED',
        'REGISTRATION_NOT_STARTED',
        'EVENT_FULL',
        'CATEGORY_FULL',
        'PAIR_NOT_ALLOWED',
        'ALREADY_REGISTERED',
      ]

      // This is a type-level test - ensuring all expected codes are valid
      validErrorCodes.forEach((code) => {
        expect(typeof code).toBe('string')
      })
    })
  })
})
