import { createClient } from '@/lib/supabase/server'
import type { Event, EventWithCategories, EventDetailData, EventCategory } from '@/types/database.types'
import type { EventsListFilters, PaginatedEventsResponse, FilterOption } from '@/types'

/**
 * Fetches featured events for the home page
 * Returns up to 3 published events marked as featured, ordered by start date
 * Includes both 'published' and 'published_no_registration' events
 * @returns Promise<Event[]> Array of featured events, empty array on error
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .in('status', ['published', 'published_no_registration'])
      .order('start_date', { ascending: true })
      .limit(3)

    if (error) {
      console.error('Error fetching featured events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching featured events:', error)
    return []
  }
}

/**
 * Fetches upcoming published events
 * Returns events with start date in the future, ordered by start date ascending
 * Includes both 'published' and 'published_no_registration' events
 * @param limit - Maximum number of events to return (default: 5)
 * @returns Promise<Event[]> Array of upcoming events, empty array on error
 */
export async function getUpcomingEvents(limit: number = 5): Promise<Event[]> {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['published', 'published_no_registration'])
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching upcoming events:', error)
    return []
  }
}

/**
 * Searches events based on query string and filters
 * @param query - Search query string
 * @param filters - Optional filters (sport_type, city, state, etc.)
 * @returns Promise<Event[]> Array of matching events, empty array on error
 */
export async function searchEvents(
  query?: string,
  filters?: {
    sport_type?: string
    city?: string
    state?: string
    status?: string
  }
): Promise<Event[]> {
  try {
    const supabase = createClient()

    let queryBuilder = supabase
      .from('events')
      .select('*')

    // If status filter is provided, use it; otherwise show published and published_no_registration
    if (filters?.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    } else {
      queryBuilder = queryBuilder.in('status', ['published', 'published_no_registration'])
    }

    // Apply text search on title and description
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Apply filters
    if (filters?.sport_type) {
      queryBuilder = queryBuilder.eq('sport_type', filters.sport_type)
    }

    // Filter by city in JSONB location column
    if (filters?.city) {
      queryBuilder = queryBuilder.contains('location', { city: filters.city })
    }

    // Filter by state in JSONB location column
    if (filters?.state) {
      queryBuilder = queryBuilder.contains('location', { state: filters.state })
    }

    const { data, error } = await queryBuilder.order('start_date', { ascending: true })

    if (error) {
      console.error('Error searching events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error searching events:', error)
    return []
  }
}

/**
 * Fetches a single event with its categories
 * @deprecated Use getEventDetailBySlug for complete event details
 * @param slug - Event slug
 * @returns Promise<EventWithCategories | null> Event with categories, null on error or not found
 */
export async function getEventBySlug(slug: string): Promise<EventWithCategories | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        categories:event_categories(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('Error fetching event by slug:', error)
      return null
    }

    return data as EventWithCategories
  } catch (error) {
    console.error('Unexpected error fetching event by slug:', error)
    return null
  }
}

/**
 * Fetches complete event details including all related tables
 * @param slug - Event slug
 * @returns Promise<EventDetailData | null> Complete event data with all relations, null on error or not found
 */
