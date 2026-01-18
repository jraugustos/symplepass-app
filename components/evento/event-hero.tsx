'use client'

import { MapPin, Calendar, Activity, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatEventDate, extractLocationString, formatCurrency } from '@/lib/utils'
import { getSportLabel } from '@/lib/constants/sports'
import type { Event } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventHeroProps {
  event: Pick<Event, 'title' | 'banner_url' | 'location' | 'start_date' | 'sport_type' | 'event_type' | 'solidarity_message' | 'allows_pair_registration' | 'allows_team_registration' | 'allows_individual_registration' | 'team_size'>
  minPrice: number | null
  onCtaClick: () => void
  header?: React.ReactNode
}

export default function EventHero({ event, minPrice, onCtaClick, header }: EventHeroProps) {
  const location = extractLocationString(event.location)
  const date = formatEventDate(event.start_date)

  const isFreeEvent = event.event_type === 'free' || event.event_type === 'solidarity'
  const eventTypeLabel = event.event_type === 'solidarity' ? 'Solidário' : event.event_type === 'free' ? 'Gratuito' : null

  // Calculate price per athlete for duo/team events
  const allowsPairRegistration = event.allows_pair_registration ?? false
  const allowsTeamRegistration = event.allows_team_registration ?? false
  const allowsIndividualRegistration = event.allows_individual_registration ?? true
  const teamSize = event.team_size

  const pricePerAthlete = (() => {
    if (minPrice === null || minPrice <= 0) return minPrice

    // If only pair registration is allowed (no individual)
    if (allowsPairRegistration && !allowsIndividualRegistration && !allowsTeamRegistration) {
      return Math.round((minPrice / 2) * 100) / 100
    }

    // If only team registration is allowed (no individual, no pair)
    if (allowsTeamRegistration && !allowsIndividualRegistration && !allowsPairRegistration && teamSize && teamSize > 1) {
      return Math.round((minPrice / teamSize) * 100) / 100
    }

    // Default: show full price
    return minPrice
  })()

  const showPerAthleteLabel = pricePerAthlete !== minPrice && pricePerAthlete !== null

  return (
    <div className="relative w-full text-white">
      {header && (
        <div className={`${EVENT_PAGE_CONTENT_CLASS} pt-6`}>
          {header}
          <div className="border-b border-white/20 mt-4" />
        </div>
      )}
      {/* Content */}
      <div className={`${EVENT_PAGE_CONTENT_CLASS} py-12 sm:py-16`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-geist">
              {event.title}
            </h1>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {location && (
                <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>

              <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                <Activity className="h-4 w-4" />
                <span>{getSportLabel(event.sport_type) || event.sport_type}</span>
              </div>

              {eventTypeLabel && (
                <div className="inline-flex items-center gap-2 sm:text-sm text-xs font-medium font-geist bg-green-500 text-white rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                  {event.event_type === 'solidarity' ? '🤝' : '🎉'} {eventTypeLabel}
                </div>
              )}
            </div>

            {/* CTA + Solidarity requirement */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                onClick={onCtaClick}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-3 h-auto"
              >
                <span>
                  {isFreeEvent
                    ? 'Inscreva-se gratuitamente'
                    : pricePerAthlete !== null
                      ? showPerAthleteLabel
                        ? `Inscreva-se por ${formatCurrency(pricePerAthlete)}/atleta`
                        : `Inscreva-se a partir de ${formatCurrency(pricePerAthlete)}`
                      : 'Inscreva-se'}
                </span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {event.event_type === 'solidarity' && event.solidarity_message && (
                <p className="text-sm text-white/90 font-geist sm:ml-2">
                  <span className="font-semibold">Requisito: </span>
                  {event.solidarity_message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
