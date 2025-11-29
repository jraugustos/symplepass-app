'use client'

import Link from 'next/link'
import { EventCard } from '@/components/ui/card'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCarousel } from '@/lib/hooks/use-carousel'
import type { Event } from '@/types/database.types'

interface FeaturedEventsProps {
  events: Event[]
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  // Helper function to format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const {
    scrollContainerRef,
    canScrollPrev,
    canScrollNext,
    scrollNext,
    scrollPrev,
    pauseAutoPlay,
  } = useCarousel({
    itemCount: events.length,
    slidesToShow: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
    },
  })

  return (
    <section className="py-16 pb-24 bg-white overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10" data-animate style={{ animation: 'fadeSlideIn 1.0s ease-out 0.2s both' }}>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              <span className="bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                Eventos em destaque
              </span>
            </h2>
            <p className="text-neutral-600">Curadoria Symplepass</p>
          </div>
          <Link
            href="/eventos?featured=true"
            className="hidden sm:flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative overflow-visible" data-animate style={{ animation: 'fadeSlideIn 1.0s ease-out 0.3s both' }}>
          {/* Navigation Buttons - Desktop Only */}
          {events.length > 3 && (
            <>
              <button
                onClick={() => {
                  pauseAutoPlay()
                  scrollPrev()
                }}
                disabled={!canScrollPrev}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  pauseAutoPlay()
                  scrollNext()
                }}
                disabled={!canScrollNext}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Carousel Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto overflow-y-visible-force snap-x snap-mandatory scroll-smooth no-scrollbar pb-8 px-1 -mx-1"
            role="region"
            aria-label="Featured events carousel"
            onMouseEnter={pauseAutoPlay}
            onTouchStart={pauseAutoPlay}
          >
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start py-2"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${events.length}`}
                data-animate
                style={{ animation: `fadeSlideIn 1.0s ease-out ${0.3 + index * 0.1}s both` }}
              >
                <EventCard
                  variant="grid"
                  featured
                  image={event.banner_url || 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800'}
                  title={event.title}
                  location={getLocation(event)}
                  category={event.sport_type}
                  date={formatEventDate(event.start_date)}
                  description={event.description}
                  tags={[event.sport_type]}
                  onRegister={() => {
                    window.location.href = `/eventos/${event.slug}`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scroll Indicator Dots - Mobile/Tablet */}
          {events.length > 1 && (
            <div className="flex lg:hidden justify-center gap-2 mt-6" role="tablist" aria-label="Carousel navigation">
              {events.map((_, index) => (
                <button
                  key={index}
                  className="w-2 h-2 rounded-full bg-neutral-300 hover:bg-neutral-400 transition-colors"
                  aria-label={`Go to slide ${index + 1}`}
                  role="tab"
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile "Ver todos" link */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/eventos?featured=true"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Ver todos os eventos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
