'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, MapPin, Calendar, Images } from 'lucide-react'
import { getSportLabel } from '@/lib/constants/sports'
import type { Event } from '@/types/database.types'

interface EventPhotoHeroProps {
  event: Event
  photoCount: number
}

export function EventPhotoHero({ event, photoCount }: EventPhotoHeroProps) {
  const location = event.location as any
  const locationString =
    location?.city && location?.state
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state || 'Local a definir'

  const eventDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(event.end_date || event.start_date))

  return (
    <section className="relative h-[320px] sm:h-[380px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={event.banner_url || '/placeholder-event.jpg'}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-white/70 mb-4">
          <Link href="/mural-fotos" className="hover:text-white transition-colors">
            Mural de Fotos
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white truncate max-w-[200px] sm:max-w-none">
            {event.title}
          </span>
        </nav>

        {/* Event info */}
        <div className="max-w-3xl">
          {/* Sport badge */}
          <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium text-white mb-3">
            {getSportLabel(event.sport_type) || event.sport_type}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-geist mb-4">
            {event.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{locationString}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Images className="w-4 h-4" />
              <span>{photoCount} {photoCount === 1 ? 'foto disponível' : 'fotos disponíveis'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
