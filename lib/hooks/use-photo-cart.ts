'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PhotoPackage } from '@/types/database.types'
import type { EventPhotoWithUrls } from '@/lib/photos/photo-utils'
import { getBestPackageForQuantity } from '@/lib/photos/photo-utils'

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
  bestPackage: PhotoPackage | null
  totalPrice: number
  pricePerPhoto: number
  getSelectedPhotos: (photos: EventPhotoWithUrls[]) => EventPhotoWithUrls[]
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

export function usePhotoCart(
  eventId: string,
  packages: PhotoPackage[]
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

  // Calculate best package and pricing
  const { bestPackage, totalPrice, pricePerPhoto } = useMemo(() => {
    const result = getBestPackageForQuantity(packages, selectedIds.length)
    return {
      bestPackage: result.package,
      totalPrice: result.totalPrice,
      pricePerPhoto: result.pricePerPhoto,
    }
  }, [packages, selectedIds.length])

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
  }
}
