'use client'

import { useRouter } from 'next/navigation'
import { EventCard } from '@/components/ui/card'
import type { Event } from '@/types/database.types'
import { formatDateShort, formatCurrency } from '@/lib/utils'

interface EventsGridProps {
  events: Event[]
  variant?: 'grid' | 'list'
}

export function EventsGrid({ events, variant = 'grid' }: EventsGridProps) {
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

        const sportTypeLabels: Record<string, string> = {
          corrida: 'Corrida',
          ciclismo: 'Ciclismo',
          triatlo: 'Triatlo',
          natacao: 'Natação',
          caminhada: 'Caminhada',
          crossfit: 'CrossFit',
          beach_sports: 'Beach Sports',
          trail_running: 'Trail Running',
          beach_tenis: 'Beach Tennis',
          futevolei: 'Futevôlei',
          volei_praia: 'Vôlei de Praia',
          stand_up_paddle: 'Stand Up Paddle',
          outro: 'Outro',
        }

        // Determine badge for event type
        let eventBadge: { text: string; variant: 'warning' | 'success' | 'info' } | undefined

        if (event.event_type === 'solidarity') {
          eventBadge = { text: '🤝 Solidário', variant: 'success' }
        } else if (event.event_type === 'free') {
          eventBadge = { text: '🎉 Gratuito', variant: 'success' }
        } else if (event.is_featured) {
          eventBadge = { text: 'Destaque', variant: 'warning' }
        }

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
              category={sportTypeLabels[event.sport_type] || event.sport_type}
              date={new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(event.start_date)).replace('.', '')}
              price={event.min_price}
              description={event.description}
              badge={eventBadge}
              onRegister={() => router.push(`/eventos/${event.slug}`)}
            />
          </div>
        )
      })}
    </div>
  )
}
