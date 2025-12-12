'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PhotoPackage, PhotoPricingTier } from '@/types/database.types'
import type { PricingCalculationResult, FormattedPricingTier } from '@/types'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'
import {
  getBestPackageForQuantity,
  calculatePriceForQuantity,
  formatTiersForDisplay,
  calculateSavings,
} from '@/lib/photos/photo-utils'

const CART_STORAGE_KEY = 'photo-cart'
const MAX_CART_SIZE = 50

interface CartState {
  eventId: string
  selectedIds: string[]
}

interface UsePhotoCartResult {
  selectedIds: string[]
  selectedCount: number
  addPhoto: (photoId: string) => void
  removePhoto: (photoId: string) => void
  togglePhoto: (photoId: string) => void
  clearCart: () => void
  isSelected: (photoId: string) => boolean
  /** @deprecated Use appliedTier instead */
  bestPackage: PhotoPackage | null
  totalPrice: number
  pricePerPhoto: number
  getSelectedPhotos: (photos: EventPhotoWithUrls[]) => EventPhotoWithUrls[]
  /** The currently applied pricing tier based on quantity */
  appliedTier: PhotoPricingTier | null
  /** All pricing tiers formatted for display */
  formattedTiers: FormattedPricingTier[]
  /** Savings compared to base price, if any */
  savings: { amount: number; percentage: number } | null
  /** Full pricing calculation result */
  pricingResult: PricingCalculationResult
}

function getStorageKey(eventId: string): string {
  return `${CART_STORAGE_KEY}-${eventId}`
}

function loadCartFromStorage(eventId: string): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(getStorageKey(eventId))
    if (!stored) return []

    const parsed: CartState = JSON.parse(stored)
    if (parsed.eventId !== eventId) return []

    return parsed.selectedIds || []
  } catch {
    return []
  }
}

function saveCartToStorage(eventId: string, selectedIds: string[]): void {
  if (typeof window === 'undefined') return

  try {
    const state: CartState = { eventId, selectedIds }
    localStorage.setItem(getStorageKey(eventId), JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error)
  }
}

/**
 * Hook for managing the photo cart with progressive pricing tiers
 *
 * @param eventId - The event ID for cart isolation
 * @param packages - Legacy photo packages (deprecated, for backward compatibility)
 * @param pricingTiers - New pricing tiers for progressive pricing
 */
export function usePhotoCart(
  eventId: string,
  packages: PhotoPackage[],
  pricingTiers: PhotoPricingTier[] = []
): UsePhotoCartResult {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedIds = loadCartFromStorage(eventId)
    setSelectedIds(storedIds)
    setIsInitialized(true)
  }, [eventId])

  // Save cart to localStorage when it changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(eventId, selectedIds)
    }
  }, [eventId, selectedIds, isInitialized])

  const addPhoto = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) return prev
      if (prev.length >= MAX_CART_SIZE) {
        console.warn(`Cart limit reached (${MAX_CART_SIZE} photos)`)
        return prev
      }
      return [...prev, photoId]
    })
  }, [])

  const removePhoto = useCallback((photoId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== photoId))
  }, [])

  const togglePhoto = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId)
      }
      if (prev.length >= MAX_CART_SIZE) {
        console.warn(`Cart limit reached (${MAX_CART_SIZE} photos)`)
        return prev
      }
      return [...prev, photoId]
    })
  }, [])

  const clearCart = useCallback(() => {
    setSelectedIds([])
  }, [])

  const isSelected = useCallback(
    (photoId: string) => selectedIds.includes(photoId),
    [selectedIds]
  )

  const getSelectedPhotos = useCallback(
    (photos: EventPhotoWithUrls[]) => {
      return photos.filter((photo) => selectedIds.includes(photo.id))
    },
    [selectedIds]
  )

  // NEW: Calculate pricing using progressive tiers
  const pricingResult = useMemo(() => {
    return calculatePriceForQuantity(pricingTiers, selectedIds.length)
  }, [pricingTiers, selectedIds.length])

  // Format tiers for display
  const formattedTiers = useMemo(() => {
    return formatTiersForDisplay(pricingTiers)
  }, [pricingTiers])

  // Calculate savings
  const savings = useMemo(() => {
    return calculateSavings(pricingTiers, selectedIds.length)
  }, [pricingTiers, selectedIds.length])

  // DEPRECATED: Calculate best package and pricing (for backward compatibility)
  const { bestPackage, legacyTotalPrice, legacyPricePerPhoto } = useMemo(() => {
    const result = getBestPackageForQuantity(packages, selectedIds.length)
    return {
      bestPackage: result.package,
      legacyTotalPrice: result.totalPrice,
      legacyPricePerPhoto: result.pricePerPhoto,
    }
  }, [packages, selectedIds.length])

  // Use new pricing if tiers are available, otherwise fall back to legacy packages
  const hasPricingTiers = pricingTiers.length > 0
  const totalPrice = hasPricingTiers ? pricingResult.totalPrice : legacyTotalPrice
  const pricePerPhoto = hasPricingTiers ? pricingResult.pricePerPhoto : legacyPricePerPhoto

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    addPhoto,
    removePhoto,
    togglePhoto,
    clearCart,
    isSelected,
    bestPackage,
    totalPrice,
    pricePerPhoto,
    getSelectedPhotos,
    // New properties for progressive pricing
    appliedTier: pricingResult.tier,
    formattedTiers,
    savings,
    pricingResult,
  }
}
