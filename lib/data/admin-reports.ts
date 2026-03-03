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
  amount_paid?: number | null
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

function getAmountPaid(row: RegistrationRevenueRow): number {
  return Number(row.amount_paid || 0)
}

function extractPrice(category: RegistrationRevenueRow['event_categories']) {
  const normalized = normalizeRelation(category)
  return Number(normalized?.price || 0)
}

export interface ReportFilters {
  start_date?: string
  end_date?: string
  event_id?: string
  organizer_id?: string
  sport_type?: string
  payment_status?: string
}

export async function getFinancialOverview(filters: ReportFilters = {}): Promise<FinancialOverview | null> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, organizer_id, sport_type, payment_status } = filters

    // Build base query for registrations
    let regQuery = supabase
      .from('registrations')
      .select(`
        id,
        payment_status,
        status,
        amount_paid,
        events:event_id!inner(id, sport_type, created_at, organizer_id)
      `)

    if (event_id) {
      regQuery = regQuery.eq('event_id', event_id)
    }

    if (organizer_id) {
      regQuery = regQuery.eq('events.organizer_id', organizer_id)
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
        return sum + getAmountPaid(r)
      }, 0) || 0

    const confirmedRevenue = registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => {
        return sum + getAmountPaid(r)
      }, 0) || 0

    const pendingRevenue = registrations
      .filter(r => r.payment_status === 'pending')
      .reduce((sum, r) => {
        return sum + getAmountPaid(r)
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
        amount_paid,
        events:event_id!inner(sport_type, organizer_id)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (filters.organizer_id) {
      query = query.eq('events.organizer_id', filters.organizer_id)
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
        acc[date].revenue += getAmountPaid(reg)
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
    const { start_date, end_date, event_id, sport_type, organizer_id, payment_status } = filters

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        sport_type,
        registrations(
          id,
          payment_status,
          amount_paid,
          created_at
        )
      `)

    if (event_id) {
      query = query.eq('id', event_id)
    }

    if (organizer_id) {
      query = query.eq('organizer_id', organizer_id)
    }

    if (sport_type) {
      query = query.eq('sport_type', sport_type)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching event performance:', error)
      return []
    }

    const performanceData: EventPerformanceData[] = (events || []).map(event => {
      let registrations = event.registrations || []

      // Apply date filters on registration created_at
      if (start_date) {
        registrations = registrations.filter((r: any) => r.created_at >= start_date)
      }
      if (end_date) {
        registrations = registrations.filter((r: any) => r.created_at <= end_date)
      }

      // Apply payment_status filter
      if (payment_status) {
        registrations = registrations.filter((r: any) => r.payment_status === payment_status)
      }

      const totalRegistrations = registrations.length
      const confirmedRegistrations = registrations.filter((r: any) => r.payment_status === 'paid').length
      const totalRevenue = registrations
        .filter((r: any) => r.payment_status === 'paid')
        .reduce((sum: number, r: any) => sum + (Number(r.amount_paid) || 0), 0)
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

    // Filter out events with no registrations after filtering
    const filtered = performanceData.filter(e => e.totalRegistrations > 0)

    // Sort by revenue descending
    return filtered.sort((a, b) => b.totalRevenue - a.totalRevenue)
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
        amount_paid,
        events:event_id!inner(sport_type, organizer_id)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (filters.organizer_id) {
      query = query.eq('events.organizer_id', filters.organizer_id)
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
      acc[status].revenue += getAmountPaid(reg)
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
        amount_paid,
        events:event_id!inner(title, organizer_id),
        event_categories:category_id(name, price),
        profiles:user_id(full_name, email, cpf),
        payments(payment_method, transaction_id, status)
      `)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (filters.organizer_id) {
      query = query.eq('events.organizer_id', filters.organizer_id)
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
        amount: `R$ ${getAmountPaid(reg).toFixed(2)}`,
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

// ============================================================
// NEW CHART DATA FUNCTIONS
// ============================================================

export interface CategoryDistributionData {
  categoryName: string
  eventTitle: string
  registrations: number
  confirmedRegistrations: number
  revenue: number
}

export async function getCategoryDistribution(filters: ReportFilters = {}): Promise<CategoryDistributionData[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, organizer_id, payment_status } = filters

    let query = supabase
      .from('registrations')
      .select(`
        payment_status,
        amount_paid,
        created_at,
        event_categories:category_id(name),
        events:event_id!inner(title, sport_type, organizer_id)
      `)

    if (event_id) query = query.eq('event_id', event_id)
    if (organizer_id) query = query.eq('events.organizer_id', organizer_id)
    if (sport_type) query = query.eq('events.sport_type', sport_type)
    if (payment_status) query = query.eq('payment_status', payment_status)
    if (start_date) query = query.gte('created_at', start_date)
    if (end_date) query = query.lte('created_at', end_date)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching category distribution:', error)
      return []
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    type GroupKey = string
    const grouped = registrations.reduce((acc, reg) => {
      const cat = normalizeRelation(reg.event_categories)
      const evt = normalizeRelation(reg.events)
      const key: GroupKey = `${evt?.title || 'N/A'} — ${cat?.name || 'N/A'}`

      if (!acc[key]) {
        acc[key] = {
          categoryName: cat?.name || 'N/A',
          eventTitle: evt?.title || 'N/A',
          registrations: 0,
          confirmedRegistrations: 0,
          revenue: 0,
        }
      }
      acc[key].registrations += 1
      if (reg.payment_status === 'paid') {
        acc[key].confirmedRegistrations += 1
        acc[key].revenue += getAmountPaid(reg)
      }
      return acc
    }, {} as Record<GroupKey, CategoryDistributionData>)

    return Object.values(grouped).sort((a, b) => b.registrations - a.registrations)
  } catch (error) {
    console.error('Error in getCategoryDistribution:', error)
    return []
  }
}

export interface CouponUsageData {
  couponCode: string
  usageCount: number
  totalDiscount: number
}

export async function getCouponUsageStats(filters: ReportFilters = {}): Promise<CouponUsageData[]> {
  try {
    const supabase = await createClient()
    const { event_id } = filters

    let query = supabase
      .from('coupon_usages')
      .select(`
        discount_applied,
        coupons(code),
        registrations:registration_id(event_id)
      `)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching coupon usage stats:', error)
      return []
    }

    const usages = (data || []) as any[]

    // Filter by event_id if provided
    const filtered = event_id
      ? usages.filter(u => {
        const reg = Array.isArray(u.registrations) ? u.registrations[0] : u.registrations
        return reg?.event_id === event_id
      })
      : usages

    const grouped = filtered.reduce((acc, usage) => {
      const coupon = Array.isArray(usage.coupons) ? usage.coupons[0] : usage.coupons
      const code = coupon?.code || 'Desconhecido'

      if (!acc[code]) {
        acc[code] = { couponCode: code, usageCount: 0, totalDiscount: 0 }
      }
      acc[code].usageCount += 1
      acc[code].totalDiscount += Number(usage.discount_applied || 0)
      return acc
    }, {} as Record<string, CouponUsageData>)

    const result: CouponUsageData[] = Object.values(grouped)
    return result.sort((a, b) => b.usageCount - a.usageCount)
  } catch (error) {
    console.error('Error in getCouponUsageStats:', error)
    return []
  }
}

