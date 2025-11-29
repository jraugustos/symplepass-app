import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Users, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  getUserById,
  getUserRegistrations,
  getUserPaymentHistory,
  getUserStats,
} from '@/lib/data/admin-users'
import { UserDetailCardClient } from '@/components/admin/user-detail-card-client'
import { UserRegistrationsTable } from '@/components/admin/user-registrations-table'
import { UserPaymentHistoryTable } from '@/components/admin/user-payment-history-table'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { user } = await getUserById(params.id)

  return {
    title: user
      ? `${user.full_name} - Usuários - Admin Symplepass`
      : 'Usuário - Admin Symplepass',
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

  const { registrations } = await getUserRegistrations(params.id)
  const { payments } = await getUserPaymentHistory(params.id)
  const stats = await getUserStats(params.id)

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

      {/* Registrations */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Inscrições ({registrations.length})
        </h2>
        <UserRegistrationsTable registrations={registrations} />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Histórico de Pagamentos ({payments.length})
        </h2>
        <UserPaymentHistoryTable payments={payments} />
      </div>
    </div>
  )
}
