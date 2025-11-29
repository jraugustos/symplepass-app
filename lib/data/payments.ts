import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { PaymentHistoryItem, PaymentStatus } from '@/types'

type Result<T> = {
  data: T | null
  error: string | null
}

type SupabaseServerClient = SupabaseClient<Database>

type PaymentHistoryRow = Database['public']['Tables']['registrations']['Row'] & {
  events?: {
    title?: string | null
  } | null
  event_categories?: {
    name?: string | null
  } | null
}

function getClient(providedClient?: SupabaseServerClient) {
  return providedClient ?? createClient()
}

function mapPaymentHistoryItem(payload: PaymentHistoryRow): PaymentHistoryItem {
  return {
    id: payload.id,
    registration_id: payload.id,
    event_title: payload.events?.title ?? 'Evento indisponível',
    category_name: payload.event_categories?.name ?? null,
    amount: Number(payload.amount_paid) || 0,
    payment_status: (payload.payment_status ?? 'pending') as PaymentStatus,
    payment_date: payload.created_at,
    stripe_payment_intent_id: payload.stripe_payment_intent_id ?? null,
  }
}

export async function getUserPaymentHistory(
  userId: string,
  limit = 10,
  supabaseClient?: SupabaseServerClient
): Promise<Result<PaymentHistoryItem[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select(
        `
          id,
          amount_paid,
          payment_status,
          created_at,
          stripe_payment_intent_id,
          events:event_id (
            title
          ),
          event_categories:category_id (
            name
          )
        `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching payment history:', error)
      return { data: null, error: error.message }
    }

    const mapped = ((data ?? []) as unknown as PaymentHistoryRow[]).map(mapPaymentHistoryItem)
    return { data: mapped, error: null }
  } catch (error) {
    console.error('Unexpected error fetching payment history:', error)
    return { data: null, error: 'Não foi possível carregar pagamentos' }
  }
}

export async function getPaymentStats(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<
  Result<{
    totalSpent: number
    totalPayments: number
    pendingPayments: number
  }>
> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('registrations')
      .select('amount_paid,payment_status')
      .eq('user_id', userId)

    if (error) {
      console.error('Error calculating payment stats:', error)
      return { data: null, error: error.message }
    }

    const metrics = (data ?? []).reduce(
      (acc, curr) => {
        if (curr.payment_status === 'paid') {
          acc.totalSpent += Number(curr.amount_paid) || 0
        }

        if (curr.payment_status === 'pending') {
          acc.pendingPayments += 1
        }

        acc.totalPayments += 1

        return acc
      },
      { totalSpent: 0, totalPayments: 0, pendingPayments: 0 }
    )

    return { data: metrics, error: null }
  } catch (error) {
    console.error('Unexpected error calculating payment stats:', error)
    return { data: null, error: 'Não foi possível calcular estatísticas' }
  }
}
