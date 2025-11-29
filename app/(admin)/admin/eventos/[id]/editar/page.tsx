import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getEventByIdForAdmin, updateEvent } from '@/lib/data/admin-events'
import {
  getCategoriesByEventId,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/data/admin-categories'
import {
  getKitItemsByEventId,
  getCourseInfoByEventId,
  getFAQsByEventId,
  getRegulationsByEventId,
} from '@/lib/data/admin-event-details'
import {
  createKitItemAction,
  updateKitItemAction,
  deleteKitItemAction,
  reorderKitItemsAction,
  updateKitPickupInfoAction,
  updateCourseInfoAction,
  createFAQAction,
  updateFAQAction,
  deleteFAQAction,
  reorderFAQsAction,
  createRegulationAction,
  updateRegulationAction,
  deleteRegulationAction,
  reorderRegulationsAction,
  updateRegulationPdfAction,
} from '@/app/actions/event-details'
import { EventForm, EventDetailsTabs } from '@/components/admin'
import { EventFormDataAdmin, CategoryFormData } from '@/types'
import { revalidatePath } from 'next/cache'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await getEventByIdForAdmin(params.id)

  return {
    title: event ? `Editar ${event.title} - Admin Symplepass` : 'Editar Evento - Admin Symplepass',
  }
}

export default async function EditarEventoPage({ params }: { params: { id: string } }) {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  const { user, profile } = result

  // Fetch all event data in parallel
  const [
    event,
    categories,
    { data: kitItems },
    { data: courseInfo },
    { data: faqs },
    { data: regulations },
  ] = await Promise.all([
    getEventByIdForAdmin(params.id),
    getCategoriesByEventId(params.id),
    getKitItemsByEventId(params.id),
    getCourseInfoByEventId(params.id),
    getFAQsByEventId(params.id),
    getRegulationsByEventId(params.id),
  ])

  if (!event) {
    notFound()
  }

  async function updateEventAction(data: EventFormDataAdmin) {
    'use server'
    const result = await getCurrentUser()
    if (!result || !result.user || !result.profile) {
      throw new Error('User not authenticated')
    }

    const updateResult = await updateEvent(
      params.id,
      {
        title: data.title,
        description: data.description,
        location: data.location,
        start_date: data.start_date,
        sport_type: data.sport_type as any,
        event_type: data.event_type,
        event_format: data.event_format,
        banner_url: data.banner_url,
        end_date: data.end_date,
        max_participants: data.max_participants,
        registration_start: data.registration_start,
        registration_end: data.registration_end,
        solidarity_message: data.solidarity_message,
        status: data.status as any,
        is_featured: data.is_featured,
        allows_pair_registration: data.allows_pair_registration,
        shirt_sizes: data.shirt_sizes,
        shirt_sizes_config: data.shirt_sizes_config,
      },
      result.user.id,
      result.profile.role
    )

    if (updateResult.error) {
      throw new Error(updateResult.error)
    }

    revalidatePath(`/admin/eventos/${params.id}/editar`)
    revalidatePath('/admin/eventos')
  }

  async function createCategoryAction(data: CategoryFormData) {
    'use server'
    const result = await createCategory({
      event_id: params.id,
      name: data.name,
      price: data.price,
      description: data.description,
      max_participants: data.max_participants,
    })

    if (result.error) {
      throw new Error(result.error)
    }

    revalidatePath(`/admin/eventos/${params.id}/editar`)
  }

  async function updateCategoryAction(categoryId: string, data: CategoryFormData) {
    'use server'
    const result = await updateCategory(categoryId, data, params.id)

    if (result.error) {
      throw new Error(result.error)
    }

    revalidatePath(`/admin/eventos/${params.id}/editar`)
  }

  async function deleteCategoryAction(categoryId: string) {
    'use server'
    const result = await deleteCategory(categoryId)

    if (result.error) {
      throw new Error(result.error)
    }

    revalidatePath(`/admin/eventos/${params.id}/editar`)
  }

  // Wrapper functions for event details actions to bind eventId where needed
  async function handleKitItemCreate(data: any) {
    'use server'
    await createKitItemAction(params.id, data)
  }

  async function handleKitPickupUpdate(data: any) {
    'use server'
    await updateKitPickupInfoAction(params.id, data)
  }

  async function handleCourseInfoUpdate(data: any) {
    'use server'
    await updateCourseInfoAction(params.id, data)
  }

  async function handleFAQCreate(data: any) {
    'use server'
    await createFAQAction(params.id, data)
  }

  async function handleRegulationCreate(data: any) {
    'use server'
    await createRegulationAction({ ...data, event_id: params.id })
  }

  async function handleRegulationPdfUpdate(url: string) {
    'use server'
    await updateRegulationPdfAction(params.id, url)
  }

  return (
    <div className="space-y-6 pb-10">
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
        <span className="text-neutral-900 font-medium">Editar</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Editar Evento: {event.title}</h1>
        <p className="text-neutral-600 mt-1">Gerencie as informações e categorias do evento</p>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl space-y-8">
        <EventForm
          event={event}
          categories={categories}
          kitItems={kitItems || []}
          onSubmit={updateEventAction}
          onCategoryCreate={createCategoryAction}
          onCategoryUpdate={updateCategoryAction}
          onCategoryDelete={deleteCategoryAction}
          eventDetailsSection={
            <EventDetailsTabs
              eventId={params.id}
              kitItems={kitItems || []}
              courseInfo={courseInfo}
              faqs={faqs || []}
              regulations={regulations || []}
              kitPickupInfo={event.kit_pickup_info}
              regulationPdfUrl={event.regulation_pdf_url}
              onKitItemCreate={handleKitItemCreate}
              onKitItemUpdate={updateKitItemAction}
              onKitItemDelete={deleteKitItemAction}
              onKitItemsReorder={reorderKitItemsAction}
              onCourseInfoUpdate={handleCourseInfoUpdate}
              onFAQCreate={handleFAQCreate}
              onFAQUpdate={updateFAQAction}
              onFAQDelete={deleteFAQAction}
              onFAQsReorder={reorderFAQsAction}
              onRegulationCreate={handleRegulationCreate}
              onRegulationUpdate={updateRegulationAction}
              onRegulationDelete={deleteRegulationAction}
              onRegulationsReorder={reorderRegulationsAction}
              onKitPickupInfoUpdate={handleKitPickupUpdate}
              onRegulationPdfUpdate={handleRegulationPdfUpdate}
            />
          }
        />
      </div>
    </div>
  )
}
