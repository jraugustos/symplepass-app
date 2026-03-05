import { NextRequest, NextResponse } from 'next/server'
import { Preference } from 'mercadopago'
import { mpClient } from '@/lib/mercadopago/client'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/registrations/payment-url?registrationId=xxx
 *
 * Recovers the Mercado Pago checkout URL (init_point) for a pending registration.
 * The user must be authenticated and own the registration.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const registrationId = searchParams.get('registrationId')

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
            .select('id, user_id, status, payment_status, mp_preference_id, event_id')
            .eq('id', registrationId)
            .single()

        const registration = regData as {
            id: string
            user_id: string
            status: string
            payment_status: string
            mp_preference_id: string | null
            event_id: string
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
                { error: 'Você não tem permissão para acessar esta inscrição.' },
                { status: 403 }
            )
        }

        // Only pending registrations can have payment URL recovered
        if (registration.status !== 'pending' || registration.payment_status === 'paid') {
            return NextResponse.json(
                { error: 'Esta inscrição não possui pagamento pendente.' },
                { status: 400 }
            )
        }

        if (!registration.mp_preference_id) {
            // No MP preference — look up the event slug so the user can redo checkout
            const { data: eventData } = await adminSupabase
                .from('events')
                .select('slug')
                .eq('id', registration.event_id)
                .single()

            const eventSlug = (eventData as { slug: string } | null)?.slug
            if (eventSlug) {
                return NextResponse.json({ url: `/eventos/${eventSlug}` })
            }

            return NextResponse.json(
                { error: 'Nenhuma preferência de pagamento encontrada. Acesse o evento para refazer a inscrição.' },
                { status: 404 }
            )
        }

        // Fetch preference from Mercado Pago to get init_point
        const preferenceApi = new Preference(mpClient)
        const mpPreference = await preferenceApi.get({
            preferenceId: registration.mp_preference_id,
        })

        if (!mpPreference?.init_point) {
            return NextResponse.json(
                { error: 'Não foi possível recuperar o link de pagamento. Tente novamente.' },
                { status: 500 }
            )
        }

        return NextResponse.json({ url: mpPreference.init_point })
    } catch (error) {
        console.error('[Payment URL] Error recovering payment URL:', error)
        return NextResponse.json(
            { error: 'Erro ao recuperar o link de pagamento. Tente novamente.' },
            { status: 500 }
        )
    }
}
