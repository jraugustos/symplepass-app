import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAdminDashboardStats } from '@/lib/data/admin-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

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
  const stats = await getAdminDashboardStats()

  const totalEvents = stats?.totalEvents ?? 0
  const totalRegistrations = stats?.totalRegistrations ?? 0
  const totalRevenue = stats?.totalRevenue ?? 0
  const activeEvents = stats?.activeEvents ?? 0

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-500">Painel administrativo</p>
        <h1 className="text-3xl font-bold text-neutral-900">
          Bem-vindo ao painel, {profile?.full_name || 'Admin'}
        </h1>
        <p className="mt-1 text-neutral-600">
          Acompanhe métricas importantes e gerencie suas operações com segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de eventos</CardTitle>
            <CardDescription>Eventos criados na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{totalEvents || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inscrições</CardTitle>
            <CardDescription>Total acumulado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{totalRegistrations || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receita</CardTitle>
            <CardDescription>Pagamentos confirmados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eventos ativos</CardTitle>
            <CardDescription>Publicados e visíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neutral-900">{activeEvents || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas ações</CardTitle>
          <CardDescription>Crie novos eventos ou analise relatórios rapidamente</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Button asChild className="flex-1">
            <a href="/admin/eventos/novo">Criar novo evento</a>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <a href="/admin/relatorios">Ver relatórios</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