export async function getEventDetailBySlug(slug: string): Promise<EventDetailData | null> {
  try {
    const supabase = createClient()

    // First, fetch the event with all its related data (except organizer)
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        categories:event_categories(*),
        kit_items:event_kit_items(*),
        course_info:event_course_info(*),
        faqs:event_faqs(*),
        regulations:event_regulations(*)
      `)
      .eq('slug', slug)
      .in('status', ['published', 'published_no_registration'])
      .order('price', { foreignTable: 'event_categories', ascending: true })
      .order('display_order', { foreignTable: 'event_kit_items', ascending: true })
      .order('display_order', { foreignTable: 'event_faqs', ascending: true })
      .order('display_order', { foreignTable: 'event_regulations', ascending: true })
      .single()

    if (error) {
      console.error('Error fetching event detail by slug:', error)
      return null
    }

    // Second, fetch the organizer profile if the event has an organizer_id
    let organizer = null
    if (data.organizer_id) {
      const { data: organizerData, error: organizerError } = await supabase
        .from('event_organizers')
        .select('id, profile_id, company_name, cnpj, description, logo_url, website, contact_email')
        .eq('profile_id', data.organizer_id)
        .single()

      if (!organizerError && organizerData) {
        organizer = organizerData
      }
    }

    // Transform the data to match EventDetailData interface
    // Handle one-to-one relations (course_info) that Supabase returns as arrays
    const courseInfo = Array.isArray(data.course_info) && data.course_info.length > 0
      ? data.course_info[0]
      : null

    // Normalize support_points to ensure it's always a string array
    if (courseInfo && courseInfo.support_points) {
      if (Array.isArray(courseInfo.support_points)) {
        courseInfo.support_points = courseInfo.support_points
          .filter((point: any) => point !== null && point !== undefined)
          .map((point: any) => String(point))
      } else {
        courseInfo.support_points = []
      }
    }

    const eventDetail: EventDetailData = {
      ...data,
      categories: data.categories || [],
      kit_items: data.kit_items || [],
      course_info: courseInfo,
      faqs: data.faqs || [],
      regulations: data.regulations || [],
      organizer: organizer,
    }

    return eventDetail
  } catch (error) {
    console.error('Unexpected error fetching event detail by slug:', error)
    return null
  }
}

/**
 * Get minimum price from array of categories
 * @param categories - Array of event categories
 * @returns number | null - Minimum price or null if no categories
 */
export function getEventMinPriceFromCategories(categories: EventCategory[]): number | null {
  if (!categories || categories.length === 0) {
    return null
  }

  const prices = categories.map(cat => cat.price)
  return Math.min(...prices)
}

/**
 * Get minimum price for an event across all categories
 * @param eventId - Event ID
 * @returns Promise<number | null> Minimum price or null if no categories
 */
export async function getEventMinPrice(eventId: string): Promise<number | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_categories')
      .select('price')
      .eq('event_id', eventId)
      .order('price', { ascending: true })
      .limit(1)
      .single()

    if (error) {
      return null
    }

    return data?.price ?? null
  } catch (error) {
    console.error('Error fetching event min price:', error)
    return null
  }
}

/**
 * Get price range for an event (min and max)
 * @param eventId - Event ID
 * @returns Promise<{ min: number; max: number } | null> Price range or null
 */
export async function getEventPriceRange(
  eventId: string
): Promise<{ min: number; max: number } | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_categories')
      .select('price')
      .eq('event_id', eventId)

    if (error || !data || data.length === 0) {
      return null
    }

    const prices = data.map((cat) => cat.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  } catch (error) {
    console.error('Error fetching event price range:', error)
    return null
  }
}

/**
 * Fetches filtered and paginated events for the events list page
 * @param filters - Filter options (sport_type, city, state, price range, date range, sort)
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of events per page
 * @returns Promise<PaginatedEventsResponse> Paginated events with metadata
 */
export async function getFilteredEvents(
  filters: EventsListFilters = {},
  page: number = 1,
  pageSize: number = 12
): Promise<PaginatedEventsResponse> {
  try {
    const supabase = createClient()
    const sort = filters.sort || 'date_asc'
    const from = 0
    const to = page * pageSize - 1

    // Try to use materialized view first, fallback to events table
    let queryBuilder = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .in('status', ['published', 'published_no_registration'])

    // Apply text search on title, description, and location
    if (filters.search) {
      // Search in title, description, and location fields
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location->>city.ilike.%${filters.search}%`
      )
    }

    // Apply filters
    if (filters.sport_type) {
      queryBuilder = queryBuilder.eq('sport_type', filters.sport_type)
    }

    if (filters.city) {
      queryBuilder = queryBuilder.contains('location', { city: filters.city })
    }

    if (filters.state) {
      queryBuilder = queryBuilder.contains('location', { state: filters.state })
    }

    if (filters.start_date) {
      queryBuilder = queryBuilder.gte('start_date', filters.start_date)
    }

    if (filters.end_date) {
      queryBuilder = queryBuilder.lte('start_date', filters.end_date)
    }

    // Note: Price filtering is currently disabled as it requires the events_with_prices view
    // TODO: Re-enable when view is created or implement client-side price filtering
    // if (filters.min_price !== undefined) {
    //   queryBuilder = queryBuilder.gte('min_price', filters.min_price)
    // }
    // if (filters.max_price !== undefined) {
    //   queryBuilder = queryBuilder.lte('max_price', filters.max_price)
    // }

    // Apply sorting directly on database fields
    switch (sort) {
      case 'date_asc':
        queryBuilder = queryBuilder.order('start_date', { ascending: true })
        break
      case 'date_desc':
        queryBuilder = queryBuilder.order('start_date', { ascending: false })
        break
      case 'title_asc':
        queryBuilder = queryBuilder.order('title', { ascending: true })
        break
      case 'price_asc':
        // Fallback to date sorting since min_price is not available in events table
        queryBuilder = queryBuilder.order('start_date', { ascending: true })
        break
      case 'price_desc':
        // Fallback to date sorting since min_price is not available in events table
        queryBuilder = queryBuilder.order('start_date', { ascending: false })
        break
    }

    // Apply pagination - cumulative (fetch all pages up to current page)
    queryBuilder = queryBuilder.range(from, to)

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('Error fetching filtered events:', error)
      return {
        events: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      }
    }

    // Events already have min_price and max_price from the materialized view
    const events = (data || []) as Event[]

    const total = count || 0
    const hasMore = from + events.length < total

    return {
      events,
      total,
      page,
      pageSize,
      hasMore,
    }
  } catch (error) {
    console.error('Unexpected error fetching filtered events:', error)
    return {
      events: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    }
  }
}

