'use client'

import { PhotoEventCard } from './photo-event-card'
import type { EventWithPhotoCount } from '@/types'

interface PhotoEventsGridProps {
  events: EventWithPhotoCount[]
}

export function PhotoEventsGrid({ events }: PhotoEventsGridProps) {
  if (events.length === 0) {
    return null
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-animate="fade-in-up"
    >
      {events.map((event, index) => (
        <div
          key={event.id}
          data-animate="fade-in-up"
          data-delay={(index * 100).toString()}
        >
          <PhotoEventCard
            event={event}
            previewThumbnails={event.preview_thumbnails}
          />
        </div>
      ))}
    </div>
  )
}
