/**
 * Mercado Pago Checkout Pro — Preference Creation
 * Equivalent to Stripe checkout session creation
 *
 * Two main functions:
 * - createEventRegistrationPreference() → replaces stripe.checkout.sessions.create() for registrations
 * - createPhotoOrderPreference() → replaces stripe.checkout.sessions.create() for photo orders
 *
 * Key differences from Stripe:
 * - unit_price is in BRL (reais), NOT centavos (no ×100)
 * - Uses back_urls instead of success_url/cancel_url
 * - auto_return: 'approved' redirects automatically after payment
 * - external_reference is used to link back to our DB records
 * - Returns init_point (checkout URL) instead of session.url
 */
import { Preference } from 'mercadopago'
import { mpClient } from './client'
import { getEnv } from '@/lib/env'

const env = getEnv()
const baseUrl = env.app.baseUrl

// Mercado Pago requires publicly accessible URLs for notification_url.
// In local development (localhost), we omit it — webhooks must be tested
// via ngrok/cloudflared tunnel or MP developer tools.
const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')

// ============================================================
// Types
// ============================================================

export interface EventRegistrationPreferenceParams {
    registrationId: string
    eventTitle: string
    categoryName: string
    description: string
    totalAmount: number // in BRL (reais), NOT centavos
    payerEmail: string
    eventId: string
    categoryId: string
    userId: string
    cancelUrlParams: string
}

export interface PhotoOrderPreferenceParams {
    orderId: string
    eventTitle: string
    photoCount: number
    totalAmount: number // in BRL (reais), NOT centavos
    payerEmail: string
    eventId: string
    userId: string
}

export interface PreferenceResult {
    id: string
    initPoint: string // URL to redirect user to MP Checkout
}

// ============================================================
// Event Registration Preference
// ============================================================

/**
 * Creates a Mercado Pago Preference for event registration checkout.
 *
 * Replaces: stripe.checkout.sessions.create() in app/api/checkout/create-session/route.ts
 *
 * The preference defines:
 * - Items (event name, category, price)
 * - Payer info (email)
 * - Redirect URLs (success, failure, pending)
 * - Webhook notification URL
 * - Metadata linking back to our registration record
 */
export async function createEventRegistrationPreference(
    params: EventRegistrationPreferenceParams
): Promise<PreferenceResult> {
    const preference = new Preference(mpClient)

    const preferenceBody = {
        items: [
            {
                id: params.registrationId,
                title: `${params.eventTitle} - ${params.categoryName}`,
                description: params.description,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: params.totalAmount,
            },
        ],
        payer: {
            email: params.payerEmail,
        },
        ...(isLocalhost
            ? {}
            : {
                back_urls: {
                    success: `${baseUrl}/confirmacao`,
                    failure: `${baseUrl}/inscricao?${params.cancelUrlParams}`,
                    pending: `${baseUrl}/confirmacao?status=pending`,
                },
                auto_return: 'approved' as const,
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
            }),
        external_reference: params.registrationId,
        metadata: {
            type: 'registration',
            registration_id: params.registrationId,
            event_id: params.eventId,
            category_id: params.categoryId,
            user_id: params.userId,
        },
        statement_descriptor: 'SYMPLEPASS',
    }

    console.log('[MercadoPago] Creating preference with body:', JSON.stringify(preferenceBody, null, 2))

    try {
        const result = await preference.create({ body: preferenceBody })

        if (!result.id || !result.init_point) {
            throw new Error('Mercado Pago preference creation failed: missing id or init_point')
        }

        return {
            id: result.id,
            initPoint: result.init_point,
        }
    } catch (error: any) {
        console.error('[MercadoPago] Preference creation error:', {
            message: error?.message,
            cause: error?.cause,
            status: error?.status,
            response: error?.response,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        })
        throw error
    }
}

// ============================================================
// Photo Order Preference
// ============================================================

/**
 * Creates a Mercado Pago Preference for photo order checkout.
 *
 * Replaces: stripe.checkout.sessions.create() in app/api/photos/checkout/create-session/route.ts
 */
export async function createPhotoOrderPreference(
    params: PhotoOrderPreferenceParams
): Promise<PreferenceResult> {
    const preference = new Preference(mpClient)

    const result = await preference.create({
        body: {
            items: [
                {
                    id: params.orderId,
                    title: `Fotos - ${params.eventTitle}`,
                    description: `${params.photoCount} foto(s) do evento`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: params.totalAmount, // BRL, NOT centavos
                },
            ],
            payer: {
                email: params.payerEmail,
            },
            // MP rejects localhost URLs — omit on development
            ...(isLocalhost
                ? {}
                : {
                    back_urls: {
                        success: `${baseUrl}/fotos/download/${params.orderId}`,
                        failure: `${baseUrl}/fotos`,
                        pending: `${baseUrl}/fotos/download/${params.orderId}?status=pending`,
                    },
                    auto_return: 'approved' as const,
                    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                }),
            external_reference: params.orderId,
            metadata: {
                type: 'photo_order',
                order_id: params.orderId,
                event_id: params.eventId,
                user_id: params.userId,
            },
            statement_descriptor: 'SYMPLEPASS',
        },
    })

    if (!result.id || !result.init_point) {
        throw new Error('Mercado Pago preference creation failed: missing id or init_point')
    }

    return {
        id: result.id,
        initPoint: result.init_point,
    }
}
