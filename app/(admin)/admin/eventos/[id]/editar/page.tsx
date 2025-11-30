import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { getEventByIdForAdmin } from '@/lib/data/admin-events'
import { getCategoriesByEventId } from '@/lib/data/admin-categories'
import {
  getKitItemsByEventId,
  getCourseInfoByEventId,
  getFAQsByEventId,
  getRegulationsByEventId,
} from '@/lib/data/admin-event-details'
import {
  updateEventAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/actions/admin-events'
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

  const eventId = params.id

  // Fetch all event data in parallel
  const [
    event,
    categories,
    { data: kitItems },
    { data: courseInfo },
    { data: faqs },
    { data: regulations },
  ] = await Promise.all([
    getEventByIdForAdmin(eventId),
    getCategoriesByEventId(eventId),
    getKitItemsByEventId(eventId),
    getCourseInfoByEventId(eventId),
    getFAQsByEventId(eventId),
    getRegulationsByEventId(eventId),
  ])

  if (!event) {
    notFound()
  }

  // Bind eventId to server actions
  const boundUpdateEvent = updateEventAction.bind(null, eventId)
  const boundCreateCategory = createCategoryAction.bind(null, eventId)
  const boundUpdateCategory = updateCategoryAction.bind(null, eventId)
  const boundDeleteCategory = deleteCategoryAction.bind(null, eventId)
  const boundCreateKitItem = createKitItemAction.bind(null, eventId)
  const boundUpdateKitPickupInfo = updateKitPickupInfoAction.bind(null, eventId)
  const boundUpdateCourseInfo = updateCourseInfoAction.bind(null, eventId)
  const boundCreateFAQ = createFAQAction.bind(null, eventId)
  const boundCreateRegulation = createRegulationAction.bind(null, eventId)
  const boundUpdateRegulationPdf = updateRegulationPdfAction.bind(null, eventId)

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
          onSubmit={boundUpdateEvent}
          onCategoryCreate={boundCreateCategory}
          onCategoryUpdate={boundUpdateCategory}
          onCategoryDelete={boundDeleteCategory}
          eventDetailsSection={
            <EventDetailsTabs
              eventId={eventId}
              kitItems={kitItems || []}
              courseInfo={courseInfo}
              faqs={faqs || []}
              regulations={regulations || []}
              kitPickupInfo={event.kit_pickup_info}
              regulationPdfUrl={event.regulation_pdf_url}
              onKitItemCreate={boundCreateKitItem}
              onKitItemUpdate={updateKitItemAction}
              onKitItemDelete={deleteKitItemAction}
              onKitItemsReorder={reorderKitItemsAction}
              onCourseInfoUpdate={boundUpdateCourseInfo}
              onFAQCreate={boundCreateFAQ}
              onFAQUpdate={updateFAQAction}
              onFAQDelete={deleteFAQAction}
              onFAQsReorder={reorderFAQsAction}
              onRegulationCreate={boundCreateRegulation}
              onRegulationUpdate={updateRegulationAction}
              onRegulationDelete={deleteRegulationAction}
              onRegulationsReorder={reorderRegulationsAction}
              onKitPickupInfoUpdate={boundUpdateKitPickupInfo}
              onRegulationPdfUpdate={boundUpdateRegulationPdf}
            />
          }
        />
      </div>
    </div>
  )
}
