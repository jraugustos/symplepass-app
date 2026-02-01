
import { getResendClient } from '@/lib/email/client'
import { generateEventApprovedHtml } from '@/lib/email/templates/event-approved'
import { generateEventRejectedHtml } from '@/lib/email/templates/event-rejected'
import { generateAdminNewEventHtml } from '@/lib/email/templates/admin-new-event'

interface SendEventApprovedEmailParams {
    organizerEmail: string
    organizerName: string
    eventTitle: string
    eventSlug: string
    startDate: string
    serviceFee: number
}

interface SendEventRejectedEmailParams {
    organizerEmail: string
    organizerName: string
    eventTitle: string
    eventId: string
    rejectionReason: string
    submittedAt: string
}

export async function sendEventApprovedEmail(data: SendEventApprovedEmailParams) {
    const resend = getResendClient()

    if (!resend) {
        console.warn('Resend client unavailable. Skipping event approved email for', data.eventSlug)
        return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    try {
        const html = generateEventApprovedHtml({
            organizerName: data.organizerName,
            eventTitle: data.eventTitle,
            eventSlug: data.eventSlug,
            startDate: data.startDate,
            serviceFee: data.serviceFee,
        })

        const response = await resend.emails.send({
            from: 'Symplepass <noreply@hello.symplepass.com.br>', // Using default sender
            to: data.organizerEmail,
            subject: `Evento Aprovado: ${data.eventTitle} 🎉`,
            html,
        })

        if (response.error) {
            console.error('Failed to send event approved email:', response.error)
            return { success: false, error: response.error.message }
        }

        return { success: true, data: response.data }
    } catch (error) {
        console.error('Unexpected error sending event approved email:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

export async function sendEventRejectedEmail(data: SendEventRejectedEmailParams) {
    const resend = getResendClient()

    if (!resend) {
        console.warn('Resend client unavailable. Skipping event rejected email for', data.eventId)
        return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    try {
        const html = generateEventRejectedHtml({
            organizerName: data.organizerName,
            eventTitle: data.eventTitle,
            eventId: data.eventId,
            rejectionReason: data.rejectionReason,
            submittedAt: data.submittedAt,
        })

        const response = await resend.emails.send({
            from: 'Symplepass <noreply@hello.symplepass.com.br>',
            to: data.organizerEmail,
            subject: `Atenção: Atualização sobre o evento ${data.eventTitle}`,
            html,
        })

        if (response.error) {
            console.error('Failed to send event rejected email:', response.error)
            return { success: false, error: response.error.message }
        }

        return { success: true, data: response.data }
    } catch (error) {
        console.error('Unexpected error sending event rejected email:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

interface SendAdminNewEventEmailParams {
    adminEmails: string[]
    eventName: string
    organizerName: string
    submittedAt: string
}

export async function sendAdminNewEventEmail(data: SendAdminNewEventEmailParams) {
    const resend = getResendClient()

    if (!resend) {
        console.warn('Resend client unavailable. Skipping admin alert email')
        return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    if (data.adminEmails.length === 0) {
        return { success: false, error: 'No admin emails provided' }
    }

    try {
        const html = generateAdminNewEventHtml({
            eventName: data.eventName,
            organizerName: data.organizerName,
            submittedAt: data.submittedAt,
        })

        const response = await resend.emails.send({
            from: 'Symplepass <noreply@hello.symplepass.com.br>',
            to: data.adminEmails,
            subject: `Novo Evento Pendente: ${data.eventName}`,
            html,
        })

        if (response.error) {
            console.error('Failed to send admin alert email:', response.error)
            return { success: false, error: response.error.message }
        }

        return { success: true, data: response.data }
    } catch (error) {
        console.error('Unexpected error sending admin alert email:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
