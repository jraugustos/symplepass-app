'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ShoppingCart, Check, ImageIcon } from 'lucide-react'
import { Modal, ModalBody } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'

interface PhotoLightboxProps {
  isOpen: boolean
  photo: EventPhotoWithUrls | null
  photos: EventPhotoWithUrls[]
  isSelected: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onToggleSelection: () => void
}

export default function PhotoLightbox({
  isOpen,
  photo,
  photos,
  isSelected,
  onClose,
  onNext,
  onPrevious,
  onToggleSelection,
}: PhotoLightboxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const currentIndex = photo ? photos.findIndex((p) => p.id === photo.id) : -1
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  // Reset loading state when photo changes
  useEffect(() => {
    if (photo) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [photo?.id])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrevious) onPrevious()
          break
        case 'ArrowRight':
          if (hasNext) onNext()
          break
        case 'Escape':
          onClose()
          break
      }
    },
    [isOpen, hasPrevious, hasNext, onPrevious, onNext, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!photo) return null

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      size="fullscreen"
      className="bg-black/95"
    >
      {/* Custom header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">
            {currentIndex + 1} de {photos.length}
          </span>
          {isSelected && (
            <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              <Check className="w-3 h-3" />
              Selecionada
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image container */}
      <ModalBody className="relative flex-1 flex items-center justify-center p-0 overflow-hidden">
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <ImageIcon className="w-16 h-16 mb-4" />
            <p>Erro ao carregar imagem</p>
          </div>
        )}

        {/* Watermarked image */}
        <img
          src={photo.watermarkedUrl}
          alt={photo.file_name}
          className={cn(
            'max-w-full max-h-full object-contain transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />

        {/* Navigation buttons */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </ModalBody>

      {/* Footer with action button */}
      <div className="flex items-center justify-between p-4 border-t border-white/10">
        <p className="text-white/60 text-sm truncate max-w-[200px] sm:max-w-none">
          {photo.file_name}
        </p>
        <Button
          onClick={onToggleSelection}
          variant={isSelected ? 'secondary' : 'primary'}
          className={cn(
            isSelected && 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          )}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Selecionada
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Selecionar foto
            </>
          )}
        </Button>
      </div>
    </Modal>
  )
}
