'use client'

import { Card } from '@/components/ui/card'
import { EventPerformanceChart } from './event-performance-chart'
import { PaymentStatusChart } from './payment-status-chart'
import { SportTypeChart } from './sport-type-chart'
import { DashboardFunnelChart } from './dashboard-funnel-chart'
import {
    EventPerformanceData,
    PaymentStatusBreakdown,
    SportTypeRevenueData,
} from '@/types'
import { AdminDashboardStats } from '@/lib/data/admin-dashboard'

interface DashboardClientProps {
    stats: AdminDashboardStats
    eventPerformance: EventPerformanceData[]
    paymentBreakdown: PaymentStatusBreakdown[]
    sportTypeRevenue: SportTypeRevenueData[]
}

export function DashboardClient({
    stats,
    eventPerformance,
    paymentBreakdown,
    sportTypeRevenue,
}: DashboardClientProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Navigation Funnel (Users -> Registrations -> Confirmed) */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                        Funil Geral de Conversão
                    </h2>
                    <DashboardFunnelChart stats={stats} />
                </Card>

                {/* Revenue by Sport */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                        Receita por Esporte
                    </h2>
                    <SportTypeChart data={sportTypeRevenue} />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                        Status de Pagamentos
                    </h2>
                    <PaymentStatusChart data={paymentBreakdown} />
                </Card>

                {/* Event Performance Chart - Top 5/10 */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                        Performance de Eventos (Receita)
                    </h2>
                    <EventPerformanceChart data={eventPerformance.slice(0, 10)} />
                </Card>
            </div>
        </div>
    )
}
