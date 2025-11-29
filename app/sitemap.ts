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
      .eq('status', 'published')

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const dynamicEntries = await getDynamicEventRoutes()

  return [...staticEntries, ...dynamicEntries]
}
