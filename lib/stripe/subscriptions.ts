import { stripe } from './client'
import Stripe from 'stripe'

/**
 * Creates a Stripe product and price for the Club Benefits subscription.
 * This should be run once during initial setup.
 */
export async function createClubProduct(): Promise<{
  product: Stripe.Product
  price: Stripe.Price
}> {
  const product = await stripe.products.create({
    name: 'Clube de Benefícios Symplepass',
    description: 'Assinatura mensal com descontos exclusivos em eventos',
    metadata: {
      type: 'club_membership',
    },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1500, // R$ 15,00 em centavos
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
    metadata: {
      type: 'club_membership',
    },
  })

  return { product, price }
}

/**
 * Creates a Stripe Checkout session for subscription purchase.
 * Returns a session that redirects the user to Stripe's hosted checkout page.
 */
export async function createSubscriptionCheckoutSession(
  customerId: string | null,
  customerEmail: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
        type: 'club_membership',
      },
    },
    metadata: {
      userId,
      type: 'club_membership',
    },
  }

  // If customer already exists, use their ID; otherwise, set email for new customer
  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_email = customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session
}

/**
 * Creates a Stripe Customer Portal session for subscription management.
 * Allows users to update payment methods, view invoices, and cancel subscriptions.
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return portalSession
}

/**
 * Cancels a subscription in Stripe.
 * By default, cancels at the end of the current billing period.
 * Set cancelAtPeriodEnd to false for immediate cancellation.
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    // Mark subscription to cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return subscription
  }

  // Cancel immediately
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

/**
 * Reactivates a subscription that was marked for cancellation.
 * Only works if the subscription hasn't been fully canceled yet.
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  return subscription
}

/**
 * Retrieves a subscription from Stripe by its ID.
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Finds an existing Stripe customer by email.
 * Returns null if no customer is found.
 */
export async function findCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  return customers.data.length > 0 ? customers.data[0] : null
}
