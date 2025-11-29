import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getAllEventsForAdmin, updateEventStatus, deleteEvent } from '@/lib/data/admin-events'
import { Button } from '@/components/ui/button'
import { EventsTableWrapper } from '@/components/admin/events-table-wrapper'
import { EventsFilters } from '@/components/admin/events-filters'
import { EventsPagination } from '@/components/admin/events-pagination'
import { revalidatePath } from 'next/cache'
import type { AdminEventFilters } from '@/types'
import { EventStatus, SportType } from '@/types/database.types'

interface SearchParams {
  status?: string
  sport_type?: string
  search?: string
  page?: string
}

export const metadata = {
  title: 'Eventos - Admin Symplepass',
}

export default async function EventosAdminPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const { user, profile } = result

  const filters: AdminEventFilters = {
    status: searchParams.status as EventStatus | undefined,
    sport_type: searchParams.sport_type as SportType | undefined,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 20,
  }

  const { events, total, page, pageSize } = await getAllEventsForAdmin(filters)

  async function updateEventStatusAction(eventId: string, status: EventStatus) {
    'use server'
    const result = await getCurrentUser()
    if (!result || !result.profile) {
      throw new Error('User not authenticated')
    }

    const updateResult = await updateEventStatus(eventId, status, result.user.id, result.profile.role)

    if (updateResult.error) {
      throw new Error(updateResult.error)
    }

    revalidatePath('/admin/eventos')
    revalidatePath(`/admin/eventos/${eventId}/editar`)
  }

  async function deleteEventAction(eventId: string) {
    'use server'
    const result = await getCurrentUser()
    if (!result || !result.profile) {
      throw new Error('Não autorizado')
    }

    const deleteResult = await deleteEvent(eventId, result.user.id, result.profile.role, false)

    if (deleteResult.error) {
      throw new Error(deleteResult.error)
    }

    revalidatePath('/admin/eventos')
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gerenciar Eventos</h1>
          <p className="text-neutral-600 mt-1">
            {total} evento{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/eventos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Evento
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <EventsFilters
        initialSearch={filters.search}
        initialStatus={filters.status}
        initialSportType={filters.sport_type}
      />

      {/* Events Table */}
      <EventsTableWrapper
        events={events}
        onStatusChange={updateEventStatusAction}
        onDelete={deleteEventAction}
      />

      {/* Pagination */}
      <EventsPagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
