'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Users, MoreVertical, Check, X, Eye, EyeOff, Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Event, EventStatus } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/modal'

interface EventsTableProps {
  events: Event[]
  onEdit: (eventId: string) => void
  onViewRegistrations: (eventId: string) => void
  onStatusChange: (eventId: string, status: EventStatus) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

export function EventsTable({
  events,
  onEdit,
  onViewRegistrations,
  onStatusChange,
  onDelete,
}: EventsTableProps) {
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusBadgeVariant = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'published_no_registration':
        return 'warning'
      case 'draft':
        return 'neutral'
      case 'cancelled':
        return 'error'
      case 'completed':
        return 'info'
      default:
        return 'neutral'
    }
  }

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case 'published':
        return 'Publicado'
      case 'published_no_registration':
        return 'Publicado - sem inscrições'
      case 'draft':
        return 'Rascunho'
      case 'cancelled':
        return 'Cancelado'
      case 'completed':
        return 'Concluído'
      default:
        return status
    }
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    setLoadingEventId(eventToDelete)
    try {
      await onDelete(eventToDelete)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      setOpenDropdownId(null)
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Erro ao deletar evento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoadingEventId(null)
    }
  }

  const handleStatusChange = async (eventId: string, status: EventStatus) => {
    setLoadingEventId(eventId)
    setOpenDropdownId(null)
    try {
      await onStatusChange(eventId, status)
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('Erro ao atualizar status: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoadingEventId(null)
    }
  }

  const toggleDropdown = (eventId: string) => {
    setOpenDropdownId(openDropdownId === eventId ? null : eventId)
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Esporte
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
          <tbody className="bg-white divide-y divide-neutral-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {event.banner_url && (
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-20 h-15 object-cover rounded"
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
                  {event.sport_type}
                </td>
                <td className="px-4 py-4 text-sm text-neutral-600">
                  {formatDate(event.start_date)}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={getStatusBadgeVariant(event.status)}>
                    {getStatusLabel(event.status)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(event.id)}
                      disabled={loadingEventId === event.id}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewRegistrations(event.id)}
                      disabled={loadingEventId === event.id}
                      title="Ver inscrições"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <div className="relative" ref={openDropdownId === event.id ? dropdownRef : null}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleDropdown(event.id)}
                        disabled={loadingEventId === event.id}
                        title="Mais ações"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {openDropdownId === event.id && (
                        <div className="absolute right-0 mt-1 w-56 rounded-lg bg-white shadow-lg border border-neutral-200 py-1 z-10">
                          {event.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(event.id, 'published')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Publicar com inscrições
                              </button>
                              <button
                                onClick={() => handleStatusChange(event.id, 'published_no_registration')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" />
                                Publicar sem inscrições
                              </button>
                            </>
                          )}
                          {event.status === 'published_no_registration' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(event.id, 'published')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Abrir inscrições
                              </button>
                              <button
                                onClick={() => handleStatusChange(event.id, 'draft')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" />
                                Despublicar
                              </button>
                            </>
                          )}
                          {event.status === 'published' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(event.id, 'published_no_registration')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" />
                                Fechar inscrições
                              </button>
                              <button
                                onClick={() => handleStatusChange(event.id, 'draft')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <EyeOff className="h-4 w-4" />
                                Despublicar
                              </button>
                            </>
                          )}
                          {(event.status === 'published' || event.status === 'published_no_registration' || event.status === 'draft') && (
                            <button
                              onClick={() => handleStatusChange(event.id, 'completed')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Marcar como concluído
                            </button>
                          )}
                          {event.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusChange(event.id, 'cancelled')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancelar evento
                            </button>
                          )}
                          <hr className="my-1 border-neutral-200" />
                          <button
                            onClick={() => {
                              setEventToDelete(event.id)
                              setDeleteDialogOpen(true)
                              setOpenDropdownId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Archive className="h-4 w-4" />
                            Deletar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg border border-neutral-200 p-4">
            {event.banner_url && (
              <img
                src={event.banner_url}
                alt={event.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            <h3 className="font-semibold text-neutral-900 mb-1">{event.title}</h3>
            <p className="text-sm text-neutral-500 mb-3">
              {typeof event.location === 'object' && event.location !== null
                ? `${event.location.city}, ${event.location.state}`
                : ''} • {formatDate(event.start_date)}
            </p>
            <Badge variant={getStatusBadgeVariant(event.status)} className="mb-3">
              {getStatusLabel(event.status)}
            </Badge>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(event.id)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewRegistrations(event.id)}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-1" />
                Inscrições
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Deletar Evento"
        description="Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
