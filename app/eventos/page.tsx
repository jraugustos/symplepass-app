import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  EventsPageHero,
  FeaturedEventBanner,
  EventsFilterBar,
  EventsGrid,
  LoadMoreButton,
  EmptyState,
} from '@/components/eventos'
import { getFilteredEvents, getFeaturedEvents, getFilterOptions } from '@/lib/data/events'
import { parseFiltersFromSearchParams } from '@/lib/utils'
import type { EventsListFilters } from '@/types'

interface EventsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export const revalidate = 1800 // Revalidate every 30 minutes

export default async function EventosPage({ searchParams }: EventsPageProps) {
  // Parse filters from URL search params
  const parsedFilters = parseFiltersFromSearchParams(searchParams)
  const filters: EventsListFilters = {
    search: parsedFilters.q || parsedFilters.search, // Support both 'q' and 'search' params
    sport_type: parsedFilters.sport_type,
    city: parsedFilters.city,
    state: parsedFilters.state,
    min_price: parsedFilters.min_price,
    max_price: parsedFilters.max_price,
    start_date: parsedFilters.start_date,
    end_date: parsedFilters.end_date,
    sort: parsedFilters.sort,
  }

  const page = parsedFilters.page || 1
  const pageSize = 12

  // Fetch data in parallel
  const [featuredEventsData, eventsData, filterOptionsData] = await Promise.all([
    getFeaturedEvents().then((events) => events.slice(0, 1)), // Get only 1 featured event
    getFilteredEvents(filters, page, pageSize),
    getFilterOptions(),
  ])

  const featuredEvent = featuredEventsData[0] || null
  const { events, total, hasMore } = eventsData

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.sport_type ||
    filters.city ||
    filters.state ||
    filters.min_price ||
    filters.max_price ||
    filters.start_date ||
    filters.end_date ||
    (filters.sort && filters.sort !== 'date_asc')
  )

  // Calculate global stats from filter options (which are based on all published events)
  const totalGlobalEvents = filterOptionsData.sportTypes.reduce((acc, curr) => acc + (curr.count || 0), 0)
  const totalCities = filterOptionsData.cities.length
  const totalModalities = filterOptionsData.sportTypes.length

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="bg-gradient-to-br from-orange-400 to-orange-600">
        <Header variant="transparent" sticky={false} />
        <EventsPageHero
          totalEvents={totalGlobalEvents}
          totalCities={totalCities}
          totalModalities={totalModalities}
        />
      </div>

      <main className="flex-1">

        {/* Featured Event Banner */}
        {featuredEvent && !hasActiveFilters && (
          <section className="container mx-auto px-4 pt-8">
            <FeaturedEventBanner event={featuredEvent} />
          </section>
        )}

        {/* Filters and Events Grid */}
        <section className={`container mx-auto px-4 pb-8 ${featuredEvent && !hasActiveFilters ? 'pt-0' : 'pt-8'}`}>
          {/* Filter Bar */}
          <EventsFilterBar filters={filters} filterOptions={filterOptionsData} />

          {/* Events Grid or Empty State */}
          {events.length > 0 ? (
            <>
              <EventsGrid events={events} variant="grid" />

              {/* Load More Button */}
              {hasMore && (
                <LoadMoreButton
                  currentPage={page}
                  hasMore={hasMore}
                  totalEvents={total}
                  currentCount={events.length}
                />
              )}
            </>
          ) : (
            <EmptyState hasFilters={hasActiveFilters} />
          )}
        </section>
      </main>

      <Footer variant="light" />
    </div>
  )
}
