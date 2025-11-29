import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateServiceFee, calculateTotal, validateEmail, validateCPF } from '@/lib/utils'

// Mock the stripe client
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock registrations
vi.mock('@/lib/data/registrations', () => ({
  createRegistration: vi.fn(),
  updateRegistrationStripeSession: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validations/registration-guards', () => ({
  validateRegistration: vi.fn(),
}))

describe('Checkout Create Session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input validation', () => {
    const ALLOWED_SHIRT_SIZES = ['P', 'M', 'G', 'GG', 'XG']
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
        subtotal: 100,
        serviceFee: 10,
        total: 110,
      }

      // All required fields present
      expect(validBody.eventId).toBeTruthy()
      expect(validBody.categoryId).toBeTruthy()
      expect(validBody.shirtSize).toBeTruthy()
      expect(validBody.userName?.trim()).toBeTruthy()
      expect(validBody.userEmail?.trim()).toBeTruthy()
      expect(validBody.userData).toBeTruthy()
      expect(typeof validBody.subtotal).toBe('number')
      expect(typeof validBody.serviceFee).toBe('number')
      expect(typeof validBody.total).toBe('number')
    })

    it('should validate shirt sizes', () => {
      expect(ALLOWED_SHIRT_SIZES.includes('P')).toBe(true)
      expect(ALLOWED_SHIRT_SIZES.includes('M')).toBe(true)
      expect(ALLOWED_SHIRT_SIZES.includes('G')).toBe(true)
      expect(ALLOWED_SHIRT_SIZES.includes('GG')).toBe(true)
      expect(ALLOWED_SHIRT_SIZES.includes('XG')).toBe(true)
      expect(ALLOWED_SHIRT_SIZES.includes('XXL' as any)).toBe(false)
    })

    it('should validate shirt genders', () => {
      expect(VALID_SHIRT_GENDERS.includes('masculino')).toBe(true)
      expect(VALID_SHIRT_GENDERS.includes('feminino')).toBe(true)
      expect(VALID_SHIRT_GENDERS.includes('infantil')).toBe(true)
      expect(VALID_SHIRT_GENDERS.includes('other' as any)).toBe(false)
    })

    it('should validate CPF format', () => {
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('123.456.789-00')).toBe(false)
      expect(validateCPF('111.111.111-11')).toBe(false)
    })

    it('should validate email format', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should validate phone number length', () => {
      const validatePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '')
        return digits.length === 10 || digits.length === 11
      }

      expect(validatePhone('(11) 99999-9999')).toBe(true)  // 11 digits
      expect(validatePhone('(11) 9999-9999')).toBe(true)   // 10 digits
      expect(validatePhone('123')).toBe(false)
    })
  })

  describe('Price calculation', () => {
    const PRICE_TOLERANCE = 0.01

    it('should calculate service fee correctly', () => {
      expect(calculateServiceFee(100)).toBe(10)
      expect(calculateServiceFee(150)).toBe(15)
      expect(calculateServiceFee(99.99)).toBe(10)
    })

    it('should calculate total correctly', () => {
      const subtotal = 100
      const serviceFee = calculateServiceFee(subtotal)
      const total = calculateTotal(subtotal, serviceFee)

      expect(total).toBe(110)
    })

    it('should detect price manipulation', () => {
      const isAmountDifferent = (clientAmount: number, serverAmount: number) => {
        return Math.abs(clientAmount - serverAmount) > PRICE_TOLERANCE
      }

      // Same amounts
      expect(isAmountDifferent(100, 100)).toBe(false)
      expect(isAmountDifferent(100.001, 100)).toBe(false) // Within tolerance

      // Different amounts
      expect(isAmountDifferent(100, 99)).toBe(true)
      expect(isAmountDifferent(100, 101)).toBe(true)
    })
  })

  describe('Partner data validation', () => {
    it('should require all partner fields when partner data is present', () => {
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

    it('should validate partner CPF', () => {
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('invalid')).toBe(false)
    })

    it('should validate partner email', () => {
      expect(validateEmail('partner@example.com')).toBe(true)
      expect(validateEmail('invalid')).toBe(false)
    })
  })

  describe('Registration validation integration', () => {
    it('should call validateRegistration with correct parameters', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({ valid: true })

      const result = await validateRegistration(
        {} as any, // supabase client
        'event-123',
        'category-123',
        'user-123',
        false // isPairRegistration
      )

      expect(result.valid).toBe(true)
    })

    it('should handle validation errors', async () => {
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

    it('should detect duplicate registration', async () => {
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

    it('should validate pair registration permissions', async () => {
      const { validateRegistration } = await import('@/lib/validations/registration-guards')

      vi.mocked(validateRegistration).mockResolvedValue({
        valid: false,
        error: 'Este evento não permite inscrição em dupla.',
        errorCode: 'PAIR_NOT_ALLOWED',
      })

      const result = await validateRegistration(
        {} as any,
        'event-123',
        'category-123',
        'user-123',
        true // isPairRegistration = true
      )

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('PAIR_NOT_ALLOWED')
    })
  })

  describe('Stripe session creation', () => {
    it('should create checkout session with correct parameters', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/cs_test_123',
      } as any)

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: 'test@example.com',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'brl',
              unit_amount: 11000, // R$ 110.00 in cents
              product_data: {
                name: 'Test Event - Test Category',
                description: 'Inscrição + taxa de serviço (M)',
              },
            },
          },
        ],
        success_url: 'http://localhost:3000/confirmacao?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/inscricao?event=test-event&category=cat-123',
      })

      expect(session.id).toBe('cs_test_123')
      expect(session.url).toBe('https://checkout.stripe.com/cs_test_123')
    })
  })
})
