'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Images, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSportLabel } from '@/lib/constants/sports'
import type { EventWithPhotoCount } from '@/types'

interface PhotoEventCardProps {
  event: EventWithPhotoCount
  previewThumbnails?: string[]
}

export function PhotoEventCard({ event, previewThumbnails = [] }: PhotoEventCardProps) {
  const location = event.location as any
  const locationString =
    location?.city && location?.state
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state || 'Local a definir'

  const eventDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(event.end_date || event.start_date))
    .replace('.', '')

  // Check if event was completed recently (within 7 days)
  const endDate = new Date(event.end_date || event.start_date)
  const daysSinceEnd = Math.floor((Date.now() - endDate.getTime()) / (1000 * 60 * 60 * 24))
  const isRecent = daysSinceEnd <= 7

  return (
    <Link href={`/mural-fotos/${event.slug}`} className="block group">
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300',
          'bg-white border-neutral-100',
          'hover:-translate-y-1 hover:shadow-lg hover:border-neutral-200'
        )}
      >
        {/* Image section with photo preview overlay */}
        <div className="relative h-52 overflow-hidden">
          {/* Main banner image */}
          <Image
            src={event.banner_url || '/placeholder-event.jpg'}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Photo thumbnails preview grid */}
          {previewThumbnails.length > 0 && (
            <div className="absolute bottom-3 right-3 grid grid-cols-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {previewThumbnails.slice(0, 4).map((thumbnail, index) => (
                <div
                  key={index}
                  className="w-10 h-10 rounded overflow-hidden border border-white/30"
                >
                  <Image
                    src={thumbnail}
                    alt={`Preview ${index + 1}`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {/* Sport type badge */}
            <span className="inline-flex items-center rounded-full bg-neutral-900/40 backdrop-blur px-2.5 py-1 text-xs font-medium text-white">
              {getSportLabel(event.sport_type) || event.sport_type}
            </span>

            {/* New badge for recent events */}
            {isRecent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur px-2.5 py-1 text-xs font-medium text-white">
                <Sparkles className="w-3 h-3" />
                Novo
              </span>
            )}
          </div>

          {/* Photo count badge */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-neutral-900">
              <Images className="w-3.5 h-3.5 text-orange-500" />
              {event.photo_count} {event.photo_count === 1 ? 'foto' : 'fotos'}
            </span>
          </div>
        </div>

        {/* Content section */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 font-geist mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {event.title}
          </h3>

          <div className="space-y-1.5">
            <p className="text-sm text-neutral-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{eventDate}</span>
            </p>
            <p className="text-sm text-neutral-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{locationString}</span>
            </p>
          </div>

          {/* CTA */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700 transition-colors">
              Ver fotos →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
