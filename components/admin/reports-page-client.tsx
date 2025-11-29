'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { SalesTrendChart } from './sales-trend-chart'
import { EventPerformanceChart } from './event-performance-chart'
import { PaymentStatusChart } from './payment-status-chart'
import { ReportFilters } from './report-filters'
import {
  SalesTrendData,
  EventPerformanceData,
  PaymentStatusBreakdown,
  ReportFilters as ReportFiltersType,
} from '@/types'

interface ReportsPageClientProps {
  salesTrends: SalesTrendData[]
  eventPerformance: EventPerformanceData[]
  paymentBreakdown: PaymentStatusBreakdown[]
  events: Array<{ id: string; title: string }>
  filters: ReportFiltersType
}

export function ReportsPageClient({
  salesTrends,
  eventPerformance,
  paymentBreakdown,
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

      {/* Sales Trends Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Tendência de Vendas
        </h2>
        <SalesTrendChart data={salesTrends} />
      </Card>

      {/* Event Performance Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Performance de Eventos (Top 10)
        </h2>
        <EventPerformanceChart data={eventPerformance} />
      </Card>

      {/* Payment Status Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Status de Pagamentos
        </h2>
        <PaymentStatusChart data={paymentBreakdown} />
      </Card>
    </div>
  )
}
