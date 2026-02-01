'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { EventsTable } from './events-table'
import { Event, EventStatus } from '@/types/database.types'
import { toast } from 'sonner'

interface EventsTableWrapperProps {
  events: Event[]
  onStatusChange: (eventId: string, status: EventStatus) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
  success?: boolean
}

export function EventsTableWrapper({
  events,
  onStatusChange,
  onDelete,
  success,
}: EventsTableWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (success) {
      toast.success('Evento criado com sucesso! Aguardando aprovação.', {
        duration: 5000,
        description: 'Seu evento será analisado pela administração em breve.'
      })

      // Clean up URL to avoid showing toast again on refresh
      const params = new URLSearchParams(searchParams.toString())
      params.delete('created')
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [success, pathname, router, searchParams])

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