import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Users, DollarSign, CheckCircle, Clock, Calendar, Eye, Pencil } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  getUserById,
  getUserRegistrations,
  getUserPaymentHistory,
  getUserStats,
} from '@/lib/data/admin-users'
import { getEventsForOrganizer } from '@/lib/data/admin-events'
import { UserDetailCardClient } from '@/components/admin/user-detail-card-client'
import { UserRegistrationsTable } from '@/components/admin/user-registrations-table'
import { UserPaymentHistoryTable } from '@/components/admin/user-payment-history-table'
import { UserPreferencesAdmin } from '@/components/admin/user-preferences-admin'
import { UserPhotoOrdersAdmin } from '@/components/admin/user-photo-orders-admin'
import { getUserPreferences } from '@/lib/data/user-preferences'
import { getUserPhotoOrders } from '@/lib/data/photo-orders'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EventStatus } from '@/types/database.types'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { user } = await getUserById(params.id)

  return {
    title: user
      ? `${user.full_name} - Usuários - Admin Symplepass`
      : 'Usuário - Admin Symplepass',
  }
}

function getStatusLabel(status: EventStatus) {
  switch (status) {
    case 'published': return 'Publicado'
    case 'published_no_registration': return 'Publicado - sem inscrições'
    case 'draft': return 'Rascunho'
    case 'pending_approval': return 'Aguardando aprovação'
    case 'cancelled': return 'Cancelado'
    case 'completed': return 'Concluído'
    default: return status
  }
}

function getStatusBadgeVariant(status: EventStatus) {
  switch (status) {
    case 'published': return 'success' as const
    case 'published_no_registration': return 'warning' as const
    case 'draft': return 'neutral' as const
    case 'pending_approval': return 'warning' as const
    case 'cancelled': return 'error' as const
    case 'completed': return 'info' as const
    default: return 'neutral' as const
  }
}

export default async function UsuarioDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || result.profile.role !== 'admin') {
    redirect('/login')
  }

  const { user, error } = await getUserById(params.id)

  if (!user || error) {
    notFound()
  }

  const isOrganizer = user.role === 'organizer'

  if (isOrganizer) {
    // Organizer view: show their events
    const result = await getEventsForOrganizer(params.id)
    const events = result.events as any[]
    const total = result.total

    const publishedCount = events.filter(e => e.status === 'published' || e.status === 'published_no_registration').length
    const pendingCount = events.filter(e => e.status === 'pending_approval').length
    const completedCount = events.filter(e => e.status === 'completed').length

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-600">
          <Link href="/admin/dashboard" className="hover:text-neutral-900">
            Admin
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/admin/usuarios" className="hover:text-neutral-900">
            Usuários
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-neutral-900 font-medium">{user.full_name}</span>
        </nav>

        {/* User Detail Card */}
        <UserDetailCardClient user={user} canEditRole={true} />

        {/* Organizer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total Eventos</p>
                <p className="text-2xl font-bold text-neutral-900">{total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Eye className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Publicados</p>
                <p className="text-2xl font-bold text-neutral-900">{publishedCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Pendentes</p>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Concluídos</p>
                <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Organizer Events Table */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Eventos do Organizador ({total})
          </h2>
          {events.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhum evento cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {event.banner_url && (
                            <img
                              src={event.banner_url}
                              alt={event.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-neutral-900">{event.title}</p>
                            <p className="text-sm text-neutral-500">
                              {typeof event.location === 'object' && event.location !== null
                                ? `${event.location.city}, ${event.location.state}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {formatDate(event.start_date)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={getStatusBadgeVariant(event.status)}>
                          {getStatusLabel(event.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/admin/eventos/${event.id}/editar`}>
                          <Button size="sm" variant="ghost" title="Editar evento">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular user (athlete) view
  const [
    { registrations },
    { payments },
    stats,
    { data: preferences },
    { data: photoOrders }
  ] = await Promise.all([
    getUserRegistrations(params.id),
    getUserPaymentHistory(params.id),
    getUserStats(params.id),
    getUserPreferences(params.id),
    getUserPhotoOrders(params.id)
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/usuarios" className="hover:text-neutral-900">
          Usuários
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">{user.full_name}</span>
      </nav>

      {/* User Detail Card */}
      <UserDetailCardClient user={user} canEditRole={true} />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total Inscrições</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalRegistrations}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Confirmadas</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.confirmedRegistrations}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Pendentes</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.pendingRegistrations}
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
                <p className="text-sm text-neutral-600">Total Gasto</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Registrations */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Inscrições ({registrations.length})
            </h2>
            <UserRegistrationsTable registrations={registrations} />
          </div>

          {/* Photo Orders */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Pedidos de Fotos ({photoOrders?.length || 0})
            </h2>
            <UserPhotoOrdersAdmin orders={photoOrders || []} />
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Histórico de Pagamentos ({payments.length})
            </h2>
            <UserPaymentHistoryTable payments={payments} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Preferences */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Preferências
            </h2>
            <UserPreferencesAdmin preferences={preferences} />
          </div>
        </div>
      </div>
    </div>
  )
}
