'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types/database.types'

interface UpcomingEventsProps {
  events: Event[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  // Helper function to format date in short format
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  // Helper function to extract location from JSONB
  const getLocation = (event: Event) => {
    if (typeof event.location === 'string') {
      return event.location
    }
    const location = event.location as any
    return `${location.city || ''}, ${location.state || ''}`.trim()
  }

  // Handle empty state
  if (!events || events.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10" data-animate style={{ animation: 'fadeSlideIn 1.0s ease-out 0.2s both' }}>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              <span className="bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                Próximos eventos
              </span>
            </h2>
          </div>
          <Link
            href="/eventos"
            className="hidden sm:flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Ver agenda
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {events.map((event, index) => {
            const delay = 0.4 + index * 0.05
            return (
              <div
                key={event.id}
                data-animate
                style={{ animation: `fadeSlideIn 1.0s ease-out ${delay}s both` }}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:bg-neutral-50 hover:shadow-custom-md hover:border-neutral-300 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5 items-center">
                  {/* Date Column */}
                  <div className="lg:col-span-2 flex items-center gap-3 lg:flex-col lg:items-center lg:justify-center lg:border-r lg:border-neutral-200 lg:pr-5">
                    <Calendar className="w-5 h-5 text-orange-600 lg:mb-2" />
                    <span className="text-sm font-medium text-neutral-900 capitalize">
                      {formatDateShort(event.start_date)}
                    </span>
                  </div>

                  {/* Event Info Column */}
                  <div className="lg:col-span-7 space-y-2">
                    <h3 className="text-lg font-semibold text-neutral-900 font-geist">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        {getLocation(event)}
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {event.sport_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Column */}
                  <div className="lg:col-span-3 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => {
                        window.location.href = `/eventos/${event.slug}`
                      }}
                      className="w-full sm:w-auto"
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile "Ver agenda" link */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Ver agenda completa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
