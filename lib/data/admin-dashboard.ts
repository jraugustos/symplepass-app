import { createClient } from '@/lib/supabase/server'

export interface AdminDashboardStats {
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  totalRevenue: number
  totalUsers: number
  fetchedAt: string
}

/**
 * Fetches all admin dashboard statistics in a single RPC call.
 * Falls back to individual queries if RPC is not available.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  try {
    const supabase = await createClient()

    // Try using the RPC function first (single query, most efficient)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats')

    if (!rpcError && rpcData) {
      return rpcData as AdminDashboardStats
    }

    // Fallback to individual queries if RPC fails or doesn't exist
    // Run queries in parallel for better performance
    const [
      { count: totalEvents },
      { count: activeEvents },
      { count: totalRegistrations },
      { count: confirmedRegistrations },
      { count: pendingRegistrations },
      { data: revenue },
      { count: totalUsers }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('registrations').select('amount_paid').eq('payment_status', 'paid'),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ])

    const totalRevenue = revenue?.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0) || 0

    return {
      totalEvents: totalEvents || 0,
      activeEvents: activeEvents || 0,
      totalRegistrations: totalRegistrations || 0,
      confirmedRegistrations: confirmedRegistrations || 0,
      pendingRegistrations: pendingRegistrations || 0,
      totalRevenue,
      totalUsers: totalUsers || 0,
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return null
  }
}
