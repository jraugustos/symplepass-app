/**
 * Script to create the Stripe product and price for the Club Benefits subscription.
 * Run this once during initial setup to create the product in Stripe.
 *
 * Usage: npm run stripe:setup-club
 */

import 'dotenv/config'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is not set.')
  console.error('Please set it in your .env.local file.')
  process.exit(1)
}

const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
})

async function createClubProduct() {
  console.log('Creating Stripe product and price for Club Benefits...\n')

  try {
    // Create the product
    const product = await stripe.products.create({
      name: 'Clube de Benefícios Symplepass',
      description: 'Assinatura mensal com descontos exclusivos em eventos',
      metadata: {
        type: 'club_membership',
      },
    })

    console.log('Product created:')
    console.log(`  Name: ${product.name}`)
    console.log(`  ID: ${product.id}`)

    // Create the price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 1500, // R$ 15,00 in centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'club_membership',
      },
    })

    console.log('\nPrice created:')
    console.log(`  Amount: R$ ${(price.unit_amount! / 100).toFixed(2)}`)
    console.log(`  Interval: ${price.recurring?.interval}`)
    console.log(`  ID: ${price.id}`)

    console.log('\n✅ Product and price created successfully!')
    console.log('\n📝 Add this to your .env.local:')
    console.log(`STRIPE_CLUB_PRICE_ID=${price.id}`)

    return { product, price }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('\nStripe API Error:', error.message)
    } else {
      console.error('\nUnexpected error:', error)
    }
    process.exit(1)
  }
}

createClubProduct()
