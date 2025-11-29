import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UserFilters, UserStats, UserRole } from '@/types'

export async function getAllUsers(filters: UserFilters = {}) {
  try {
    const supabase = await createClient()
    const { role, search, registration_status, page = 1, pageSize = 20 } = filters

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0, page, pageSize }
    }

    return { users: data || [], total: count || 0, page, pageSize }
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    return { users: [], total: 0, page: 1, pageSize: 20 }
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return { user: null, error: error.message }
    }

    return { user: data, error: null }
  } catch (error) {
    console.error('Error in getUserById:', error)
    return { user: null, error: 'Failed to fetch user' }
  }
}

export async function getUserRegistrations(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events:event_id(id, title, slug, start_date, sport_type),
        event_categories:category_id(id, name, price)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user registrations:', error)
      return { registrations: [], error: error.message }
    }

    return { registrations: data || [], error: null }
  } catch (error) {
    console.error('Error in getUserRegistrations:', error)
    return { registrations: [], error: 'Failed to fetch registrations' }
  }
}

export async function getUserPaymentHistory(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        registration_id,
        amount,
        status,
        payment_method,
        stripe_payment_intent_id,
        created_at,
        registrations(
          id,
          events:event_id(id, title, slug),
          event_categories:category_id(name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment history:', error)
      return { payments: [], error: error.message }
    }

    // Map to PaymentHistoryItem shape
    const mappedPayments = (data || []).map((payment) => {
      const registration = Array.isArray(payment.registrations)
        ? payment.registrations[0]
        : payment.registrations
      const eventInfo = registration
        ? Array.isArray(registration.events)
          ? registration.events[0]
          : registration.events
        : null
      const categoryInfo = registration
        ? Array.isArray(registration.event_categories)
          ? registration.event_categories[0]
          : registration.event_categories
        : null

      return {
        id: payment.id,
        registration_id: payment.registration_id,
        event_title: eventInfo?.title || '',
        category_name: categoryInfo?.name || null,
        amount: payment.amount,
        payment_status: payment.status,
        payment_date: payment.created_at,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
      }
    })

    return { payments: mappedPayments, error: null }
  } catch (error) {
    console.error('Error in getUserPaymentHistory:', error)
    return { payments: [], error: 'Failed to fetch payment history' }
  }
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const supabase = await createClient()

    // Get registration stats
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, status, payment_status')
      .eq('user_id', userId)

    if (regError) {
      console.error('Error fetching user registration stats:', regError)
      return null
    }

    const totalRegistrations = registrations?.length || 0
    const confirmedRegistrations = registrations?.filter(r => r.payment_status === 'paid').length || 0
    const pendingRegistrations = registrations?.filter(r => r.payment_status === 'pending').length || 0

    // Get payment stats
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'paid')

    if (payError) {
      console.error('Error fetching user payment stats:', payError)
      return null
    }

    const totalSpent = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const averageSpent = totalRegistrations > 0 ? totalSpent / totalRegistrations : 0

    return {
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      totalSpent,
      averageSpent,
    }
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return null
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // Use admin client to bypass RLS - required because the profiles RLS policy
    // only allows users to update their own profile (auth.uid() = id)
    // Admin operations need service role to update other users' roles
    const supabase = createAdminClient()

    // Cast to any to bypass incomplete Database type definitions
    // The update payload is valid: { role: string, updated_at: string }
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user role:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}
