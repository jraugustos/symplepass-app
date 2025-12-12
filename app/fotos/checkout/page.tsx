import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getEventPhotosData,
  getBestPackageForQuantity,
  calculatePriceForQuantity,
} from '@/lib/data/event-photos'
import { PhotoCheckoutClient } from './checkout-client'

interface PageProps {
  searchParams: {
    eventId?: string
    photoIds?: string
  }
}

export default async function PhotoCheckoutPage({ searchParams }: PageProps) {
  const { eventId, photoIds: photoIdsParam } = searchParams

  // Validate required params
  if (!eventId || !photoIdsParam) {
    redirect('/')
  }

  const photoIds = photoIdsParam.split(',').filter(Boolean)
  if (photoIds.length === 0) {
    redirect('/')
  }

  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with callback
    const callbackUrl = `/fotos/checkout?eventId=${eventId}&photoIds=${photoIdsParam}`
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

  // Fetch event data
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, slug, banner_url, start_date, location')
    .eq('id', eventId)
    .eq('status', 'completed')
    .single()

  if (eventError || !event) {
    console.error('Event not found or not completed:', eventError)
    redirect('/')
  }

  // Fetch photos, packages, and pricing tiers using shared data layer
  const { photos: allPhotos, packages, pricingTiers } = await getEventPhotosData(eventId)

  // Filter to only selected photos and map to expected shape
  const selectedPhotoIds = new Set(photoIds)
  const photosWithUrls = allPhotos
    .filter((photo) => selectedPhotoIds.has(photo.id))
    .map((photo) => ({
      id: photo.id,
      file_name: photo.file_name,
      thumbnail_path: photo.thumbnail_path,
      thumbnailUrl: photo.thumbnailUrl,
    }))

  if (photosWithUrls.length === 0) {
    console.error('No matching photos found for IDs:', photoIds)
    redirect(`/eventos/${event.slug}#fotos`)
  }

  // Calculate pricing using new progressive tiers (or fallback to legacy packages)
  const hasPricingTiers = pricingTiers.length > 0
  const pricingResult = calculatePriceForQuantity(pricingTiers, photoIds.length)

  // Legacy: Calculate best package (for backward compatibility)
  const { package: bestPackage, totalPrice: legacyTotalPrice } = getBestPackageForQuantity(
    packages,
    photoIds.length
  )

  // Use new pricing if tiers are available
  const totalPrice = hasPricingTiers ? pricingResult.totalPrice : legacyTotalPrice
  const appliedTier = hasPricingTiers ? pricingResult.tier : null

  return (
    <PhotoCheckoutClient
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
        banner_url: event.banner_url,
        start_date: event.start_date,
        location: event.location as { city: string; state: string },
      }}
      selectedPhotos={photosWithUrls}
      packages={packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        quantity: pkg.quantity,
        price: Number(pkg.price),
      }))}
      bestPackage={
        bestPackage
          ? {
              id: bestPackage.id,
              name: bestPackage.name,
              quantity: bestPackage.quantity,
              price: Number(bestPackage.price),
            }
          : null
      }
      appliedTier={
        appliedTier
          ? {
              id: appliedTier.id,
              min_quantity: appliedTier.min_quantity,
              price_per_photo: Number(appliedTier.price_per_photo),
            }
          : null
      }
      pricePerPhoto={hasPricingTiers ? pricingResult.pricePerPhoto : null}
      totalPrice={totalPrice}
      user={{
        id: user.id,
        email: user.email || profile?.email || '',
        full_name: profile?.full_name || user.user_metadata?.full_name || null,
      }}
    />
  )
}
