'use client'

import { useState, useEffect } from 'react'
import { RegistrationsTable } from './registrations-table'
import { EditRegistrationModal } from './edit-registration-modal'
import { EventCategory } from '@/types/database.types'
import { RegistrationFilters, RegistrationExportData, ShirtSizesByGender } from '@/types'
import { UpdateRegistrationData } from '@/lib/data/admin-registrations'
import { arrayToCSV, downloadCSV } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface RegistrationsPageClientProps {
  registrations: any[]
  categories: EventCategory[]
  eventId: string
  eventSlug: string
  searchParams: any
  allowsPairRegistration: boolean
  shirtSizesConfig?: ShirtSizesByGender | null
}

export function RegistrationsPageClient({
  registrations: initialRegistrations,
  categories,
  eventId,
  eventSlug,
  searchParams,
  allowsPairRegistration,
  shirtSizesConfig,
}: RegistrationsPageClientProps) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [editingRegistration, setEditingRegistration] = useState<any | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Sync registrations state when props change (after router.refresh())
  useEffect(() => {
    setRegistrations(initialRegistrations)
  }, [initialRegistrations])

  const handleFilterChange = (newFilters: RegistrationFilters) => {
    const queryParams = new URLSearchParams()
    if (newFilters.payment_status) queryParams.set('payment_status', newFilters.payment_status)
    if (newFilters.status) queryParams.set('status', newFilters.status)
    if (newFilters.category_id) queryParams.set('category_id', newFilters.category_id)
    if (newFilters.search) queryParams.set('search', newFilters.search)

    router.push(`/admin/eventos/${eventId}/inscricoes?${queryParams.toString()}`)
  }

  const handleExport = async () => {
    try {
      // Call server action to get export data
      const response = await fetch(`/api/admin/events/${eventId}/registrations/export`)
      const exportData: RegistrationExportData[] = await response.json()

      // Generate CSV
      const csv = arrayToCSV(exportData)

      // Trigger download
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `inscricoes-${eventSlug}-${timestamp}.csv`
      downloadCSV(csv, filename)
    } catch (error) {
      console.error('Error exporting registrations:', error)
      alert('Erro ao exportar inscrições. Tente novamente.')
    }
  }

  const handleDelete = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir inscrição')
      }

      // Remove from local state
      setRegistrations(prev => prev.filter(r => r.id !== registrationId))

      // Refresh the page to update stats
      router.refresh()
    } catch (error) {
      console.error('Error deleting registration:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir inscrição. Tente novamente.')
    }
  }

  const handleEdit = (registration: any) => {
    setEditingRegistration(registration)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (data: UpdateRegistrationData) => {
    if (!editingRegistration) return

    const response = await fetch(`/api/admin/registrations/${editingRegistration.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao salvar alterações')
    }

    // Refresh the page to get updated data
    router.refresh()
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingRegistration(null)
  }

  return (
    <>
      <RegistrationsTable
        registrations={registrations}
        categories={categories}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <EditRegistrationModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        registration={editingRegistration}
        categories={categories}
        allowsPairRegistration={allowsPairRegistration}
        shirtSizesConfig={shirtSizesConfig}
      />
    </>
  )
}
