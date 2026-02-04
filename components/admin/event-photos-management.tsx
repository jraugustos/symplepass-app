'use client'

import { useState, useEffect } from 'react'
import { Trash2, Loader2, CheckSquare, Square, XSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotosUpload } from './photos-upload'
import { PhotosBulkUpload } from './photos-bulk-upload'
import { PhotoJobsStatus } from './photo-jobs-status'
import { FaceProcessingButton } from './face-processing-button'
import { PhotoPackagesForm } from './photo-packages-form'
import { PhotoPricingTiersForm } from './photo-pricing-tiers-form'
import { PhotoOrdersPageClient } from './photo-orders-page-client'
import { ConfirmDialog } from '@/components/ui/modal'
import type { EventPhoto, PhotoPackage, PhotoPricingTier } from '@/types/database.types'
import type { AdminPhotoOrderWithDetails, CreatePhotoData, PhotoOrderFilters } from '@/lib/data/admin-photos'
import type { PhotoPackageFormData, PhotoPricingTierFormData } from '@/types'

type TabId = 'photos' | 'pricing' | 'orders'

interface EventPhotosManagementProps {
  eventId: string
  photos: EventPhoto[]
  /** @deprecated Use pricingTiers instead */
  packages: PhotoPackage[]
  pricingTiers: PhotoPricingTier[]
  orders: AdminPhotoOrderWithDetails[]
  totalOrders: number
  isAdmin?: boolean
  onPhotoCreate: (data: Omit<CreatePhotoData, 'event_id'>) => Promise<any>
  onPhotoDelete: (photoId: string) => Promise<void>
  onPhotosReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  /** @deprecated Use onPricingTierCreate instead */
  onPackageCreate: (data: PhotoPackageFormData) => Promise<any>
  /** @deprecated Use onPricingTierUpdate instead */
  onPackageUpdate: (packageId: string, data: PhotoPackageFormData) => Promise<any>
  /** @deprecated Use onPricingTierDelete instead */
  onPackageDelete: (packageId: string) => Promise<void>
  /** @deprecated Use onPricingTiersReorder instead */
  onPackagesReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  onPricingTierCreate: (data: PhotoPricingTierFormData) => Promise<any>
  onPricingTierUpdate: (tierId: string, data: PhotoPricingTierFormData) => Promise<any>
  onPricingTierDelete: (tierId: string) => Promise<void>
  onPricingTiersReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  onFilterOrders: (filters: PhotoOrderFilters) => Promise<{ orders: AdminPhotoOrderWithDetails[]; total: number }>
  onExportOrders: (filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'>) => Promise<string>
  onDeleteOrder?: (orderId: string) => Promise<void>
}

export function EventPhotosManagement({
  eventId,
  photos,
  packages,
  pricingTiers,
  orders,
  totalOrders,
  isAdmin = false,
  onPhotoCreate,
  onPhotoDelete,
  onPhotosReorder,
  onPackageCreate,
  onPackageUpdate,
  onPackageDelete,
  onPackagesReorder,
  onPricingTierCreate,
  onPricingTierUpdate,
  onPricingTierDelete,
  onPricingTiersReorder,
  onFilterOrders,
  onExportOrders,
  onDeleteOrder,
}: EventPhotosManagementProps) {
  const [activeTab, setActiveTab] = useState<TabId>('photos')
  const [uploadMode, setUploadMode] = useState<'bulk' | 'individual'>('bulk')
  const [jobsRefreshTrigger, setJobsRefreshTrigger] = useState(0)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    description: string
    onConfirm: () => void
  }>({ open: false, description: '', onConfirm: () => {} })
  const [localPhotos, setLocalPhotos] = useState<EventPhoto[]>(photos)

  // Sync local photos with props
  useEffect(() => {
    setLocalPhotos(photos)
    // Clear selection when photos change (after delete, etc.)
    setSelectedPhotos(new Set())
  }, [photos])

  const tabs = [
    { id: 'photos' as TabId, label: 'Fotos do Evento', count: photos.length },
    { id: 'pricing' as TabId, label: 'Faixas de Preço', count: pricingTiers.length },
    { id: 'orders' as TabId, label: 'Pedidos', count: totalOrders },
  ]

  const handleJobCreated = () => {
    // Refresh the jobs list when a new job is created
    setJobsRefreshTrigger((prev) => prev + 1)
  }

