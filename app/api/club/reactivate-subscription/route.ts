import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reactivateSubscription } from '@/lib/stripe/subscriptions'
import { getActiveSubscription } from '@/lib/data/subscriptions'
import { createAdminClient } from '@/lib/supabase/server'

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

    // Find active subscription that's marked for cancellation
    const { data: subscription, error: fetchError } = await getActiveSubscription(user.id)

    if (fetchError || !subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Check if subscription is marked for cancellation
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Assinatura não está marcada para cancelamento' },
        { status: 400 }
      )
    }

    // Reactivate subscription in Stripe
    await reactivateSubscription(subscription.stripe_subscription_id)

    // Update subscription in database using admin client to bypass RLS
    const adminSupabase = createAdminClient()
    const { data: updatedSubscription, error: updateError } = await (adminSupabase
      .from('subscriptions') as any)
      .update({
        cancel_at_period_end: false,
      })
      .eq('id', subscription.id)
      .select('*')
      .single()

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
      message: 'Assinatura reativada com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao reativar assinatura:', error)
    return NextResponse.json(
      { error: 'Não foi possível reativar a assinatura' },
      { status: 500 }
    )
  }
}
