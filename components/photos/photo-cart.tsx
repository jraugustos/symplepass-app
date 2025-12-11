'use client'

import { useState } from 'react'
import { ShoppingCart, X, Trash2, ChevronUp, ChevronDown, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PhotoPackage } from '@/types/database.types'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'

interface PhotoCartProps {
  eventId: string
  selectedPhotos: EventPhotoWithUrls[]
  bestPackage: PhotoPackage | null
  totalPrice: number
  pricePerPhoto: number
  onRemovePhoto: (photoId: string) => void
  onClearCart: () => void
  onCheckout: () => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}

export default function PhotoCart({
  eventId,
  selectedPhotos,
  bestPackage,
  totalPrice,
  pricePerPhoto,
  onRemovePhoto,
  onClearCart,
  onCheckout,
}: PhotoCartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const photoCount = selectedPhotos.length

  if (photoCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300 ease-out',
        'w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-custom-xl border border-neutral-200 overflow-hidden',
          'transform transition-all duration-300'
        )}
      >
        {/* Header - Always visible */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {photoCount}
              </span>
            </div>
            <div className="text-left">
              <p className="font-medium text-neutral-900 font-geist">
                {photoCount} {photoCount === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </p>
              <p className="text-sm text-orange-600 font-semibold">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-neutral-100">
            {/* Package info */}
            {bestPackage && (
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-700">
                    <span className="font-medium">{bestPackage.name}</span>
                    {' - '}
                    {formatPrice(pricePerPhoto)}/foto
                  </span>
                </div>
              </div>
            )}

            {/* Photo thumbnails */}
            <div className="p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {selectedPhotos.slice(0, 8).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(photo.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label={`Remover ${photo.file_name}`}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {selectedPhotos.length > 8 && (
                  <div className="aspect-square rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 text-sm font-medium">
                    +{selectedPhotos.length - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-neutral-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Total</span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Button
                onClick={onCheckout}
                className="w-full"
                size="lg"
              >
                Finalizar compra
              </Button>

              <button
                type="button"
                onClick={onClearCart}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpar carrinho
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
