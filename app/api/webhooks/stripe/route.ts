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
import {
  getPhotoOrderByStripeSession,
  getPhotoOrderByStripeSessionWithDetails,
  updatePhotoOrderPaymentStatus,
} from '@/lib/data/photo-orders'
import { generateQRCode } from '@/lib/qrcode/generate'
import { sendConfirmationEmail } from '@/lib/email/send-confirmation'
import { sendPhotoOrderConfirmationEmail } from '@/lib/email/send-photo-order-confirmation'
import { markContactAsEventParticipant } from '@/lib/email/contacts'
import { formatDateTimeLong, extractLocationString } from '@/lib/utils'
import { APP_URL } from '@/lib/email/templates/base-layout'

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

        const checkoutType = session.metadata?.type || 'registration'

        if (checkoutType === 'photo_order') {
          // Handle photo order payment
          const { data: order } = await getPhotoOrderByStripeSession(session.id)

          if (!order) {
            console.error('Photo order not found for session:', session.id)
            break
          }

          if (order.payment_status === 'paid') {
            console.log('Photo order already confirmed:', order.id)
            break
          }

          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id

          await updatePhotoOrderPaymentStatus(
            order.id,
            'confirmed',
            'paid',
            paymentIntentId || undefined
          )

          const { data: orderDetails } = await getPhotoOrderByStripeSessionWithDetails(session.id)

          if (!orderDetails) {
            console.error('Photo order details not found for session:', session.id)
            break
          }

          const userEmail = orderDetails.user?.email || session.customer_email || ''
          const userName = orderDetails.user?.full_name || session.customer_details?.name || 'Cliente'
          const eventTitle = orderDetails.event?.title || 'Evento'

          // Safe date/location handling with fallbacks for missing data
          const eventDate =
            orderDetails.event?.start_date
              ? formatDateTimeLong(orderDetails.event.start_date)
              : 'Data a definir'
          const eventLocation =
            orderDetails.event?.location
              ? extractLocationString(orderDetails.event.location)
              : 'Local a definir'

          const downloadUrl = `${APP_URL}/fotos/download/${orderDetails.id}`

          // Generate thumbnail URLs for email with env var guard
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          let photos: Array<{ id: string; file_name: string; thumbnailUrl: string }> = []

          if (!supabaseUrl) {
            console.warn(
              'NEXT_PUBLIC_SUPABASE_URL is not configured. Photo thumbnails will not be included in email for order:',
              orderDetails.id
            )
          } else {
            photos = (orderDetails.items || [])
              .filter((item) => item.photo)
              .map((item) => ({
                id: item.photo!.id,
                file_name: item.photo!.file_name,
                thumbnailUrl: `${supabaseUrl}/storage/v1/object/public/event-photos-watermarked/${item.photo!.thumbnail_path}`,
              }))
          }

          if (userEmail) {
            await sendPhotoOrderConfirmationEmail({
              userEmail,
              userName,
              eventTitle,
              eventDate,
              eventLocation,
              orderId: orderDetails.id,
              packageName: orderDetails.package?.name || null,
              photoCount: orderDetails.items?.length || 0,
              totalAmount: Number(orderDetails.total_amount),
              downloadUrl,
              photos,
            })

            console.log('Photo order confirmation email sent for order:', orderDetails.id)
          } else {
            console.warn('No email available to send confirmation for photo order', orderDetails.id)
          }
        } else {
          // Handle registration payment (existing logic)
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

          const { data: registrationDetails } =
            await getRegistrationByStripeSessionWithDetails(session.id)

          // Generate ticket code with event slug for better identification
          const eventSlug = registrationDetails?.event?.slug || 'EVENT'
          const ticketCode = `${eventSlug.toUpperCase()}-${registration.id.slice(0, 8).toUpperCase()}`

          let qrCodeDataUrl = registration.qr_code

          if (!qrCodeDataUrl) {
            qrCodeDataUrl = await generateQRCode(ticketCode)

            if (qrCodeDataUrl) {
              await updateRegistrationQRCode(registration.id, qrCodeDataUrl, ticketCode)
            } else {
              console.error('Failed to generate QR code for registration:', registration.id)
            }
          } else if (!registration.ticket_code) {
            // QR code exists but ticket_code doesn't - update only ticket_code
            await updateRegistrationQRCode(registration.id, qrCodeDataUrl, ticketCode)
          }

          if (registrationDetails) {
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

              // Update Resend contact as event participant (non-blocking)
              markContactAsEventParticipant(recipientEmail).catch((err) => {
                console.error('Failed to update Resend contact:', err)
              })
            } else {
              console.warn('No email available to send confirmation for registration', registrationDetails.id)
            }
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
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Subscription ${event.type}:`, subscription.id)

        // Extract user_id from metadata
        const userId = subscription.metadata?.userId
        if (!userId) {
          console.error('Missing userId in subscription metadata:', subscription.id)
          break
        }

        const { upsertSubscription } = await import('@/lib/data/subscriptions')
        type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'incomplete_expired' | 'paused'

        await upsertSubscription(
          userId,
          subscription.id,
          subscription.customer as string,
          subscription.status as SubscriptionStatus,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.cancel_at_period_end,
          subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          subscription.metadata
        )

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', subscription.id)

        const { upsertSubscription } = await import('@/lib/data/subscriptions')

        // Get existing subscription to retrieve user_id if not in metadata
        const { getSubscriptionByStripeId } = await import('@/lib/data/subscriptions')
        const { data: existingSub } = await getSubscriptionByStripeId(subscription.id)

        const userId = subscription.metadata?.userId || existingSub?.user_id
        if (!userId) {
          console.error('Cannot determine userId for deleted subscription:', subscription.id)
          break
        }

        await upsertSubscription(
          userId,
          subscription.id,
          subscription.customer as string,
          'canceled',
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          true,
          new Date(),
          subscription.metadata
        )

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)

        // Update subscription status if this is a subscription invoice
        if (invoice.subscription) {
          const { getSubscriptionByStripeId, upsertSubscription } = await import('@/lib/data/subscriptions')
          const { data: existingSub } = await getSubscriptionByStripeId(invoice.subscription as string)

          if (existingSub && existingSub.status !== 'active') {
            // Reactivate subscription after successful payment
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
            await upsertSubscription(
              existingSub.user_id,
              stripeSubscription.id,
              stripeSubscription.customer as string,
              'active',
              new Date(stripeSubscription.current_period_start * 1000),
              new Date(stripeSubscription.current_period_end * 1000),
              stripeSubscription.cancel_at_period_end,
              stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
              stripeSubscription.metadata
            )
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)

        // Update subscription status to past_due
        if (invoice.subscription) {
          const { getSubscriptionByStripeId, upsertSubscription } = await import('@/lib/data/subscriptions')
          const { data: existingSub } = await getSubscriptionByStripeId(invoice.subscription as string)

          if (existingSub) {
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
            await upsertSubscription(
              existingSub.user_id,
              stripeSubscription.id,
              stripeSubscription.customer as string,
              'past_due',
              new Date(stripeSubscription.current_period_start * 1000),
              new Date(stripeSubscription.current_period_end * 1000),
              stripeSubscription.cancel_at_period_end,
              stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
              stripeSubscription.metadata
            )
          }
        }

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
