'use client'

import { BadgeCheck, Medal, Calendar, MapPin, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Event, EventCategory } from '@/types'
import { formatDate } from '@/lib/utils'

interface EventSummaryCardProps {
  event: Event
  category: EventCategory
}

export function EventSummaryCard({ event, category }: EventSummaryCardProps) {
  const city = event.location?.city
  const state = event.location?.state
  const locationLabel = city && state ? `${city}, ${state}` : city || state || 'Local a definir'

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
          <BadgeCheck className="w-5 h-5 text-neutral-700" />
        </div>
        <h3 className="leading-snug font-medium font-geist text-neutral-900">{event.title}</h3>
      </div>

      <ul className="mt-2 space-y-1.5 text-sm text-neutral-700 font-geist">
        <li className="flex items-center gap-2">
          <Medal className="w-4 h-4" />
          <span>{category.name}</span>
        </li>
        <li className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(event.start_date)}</span>
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{locationLabel}</span>
        </li>
        <li className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{event.sport_type || 'Evento'}</span>
        </li>
      </ul>
    </div>
  )
}
