import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import {
  getRegistrationByStripeSession,
  getRegistrationByStripeSessionWithDetails,
  getRegistrationByPaymentIntent,
  updateRegistrationPaymentStatus,
  updateRegistrationQRCode,
} from '@/lib/data/registrations'
import { generateQRCode } from '@/lib/qrcode/generate'
import { sendConfirmationEmail } from '@/lib/email/send-confirmation'
import { generateTicketCode, formatDateTimeLong, extractLocationString } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', errorMessage)
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    )
  }

  console.log(`Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Payment successful:', session.id)

        const { data: registration } = await getRegistrationByStripeSession(session.id)

        if (!registration) {
          console.error('Registration not found for session:', session.id)
          break
        }

        if (registration.payment_status === 'paid') {
          console.log('Registration already confirmed:', registration.id)
          break
        }

        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

        // Update payment status - registration_data is preserved by only updating specific fields
        await updateRegistrationPaymentStatus(
          registration.id,
          'confirmed',
          'paid',
          paymentIntentId || undefined
        )

        let qrCodeDataUrl = registration.qr_code

        if (!qrCodeDataUrl) {
          qrCodeDataUrl = await generateQRCode(registration.id)

          if (qrCodeDataUrl) {
            await updateRegistrationQRCode(registration.id, qrCodeDataUrl)
          } else {
            console.error('Failed to generate QR code for registration:', registration.id)
          }
        }

        const { data: registrationDetails } =
          await getRegistrationByStripeSessionWithDetails(session.id)

        if (registrationDetails) {
          const ticketCode = generateTicketCode(registrationDetails.id)
          const eventTitle = registrationDetails.event?.title || 'Evento'
          const eventDate = formatDateTimeLong(registrationDetails.event?.start_date || '')
          const eventLocation = extractLocationString(registrationDetails.event?.location)
          const categoryName = registrationDetails.category?.name || 'Categoria'
          const recipientEmail = registrationDetails.user?.email || session.customer_email || ''

          if (recipientEmail) {
            // Extract partner data from registration_data for email
            const partnerData = registrationDetails.registration_data?.partner
              ? {
                  name: registrationDetails.registration_data.partner.name,
                  email: registrationDetails.registration_data.partner.email,
                  cpf: registrationDetails.registration_data.partner.cpf,
                  phone: registrationDetails.registration_data.partner.phone,
                  shirtSize: registrationDetails.registration_data.partner.shirtSize,
                }
              : undefined

            await sendConfirmationEmail({
              userEmail: recipientEmail,
              userName: registrationDetails.user?.full_name || session.customer_details?.name || '',
              eventTitle,
              eventDate,
              eventLocation,
              categoryName,
              qrCodeDataUrl: qrCodeDataUrl || '',
              ticketCode,
              registrationId: registrationDetails.id,
              qrMissingNote: qrCodeDataUrl ? null : 'QR Code temporariamente indisponível. Entre em contato com o suporte.',
              partnerData,
            })
          } else {
            console.warn('No email available to send confirmation for registration', registrationDetails.id)
          }
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session expired:', session.id)

        const { data: registration } = await getRegistrationByStripeSession(session.id)

        if (registration) {
          await updateRegistrationPaymentStatus(registration.id, 'cancelled', 'failed')
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('PaymentIntent succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('PaymentIntent failed:', paymentIntent.id)

        const { data: registration } = await getRegistrationByPaymentIntent(paymentIntent.id)

        if (registration) {
          await updateRegistrationPaymentStatus(registration.id, 'pending', 'failed', paymentIntent.id)
        } else if (paymentIntent.metadata?.registrationId) {
          await updateRegistrationPaymentStatus(
            paymentIntent.metadata.registrationId,
            'pending',
            'failed',
            paymentIntent.id
          )
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log(`Subscription ${event.type}:`, subscription.id)
        // TODO: Handle subscription events (future feature)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error processing webhook:', errorMessage)
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 400 }
    )
  }
}
