import { createClient } from '@/lib/supabase/server'

export interface FinancialOverview {
  totalRevenue: number
  confirmedRevenue: number
  pendingRevenue: number
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  averageTicketPrice: number
  conversionRate: number
}

export interface SalesTrendData {
  date: string
  revenue: number
  registrations: number
}

export interface EventPerformanceData {
  eventId: string
  eventTitle: string
  totalRevenue: number
  totalRegistrations: number
  confirmedRegistrations: number
  conversionRate: number
}

export interface PaymentStatusBreakdown {
  status: string
  count: number
  revenue: number
  percentage: number
}

type RegistrationRevenueRow = {
  id?: string
  created_at: string
  payment_status?: string | null
  status?: string | null
  total_amount?: number | null
  event_categories?:
    | {
        price?: number | null
        name?: string | null
      }
    | Array<{
        price?: number | null
        name?: string | null
      }>
    | null
  events?:
    | {
        id?: string
        title?: string | null
        sport_type?: string | null
        start_date?: string | null
        created_at?: string | null
      }
    | Array<{
        id?: string
        title?: string | null
        sport_type?: string | null
        start_date?: string | null
        created_at?: string | null
      }>
    | null
  profiles?: {
    full_name?: string | null
    email?: string | null
    cpf?: string | null
  } | null
  payments?:
    | Array<{
        payment_method?: string | null
        transaction_id?: string | null
        status?: string | null
      }>
    | {
        payment_method?: string | null
        transaction_id?: string | null
        status?: string | null
      }
    | null
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function extractPrice(category: RegistrationRevenueRow['event_categories']) {
  const normalized = normalizeRelation(category)
  return Number(normalized?.price || 0)
}

export interface ReportFilters {
  start_date?: string
  end_date?: string
  event_id?: string
  sport_type?: string
  payment_status?: string
}

export async function getFinancialOverview(filters: ReportFilters = {}): Promise<FinancialOverview | null> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, payment_status } = filters

    // Build base query for registrations
    let regQuery = supabase
      .from('registrations')
      .select(`
        id,
        payment_status,
        status,
        event_categories:category_id(price),
        events:event_id(id, sport_type, created_at)
      `)

    if (event_id) {
      regQuery = regQuery.eq('event_id', event_id)
    }

    if (sport_type) {
      regQuery = regQuery.eq('events.sport_type', sport_type)
    }

    if (payment_status) {
      regQuery = regQuery.eq('payment_status', payment_status)
    }

    if (start_date) {
      regQuery = regQuery.gte('created_at', start_date)
    }

    if (end_date) {
      regQuery = regQuery.lte('created_at', end_date)
    }

    const { data, error } = await regQuery

    if (error) {
      console.error('Error fetching registrations for overview:', error)
      return null
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    const totalRegistrations = registrations.length
    const confirmedRegistrations = registrations.filter(r => r.payment_status === 'paid').length
    const pendingRegistrations = registrations.filter(r => r.payment_status === 'pending').length

    const totalRevenue =
      registrations.reduce((sum, r) => {
        return sum + extractPrice(r.event_categories)
      }, 0) || 0

    const confirmedRevenue = registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => {
        return sum + extractPrice(r.event_categories)
      }, 0) || 0

    const pendingRevenue = registrations
      .filter(r => r.payment_status === 'pending')
      .reduce((sum, r) => {
        return sum + extractPrice(r.event_categories)
      }, 0) || 0

    const averageTicketPrice = totalRegistrations > 0 ? totalRevenue / totalRegistrations : 0
    const conversionRate = totalRegistrations > 0 ? (confirmedRegistrations / totalRegistrations) * 100 : 0

    return {
      totalRevenue,
      confirmedRevenue,
      pendingRevenue,
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      averageTicketPrice,
      conversionRate,
    }
  } catch (error) {
    console.error('Error in getFinancialOverview:', error)
    return null
  }
}

