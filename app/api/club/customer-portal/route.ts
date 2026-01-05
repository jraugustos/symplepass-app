import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe/subscriptions'
import { getEnv } from '@/lib/env'

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

    // Find active or trialing subscription with customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    const env = getEnv()
    const portalSession = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${env.app.baseUrl}/conta?tab=config`
    )

    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Erro ao criar portal do cliente:', error)
    return NextResponse.json(
      { error: 'Não foi possível acessar o portal' },
      { status: 500 }
    )
  }
}
