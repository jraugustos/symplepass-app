'use client'

import { useState } from 'react'
import { Check, ImageIcon, ShoppingCart, ArrowLeft, Frown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSimilarityLabel, formatSimilarityAsPercentage } from '@/lib/photos/face-detection'

export interface FaceSearchMatch {
  photoId: string
  similarity: number
  thumbnailUrl: string | null
  watermarkedUrl: string | null
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

interface FaceSearchResultsProps {
  matches: FaceSearchMatch[]
  selectedIds: string[]
  onPhotoToggle: (photoId: string) => void
  onPhotoClick: (match: FaceSearchMatch) => void
  onBack: () => void
  onAddToCart: () => void
}

interface MatchItemProps {
  match: FaceSearchMatch
  isSelected: boolean
  onToggle: () => void
  onClick: () => void
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const label = getSimilarityLabel(similarity)
  const percentage = formatSimilarityAsPercentage(similarity)

  const colorClasses = {
    alta: 'bg-green-100 text-green-700 border-green-200',
    média: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    baixa: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        colorClasses[label]
      )}
    >
      {percentage}
    </span>
  )
}

function MatchItem({ match, isSelected, onToggle, onClick }: MatchItemProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }

  return (
    <div
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-500/20'
          : 'border-neutral-200 hover:border-neutral-300'
      )}
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

      {/* Thumbnail image */}
      {match.thumbnailUrl && !hasError && (
        <img
          src={match.thumbnailUrl}
          alt="Foto encontrada"
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

      {/* Similarity badge */}
      <div className="absolute top-2 left-2">
        <SimilarityBadge similarity={match.similarity} />
      </div>

      {/* Selection checkbox */}
      <button
        onClick={handleCheckboxClick}
        className={cn(
          'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all',
          isSelected
            ? 'bg-orange-500 text-white'
            : 'bg-white/90 text-neutral-400 hover:text-neutral-600 border border-neutral-200'
        )}
      >
        <Check className={cn('w-4 h-4', isSelected ? 'opacity-100' : 'opacity-0')} />
      </button>

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100 bg-orange-500/10'
        )}
      />

      {/* Selected indicator at bottom */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-xs font-medium py-1 text-center">
          Selecionada
        </div>
      )}
    </div>
  )
}

export function FaceSearchResults({
  matches,
  selectedIds,
  onPhotoToggle,
  onPhotoClick,
  onBack,
  onAddToCart,
}: FaceSearchResultsProps) {
  const selectedCount = selectedIds.length

  // Empty state
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Frown className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">
          Não encontramos fotos suas neste evento. Tente com outra foto ou volte para a galeria completa.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para galeria
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </button>
        <div className="text-sm text-neutral-600">
          <span className="font-semibold text-orange-600">{matches.length}</span>{' '}
          {matches.length === 1 ? 'foto encontrada' : 'fotos encontradas'}
        </div>
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {matches.map((match) => (
            <MatchItem
              key={match.photoId}
              match={match}
              isSelected={selectedIds.includes(match.photoId)}
              onToggle={() => onPhotoToggle(match.photoId)}
              onClick={() => onPhotoClick(match)}
            />
          ))}
        </div>
      </div>

      {/* Footer with add to cart */}
      {selectedCount > 0 && (
        <div className="border-t border-neutral-100 px-4 py-3 bg-white">
          <Button
            onClick={onAddToCart}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar {selectedCount} {selectedCount === 1 ? 'foto' : 'fotos'} ao carrinho
          </Button>
        </div>
      )}
    </div>
  )
}