  // Selection handlers
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(localPhotos.map((p) => p.id)))
  }

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return

    const count = selectedPhotos.size
    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir ${count} foto${count > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const photoIds = Array.from(selectedPhotos)
          for (const photoId of photoIds) {
            await onPhotoDelete(photoId)
          }
          setSelectedPhotos(new Set())
        } catch (err) {
          console.error('Error deleting photos:', err)
          alert('Erro ao excluir algumas fotos. Tente novamente.')
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const handleDeleteAllPhotos = () => {
    if (localPhotos.length === 0) return

    setConfirmDialog({
      open: true,
      description: `Tem certeza que deseja excluir TODAS as ${localPhotos.length} fotos? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          for (const photo of localPhotos) {
            await onPhotoDelete(photo.id)
          }
          setSelectedPhotos(new Set())
        } catch (err) {
          console.error('Error deleting all photos:', err)
          alert('Erro ao excluir algumas fotos. Tente novamente.')
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Upload Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg w-fit">
              <button
                onClick={() => setUploadMode('bulk')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  uploadMode === 'bulk'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Upload em Massa (ZIP)
              </button>
              <button
                onClick={() => setUploadMode('individual')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  uploadMode === 'individual'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Upload Individual
              </button>
            </div>

            {/* Bulk Upload Mode */}
            {uploadMode === 'bulk' && (
              <div className="space-y-6">
                <PhotosBulkUpload
                  eventId={eventId}
                  onJobCreated={handleJobCreated}
                />
                <PhotoJobsStatus
                  eventId={eventId}
                  refreshTrigger={jobsRefreshTrigger}
                />
                {/* Face Processing */}
                {localPhotos.length > 0 && (
                  <FaceProcessingButton
                    eventId={eventId}
                    photoCount={localPhotos.length}
                  />
                )}
              </div>
            )}

            {/* Individual Upload Mode */}
            {uploadMode === 'individual' && (
              <PhotosUpload
                eventId={eventId}
                photos={photos}
                onPhotoCreate={onPhotoCreate}
                onPhotoDelete={onPhotoDelete}
                onPhotosReorder={onPhotosReorder}
              />
            )}

            {/* Photo Gallery - Always visible when in photos tab */}
            {localPhotos.length > 0 && uploadMode === 'bulk' && (
              <div className="border-t border-neutral-200 pt-6">
                {/* Header with selection controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h4 className="font-medium">Fotos do Evento ({localPhotos.length})</h4>
                  <div className="flex items-center gap-2">
                    {/* Selection buttons */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectedPhotos.size === localPhotos.length ? deselectAllPhotos : selectAllPhotos}
                      disabled={isDeleting}
                    >
                      {selectedPhotos.size === localPhotos.length ? (
                        <>
                          <XSquare className="h-4 w-4 mr-1" />
                          Desmarcar
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-1" />
                          Selecionar Todas
                        </>
                      )}
                    </Button>
                    {/* Delete selected button */}
                    {selectedPhotos.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Excluir {selectedPhotos.size}
                      </Button>
                    )}
                    {/* Delete all button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAllPhotos}
                      disabled={isDeleting || localPhotos.length === 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir Todas
                    </Button>
                  </div>
                </div>

                {/* Selection info */}
                {selectedPhotos.size > 0 && (
                  <div className="mb-4 p-2 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
                    {selectedPhotos.size} foto{selectedPhotos.size > 1 ? 's' : ''} selecionada{selectedPhotos.size > 1 ? 's' : ''}
                  </div>
                )}

                {/* Photo grid with selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {localPhotos.map((photo, index) => {
                    const isSelected = selectedPhotos.has(photo.id)
                    return (
                      <div
                        key={photo.id}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="aspect-square bg-neutral-100">
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos-watermarked/${photo.thumbnail_path}`}
                            alt={photo.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {/* Selection checkbox */}
                        <div className={`absolute top-2 right-2 p-0.5 rounded ${isSelected ? 'bg-primary-500' : 'bg-black/40'}`}>
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-white" />
                          ) : (
                            <Square className="h-4 w-4 text-white" />
                          )}
                        </div>
                        {/* Order badge */}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-neutral-500 mt-4">
                  Clique nas fotos para selecioná-las. Use os botões acima para ações em massa.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <PhotoPricingTiersForm
            eventId={eventId}
            tiers={pricingTiers}
            onCreate={onPricingTierCreate}
            onUpdate={onPricingTierUpdate}
            onDelete={onPricingTierDelete}
            onReorder={onPricingTiersReorder}
          />
        )}

        {activeTab === 'orders' && (
          <PhotoOrdersPageClient
            eventId={eventId}
            initialOrders={orders}
            initialTotal={totalOrders}
            isAdmin={isAdmin}
            onFilterOrders={onFilterOrders}
            onExportOrders={onExportOrders}
            onDeleteOrder={onDeleteOrder}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title="Confirmar exclusão"
        description={confirmDialog.description}
        confirmText="Excluir"
        cancelText="Cancelar"
        destructive
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}
