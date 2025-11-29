import Stripe from 'stripe'
import { getEnv } from '@/lib/env'

const env = getEnv()

if (!env.stripe.secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

// Uses the Stripe API version configured in your Stripe Dashboard
// (Dashboard > Developers > API keys > API version)
// This ensures consistency across environments without hardcoding versions
export const stripe = new Stripe(env.stripe.secretKey, {
  typescript: true,
})
