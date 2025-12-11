'use client'

import { useRef, useState, useEffect } from 'react'
import { Check, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'

interface PhotoGridProps {
  photos: EventPhotoWithUrls[]
  selectedIds: string[]
  onPhotoToggle: (photoId: string) => void
  onPhotoClick: (photo: EventPhotoWithUrls) => void
}

interface PhotoItemProps {
  photo: EventPhotoWithUrls
  isSelected: boolean
  onToggle: () => void
  onClick: () => void
  index: number
}

function PhotoItem({ photo, isSelected, onToggle, onClick, index }: PhotoItemProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  // Intersection observer for lazy loading
  useEffect(() => {
    const element = itemRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(element)
          }
        })
      },
      { rootMargin: '100px', threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <div
      ref={itemRef}
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-500/20'
          : 'border-neutral-200 hover:border-neutral-300'
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Placeholder / Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-neutral-300" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-neutral-400" />
        </div>
      )}

      {/* Thumbnail image - loads first */}
      {isVisible && !hasError && (
        <img
          src={photo.thumbnailUrl}
          alt={photo.file_name}
          loading="lazy"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onClick={onClick}
        />
      )}

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200',
          isSelected && 'bg-orange-500/10'
        )}
        onClick={onClick}
      />

      {/* Selection checkbox */}
      <button
        type="button"
        onClick={handleCheckboxClick}
        className={cn(
          'absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200',
          isSelected
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-white/90 border border-neutral-300 text-transparent hover:border-orange-400 hover:bg-white'
        )}
        aria-label={isSelected ? 'Remover da seleção' : 'Adicionar à seleção'}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
      </button>

      {/* Selected badge */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          Selecionada
        </div>
      )}
    </div>
  )
}

export default function PhotoGrid({
  photos,
  selectedIds,
  onPhotoToggle,
  onPhotoClick,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-600">Nenhuma foto disponível</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {photos.map((photo, index) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          isSelected={selectedIds.includes(photo.id)}
          onToggle={() => onPhotoToggle(photo.id)}
          onClick={() => onPhotoClick(photo)}
          index={index}
        />
      ))}
    </div>
  )
}
