'use client'

import { useState, useCallback } from 'react'
import { Camera, ImageIcon, ImagePlus } from 'lucide-react'
import { PhotoGrid, PhotoLightbox, PhotoCart } from '@/components/photos'
import { usePhotoCart } from '@/lib/hooks/use-photo-cart'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'
import { cn } from '@/lib/utils'
import type { PhotoPackage } from '@/types/database.types'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'

interface EventPhotosProps {
  eventId: string
  photos: EventPhotoWithUrls[]
  packages: PhotoPackage[]
}

export default function EventPhotos({ eventId, photos, packages }: EventPhotosProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhotoWithUrls | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const {
    selectedIds,
    selectedCount,
    togglePhoto,
    removePhoto,
    clearCart,
    isSelected,
    bestPackage,
    totalPrice,
    pricePerPhoto,
    getSelectedPhotos,
  } = usePhotoCart(eventId, packages)

  const handlePhotoClick = useCallback((photo: EventPhotoWithUrls) => {
    setLightboxPhoto(photo)
    setIsLightboxOpen(true)
  }, [])

  const handleLightboxClose = useCallback(() => {
    setIsLightboxOpen(false)
    setLightboxPhoto(null)
  }, [])

  const handleLightboxNext = useCallback(() => {
    if (!lightboxPhoto) return
    const currentIndex = photos.findIndex((p) => p.id === lightboxPhoto.id)
    if (currentIndex < photos.length - 1) {
      setLightboxPhoto(photos[currentIndex + 1])
    }
  }, [lightboxPhoto, photos])

  const handleLightboxPrevious = useCallback(() => {
    if (!lightboxPhoto) return
    const currentIndex = photos.findIndex((p) => p.id === lightboxPhoto.id)
    if (currentIndex > 0) {
      setLightboxPhoto(photos[currentIndex - 1])
    }
  }, [lightboxPhoto, photos])

  const handleLightboxToggleSelection = useCallback(() => {
    if (lightboxPhoto) {
      togglePhoto(lightboxPhoto.id)
    }
  }, [lightboxPhoto, togglePhoto])

  const handleCheckout = useCallback(() => {
    const photoIdsParam = selectedIds.join(',')
    window.location.href = `/fotos/checkout?eventId=${eventId}&photoIds=${photoIdsParam}`
  }, [eventId, selectedIds])

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <div className="flex items-center gap-3 mb-2">
            <Camera className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl sm:text-3xl font-semibold font-geist">Fotos do Evento</h2>
          </div>
          <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200">
            <ImageIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg">Fotos em breve</p>
            <p className="text-neutral-500 text-sm mt-2">
              As fotos do evento serão disponibilizadas após a conclusão.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const selectedPhotos = getSelectedPhotos(photos)

  return (
    <div className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl sm:text-3xl font-semibold font-geist">Fotos do Evento</h2>
            </div>
            <p className="text-neutral-600">
              Selecione as fotos que deseja adquirir
            </p>
          </div>
          {selectedCount > 0 && (
            <div className="hidden sm:block text-right">
              <p className="text-sm text-neutral-500">
                {selectedCount} {selectedCount === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </p>
            </div>
          )}
        </div>

        {/* Package cards */}
        {packages.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-neutral-700 mb-3">Pacotes disponíveis:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const pricePerPhoto = Number(pkg.price) / Number(pkg.quantity)
                const isCurrentPackage = bestPackage?.id === pkg.id

                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      'relative rounded-xl border p-4 transition-all',
                      isCurrentPackage
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-400'
                        : 'border-neutral-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                    )}
                  >
                    {isCurrentPackage && (
                      <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                        Selecionado
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ImagePlus className={cn(
                            'w-4 h-4',
                            isCurrentPackage ? 'text-orange-600' : 'text-neutral-400'
                          )} />
                          <span className={cn(
                            'font-semibold',
                            isCurrentPackage ? 'text-orange-900' : 'text-neutral-900'
                          )}>
                            {pkg.name}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pricePerPhoto)}/foto
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-lg font-bold',
                          isCurrentPackage ? 'text-orange-600' : 'text-neutral-900'
                        )}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pkg.price))}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Photo grid */}
        <PhotoGrid
          photos={photos}
          selectedIds={selectedIds}
          onPhotoToggle={togglePhoto}
          onPhotoClick={handlePhotoClick}
        />

        {/* Photo count info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            {photos.length} {photos.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        isOpen={isLightboxOpen}
        photo={lightboxPhoto}
        photos={photos}
        isSelected={lightboxPhoto ? isSelected(lightboxPhoto.id) : false}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
        onToggleSelection={handleLightboxToggleSelection}
      />

      {/* Floating cart */}
      <PhotoCart
        eventId={eventId}
        selectedPhotos={selectedPhotos}
        bestPackage={bestPackage}
        totalPrice={totalPrice}
        pricePerPhoto={pricePerPhoto}
        onRemovePhoto={removePhoto}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  )
}
