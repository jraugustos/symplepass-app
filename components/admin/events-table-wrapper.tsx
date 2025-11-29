'use client'

import { useRouter } from 'next/navigation'
import { EventsTable } from './events-table'
import { Event, EventStatus } from '@/types/database.types'

interface EventsTableWrapperProps {
  events: Event[]
  onStatusChange: (eventId: string, status: EventStatus) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

export function EventsTableWrapper({
  events,
  onStatusChange,
  onDelete,
}: EventsTableWrapperProps) {
  const router = useRouter()

  const handleEdit = (eventId: string) => {
    router.push(`/admin/eventos/${eventId}/editar`)
  }

  const handleViewRegistrations = (eventId: string) => {
    router.push(`/admin/eventos/${eventId}/inscricoes`)
  }

  return (
    <EventsTable
      events={events}
      onEdit={handleEdit}
      onViewRegistrations={handleViewRegistrations}
      onStatusChange={onStatusChange}
      onDelete={onDelete}
    />
  )
}