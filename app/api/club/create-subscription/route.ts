import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubscriptionCheckoutSession, findCustomerByEmail } from '@/lib/stripe/subscriptions'
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

    // Check if user already has a non-canceled subscription (active, trialing, past_due, unpaid, incomplete, paused)
    // We block any subscription that is not canceled or incomplete_expired to prevent duplicates
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused'])
      .maybeSingle()

    if (existingSubscription) {
      const statusMessages: Record<string, string> = {
        active: 'Você já possui uma assinatura ativa',
        trialing: 'Você já possui uma assinatura em período de teste',
        past_due: 'Você possui uma assinatura com pagamento pendente. Por favor, regularize o pagamento.',
        unpaid: 'Você possui uma assinatura com pagamento em aberto. Por favor, regularize o pagamento.',
        incomplete: 'Você possui uma assinatura incompleta. Por favor, finalize o pagamento anterior.',
        paused: 'Você possui uma assinatura pausada. Por favor, reative-a.',
      }
      return NextResponse.json(
        { error: statusMessages[existingSubscription.status] || 'Você já possui uma assinatura' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const env = getEnv()
    const priceId = process.env.STRIPE_CLUB_PRICE_ID

    if (!priceId) {
      console.error('STRIPE_CLUB_PRICE_ID not configured')
      return NextResponse.json(
        { error: 'Configuração de preço não encontrada' },
        { status: 500 }
      )
    }

    // Check if customer already exists in Stripe
    const existingCustomer = await findCustomerByEmail(profile.email)

    // Create checkout session
    const session = await createSubscriptionCheckoutSession(
      existingCustomer?.id || null,
      profile.email,
      priceId,
      user.id,
      `${env.app.baseUrl}/clube-beneficios?success=true`,
      `${env.app.baseUrl}/clube-beneficios?canceled=true`
    )

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de assinatura:', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a assinatura' },
      { status: 500 }
    )
  }
}
