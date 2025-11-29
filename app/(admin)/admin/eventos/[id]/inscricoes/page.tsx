import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Users, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'
import { getCategoriesByEventId } from '@/lib/data/admin-categories'
import {
  getRegistrationsByEventId,
  getRegistrationStats,
} from '@/lib/data/admin-registrations'
import { RegistrationsPageClient } from '@/components/admin/registrations-page-client'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RegistrationFilters } from '@/types'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await getEventByIdForAdmin(params.id)

  return {
    title: event
      ? `Inscrições ${event.title} - Admin Symplepass`
      : 'Inscrições - Admin Symplepass',
  }
}

interface SearchParams {
  payment_status?: string
  status?: string
  category_id?: string
  search?: string
  page?: string
}

export default async function InscricoesEventoPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const event = await getEventByIdForAdmin(params.id)

  if (!event) {
    notFound()
  }

  const categories = await getCategoriesByEventId(params.id)

  const filters: RegistrationFilters = {
    payment_status: searchParams.payment_status as any,
    status: searchParams.status as any,
    category_id: searchParams.category_id,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 50,
  }

  const { registrations, total } = await getRegistrationsByEventId(params.id, filters)
  const stats = await getRegistrationStats(params.id)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <Link href="/admin/dashboard" className="hover:text-neutral-900">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/eventos" className="hover:text-neutral-900">
          Eventos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-neutral-900 font-medium">Inscrições</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Inscrições: {event.title}</h1>
        <p className="text-neutral-600 mt-1">Gerencie as inscrições e visualize estatísticas</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total de Inscrições</p>
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
                <p className="text-sm text-neutral-600">Receita Confirmada</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(stats.confirmedRevenue)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Registrations Table */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <RegistrationsPageClient
          registrations={registrations}
          categories={categories}
          eventId={params.id}
          eventSlug={event.slug}
          searchParams={searchParams}
        />
      </div>
    </div>
  )
}
