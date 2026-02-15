import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'

// NOTE: Registration and photo order payments have been migrated to Mercado Pago.
// This webhook now only handles Stripe Subscriptions (Benefits Club).
// See app/api/webhooks/mercadopago/route.ts for payment webhooks.

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

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      // ─── Subscriptions (Benefits Club) ────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Subscription ${event.type}:`, subscription.id)

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

      // ─── Invoices (Subscription billing) ──────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)

        if (invoice.subscription) {
          const { getSubscriptionByStripeId, upsertSubscription } = await import('@/lib/data/subscriptions')
          const { data: existingSub } = await getSubscriptionByStripeId(invoice.subscription as string)

          if (existingSub && existingSub.status !== 'active') {
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
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe Webhook] Error processing webhook:', errorMessage)
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 400 }
    )
  }
}
