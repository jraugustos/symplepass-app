'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/actions'
import {
    approveEvent,
    rejectEvent,
    getPendingApprovalEvents,
    getPendingApprovalCount,
} from '@/lib/data/admin-events'
import { sendEventApprovedEmail, sendEventRejectedEmail } from '@/lib/email/send-event-status'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDateShort } from '@/lib/utils'

/**
 * Approve an event and set service fee
 */
export async function approveEventAction(
    eventId: string,
    serviceFee: number,
    notes?: string
) {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { error: 'Você não tem permissão para aprovar eventos' }
    }

    const approvalResult = await approveEvent(eventId, serviceFee, result.profile.id, notes)

    if (approvalResult.error) {
        return { error: approvalResult.error }
    }

    revalidatePath('/admin/aprovacoes')
    revalidatePath('/admin/eventos')

    // Send email notification to organizer
    try {
        const event = approvalResult.data as any
        if (event && event.organizer_id) {
            const supabase = createAdminClient()
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', event.organizer_id)
                .single()

            // Cast profile to any to access properties safely
            const organizerProfile = profile as any

            if (organizerProfile && organizerProfile.email) {
                await sendEventApprovedEmail({
                    organizerEmail: organizerProfile.email,
                    organizerName: organizerProfile.full_name || 'Organizador',
                    eventTitle: event.title,
                    eventSlug: event.slug,
                    startDate: formatDateShort(event.start_date),
                    serviceFee: serviceFee,
                })
            }
        }
    } catch (error) {
        console.error('Failed to send approval email:', error)
        // Don't fail the action if email fails
    }

    return { success: true, event: approvalResult.data }
}

/**
 * Reject an event with reason
 */
export async function rejectEventAction(
    eventId: string,
    reason: string
) {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { error: 'Você não tem permissão para rejeitar eventos' }
    }

    if (!reason.trim()) {
        return { error: 'Por favor, informe o motivo da rejeição' }
    }

    const rejectResult = await rejectEvent(eventId, result.profile.id, reason)

    if (rejectResult.error) {
        return { error: rejectResult.error }
    }

    revalidatePath('/admin/aprovacoes')
    revalidatePath('/admin/eventos')

    revalidatePath('/admin/aprovacoes')
    revalidatePath('/admin/eventos')

    // Send email notification to organizer
    try {
        const event = rejectResult.data as any
        if (event && event.organizer_id) {
            const supabase = createAdminClient()
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', event.organizer_id)
                .single()

            // Cast profile to any to access properties safely
            const organizerProfile = profile as any

            if (organizerProfile && organizerProfile.email) {
                await sendEventRejectedEmail({
                    organizerEmail: organizerProfile.email,
                    organizerName: organizerProfile.full_name || 'Organizador',
                    eventTitle: event.title,
                    eventId: event.id,
                    rejectionReason: reason,
                    submittedAt: formatDateShort(event.created_at),
                })
            }
        }
    } catch (error) {
        console.error('Failed to send rejection email:', error)
        // Don't fail the action if email fails
    }

    return { success: true, event: rejectResult.data }
}

/**
 * Get events pending approval
 */
export async function getPendingEventsAction() {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return { data: [], error: 'Você não tem permissão para ver eventos pendentes' }
    }

    return await getPendingApprovalEvents()
}

/**
 * Get count of events pending approval
 */
export async function getPendingCountAction() {
    const result = await getCurrentUser()

    if (!result?.profile || result.profile.role !== 'admin') {
        return 0
    }

    return await getPendingApprovalCount()
}
