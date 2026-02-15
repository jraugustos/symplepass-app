/**
 * Mercado Pago Client Configuration
 * Initializes the MercadoPago SDK for Checkout Pro integration
 * Used for event registration and photo order payments
 */
import { MercadoPagoConfig } from 'mercadopago'
import { getEnv } from '@/lib/env'

const env = getEnv()

export const mpClient = new MercadoPagoConfig({
    accessToken: env.mercadopago.accessToken,
})
