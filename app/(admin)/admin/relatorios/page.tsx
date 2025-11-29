import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, DollarSign, Users, TrendingUp, Download } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  getFinancialOverview,
  getSalesTrends,
  getEventPerformance,
  getPaymentStatusBreakdown,
} from '@/lib/data/admin-reports'
import { getAllEventsForAdmin } from '@/lib/data/admin-events'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { ReportsPageClient } from '@/components/admin/reports-page-client'
import { ExportReportButton } from '@/components/admin/export-report-button'
import { ReportFilters, SportType, PaymentStatus } from '@/types'

export const metadata = {
  title: 'Relatórios Financeiros - Admin Symplepass',
}

interface SearchParams {
  start_date?: string
  end_date?: string
  event_id?: string
  sport_type?: SportType
  payment_status?: PaymentStatus
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const filters: ReportFilters = {
    start_date: searchParams.start_date,
    end_date: searchParams.end_date,
    event_id: searchParams.event_id,
    sport_type: searchParams.sport_type,
    payment_status: searchParams.payment_status,
  }

  const [overview, salesTrends, eventPerformance, paymentBreakdown, { events }] = await Promise.all([
    getFinancialOverview(filters),
    getSalesTrends(filters),
    getEventPerformance(filters),
    getPaymentStatusBreakdown(filters),
    getAllEventsForAdmin({ pageSize: 1000 }),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Relatórios Financeiros</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Relatórios Financeiros</h1>
          <p className="text-neutral-600 mt-1">
            Visualize métricas financeiras e desempenho de eventos
          </p>
        </div>
        <ExportReportButton filters={filters} />
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Receita Total</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(overview.totalRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Receita Confirmada</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(overview.confirmedRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total Inscrições</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {overview.totalRegistrations}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {overview.conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts and Filters */}
      <ReportsPageClient
        salesTrends={salesTrends}
        eventPerformance={eventPerformance}
        paymentBreakdown={paymentBreakdown}
        events={events}
        filters={filters}
      />
    </div>
  )
}
