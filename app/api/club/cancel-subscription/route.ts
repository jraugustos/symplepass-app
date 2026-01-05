import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelStripeSubscription } from '@/lib/stripe/subscriptions'
import { getActiveSubscription, cancelSubscription } from '@/lib/data/subscriptions'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Find active subscription
    const { data: subscription, error: fetchError } = await getActiveSubscription(user.id)

    if (fetchError || !subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Check if already marked for cancellation
    if (subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Assinatura já está marcada para cancelamento' },
        { status: 400 }
      )
    }

    // Cancel subscription in Stripe (at period end)
    await cancelStripeSubscription(subscription.stripe_subscription_id, true)

    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await cancelSubscription(
      subscription.id
    )

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar assinatura no banco de dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'Assinatura cancelada. Você terá acesso aos benefícios até o fim do período pago.',
    })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Não foi possível cancelar a assinatura' },
      { status: 500 }
    )
  }
}
