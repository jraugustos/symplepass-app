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

    // Fetch photos, packages (deprecated), and pricing tiers in parallel
    const [photosRes, packagesRes, tiersRes] = await Promise.all([
      supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })
        .limit(10000), // Override Supabase default limit of 1000
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

    if (photosRes.error) {
      console.error('Error fetching event photos:', photosRes.error)
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

    // Generate public URLs for watermarked and thumbnail images
    const photosWithUrls: EventPhotoWithUrls[] = (photosRes.data || []).map((photo) => {
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