/**
 * Get total count of active (published) events
 * @returns Promise<number> Total count of active events
 */
export async function getActiveEventsCount(): Promise<number> {
  try {
    const supabase = createClient()

    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    if (error) {
      console.error('Error fetching active events count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Unexpected error fetching active events count:', error)
    return 0
  }
}

/**
 * Get sport types that have active events
 * @returns Promise<string[]> Array of sport type slugs with active events
 */
export async function getSportTypesWithActiveEvents(): Promise<string[]> {
  try {
    const supabase = createClient()

    const { data: events, error } = await supabase
      .from('events')
      .select('sport_type')
      .eq('status', 'published')

    if (error || !events) {
      console.error('Error fetching sport types with active events:', error)
      return []
    }

    // Get unique sport types
    const sportTypesSet = new Set<string>()
    events.forEach((event) => {
      if (event.sport_type) {
        sportTypesSet.add(event.sport_type)
      }
    })

    return Array.from(sportTypesSet)
  } catch (error) {
    console.error('Unexpected error fetching sport types with active events:', error)
    return []
  }
}

/**
 * Get available filter options from the database
 * Returns distinct values for cities, states, and sport types with counts
 * @returns Promise<{ cities: FilterOption[]; states: FilterOption[]; sportTypes: FilterOption[] }>
 */
export async function getFilterOptions(): Promise<{
  cities: FilterOption[]
  states: FilterOption[]
  sportTypes: FilterOption[]
}> {
  try {
    const supabase = createClient()

    // Get all published events
    const { data: events, error } = await supabase
      .from('events')
      .select('location, sport_type')
      .eq('status', 'published')

    if (error || !events) {
      console.error('Error fetching filter options:', error)
      return { cities: [], states: [], sportTypes: [] }
    }

    // Extract unique cities
    const cityMap = new Map<string, number>()
    const stateMap = new Map<string, number>()
    const sportTypeMap = new Map<string, number>()

    events.forEach((event) => {
      // Process location (JSONB)
      if (event.location) {
        const location = event.location as any
        if (location.city) {
          cityMap.set(location.city, (cityMap.get(location.city) || 0) + 1)
        }
        if (location.state) {
          stateMap.set(location.state, (stateMap.get(location.state) || 0) + 1)
        }
      }

      // Process sport_type
      if (event.sport_type) {
        sportTypeMap.set(
          event.sport_type,
          (sportTypeMap.get(event.sport_type) || 0) + 1
        )
      }
    })

    // Convert to FilterOption arrays
    const cities: FilterOption[] = Array.from(cityMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const states: FilterOption[] = Array.from(stateMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label))

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

    const sportTypes: FilterOption[] = Array.from(sportTypeMap.entries())
      .map(([value, count]) => ({
        value,
        label: sportTypeLabels[value] || value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return { cities, states, sportTypes }
  } catch (error) {
    console.error('Unexpected error fetching filter options:', error)
    return { cities: [], states: [], sportTypes: [] }
  }
}