export interface SportTypeRevenueData {
  sportType: string
  revenue: number
  registrations: number
  percentage: number
}

export async function getSportTypeRevenue(filters: ReportFilters = {}): Promise<SportTypeRevenueData[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, organizer_id, payment_status } = filters

    let query = supabase
      .from('registrations')
      .select(`
        payment_status,
        amount_paid,
        created_at,
        events:event_id!inner(sport_type, organizer_id)
      `)

    if (organizer_id) query = query.eq('events.organizer_id', organizer_id)
    if (payment_status) query = query.eq('payment_status', payment_status)
    if (start_date) query = query.gte('created_at', start_date)
    if (end_date) query = query.lte('created_at', end_date)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sport type revenue:', error)
      return []
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    const grouped = registrations.reduce((acc, reg) => {
      const evt = normalizeRelation(reg.events)
      const sport = evt?.sport_type || 'outro'

      if (!acc[sport]) {
        acc[sport] = { sportType: sport, revenue: 0, registrations: 0, percentage: 0 }
      }
      acc[sport].registrations += 1
      if (reg.payment_status === 'paid') {
        acc[sport].revenue += getAmountPaid(reg)
      }
      return acc
    }, {} as Record<string, SportTypeRevenueData>)

    const result = Object.values(grouped)
    const totalRevenue = result.reduce((sum, r) => sum + r.revenue, 0)

    // Calculate percentages
    result.forEach(r => {
      r.percentage = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0
    })

    return result.sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error('Error in getSportTypeRevenue:', error)
    return []
  }
}

export interface RevenueComparisonData {
  eventTitle: string
  expectedRevenue: number // sum of category prices
  actualRevenue: number   // sum of amount_paid
  difference: number
  discountPercentage: number
}

export async function getRevenueComparison(filters: ReportFilters = {}): Promise<RevenueComparisonData[]> {
  try {
    const supabase = await createClient()
    const { start_date, end_date, event_id, sport_type, organizer_id } = filters

    let query = supabase
      .from('registrations')
      .select(`
        payment_status,
        amount_paid,
        created_at,
        event_categories:category_id(price),
        events:event_id!inner(id, title, sport_type, organizer_id)
      `)
      .eq('payment_status', 'paid')

    if (event_id) query = query.eq('event_id', event_id)
    if (organizer_id) query = query.eq('events.organizer_id', organizer_id)
    if (sport_type) query = query.eq('events.sport_type', sport_type)
    if (start_date) query = query.gte('created_at', start_date)
    if (end_date) query = query.lte('created_at', end_date)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching revenue comparison:', error)
      return []
    }

    const registrations = ((data ?? []) as unknown) as RegistrationRevenueRow[]

    const grouped = registrations.reduce((acc, reg) => {
      const evt = normalizeRelation(reg.events)
      const eventId = evt?.id || 'unknown'

      if (!acc[eventId]) {
        acc[eventId] = {
          eventTitle: evt?.title || 'N/A',
          expectedRevenue: 0,
          actualRevenue: 0,
          difference: 0,
          discountPercentage: 0,
        }
      }
      acc[eventId].expectedRevenue += extractPrice(reg.event_categories)
      acc[eventId].actualRevenue += getAmountPaid(reg)
      return acc
    }, {} as Record<string, RevenueComparisonData>)

    const result = Object.values(grouped)
    result.forEach(r => {
      r.difference = r.expectedRevenue - r.actualRevenue
      r.discountPercentage = r.expectedRevenue > 0
        ? ((r.difference / r.expectedRevenue) * 100)
        : 0
    })

    return result.sort((a, b) => b.difference - a.difference)
  } catch (error) {
    console.error('Error in getRevenueComparison:', error)
    return []
  }
}
