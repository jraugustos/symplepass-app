'use client'

import Link from 'next/link'
import { Calendar, MapPin, Sparkles, Ticket, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types/database.types'
import { formatEventDate } from '@/lib/utils'

interface FeaturedEventBannerProps {
  event: Event | null
}

export function FeaturedEventBanner({ event }: FeaturedEventBannerProps) {
  if (!event) return null

  const location = event.location as any
  const locationString = location?.city && location?.state
    ? `${location.city}, ${location.state}`
    : location?.city || location?.state || 'Local a definir'

  return (
    <Card className="overflow-hidden mb-8 transition-all duration-300 hover:shadow-custom-md hover:-translate-y-0.5 hover:border-neutral-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Image Side */}
        <div className="relative h-64 md:h-auto min-h-[300px] group overflow-hidden">
          <img
            src={event.banner_url || '/placeholder-event.jpg'}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/30 backdrop-blur px-3 py-1.5 text-xs font-medium text-white">
              <Sparkles className="w-3.5 h-3.5" />
              Destaque
            </span>
          </div>

          {/* Participant Count Badge (if available) */}
          {event.max_participants && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/30 backdrop-blur px-3 py-1.5 text-xs font-medium text-white">
                <Users className="w-3.5 h-3.5" />
                {event.max_participants} vagas
              </span>
            </div>
          )}
        </div>

        {/* Content Side */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-4 font-geist">
            {event.title}
          </h2>

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-light">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatEventDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-light">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{locationString}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-neutral-600 font-light mb-6 line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link href={`/eventos/${event.slug}`}>
              <Button variant="primary" size="lg" className="bg-gradient-primary">
                Ver detalhes
              </Button>
            </Link>
            <Link href={`/eventos/${event.slug}`}>
              <Button variant="outline" size="lg">
                <Ticket className="w-4 h-4 mr-2" />
                Garantir ingresso
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
