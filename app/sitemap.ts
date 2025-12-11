import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour to balance freshness and caching

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://symplepass.com'

const staticRoutes: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/eventos', priority: 0.9, changeFrequency: 'daily' },
  { path: '/mural-fotos', priority: 0.8, changeFrequency: 'daily' },
  { path: '/modalidades', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/como-funciona', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/clube', priority: 0.6, changeFrequency: 'monthly' },
]

async function getDynamicEventRoutes() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .in('status', ['published', 'published_no_registration'])

    if (error || !data) {
      console.error('Failed to fetch events for sitemap:', error)
      return []
    }

    return data.map((event) => ({
      url: `${baseUrl}/eventos/${event.slug}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Unexpected error generating dynamic sitemap entries:', error)
    return []
  }
}

async function getDynamicMuralFotosRoutes() {
  try {
    const supabase = createClient()

    // Fetch completed events that have photos
    const { data: eventsData, error } = await supabase
      .from('events')
      .select(`
        slug,
        updated_at,
        event_photos (id)
      `)
      .eq('status', 'completed')

    if (error || !eventsData) {
      console.error('Failed to fetch mural-fotos events for sitemap:', error)
      return []
    }

    // Filter events that have at least one photo
    const eventsWithPhotos = eventsData.filter(
      (event: any) => event.event_photos && event.event_photos.length > 0
    )

    return eventsWithPhotos.map((event) => ({
      url: `${baseUrl}/mural-fotos/${event.slug}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Unexpected error generating mural-fotos sitemap entries:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const [dynamicEventEntries, dynamicMuralEntries] = await Promise.all([
    getDynamicEventRoutes(),
    getDynamicMuralFotosRoutes(),
  ])

  return [...staticEntries, ...dynamicEventEntries, ...dynamicMuralEntries]
}
