import { NextRequest, NextResponse } from 'next/server'
import { Payment } from 'mercadopago'
import { mpClient } from '@/lib/mercadopago/client'
import {
    getRegistrationByMpPreference,
    getRegistrationByIdWithDetails,
    updateRegistrationMpPaymentStatus,
    updateRegistrationQRCode,
} from '@/lib/data/registrations'
import {
    getPhotoOrderByMpPreference,
    getPhotoOrderByIdWithDetails,
    updatePhotoOrderMpPaymentStatus,
} from '@/lib/data/photo-orders'
import { generateQRCode } from '@/lib/qrcode/generate'
import { sendConfirmationEmail } from '@/lib/email/send-confirmation'
import { sendPhotoOrderConfirmationEmail } from '@/lib/email/send-photo-order-confirmation'
import { markContactAsEventParticipant } from '@/lib/email/contacts'
import { formatDateTimeLong, extractLocationString } from '@/lib/utils'
import { APP_URL } from '@/lib/email/templates/base-layout'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mercado Pago Webhook Handler
 *
 * MP sends a POST with:
 *   { action: "payment.created" | "payment.updated", data: { id: "<payment_id>" }, type: "payment" }
 *
 * We then:
 * 1. Fetch the full payment from the Payments API
 * 2. Use metadata.type to determine if it's a registration or photo_order
 * 3. Look up the record by external_reference (our registration/order ID)
 * 4. Update payment status + send confirmation email
 *
 * Note: MP may send the webhook more than once — handlers are idempotent.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // MP webhook notification format
        const { type, data, action } = body as {
            type?: string
            data?: { id?: string }
            action?: string
        }

        console.log(`[MP Webhook] Received: type=${type}, action=${action}, data.id=${data?.id}`)

        // Only process payment notifications
        if (type !== 'payment' || !data?.id) {
            // MP also sends "test" notifications and other types — acknowledge them
            return NextResponse.json({ received: true })
        }

        // Fetch full payment details from MP API
        const paymentApi = new Payment(mpClient)
        const payment = await paymentApi.get({ id: data.id })

        if (!payment || !payment.id) {
            console.error('[MP Webhook] Could not fetch payment:', data.id)
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        const mpPaymentId = payment.id
        const mpStatus = payment.status // 'approved', 'pending', 'rejected', 'refunded', etc.
        const externalReference = payment.external_reference // our registration/order ID
        const preferenceId = payment.metadata?.preference_id as string | undefined
        const recordType = (payment.metadata?.type as string) || 'registration'

        console.log(`[MP Webhook] Payment ${mpPaymentId}: status=${mpStatus}, type=${recordType}, ref=${externalReference}`)

        if (recordType === 'photo_order') {
            await handlePhotoOrderPayment(mpPaymentId, mpStatus!, externalReference!, preferenceId)
        } else {
            await handleRegistrationPayment(mpPaymentId, mpStatus!, externalReference!, preferenceId)
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('[MP Webhook] Error processing webhook:', errorMessage)
        return NextResponse.json(
            { error: `Webhook handler failed: ${errorMessage}` },
            { status: 400 }
        )
    }
}

// ============================================================
// Registration Payment Handler
// ============================================================

