'use client'

import { useState, useCallback, useEffect } from 'react'
import { Camera, ImageIcon, TrendingDown, Check, Search } from 'lucide-react'
import { PhotoGrid, PhotoLightbox, PhotoCart } from '@/components/photos'
import { PhotoFaceSearch } from '@/components/photos/photo-face-search'
import { usePhotoCart } from '@/lib/hooks/use-photo-cart'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'
import { cn, formatCurrency } from '@/lib/utils'
import type { PhotoPackage, PhotoPricingTier } from '@/types/database.types'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'

interface EventPhotosProps {
  eventId: string
  photos: EventPhotoWithUrls[]
  /** @deprecated Use pricingTiers instead */
  packages: PhotoPackage[]
  pricingTiers: PhotoPricingTier[]
  /** Whether face search is available for this event */
  faceSearchAvailable?: boolean
}

export default function EventPhotos({ eventId, photos, packages, pricingTiers, faceSearchAvailable = false }: EventPhotosProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhotoWithUrls | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isFaceSearchOpen, setIsFaceSearchOpen] = useState(false)

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
    appliedTier,
    formattedTiers,
    savings,
  } = usePhotoCart(eventId, packages, pricingTiers)

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
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-neutral-500">
                  {selectedCount} {selectedCount === 1 ? 'foto selecionada' : 'fotos selecionadas'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Face search button */}
        {faceSearchAvailable && (
          <div className="mb-6">
            <button
              onClick={() => setIsFaceSearchOpen(true)}
              className={cn(
                'w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl',
                'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium',
                'hover:from-orange-600 hover:to-amber-600 transition-all',
                'shadow-md hover:shadow-lg'
              )}
            >
              <Search className="w-5 h-5" />
              Encontrar suas fotos
            </button>
            <p className="text-xs text-neutral-500 mt-2">
              Use reconhecimento facial para encontrar suas fotos automaticamente
            </p>
          </div>
        )}

        {/* Pricing tiers cards */}
        {formattedTiers.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-neutral-700 mb-3">Faixas de preço:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {formattedTiers.map((tier, index) => {
                const isCurrentTier = appliedTier?.id === tier.id
                const isBaseTier = tier.minQty === 1
                const basePricePerPhoto = formattedTiers[0]?.pricePerPhoto || tier.pricePerPhoto
                const discountPercentage = !isBaseTier && basePricePerPhoto > 0
                  ? Math.round(((basePricePerPhoto - tier.pricePerPhoto) / basePricePerPhoto) * 100)
                  : null

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      'relative rounded-xl border p-4 transition-all',
                      isCurrentTier
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-400'
                        : 'border-neutral-200 bg-white'
                    )}
                  >
                    {isCurrentTier && selectedCount > 0 && (
                      <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Sua faixa
                      </div>
                    )}
                    {discountPercentage && discountPercentage > 0 && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {discountPercentage}% off
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className={cn(
                        'font-semibold mb-1',
                        isCurrentTier ? 'text-orange-900' : 'text-neutral-900'
                      )}>
                        {tier.label}
                      </span>
                      <p className={cn(
                        'text-2xl font-bold',
                        isCurrentTier ? 'text-orange-600' : 'text-neutral-900'
                      )}>
                        {formatCurrency(tier.pricePerPhoto)}
                        <span className="text-sm font-normal text-neutral-500">/foto</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {savings && selectedCount > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Você está economizando {savings.percentage}% ({formatCurrency(savings.amount)})
                </p>
              </div>
            )}
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
        appliedTier={appliedTier}
        totalPrice={totalPrice}
        pricePerPhoto={pricePerPhoto}
        savings={savings}
        onRemovePhoto={removePhoto}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />

      {/* Face search modal */}
      <PhotoFaceSearch
        eventId={eventId}
        isOpen={isFaceSearchOpen}
        onClose={() => setIsFaceSearchOpen(false)}
        onPhotoSelect={togglePhoto}
        selectedPhotoIds={selectedIds}
      />
    </div>
  )
}
