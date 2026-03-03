'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { SalesTrendChart } from './sales-trend-chart'
import { EventPerformanceChart } from './event-performance-chart'
import { PaymentStatusChart } from './payment-status-chart'
import { CategoryDistributionChart } from './category-distribution-chart'
import { RegistrationFunnelChart } from './registration-funnel-chart'
import { CouponUsageChart } from './coupon-usage-chart'
import { SportTypeChart } from './sport-type-chart'
import { RevenueComparisonChart } from './revenue-comparison-chart'
import { ReportFilters } from './report-filters'
import {
  SalesTrendData,
  EventPerformanceData,
  PaymentStatusBreakdown,
  CategoryDistributionData,
  CouponUsageData,
  SportTypeRevenueData,
  RevenueComparisonData,
  FinancialOverview,
  ReportFilters as ReportFiltersType,
} from '@/types'

interface ReportsPageClientProps {
  salesTrends: SalesTrendData[]
  eventPerformance: EventPerformanceData[]
  paymentBreakdown: PaymentStatusBreakdown[]
  categoryDistribution: CategoryDistributionData[]
  couponUsage: CouponUsageData[]
  sportTypeRevenue: SportTypeRevenueData[]
  revenueComparison: RevenueComparisonData[]
  overview: FinancialOverview | null
  events: Array<{ id: string; title: string }>
  filters: ReportFiltersType
}

export function ReportsPageClient({
  salesTrends,
  eventPerformance,
  paymentBreakdown,
  categoryDistribution,
  couponUsage,
  sportTypeRevenue,
  revenueComparison,
  overview,
  events,
  filters,
}: ReportsPageClientProps) {
  const router = useRouter()

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    const queryParams = new URLSearchParams()
    if (newFilters.start_date) queryParams.set('start_date', newFilters.start_date)
    if (newFilters.end_date) queryParams.set('end_date', newFilters.end_date)
    if (newFilters.event_id) queryParams.set('event_id', newFilters.event_id)
    if (newFilters.sport_type) queryParams.set('sport_type', newFilters.sport_type)
    if (newFilters.payment_status) queryParams.set('payment_status', newFilters.payment_status)

    router.push(`/admin/relatorios?${queryParams.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ReportFilters onFilterChange={handleFilterChange} events={events} />

      {/* Registration Funnel */}
      {overview && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Funil de Conversão
          </h2>
          <RegistrationFunnelChart
            totalRegistrations={overview.totalRegistrations}
            pendingRegistrations={overview.pendingRegistrations}
            confirmedRegistrations={overview.confirmedRegistrations}
            conversionRate={overview.conversionRate}
          />
        </Card>
      )}

      {/* Sales Trends Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Tendência de Vendas
        </h2>
        <SalesTrendChart data={salesTrends} />
      </Card>

      {/* Two columns: Sport Type + Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Receita por Esporte
          </h2>
          <SportTypeChart data={sportTypeRevenue} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Status de Pagamentos
          </h2>
          <PaymentStatusChart data={paymentBreakdown} />
        </Card>
      </div>

      {/* Event Performance Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Performance de Eventos (Top 10)
        </h2>
        <EventPerformanceChart data={eventPerformance} />
      </Card>

      {/* Revenue Comparison */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Receita Esperada vs Realizada
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Comparação entre o valor cheio da categoria e o valor efetivamente pago (após cupons e descontos)
        </p>
        <RevenueComparisonChart data={revenueComparison} />
      </Card>

      {/* Category Distribution */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Distribuição por Categoria
        </h2>
        <CategoryDistributionChart data={categoryDistribution} />
      </Card>

      {/* Coupon Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Uso de Cupons
        </h2>
        <CouponUsageChart data={couponUsage} />
      </Card>
    </div>
  )
}
