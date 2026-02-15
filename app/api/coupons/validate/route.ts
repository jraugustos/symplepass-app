import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCoupon } from '@/lib/data/admin-coupons'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { couponCode, eventId, categoryPrice } = body

        if (!couponCode || !eventId || categoryPrice === undefined) {
            return NextResponse.json(
                { error: 'Dados incompletos para validação do cupom.' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não autenticado.' },
                { status: 401 }
            )
        }

        const validationResult = await validateCoupon(
            couponCode,
            eventId,
            user.id,
            categoryPrice
        )

        if (!validationResult.valid) {
            return NextResponse.json(
                { error: validationResult.error || 'Cupom inválido.' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            valid: true,
            discountAmount: validationResult.discountAmount,
            coupon: validationResult.coupon,
        })
    } catch (error) {
        console.error('Error validating coupon:', error)
        return NextResponse.json(
            { error: 'Erro ao validar cupom.' },
            { status: 500 }
        )
    }
}
