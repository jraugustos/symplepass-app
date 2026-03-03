import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAdminDashboardStats } from '@/lib/data/admin-dashboard'
import { getEventPerformance, getSportTypeRevenue, getPaymentStatusBreakdown } from '@/lib/data/admin-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { DashboardClient } from '@/components/admin/dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard - Admin Symplepass',
}

export default async function AdminDashboardPage() {
  const userData = await getCurrentUser()

  if (!userData?.user) {
    redirect('/login')
  }

  const { profile } = userData

  // Fetch all stats in a single optimized call (uses RPC or parallel queries)
  const [
    stats,
    eventPerformance,
    sportTypeRevenue,
    paymentBreakdown
  ] = await Promise.all([
    getAdminDashboardStats(),
    getEventPerformance(),
    getSportTypeRevenue(),
    getPaymentStatusBreakdown()
  ])

  const totalEvents = stats?.totalEvents ?? 0
  const totalRevenue = stats?.totalRevenue ?? 0
  const newUsers = stats?.newUsers ?? 0
  const totalUsers = stats?.totalUsers ?? 0
  const confirmedRegistrations = stats?.confirmedRegistrations ?? 0

  const conversionRate = totalUsers > 0 ? (confirmedRegistrations / totalUsers) * 100 : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-sm text-neutral-500">Painel administrativo</p>
          <h1 className="text-3xl font-bold text-neutral-900">
            Bem-vindo ao painel, {profile?.full_name || 'Admin'}
          </h1>
          <p className="mt-1 text-neutral-600">
            Acompanhe métricas importantes e gerencie suas operações com segurança.
          </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button asChild variant="outline" className="flex-1 lg:flex-none">
            <a href="/admin/relatorios">Ver relatórios</a>
          </Button>
          <Button asChild className="flex-1 lg:flex-none">
            <a href="/admin/eventos/novo">Criar novo evento</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
            <CardDescription>Pagamentos confirmados globais</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Novos Usuários</CardTitle>
            <CardDescription>Cadastros nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{newUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão</CardTitle>
            <CardDescription>Eficácia de fechamento total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Eventos</CardTitle>
            <CardDescription>Eventos criados na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{totalEvents}</p>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <DashboardClient
          stats={stats}
          eventPerformance={eventPerformance}
          sportTypeRevenue={sportTypeRevenue}
          paymentBreakdown={paymentBreakdown}
        />
      )}

    </div>
  )
}
