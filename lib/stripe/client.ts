import { createHash } from 'crypto'
import Stripe from 'stripe'
import { getEnv } from '@/lib/env'

const env = getEnv()

if (!env.stripe.secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripeMode = env.stripe.secretKey.startsWith('sk_live_') ? 'live' : 'test'
const stripeKeyFingerprint = createHash('sha256').update(env.stripe.secretKey).digest('hex').slice(0, 12)

console.log(`[Stripe] Initialized client (mode=${stripeMode}, key_fingerprint=${stripeKeyFingerprint})`)

// Uses the Stripe API version configured in your Stripe Dashboard
// (Dashboard > Developers > API keys > API version)
// This ensures consistency across environments without hardcoding versions
export const stripe = new Stripe(env.stripe.secretKey, {
  typescript: true,
})
