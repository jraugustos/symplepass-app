import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/actions'
import { createEvent } from '@/lib/data/admin-events'
import { EventForm } from '@/components/admin'
import { EventFormDataAdmin } from '@/types'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'Criar Evento - Admin Symplepass',
}

export default async function NovoEventoPage() {
  const result = await getCurrentUser()

  if (!result || !result.profile || (result.profile.role !== 'admin' && result.profile.role !== 'organizer')) {
    redirect('/login')
  }

  async function createEventAction(data: EventFormDataAdmin) {
    'use server'
    const result = await getCurrentUser()
    if (!result || !result.user) {
      throw new Error('User not authenticated')
    }

    const createResult = await createEvent({
      title: data.title,
      description: data.description,
      location: data.location,
      start_date: data.start_date,
      sport_type: data.sport_type as any,
      event_type: data.event_type,
      event_format: data.event_format,
      organizer_id: result.user.id,
      banner_url: data.banner_url,
      end_date: data.end_date,
      max_participants: data.max_participants,
      registration_start: data.registration_start,
      registration_end: data.registration_end,
      solidarity_message: data.solidarity_message,
      status: data.status as any,
      is_featured: data.is_featured,
    })

    if (createResult.error) {
      throw new Error(createResult.error)
    }

    revalidatePath('/admin/eventos')
    redirect(`/admin/eventos/${createResult.data?.id}/editar`)
  }

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
        <span className="text-neutral-900 font-medium">Novo</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Criar Novo Evento</h1>
        <p className="text-neutral-600 mt-1">
          Preencha as informações abaixo para criar um novo evento
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <EventForm onSubmit={createEventAction} />
      </div>
    </div>
  )
}
