'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/actions'
import {
  createPhoto,
  deletePhoto,
  reorderPhotos,
  createPhotoPackage,
  updatePhotoPackage,
  deletePhotoPackage,
  reorderPhotoPackages,
  getPhotoOrdersByEventIdWithFilters,
  type CreatePhotoData,
  type CreatePhotoPackageData,
  type PhotoOrderFilters,
  type AdminPhotoOrderWithDetails,
} from '@/lib/data/admin-photos'
import {
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  reorderPricingTiers,
  type CreatePricingTierData,
} from '@/lib/data/photo-pricing-tiers'

/**
 * Create a new photo record after upload
 */
export async function createPhotoAction(eventId: string, data: Omit<CreatePhotoData, 'event_id'>) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const createResult = await createPhoto({
    event_id: eventId,
    ...data,
  })

  if (createResult.error) {
    throw new Error(createResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
  return createResult.data
}

/**
 * Delete a photo
 */
export async function deletePhotoAction(eventId: string, photoId: string) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const deleteResult = await deletePhoto(photoId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}

/**
 * Reorder photos
 */
export async function reorderPhotosAction(
  eventId: string,
  items: { id: string; display_order: number }[]
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const reorderResult = await reorderPhotos(items)

  if (reorderResult.error) {
    throw new Error(reorderResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}

/**
 * Create a new photo package
 */
export async function createPhotoPackageAction(
  eventId: string,
  data: Omit<CreatePhotoPackageData, 'event_id'>
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const createResult = await createPhotoPackage({
    event_id: eventId,
    ...data,
  })

  if (createResult.error) {
    throw new Error(createResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
  return createResult.data
}

/**
 * Update an existing photo package
 */
export async function updatePhotoPackageAction(
  eventId: string,
  packageId: string,
  data: Partial<Omit<CreatePhotoPackageData, 'event_id'>>
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const updateResult = await updatePhotoPackage(packageId, data, eventId)

  if (updateResult.error) {
    throw new Error(updateResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
  return updateResult.data
}

/**
 * Delete a photo package
 */
export async function deletePhotoPackageAction(eventId: string, packageId: string) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const deleteResult = await deletePhotoPackage(packageId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}

/**
 * Reorder photo packages
 */
export async function reorderPhotoPackagesAction(
  eventId: string,
  items: { id: string; display_order: number }[]
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const reorderResult = await reorderPhotoPackages(items)

  if (reorderResult.error) {
    throw new Error(reorderResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}

/**
 * Get photo orders with filters and pagination
 */
export async function filterPhotoOrdersAction(
  eventId: string,
  filters: PhotoOrderFilters
): Promise<{ orders: AdminPhotoOrderWithDetails[]; total: number }> {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const queryResult = await getPhotoOrdersByEventIdWithFilters(eventId, filters)

  return {
    orders: queryResult.orders,
    total: queryResult.total,
  }
}

/**
 * Export photo orders to CSV (triggers download via API route)
 */
export async function exportPhotoOrdersAction(
  eventId: string,
  filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'>
): Promise<string> {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  // Build query string for the export API
  const params = new URLSearchParams()
  if (filters.payment_status) params.set('payment_status', filters.payment_status)
  if (filters.search) params.set('search', filters.search)
  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)

  const queryString = params.toString()
  return `/api/admin/events/${eventId}/photos/orders/export${queryString ? `?${queryString}` : ''}`
}

// ============================================================
// PRICING TIER ACTIONS (New Progressive Pricing Model)
// ============================================================

/**
 * Create a new pricing tier
 */
export async function createPricingTierAction(
  eventId: string,
  data: Omit<CreatePricingTierData, 'event_id'>
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const createResult = await createPricingTier({
    event_id: eventId,
    ...data,
  })

  if (createResult.error) {
    throw new Error(createResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
  return createResult.data
}

/**
 * Update an existing pricing tier
 */
export async function updatePricingTierAction(
  eventId: string,
  tierId: string,
  data: Partial<Omit<CreatePricingTierData, 'event_id'>>
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const updateResult = await updatePricingTier(tierId, data, eventId)

  if (updateResult.error) {
    throw new Error(updateResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
  return updateResult.data
}

/**
 * Delete a pricing tier
 */
export async function deletePricingTierAction(eventId: string, tierId: string) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const deleteResult = await deletePricingTier(tierId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}

/**
 * Reorder pricing tiers
 */
export async function reorderPricingTiersAction(
  eventId: string,
  items: { id: string; display_order: number }[]
) {
  const result = await getCurrentUser()
  if (!result || !result.user || !result.profile) {
    throw new Error('User not authenticated')
  }

  if (result.profile.role !== 'admin' && result.profile.role !== 'organizer') {
    throw new Error('Unauthorized')
  }

  const reorderResult = await reorderPricingTiers(items)

  if (reorderResult.error) {
    throw new Error(reorderResult.error)
  }

  revalidatePath(`/admin/eventos/${eventId}/fotos`)
}
