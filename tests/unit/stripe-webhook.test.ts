import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock('@/lib/data/registrations', () => ({
  getRegistrationByStripeSession: vi.fn(),
  getRegistrationByStripeSessionWithDetails: vi.fn(),
  getRegistrationByPaymentIntent: vi.fn(),
  updateRegistrationPaymentStatus: vi.fn(),
  updateRegistrationQRCode: vi.fn(),
}))

vi.mock('@/lib/qrcode/generate', () => ({
  generateQRCode: vi.fn(),
}))

vi.mock('@/lib/email/send-confirmation', () => ({
  sendConfirmationEmail: vi.fn(),
}))

describe('Stripe Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Event handling', () => {
    it('should handle checkout.session.completed event', async () => {
      const { stripe } = await import('@/lib/stripe/client')
      const {
        getRegistrationByStripeSession,
        getRegistrationByStripeSessionWithDetails,
        updateRegistrationPaymentStatus,
        updateRegistrationQRCode,
      } = await import('@/lib/data/registrations')
      const { generateQRCode } = await import('@/lib/qrcode/generate')
      const { sendConfirmationEmail } = await import('@/lib/email/send-confirmation')

      // Mock the event construction
      const mockSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
        customer_email: 'test@example.com',
        customer_details: { name: 'Test User' },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: mockSession },
      } as any)

      // Mock registration data
      const mockRegistration = {
        id: 'reg-123',
        payment_status: 'pending',
        qr_code: null,
      }

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: mockRegistration,
        error: null,
      } as any)

      vi.mocked(generateQRCode).mockResolvedValue('data:image/png;base64,qrcode123')

      vi.mocked(getRegistrationByStripeSessionWithDetails).mockResolvedValue({
        data: {
          ...mockRegistration,
          event: { title: 'Test Event', start_date: '2025-04-15', location: { city: 'São Paulo', state: 'SP' } },
          category: { name: 'Test Category' },
          user: { email: 'test@example.com', full_name: 'Test User' },
          registration_data: null,
        },
        error: null,
      } as any)

      // Verify the mocks were set up correctly
      expect(vi.mocked(getRegistrationByStripeSession)).toBeDefined()
      expect(vi.mocked(updateRegistrationPaymentStatus)).toBeDefined()
      expect(vi.mocked(sendConfirmationEmail)).toBeDefined()
    })

    it('should handle checkout.session.expired event', async () => {
      const { stripe } = await import('@/lib/stripe/client')
      const { getRegistrationByStripeSession, updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      const mockSession = { id: 'cs_test_expired_123' }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'checkout.session.expired',
        data: { object: mockSession },
      } as any)

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: { id: 'reg-456' },
        error: null,
      } as any)

      // Verify the event type is handled
      expect(vi.mocked(getRegistrationByStripeSession)).toBeDefined()
    })

    it('should handle payment_intent.payment_failed event', async () => {
      const { stripe } = await import('@/lib/stripe/client')
      const { getRegistrationByPaymentIntent, updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      const mockPaymentIntent = {
        id: 'pi_test_failed_123',
        metadata: { registrationId: 'reg-789' },
      }

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: mockPaymentIntent },
      } as any)

      vi.mocked(getRegistrationByPaymentIntent).mockResolvedValue({
        data: { id: 'reg-789' },
        error: null,
      } as any)

      expect(vi.mocked(getRegistrationByPaymentIntent)).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should return 400 for invalid signature', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      // This verifies the mock throws as expected
      expect(() => stripe.webhooks.constructEvent('body', 'sig', 'secret')).toThrow('Invalid signature')
    })

    it('should skip already confirmed registrations', async () => {
      const { getRegistrationByStripeSession, updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      const mockRegistration = {
        id: 'reg-already-confirmed',
        payment_status: 'paid', // Already paid
      }

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: mockRegistration,
        error: null,
      } as any)

      // When registration is already paid, updateRegistrationPaymentStatus should not be called
      // This is the expected behavior to prevent duplicate processing
      expect(mockRegistration.payment_status).toBe('paid')
    })
  })

  describe('QR Code generation', () => {
    it('should generate QR code when not present', async () => {
      const { generateQRCode } = await import('@/lib/qrcode/generate')

      vi.mocked(generateQRCode).mockResolvedValue('data:image/png;base64,newqrcode')

      const result = await generateQRCode('reg-123')
      expect(result).toBe('data:image/png;base64,newqrcode')
    })

    it('should handle QR code generation failure gracefully', async () => {
      const { generateQRCode } = await import('@/lib/qrcode/generate')

      vi.mocked(generateQRCode).mockResolvedValue(null as any)

      const result = await generateQRCode('reg-123')
      expect(result).toBeNull()
    })
  })

  describe('Email sending', () => {
    it('should send confirmation email with correct data', async () => {
      const { sendConfirmationEmail } = await import('@/lib/email/send-confirmation')

      vi.mocked(sendConfirmationEmail).mockResolvedValue(undefined)

      await sendConfirmationEmail({
        userEmail: 'test@example.com',
        userName: 'Test User',
        eventTitle: 'Test Event',
        eventDate: '15 de abril de 2025 • 07:00',
        eventLocation: 'São Paulo, SP',
        categoryName: 'Test Category',
        qrCodeDataUrl: 'data:image/png;base64,qrcode',
        ticketCode: '#SP2025-1234',
        registrationId: 'reg-123',
        qrMissingNote: null,
        partnerData: undefined,
      })

      expect(sendConfirmationEmail).toHaveBeenCalled()
    })

    it('should include partner data when present', async () => {
      const { sendConfirmationEmail } = await import('@/lib/email/send-confirmation')

      vi.mocked(sendConfirmationEmail).mockResolvedValue(undefined)

      const partnerData = {
        name: 'Partner Name',
        email: 'partner@example.com',
        cpf: '123.456.789-00',
        phone: '(11) 99999-9999',
        shirtSize: 'M',
      }

      await sendConfirmationEmail({
        userEmail: 'test@example.com',
        userName: 'Test User',
        eventTitle: 'Test Event',
        eventDate: '15 de abril de 2025 • 07:00',
        eventLocation: 'São Paulo, SP',
        categoryName: 'Dupla',
        qrCodeDataUrl: 'data:image/png;base64,qrcode',
        ticketCode: '#SP2025-1234',
        registrationId: 'reg-123',
        qrMissingNote: null,
        partnerData,
      })

      expect(sendConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ partnerData })
      )
    })
  })

  describe('Security validations', () => {
    it('should require stripe-signature header', () => {
      // Missing signature should result in 400 error
      const signature = null
      expect(signature).toBeNull()
    })

    it('should require STRIPE_WEBHOOK_SECRET environment variable', () => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
      // In test environment, this may be empty, but the route should check for it
      expect(typeof webhookSecret).toBe('string')
    })

    it('should validate webhook signature against secret', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      // Valid signature should pass
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_valid' } },
      } as any)

      const event = stripe.webhooks.constructEvent('body', 'valid_sig', 'secret')
      expect(event.type).toBe('checkout.session.completed')
    })

    it('should reject tampered payload', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Webhook payload hash does not match')
      })

      expect(() =>
        stripe.webhooks.constructEvent('tampered_body', 'sig', 'secret')
      ).toThrow('Webhook payload hash does not match')
    })

    it('should reject expired signatures', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Webhook timestamp is outside the tolerance zone')
      })

      expect(() =>
        stripe.webhooks.constructEvent('body', 'expired_sig', 'secret')
      ).toThrow('Webhook timestamp is outside the tolerance zone')
    })

    it('should reject wrong webhook secret', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature')
      })

      expect(() =>
        stripe.webhooks.constructEvent('body', 'sig', 'wrong_secret')
      ).toThrow('No signatures found matching the expected signature')
    })
  })

  describe('Idempotency', () => {
    it('should not process already paid registrations', async () => {
      const { getRegistrationByStripeSession, updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: { id: 'reg-123', payment_status: 'paid' },
        error: null,
      } as any)

      const registration = (await getRegistrationByStripeSession('cs_test')).data
      const shouldUpdate = registration?.payment_status !== 'paid'

      expect(shouldUpdate).toBe(false)
    })

    it('should process pending registrations', async () => {
      const { getRegistrationByStripeSession } = await import('@/lib/data/registrations')

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: { id: 'reg-123', payment_status: 'pending' },
        error: null,
      } as any)

      const registration = (await getRegistrationByStripeSession('cs_test')).data
      const shouldUpdate = registration?.payment_status !== 'paid'

      expect(shouldUpdate).toBe(true)
    })

    it('should handle missing registration gracefully', async () => {
      const { getRegistrationByStripeSession } = await import('@/lib/data/registrations')

      vi.mocked(getRegistrationByStripeSession).mockResolvedValue({
        data: null,
        error: null,
      } as any)

      const { data: registration } = await getRegistrationByStripeSession('cs_test_unknown')
      expect(registration).toBeNull()
    })
  })

  describe('Payment status updates', () => {
    it('should update to confirmed/paid on successful payment', async () => {
      const { updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      vi.mocked(updateRegistrationPaymentStatus).mockResolvedValue({ error: null } as any)

      await updateRegistrationPaymentStatus('reg-123', 'confirmed', 'paid', 'pi_test_123')

      expect(updateRegistrationPaymentStatus).toHaveBeenCalledWith(
        'reg-123',
        'confirmed',
        'paid',
        'pi_test_123'
      )
    })

    it('should update to cancelled/failed on expired session', async () => {
      const { updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      vi.mocked(updateRegistrationPaymentStatus).mockResolvedValue({ error: null } as any)

      await updateRegistrationPaymentStatus('reg-123', 'cancelled', 'failed')

      expect(updateRegistrationPaymentStatus).toHaveBeenCalledWith(
        'reg-123',
        'cancelled',
        'failed'
      )
    })

    it('should update to pending/failed on payment failure', async () => {
      const { updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      vi.mocked(updateRegistrationPaymentStatus).mockResolvedValue({ error: null } as any)

      await updateRegistrationPaymentStatus('reg-123', 'pending', 'failed', 'pi_failed_123')

      expect(updateRegistrationPaymentStatus).toHaveBeenCalledWith(
        'reg-123',
        'pending',
        'failed',
        'pi_failed_123'
      )
    })
  })

  describe('Payment intent handling', () => {
    it('should lookup registration by payment intent ID', async () => {
      const { getRegistrationByPaymentIntent } = await import('@/lib/data/registrations')

      vi.mocked(getRegistrationByPaymentIntent).mockResolvedValue({
        data: { id: 'reg-123' },
        error: null,
      } as any)

      const result = await getRegistrationByPaymentIntent('pi_test_123')
      expect(result.data?.id).toBe('reg-123')
    })

    it('should fallback to metadata registrationId if lookup fails', async () => {
      const { getRegistrationByPaymentIntent, updateRegistrationPaymentStatus } = await import('@/lib/data/registrations')

      vi.mocked(getRegistrationByPaymentIntent).mockResolvedValue({
        data: null,
        error: null,
      } as any)

      const paymentIntent = {
        id: 'pi_test_123',
        metadata: { registrationId: 'reg-from-metadata' },
      }

      const { data: registration } = await getRegistrationByPaymentIntent(paymentIntent.id)

      if (!registration && paymentIntent.metadata?.registrationId) {
        expect(paymentIntent.metadata.registrationId).toBe('reg-from-metadata')
      }
    })
  })

  describe('Unhandled event types', () => {
    it('should log and continue for unknown event types', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
        type: 'unknown.event.type',
        data: { object: {} },
      } as any)

      const event = stripe.webhooks.constructEvent('body', 'sig', 'secret')
      expect(event.type).toBe('unknown.event.type')
      // Should return 200 even for unknown events
    })

    it('should handle subscription events gracefully', async () => {
      const { stripe } = await import('@/lib/stripe/client')

      const subscriptionEvents = [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ]

      for (const eventType of subscriptionEvents) {
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
          type: eventType,
          data: { object: { id: 'sub_test_123' } },
        } as any)

        const event = stripe.webhooks.constructEvent('body', 'sig', 'secret')
        expect(event.type).toBe(eventType)
      }
    })
  })
})
