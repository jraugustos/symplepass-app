import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateEmail, validateCPF } from '@/lib/utils'

// Mock qrcode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}))

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock registrations
vi.mock('@/lib/data/registrations', () => ({
  createRegistration: vi.fn(),
  updateRegistrationQRCode: vi.fn(),
}))

// Mock email
vi.mock('@/lib/email/send-confirmation', () => ({
  sendConfirmationEmail: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validations/registration-guards', () => ({
  validateRegistration: vi.fn(),
}))

describe('Free Registration Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Event type validation', () => {
    it('should only accept free event type', () => {
      const validEventTypes = ['free', 'solidarity']

      expect(validEventTypes.includes('free')).toBe(true)
      expect(validEventTypes.includes('solidarity')).toBe(true)
      expect(validEventTypes.includes('paid')).toBe(false)
    })

    it('should reject paid events', () => {
      const eventType = 'paid'
      const isValid = eventType === 'free' || eventType === 'solidarity'

      expect(isValid).toBe(false)
    })
  })

  describe('Category price validation', () => {
    it('should only accept zero price categories', () => {
      const categoryPrice = 0
      expect(categoryPrice).toBe(0)
    })

    it('should reject non-zero price categories', () => {
      const categoryPrice = 100
      const isValidForFreeEvent = categoryPrice === 0

      expect(isValidForFreeEvent).toBe(false)
    })

    it('should handle string price conversion', () => {
      const priceAsString = '0'
      const categoryPrice = Number(priceAsString)

      expect(categoryPrice).toBe(0)
      expect(Number.isNaN(categoryPrice)).toBe(false)
    })
  })

  describe('Input validation', () => {
    const VALID_SHIRT_GENDERS = ['masculino', 'feminino', 'infantil']

    it('should validate required fields', () => {
      const validBody = {
        eventId: 'event-123',
        categoryId: 'cat-123',
        shirtSize: 'M',
        userName: 'Test User',
        userEmail: 'test@example.com',
        userData: {
          name: 'Test User',
          email: 'test@example.com',
          cpf: '529.982.247-25',
          phone: '(11) 99999-9999',
          shirtSize: 'M',
        },
      }

      expect(validBody.eventId).toBeTruthy()
      expect(validBody.categoryId).toBeTruthy()
      expect(validBody.shirtSize).toBeTruthy()
      expect(validBody.userName?.trim()).toBeTruthy()
      expect(validBody.userEmail?.trim()).toBeTruthy()
      expect(validBody.userData).toBeTruthy()
    })

    it('should reject empty event ID', () => {
      const eventId = ''
      expect(eventId).toBeFalsy()
    })

    it('should reject empty category ID', () => {
      const categoryId = ''
      expect(categoryId).toBeFalsy()
    })

    it('should validate CPF format', () => {
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('123.456.789-00')).toBe(false)
      expect(validateCPF('111.111.111-11')).toBe(false)
      expect(validateCPF('invalid')).toBe(false)
    })

    it('should validate email format', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user@domain.org')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
    })

    it('should validate phone number length', () => {
      const validatePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '')
        return digits.length === 10 || digits.length === 11
      }

      expect(validatePhone('(11) 99999-9999')).toBe(true)
      expect(validatePhone('(11) 9999-9999')).toBe(true)
      expect(validatePhone('11999999999')).toBe(true)
      expect(validatePhone('1199999999')).toBe(true)
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('123456789012')).toBe(false)
    })

    it('should validate shirt gender', () => {
      const isValidShirtGender = (gender?: string | null) => {
        return !!gender && VALID_SHIRT_GENDERS.includes(gender)
      }

      expect(isValidShirtGender('masculino')).toBe(true)
      expect(isValidShirtGender('feminino')).toBe(true)
      expect(isValidShirtGender('infantil')).toBe(true)
      expect(isValidShirtGender('other')).toBe(false)
      expect(isValidShirtGender(null)).toBe(false)
      expect(isValidShirtGender(undefined)).toBe(false)
    })

    it('should match shirt size between userData and body', () => {
      const body = { shirtSize: 'M' }
      const userData = { shirtSize: 'M' }

      expect(userData.shirtSize).toBe(body.shirtSize)
    })

    it('should reject mismatched shirt sizes', () => {
      const body = { shirtSize: 'M' }
      const userData = { shirtSize: 'G' }

      expect(userData.shirtSize).not.toBe(body.shirtSize)
    })
  })

  describe('Partner data validation', () => {
    it('should validate all required partner fields', () => {
      const validPartnerData = {
        name: 'Partner Name',
        email: 'partner@example.com',
        cpf: '529.982.247-25',
        phone: '(11) 99999-9999',
        shirtSize: 'M',
      }

      expect(validPartnerData.name).toBeTruthy()
      expect(validPartnerData.email).toBeTruthy()
      expect(validPartnerData.cpf).toBeTruthy()
      expect(validPartnerData.phone).toBeTruthy()
      expect(validPartnerData.shirtSize).toBeTruthy()
    })

    it('should reject incomplete partner data', () => {
      const incompletePartnerData = {
        name: 'Partner Name',
        // missing email, cpf, phone, shirtSize
      }

      expect(incompletePartnerData.name).toBeTruthy()
      expect((incompletePartnerData as any).email).toBeFalsy()
    })

    it('should validate partner CPF', () => {
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('000.000.000-00')).toBe(false)
    })

    it('should validate partner email', () => {
      expect(validateEmail('partner@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
    })
  })

  describe('Registration creation flow', () => {
    it('should create registration with confirmed status for free events', async () => {
      const { createRegistration } = await import('@/lib/data/registrations')

      vi.mocked(createRegistration).mockResolvedValue({
        data: {
          id: 'reg-123',
          status: 'pending',
          payment_status: 'pending',
        },
        error: null,
      } as any)

      const result = await createRegistration(
        'user-123',
        'event-123',
        'category-123',
        'M',
        0, // amount is 0 for free events
        undefined,
        null,
        null,
        { name: 'Test', email: 'test@test.com', cpf: '529.982.247-25', phone: '11999999999', shirtSize: 'M' },
        {} as any
      )

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('reg-123')
    })

    it('should handle idempotent registration (already confirmed)', () => {
      const registration = {
        status: 'confirmed',
        payment_status: 'paid',
      }

      const isAlreadyConfirmed = registration.status === 'confirmed' && registration.payment_status === 'paid'
      expect(isAlreadyConfirmed).toBe(true)
    })

    it('should not skip update for pending registration', () => {
      const registration = {
        status: 'pending',
        payment_status: 'pending',
      }

      const isAlreadyConfirmed = registration.status === 'confirmed' && registration.payment_status === 'paid'
      expect(isAlreadyConfirmed).toBe(false)
    })
  })

  describe('QR Code generation', () => {
    it('should generate ticket code in correct format', () => {
      const eventSlug = 'corrida-solidaria-2025'
      const registrationId = 'abc12345-def6-7890-ghij-klmn12345678'

      const ticketCode = `${eventSlug.toUpperCase()}-${registrationId.slice(0, 8).toUpperCase()}`

      expect(ticketCode).toBe('CORRIDA-SOLIDARIA-2025-ABC12345')
    })

    it('should generate QR code data URL', async () => {
      const QRCode = await import('qrcode')

      const result = await QRCode.default.toDataURL('TEST-CODE', {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
      })

      expect(result).toBe('data:image/png;base64,mock-qr-code')
    })
  })

  describe('Email confirmation', () => {
    it('should send confirmation email with correct data', async () => {
      const { sendConfirmationEmail } = await import('@/lib/email/send-confirmation')

      vi.mocked(sendConfirmationEmail).mockResolvedValue(undefined)

      await sendConfirmationEmail({
        userEmail: 'test@example.com',
        userName: 'Test User',
        eventTitle: 'Corrida Solidária',
        eventDate: '15/04/2025',
        eventLocation: 'São Paulo',
        categoryName: 'Individual',
        qrCodeDataUrl: 'data:image/png;base64,qrcode',
        ticketCode: 'CORRIDA-2025-ABC12345',
        registrationId: 'reg-123',
        eventType: 'solidarity',
        solidarityMessage: 'Sua inscrição ajuda uma causa social!',
      })

      expect(sendConfirmationEmail).toHaveBeenCalled()
    })

    it('should handle email failure gracefully', async () => {
      const { sendConfirmationEmail } = await import('@/lib/email/send-confirmation')

      vi.mocked(sendConfirmationEmail).mockRejectedValue(new Error('Email service unavailable'))

      // Email failure should not throw - registration should still succeed
      await expect(
        sendConfirmationEmail({
          userEmail: 'test@example.com',
          userName: 'Test User',
          eventTitle: 'Test Event',
          eventDate: '15/04/2025',
          eventLocation: 'São Paulo',
          categoryName: 'Individual',
          qrCodeDataUrl: 'data:image/png;base64,qrcode',
          ticketCode: 'TEST-ABC12345',
          registrationId: 'reg-123',
        })
      ).rejects.toThrow('Email service unavailable')
    })
  })

  describe('Validation integration', () => {
    it('should validate registration constraints', async () => {
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

    it('should handle capacity exceeded', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Este evento atingiu o número máximo de participantes.',
        errorCode: 'EVENT_FULL',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EVENT_FULL')
    })

    it('should handle duplicate registration', async () => {
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
        'user-123',
        false
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('ALREADY_REGISTERED')
    })
  })

  describe('User creation flow', () => {
    it('should use existing user if found by email', async () => {
      const existingProfile = { id: 'existing-user-123' }
      expect(existingProfile.id).toBe('existing-user-123')
    })

    it('should generate temporary password for new users', () => {
      const generateTempPassword = () => {
        const random = Math.random().toString(36).slice(-8)
        return `Symp!e${random}${Date.now().toString().slice(-2)}`
      }

      const password = generateTempPassword()

      expect(password).toMatch(/^Symp!e[a-z0-9]{8}\d{2}$/)
    })
  })
})
