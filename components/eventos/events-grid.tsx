'use client'

import { useRouter } from 'next/navigation'
import { EventCard } from '@/components/ui/card'
import type { Event } from '@/types/database.types'
import { getSportLabel } from '@/lib/constants/sports'

interface EventsGridProps {
  events: Event[]
  variant?: 'grid' | 'list'
  isClubMember?: boolean
}

export function EventsGrid({ events, variant = 'grid', isClubMember = false }: EventsGridProps) {
  const router = useRouter()

  if (events.length === 0) {
    return null
  }

  return (
    <div
      className={
        variant === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
          : 'flex flex-col gap-6'
      }
      data-animate="fade-in-up"
    >
      {events.map((event, index) => {
        const location = event.location as any
        const locationString =
          location?.city && location?.state
            ? `${location.city}, ${location.state}`
            : location?.city || location?.state || 'Local a definir'

        // Determine badge for event - only show "Destaque" badge, hide event type badges (solidário/gratuito) to limit to 2 tags
        let eventBadge: { text: string; variant: 'warning' | 'success' | 'info' } | undefined

        if (event.is_featured) {
          eventBadge = { text: 'Destaque', variant: 'warning' }
        }

        const isComingSoon = event.status === 'published_no_registration' && !event.allow_page_access

        return (
          <div
            key={event.id}
            data-animate="fade-in-up"
            data-delay={(index * 100).toString()}
          >
            <EventCard
              variant={variant}
              image={event.banner_url || '/placeholder-event.jpg'}
              title={event.title}
              location={locationString}
              category={getSportLabel(event.sport_type) || event.sport_type}
              date={new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(event.start_date)).replace('.', '')}
              price={event.min_price}
              description={event.description}
              badge={eventBadge}
              isComingSoon={isComingSoon}
              showClubBadge={isClubMember}
              allowsPairRegistration={event.allows_pair_registration ?? false}
              allowsTeamRegistration={event.allows_team_registration ?? false}
              allowsIndividualRegistration={event.allows_individual_registration ?? true}
              teamSize={event.team_size ?? undefined}
              onRegister={() => router.push(`/eventos/${event.slug}`)}
            />
          </div>
        )
      })}
    </div>
  )
}
