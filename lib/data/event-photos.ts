import { createClient } from '@/lib/supabase/server'
import type { EventPhotosData, EventPhotoWithUrls } from '@/lib/photos/photo-utils'

// Re-export types and utilities for convenience
export type { EventPhotosData, EventPhotoWithUrls, BestPackageResult } from '@/lib/photos/photo-utils'
export { getBestPackageForQuantity, getSinglePhotoPrice } from '@/lib/photos/photo-utils'

// Re-export new pricing tier utilities
export {
  calculatePriceForQuantity,
  getApplicableTier,
  formatTiersForDisplay,
  getBasePricePerPhoto,
  getLowestPricePerPhoto,
  hasValidPricingConfiguration,
  calculateSavings,
} from '@/lib/photos/photo-utils'

/**
 * Fetches photos, packages, and pricing tiers for an event
 * Generates public URLs for watermarked and thumbnail images
 * @param eventId - Event ID
 * @returns Promise<EventPhotosData> Photos with public URLs, packages (deprecated), and pricing tiers
 */
export async function getEventPhotosData(eventId: string): Promise<EventPhotosData> {
  try {
    const supabase = createClient()

    // Paginate using .range() to bypass PostgREST max-rows (default 1000).
    // First page runs in parallel with packages/tiers so there is no latency
    // regression for events with < 1000 photos.
    const PAGE_SIZE = 1000
    const [firstPhotosRes, packagesRes, tiersRes] = await Promise.all([
      supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })
        .range(0, PAGE_SIZE - 1),
      supabase
        .from('photo_packages')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true }),
      supabase
        .from('photo_pricing_tiers')
        .select('*')
        .eq('event_id', eventId)
        .order('min_quantity', { ascending: true }),
    ])

    if (firstPhotosRes.error) {
      console.error('Error fetching event photos:', firstPhotosRes.error)
      return { photos: [], packages: [], pricingTiers: [] }
    }

    // Log package error but don't return early - photos can still be displayed
    if (packagesRes.error) {
      console.error('Error fetching photo packages:', packagesRes.error)
    }

    // Log tier error but don't return early
    if (tiersRes.error) {
      console.error('Error fetching photo pricing tiers:', tiersRes.error)
    }

    // Fetch remaining pages if first page was full
    let allPhotos = firstPhotosRes.data || []
    if (allPhotos.length === PAGE_SIZE) {
      let offset = PAGE_SIZE
      while (true) {
        const { data, error } = await supabase
          .from('event_photos')
          .select('*')
          .eq('event_id', eventId)
          .order('display_order', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)

        if (error) {
          console.error('Error fetching event photos page:', error)
          break
        }

        if (!data || data.length === 0) break

        allPhotos = allPhotos.concat(data)

        if (data.length < PAGE_SIZE) break
        offset += PAGE_SIZE
      }
    }

    // Generate public URLs for watermarked and thumbnail images
    const photosWithUrls: EventPhotoWithUrls[] = allPhotos.map((photo) => {
      const { data: watermarkedData } = supabase.storage
        .from('event-photos-watermarked')
        .getPublicUrl(photo.watermarked_path)

      const { data: thumbnailData } = supabase.storage
        .from('event-photos-watermarked')
        .getPublicUrl(photo.thumbnail_path)

      return {
        ...photo,
        watermarkedUrl: watermarkedData.publicUrl,
        thumbnailUrl: thumbnailData.publicUrl,
      }
    })

    return {
      photos: photosWithUrls,
      packages: packagesRes.error ? [] : (packagesRes.data || []),
      pricingTiers: tiersRes.error ? [] : (tiersRes.data || []),
    }
  } catch (error) {
    console.error('Unexpected error fetching event photos data:', error)
    return { photos: [], packages: [], pricingTiers: [] }
  }
}
