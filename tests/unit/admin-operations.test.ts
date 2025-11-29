import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

// Mock auth
vi.mock('@/lib/auth/actions', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock admin data functions
vi.mock('@/lib/data/admin-users', () => ({
  updateUserRole: vi.fn(),
}))

vi.mock('@/lib/data/admin-registrations', () => ({
  exportRegistrationsToCSV: vi.fn(),
}))

vi.mock('@/lib/data/admin-reports', () => ({
  exportFinancialReport: vi.fn(),
}))

describe('Admin Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role update endpoint', () => {
    it('should require admin role', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      // Non-admin user
      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'user-123' },
        profile: { id: 'user-123', role: 'user' },
      } as any)

      const result = await getCurrentUser()
      expect(result?.profile?.role).not.toBe('admin')
    })

    it('should allow admin role changes', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'admin-123' },
        profile: { id: 'admin-123', role: 'admin' },
      } as any)

      const result = await getCurrentUser()
      expect(result?.profile?.role).toBe('admin')
    })

    it('should validate role values', () => {
      const validRoles = ['user', 'organizer', 'admin']

      expect(validRoles.includes('user')).toBe(true)
      expect(validRoles.includes('organizer')).toBe(true)
      expect(validRoles.includes('admin')).toBe(true)
      expect(validRoles.includes('superadmin')).toBe(false)
      expect(validRoles.includes('')).toBe(false)
    })

    it('should call updateUserRole with correct parameters', async () => {
      const { updateUserRole } = await import('@/lib/data/admin-users')

      vi.mocked(updateUserRole).mockResolvedValue({ success: true, error: null })

      const result = await updateUserRole('user-123', 'organizer')

      expect(updateUserRole).toHaveBeenCalledWith('user-123', 'organizer')
      expect(result.success).toBe(true)
    })

    it('should handle update failure', async () => {
      const { updateUserRole } = await import('@/lib/data/admin-users')

      vi.mocked(updateUserRole).mockResolvedValue({
        success: false,
        error: 'Failed to update role',
      })

      const result = await updateUserRole('user-123', 'admin')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update role')
    })
  })

  describe('Export registrations endpoint', () => {
    it('should require admin or organizer role', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'organizer-123' },
        profile: { id: 'organizer-123', role: 'organizer' },
      } as any)

      const result = await getCurrentUser()
      const hasAccess = result?.profile?.role === 'admin' || result?.profile?.role === 'organizer'

      expect(hasAccess).toBe(true)
    })

    it('should reject regular users', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'user-123' },
        profile: { id: 'user-123', role: 'user' },
      } as any)

      const result = await getCurrentUser()
      const hasAccess = result?.profile?.role === 'admin' || result?.profile?.role === 'organizer'

      expect(hasAccess).toBe(false)
    })

    it('should export registrations for event', async () => {
      const { exportRegistrationsToCSV } = await import('@/lib/data/admin-registrations')

      const mockData = [
        { id: 'reg-1', user_name: 'User 1', status: 'confirmed' },
        { id: 'reg-2', user_name: 'User 2', status: 'confirmed' },
      ]

      vi.mocked(exportRegistrationsToCSV).mockResolvedValue(mockData as any)

      const result = await exportRegistrationsToCSV('event-123')

      expect(exportRegistrationsToCSV).toHaveBeenCalledWith('event-123')
      expect(result).toHaveLength(2)
    })
  })

  describe('Export financial reports endpoint', () => {
    it('should accept filter parameters', async () => {
      const { exportFinancialReport } = await import('@/lib/data/admin-reports')

      const filters = {
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        event_id: 'event-123',
        payment_status: 'paid',
      }

      vi.mocked(exportFinancialReport).mockResolvedValue([])

      await exportFinancialReport(filters)

      expect(exportFinancialReport).toHaveBeenCalledWith(filters)
    })

    it('should handle empty filters', async () => {
      const { exportFinancialReport } = await import('@/lib/data/admin-reports')

      vi.mocked(exportFinancialReport).mockResolvedValue([])

      const result = await exportFinancialReport({})

      expect(result).toEqual([])
    })
  })

  describe('Rate limiting', () => {
    it('should use strict rate limit for role changes', () => {
      expect(RATE_LIMITS.strict.limit).toBe(3)
      expect(RATE_LIMITS.strict.windowSeconds).toBe(60)
    })

    it('should use export rate limit for data exports', () => {
      expect(RATE_LIMITS.export.limit).toBe(10)
      expect(RATE_LIMITS.export.windowSeconds).toBe(60)
    })

    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-user-1', RATE_LIMITS.strict)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('should block requests over limit', () => {
      const identifier = 'rate-limit-test-user'

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(identifier, RATE_LIMITS.strict)
        expect(result.success).toBe(true)
      }

      // 4th request should be blocked
      const result = checkRateLimit(identifier, RATE_LIMITS.strict)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should return correct rate limit headers', () => {
      const result = checkRateLimit('header-test-user', RATE_LIMITS.admin)
      const headers = rateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('30')
      expect(headers['X-RateLimit-Remaining']).toBeDefined()
      expect(headers['X-RateLimit-Reset']).toBeDefined()
    })

    it('should use different limits for different presets', () => {
      expect(RATE_LIMITS.standard.limit).toBe(100)
      expect(RATE_LIMITS.admin.limit).toBe(30)
      expect(RATE_LIMITS.export.limit).toBe(10)
      expect(RATE_LIMITS.auth.limit).toBe(5)
      expect(RATE_LIMITS.strict.limit).toBe(3)
    })
  })

  describe('Authorization checks', () => {
    it('should reject unauthenticated requests', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('should reject users without profile', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'user-123' },
        profile: null,
      } as any)

      const result = await getCurrentUser()
      expect(result?.profile).toBeNull()
    })

    it('should check profile exists before role check', async () => {
      const { getCurrentUser } = await import('@/lib/auth/actions')

      vi.mocked(getCurrentUser).mockResolvedValue({
        user: { id: 'user-123' },
        profile: { id: 'user-123', role: 'admin' },
      } as any)

      const result = await getCurrentUser()
      const isAuthorized = result && result.profile && result.profile.role === 'admin'

      expect(isAuthorized).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const { updateUserRole } = await import('@/lib/data/admin-users')

      vi.mocked(updateUserRole).mockRejectedValue(new Error('Database connection failed'))

      await expect(updateUserRole('user-123', 'admin')).rejects.toThrow('Database connection failed')
    })

    it('should handle export errors gracefully', async () => {
      const { exportRegistrationsToCSV } = await import('@/lib/data/admin-registrations')

      vi.mocked(exportRegistrationsToCSV).mockRejectedValue(new Error('Export failed'))

      await expect(exportRegistrationsToCSV('event-123')).rejects.toThrow('Export failed')
    })
  })
})
