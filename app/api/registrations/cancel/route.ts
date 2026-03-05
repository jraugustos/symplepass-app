import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * POST /api/registrations/cancel
 *
 * Allows users to cancel their own pending registrations.
 * This frees up the slot so they can register again.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { registrationId } = body as { registrationId?: string }

        if (!registrationId) {
            return NextResponse.json(
                { error: 'ID da inscrição é obrigatório.' },
                { status: 400 }
            )
        }

        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Você precisa estar autenticado.' },
                { status: 401 }
            )
        }

        // Fetch registration using admin client to bypass RLS
        const adminSupabase = createAdminClient()
        const { data: regData, error: regError } = await adminSupabase
            .from('registrations')
            .select('id, user_id, status, payment_status')
            .eq('id', registrationId)
            .single()

        const registration = regData as {
            id: string
            user_id: string
            status: string
            payment_status: string
        } | null

        if (regError || !registration) {
            return NextResponse.json(
                { error: 'Inscrição não encontrada.' },
                { status: 404 }
            )
        }

        // Verify ownership
        if (registration.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Você não tem permissão para cancelar esta inscrição.' },
                { status: 403 }
            )
        }

        // Only pending registrations can be cancelled by the user
        if (registration.status !== 'pending') {
            return NextResponse.json(
                { error: 'Apenas inscrições pendentes podem ser canceladas.' },
                { status: 400 }
            )
        }

        // If payment was already made, don't allow cancellation
        if (registration.payment_status === 'paid') {
            return NextResponse.json(
                { error: 'Inscrições com pagamento confirmado não podem ser canceladas pelo usuário.' },
                { status: 400 }
            )
        }

        // Cancel the registration
        const { error: updateError } = await (adminSupabase
            .from('registrations') as any)
            .update({
                status: 'cancelled',
                payment_status: 'failed',
            })
            .eq('id', registrationId)

        if (updateError) {
            console.error('[Cancel Registration] Error cancelling:', updateError)
            return NextResponse.json(
                { error: 'Erro ao cancelar inscrição. Tente novamente.' },
                { status: 500 }
            )
        }

        console.log(`[Cancel Registration] Registration ${registrationId} cancelled by user ${user.id}`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Cancel Registration] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Erro ao cancelar inscrição. Tente novamente.' },
            { status: 500 }
        )
    }
}