async function handleRegistrationPayment(
    mpPaymentId: number,
    mpStatus: string,
    externalReference: string,
    preferenceId?: string
) {
    // Look up registration by external_reference (registration ID) or by preference
    const { data: registration } = preferenceId
        ? await getRegistrationByMpPreference(preferenceId)
        : { data: null }

    const registrationId = registration?.id || externalReference

    if (!registrationId) {
        console.error('[MP Webhook] No registration found for payment:', mpPaymentId)
        return
    }

    // Map MP status to our system
    switch (mpStatus) {
        case 'approved': {
            // Check idempotency — don't re-process if already paid
            if (registration?.payment_status === 'paid') {
                console.log('[MP Webhook] Registration already confirmed:', registrationId)
                return
            }

            await updateRegistrationMpPaymentStatus(
                registrationId,
                'confirmed',
                'paid',
                mpPaymentId
            )

            // Fetch full details for email
            const adminClient = createAdminClient()
            const { data: registrationDetails } = await getRegistrationByIdWithDetails(registrationId, adminClient)

            if (registrationDetails) {
                // Generate ticket code
                const eventSlug = registrationDetails.event?.slug || 'EVENT'
                const ticketCode = `${eventSlug.toUpperCase()}-${registrationId.slice(0, 8).toUpperCase()}`

                let qrCodeDataUrl = registrationDetails.qr_code

                if (!qrCodeDataUrl) {
                    qrCodeDataUrl = await generateQRCode(ticketCode)
                    if (qrCodeDataUrl) {
                        await updateRegistrationQRCode(registrationId, qrCodeDataUrl, ticketCode)
                    } else {
                        console.error('[MP Webhook] Failed to generate QR code:', registrationId)
                    }
                } else if (!registrationDetails.ticket_code) {
                    await updateRegistrationQRCode(registrationId, qrCodeDataUrl, ticketCode)
                }

                const eventTitle = registrationDetails.event?.title || 'Evento'
                const eventDate = formatDateTimeLong(registrationDetails.event?.start_date || '')
                const eventLocation = extractLocationString(registrationDetails.event?.location)
                const categoryName = registrationDetails.category?.name || 'Categoria'
                const recipientEmail = registrationDetails.user?.email || ''

                if (recipientEmail) {
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
                        userName: registrationDetails.user?.full_name || '',
                        eventTitle,
                        eventDate,
                        eventLocation,
                        categoryName,
                        qrCodeDataUrl: qrCodeDataUrl || '',
                        ticketCode,
                        registrationId: registrationDetails.id,
                        qrMissingNote: qrCodeDataUrl
                            ? null
                            : 'QR Code temporariamente indisponível. Entre em contato com o suporte.',
                        partnerData,
                    })

                    markContactAsEventParticipant(recipientEmail).catch((err) => {
                        console.error('[MP Webhook] Failed to update Resend contact:', err)
                    })

                    console.log('[MP Webhook] Confirmation email sent for registration:', registrationId)
                }
            }

            break
        }

        case 'rejected':
        case 'cancelled': {
            await updateRegistrationMpPaymentStatus(
                registrationId,
                'pending',
                'failed',
                mpPaymentId
            )
            console.log(`[MP Webhook] Registration payment ${mpStatus}:`, registrationId)
            break
        }

        case 'refunded': {
            await updateRegistrationMpPaymentStatus(
                registrationId,
                'cancelled',
                'refunded' as any,
                mpPaymentId
            )
            console.log('[MP Webhook] Registration refunded:', registrationId)
            break
        }

        case 'pending':
        case 'in_process': {
            console.log(`[MP Webhook] Registration payment ${mpStatus} (waiting):`, registrationId)
            break
        }

        default:
            console.log(`[MP Webhook] Unhandled payment status: ${mpStatus}`)
    }
}

// ============================================================
// Photo Order Payment Handler
// ============================================================

async function handlePhotoOrderPayment(
    mpPaymentId: number,
    mpStatus: string,
    externalReference: string,
    preferenceId?: string
) {
    const { data: order } = preferenceId
        ? await getPhotoOrderByMpPreference(preferenceId)
        : { data: null }

    const orderId = order?.id || externalReference

    if (!orderId) {
        console.error('[MP Webhook] No photo order found for payment:', mpPaymentId)
        return
    }

    switch (mpStatus) {
        case 'approved': {
            if (order?.payment_status === 'paid') {
                console.log('[MP Webhook] Photo order already confirmed:', orderId)
                return
            }

            await updatePhotoOrderMpPaymentStatus(
                orderId,
                'confirmed',
                'paid',
                mpPaymentId
            )

            // Fetch full details for email
            const adminClient = createAdminClient()
            const { data: orderDetails } = await getPhotoOrderByIdWithDetails(orderId, adminClient)

            if (orderDetails) {
                const userEmail = orderDetails.user?.email || ''
                const userName = orderDetails.user?.full_name || 'Cliente'
                const eventTitle = orderDetails.event?.title || 'Evento'

                const eventDate = orderDetails.event?.start_date
                    ? formatDateTimeLong(orderDetails.event.start_date)
                    : 'Data a definir'
                const eventLocation = orderDetails.event?.location
                    ? extractLocationString(orderDetails.event.location)
                    : 'Local a definir'

                const downloadUrl = `${APP_URL}/fotos/download/${orderDetails.id}`

                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                let photos: Array<{ id: string; file_name: string; thumbnailUrl: string }> = []

                if (supabaseUrl) {
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
                    console.log('[MP Webhook] Photo order confirmation email sent:', orderId)
                }
            }

            break
        }

        case 'rejected':
        case 'cancelled': {
            await updatePhotoOrderMpPaymentStatus(
                orderId,
                'cancelled',
                'failed',
                mpPaymentId
            )
            console.log(`[MP Webhook] Photo order payment ${mpStatus}:`, orderId)
            break
        }

        case 'refunded': {
            await updatePhotoOrderMpPaymentStatus(
                orderId,
                'cancelled',
                'refunded',
                mpPaymentId
            )
            console.log('[MP Webhook] Photo order refunded:', orderId)
            break
        }

        case 'pending':
        case 'in_process': {
            console.log(`[MP Webhook] Photo order payment ${mpStatus} (waiting):`, orderId)
            break
        }

        default:
            console.log(`[MP Webhook] Unhandled photo order payment status: ${mpStatus}`)
    }
}