export async function getSalesTrends(filters: ReportFilters = {}): Promise<SalesTrendData[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, payment_status } = filters

    let query = supabase
      .from('registrations')
      .select(`
        created_at,
        payment_status,
        event_categories:category_id(price),
        events:event_id(sport_type)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (sport_type) {
      query = query.eq('events.sport_type', sport_type)
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sales trends:', error)
      return []
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    // Group by date
    const groupedByDate = registrations.reduce((acc, reg) => {
      const date = new Date(reg.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { revenue: 0, registrations: 0 }
      }
      acc[date].registrations += 1
      if (reg.payment_status === 'paid') {
        acc[date].revenue += extractPrice(reg.event_categories)
      }
      return acc
    }, {} as Record<string, { revenue: number; registrations: number }>)

    // Convert to array and sort by date
    const trendsData = Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        registrations: data.registrations,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return trendsData
  } catch (error) {
    console.error('Error in getSalesTrends:', error)
    return []
  }
}

export async function getEventPerformance(filters: ReportFilters = {}): Promise<EventPerformanceData[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, sport_type } = filters

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        sport_type,
        registrations(
          id,
          payment_status,
          event_categories:category_id(price)
        )
      `)

    if (sport_type) {
      query = query.eq('sport_type', sport_type)
    }

    if (start_date) {
      query = query.gte('start_date', start_date)
    }

    if (end_date) {
      query = query.lte('start_date', end_date)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching event performance:', error)
      return []
    }

    const performanceData: EventPerformanceData[] = (events || []).map(event => {
      const registrations = event.registrations || []
      const totalRegistrations = registrations.length
      const confirmedRegistrations = registrations.filter(r => r.payment_status === 'paid').length
      const totalRevenue = registrations
        .filter(r => r.payment_status === 'paid')
        .reduce((sum, r) => sum + extractPrice(r.event_categories), 0)
      const conversionRate = totalRegistrations > 0 ? (confirmedRegistrations / totalRegistrations) * 100 : 0

      return {
        eventId: event.id,
        eventTitle: event.title,
        totalRevenue,
        totalRegistrations,
        confirmedRegistrations,
        conversionRate,
      }
    })

    // Sort by revenue descending
    return performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue)
  } catch (error) {
    console.error('Error in getEventPerformance:', error)
    return []
  }
}

export async function getPaymentStatusBreakdown(filters: ReportFilters = {}): Promise<PaymentStatusBreakdown[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, payment_status } = filters

    let query = supabase
      .from('registrations')
      .select(`
        payment_status,
        event_categories:category_id(price),
        events:event_id(sport_type)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (sport_type) {
      query = query.eq('events.sport_type', sport_type)
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment status breakdown:', error)
      return []
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    const total = registrations.length

    // Group by payment status
    const grouped = registrations.reduce((acc, reg) => {
      const status = reg.payment_status || 'unknown'
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0 }
      }
      acc[status].count += 1
      if (status === 'paid') {
        acc[status].revenue += extractPrice(reg.event_categories)
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const breakdown: PaymentStatusBreakdown[] = Object.entries(grouped).map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
    }))

    return breakdown.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error in getPaymentStatusBreakdown:', error)
    return []
  }
}

export interface FinancialReportExport {
  event: string
  category: string
  participant: string
  email: string
  cpf: string
  registrationDate: string
  paymentStatus: string
  amount: string
  paymentMethod: string
  transactionId: string
}

export async function exportFinancialReport(filters: ReportFilters = {}): Promise<FinancialReportExport[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, payment_status } = filters

    let query = supabase
      .from('registrations')
      .select(`
        created_at,
        payment_status,
        events:event_id(title),
        event_categories:category_id(name, price),
        profiles:user_id(full_name, email, cpf),
        payments(payment_method, transaction_id, status)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (sport_type) {
      query = query.eq('events.sport_type', sport_type)
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error exporting financial report:', error)
      return []
    }

    const registrations = (data || []) as RegistrationRevenueRow[]

    const exportData: FinancialReportExport[] = registrations.map(reg => {
      const payment = Array.isArray(reg.payments) ? reg.payments[0] : reg.payments
      const eventInfo = normalizeRelation(reg.events)
      const categoryInfo = normalizeRelation(reg.event_categories)
      const profileInfo = normalizeRelation(reg.profiles)

      return {
        event: eventInfo?.title || '',
        category: categoryInfo?.name || '',
        participant: profileInfo?.full_name || '',
        email: profileInfo?.email || '',
        cpf: profileInfo?.cpf || '',
        registrationDate: new Date(reg.created_at).toLocaleDateString('pt-BR'),
        paymentStatus:
          reg.payment_status === 'paid'
            ? 'Pago'
            : reg.payment_status === 'pending'
              ? 'Pendente'
              : 'Cancelado',
        amount: `R$ ${extractPrice(reg.event_categories).toFixed(2)}`,
        paymentMethod: payment?.payment_method || '',
        transactionId: payment?.transaction_id || '',
      }
    })

    return exportData
  } catch (error) {
    console.error('Error in exportFinancialReport:', error)
    return []
  }
}
