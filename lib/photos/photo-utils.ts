import type { EventPhoto, PhotoPackage, PhotoPricingTier } from '@/types/database.types'
import type { PricingCalculationResult, FormattedPricingTier } from '@/types'

export interface EventPhotoWithUrls extends EventPhoto {
  watermarkedUrl: string
  thumbnailUrl: string
}

export interface EventPhotosData {
  photos: EventPhotoWithUrls[]
  packages: PhotoPackage[]
  pricingTiers: PhotoPricingTier[]
}

export interface BestPackageResult {
  package: PhotoPackage | null
  totalPrice: number
  pricePerPhoto: number
}

/**
 * Calculates the best package for a given quantity of photos
 * Uses the smallest package that can accommodate the quantity (most intuitive for the user)
 * @param packages - Available photo packages
 * @param quantity - Number of photos selected
 * @returns Best package and total price
 */
export function getBestPackageForQuantity(
  packages: PhotoPackage[],
  quantity: number
): BestPackageResult {
  if (quantity === 0) {
    return { package: null, totalPrice: 0, pricePerPhoto: 0 }
  }

  if (packages.length === 0) {
    return { package: null, totalPrice: 0, pricePerPhoto: 0 }
  }

  // Sort packages by quantity ascending (ensure numeric comparison for string/number edge cases)
  const sortedPackages = [...packages].sort((a, b) => Number(a.quantity) - Number(b.quantity))

  // Find the smallest package that can accommodate the quantity
  // This is the most intuitive behavior: if user has 3 photos, show the 3-photo package (not 5-photo)
  const applicablePackage = sortedPackages.find((pkg) => Number(pkg.quantity) >= quantity)

  if (applicablePackage) {
    const pkgQuantity = Number(applicablePackage.quantity)
    const pricePerPhoto = Number(applicablePackage.price) / pkgQuantity

    return {
      package: applicablePackage,
      totalPrice: Number(applicablePackage.price),
      pricePerPhoto,
    }
  }

  // If quantity exceeds all packages, use the largest package
  // Calculate how many times we need the largest package
  const largestPackage = sortedPackages[sortedPackages.length - 1]
  const largestQty = Number(largestPackage.quantity)
  const packagesNeeded = Math.ceil(quantity / largestQty)
  const totalPhotosInPackages = largestQty * packagesNeeded
  const totalPrice = Number(largestPackage.price) * packagesNeeded
  const pricePerPhoto = totalPrice / totalPhotosInPackages

  return {
    package: largestPackage,
    totalPrice,
    pricePerPhoto,
  }
}

/**
 * Get single photo price (price of package with quantity 1, or minimum package)
 * @param packages - Available photo packages
 * @returns Unit price for a single photo
 * @deprecated Use calculatePriceForQuantity with pricingTiers instead
 */
export function getSinglePhotoPrice(packages: PhotoPackage[]): number {
  if (packages.length === 0) return 0

  const singlePhotoPackage = packages.find((pkg) => pkg.quantity === 1)
  if (singlePhotoPackage) {
    return Number(singlePhotoPackage.price)
  }

  // If no single photo package, use minimum package price
  const sortedByPrice = [...packages].sort((a, b) => Number(a.price) - Number(b.price))
  return Number(sortedByPrice[0].price)
}

// ============================================================
// PROGRESSIVE PRICING TIER FUNCTIONS (New Model)
// ============================================================

/**
 * Calculate price for a given quantity of photos using progressive pricing tiers
 *
 * Algorithm: Find the largest tier where min_quantity <= quantity
 * Then calculate: total = quantity × price_per_photo
 *
 * Example with tiers [1: R$10, 3: R$7, 10: R$5]:
 * - 1 photo → uses tier 1 → 1 × R$10 = R$10
 * - 5 photos → uses tier 3 → 5 × R$7 = R$35
 * - 15 photos → uses tier 10 → 15 × R$5 = R$75
 *
 * @param tiers - Available pricing tiers for the event
 * @param quantity - Number of photos selected
 * @returns Pricing calculation result with tier, price per photo, and total
 */
export function calculatePriceForQuantity(
  tiers: PhotoPricingTier[],
  quantity: number
): PricingCalculationResult {
  if (quantity === 0 || tiers.length === 0) {
    return {
      tier: null,
      pricePerPhoto: 0,
      totalPrice: 0,
      quantity: 0,
    }
  }

  // Sort tiers by min_quantity descending to find the best applicable tier
  const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)

  // Find the largest tier where min_quantity <= quantity
  const applicableTier = sortedTiers.find((tier) => tier.min_quantity <= quantity)

  if (!applicableTier) {
    // This shouldn't happen if there's a tier with min_quantity = 1
    // But handle it gracefully by using the smallest tier
    const smallestTier = sortedTiers[sortedTiers.length - 1]
    return {
      tier: smallestTier,
      pricePerPhoto: Number(smallestTier.price_per_photo),
      totalPrice: quantity * Number(smallestTier.price_per_photo),
      quantity,
    }
  }

  const pricePerPhoto = Number(applicableTier.price_per_photo)

  return {
    tier: applicableTier,
    pricePerPhoto,
    totalPrice: quantity * pricePerPhoto,
    quantity,
  }
}

/**
 * Get the applicable tier for a given quantity
 * Useful for showing which tier is currently active
 *
 * @param tiers - Available pricing tiers
 * @param quantity - Number of photos
 * @returns The applicable tier or null
 */
export function getApplicableTier(
  tiers: PhotoPricingTier[],
  quantity: number
): PhotoPricingTier | null {
  if (quantity === 0 || tiers.length === 0) {
    return null
  }

  const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
  return sortedTiers.find((tier) => tier.min_quantity <= quantity) || null
}

/**
 * Format pricing tiers for display in the UI
 * Creates labels like "1-2 fotos", "3-9 fotos", "10+ fotos"
 *
 * @param tiers - Available pricing tiers (should be sorted by min_quantity ascending)
 * @returns Array of formatted tiers with labels and ranges
 */
export function formatTiersForDisplay(tiers: PhotoPricingTier[]): FormattedPricingTier[] {
  if (tiers.length === 0) return []

  // Sort by min_quantity ascending
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)

  return sortedTiers.map((tier, index) => {
    const nextTier = sortedTiers[index + 1]
    const minQty = tier.min_quantity
    const maxQty = nextTier ? nextTier.min_quantity - 1 : null

    let label: string
    if (maxQty === null) {
      // Last tier: "10+ fotos"
      label = `${minQty}+ ${minQty === 1 ? 'foto' : 'fotos'}`
    } else if (minQty === maxQty) {
      // Single quantity: "1 foto"
      label = `${minQty} ${minQty === 1 ? 'foto' : 'fotos'}`
    } else {
      // Range: "3-9 fotos"
      label = `${minQty}-${maxQty} fotos`
    }

    return {
      id: tier.id,
      label,
      pricePerPhoto: Number(tier.price_per_photo),
      minQty,
      maxQty,
    }
  })
}

/**
 * Get the price per photo for the first tier (base price)
 * Used for displaying "a partir de R$X"
 *
 * @param tiers - Available pricing tiers
 * @returns Base price per photo (from tier with min_quantity = 1, or smallest tier)
 */
export function getBasePricePerPhoto(tiers: PhotoPricingTier[]): number {
  if (tiers.length === 0) return 0

  // Find tier with min_quantity = 1
  const baseTier = tiers.find((t) => t.min_quantity === 1)
  if (baseTier) {
    return Number(baseTier.price_per_photo)
  }

  // Fallback to smallest tier
  const sortedTiers = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)
  return Number(sortedTiers[0].price_per_photo)
}

/**
 * Get the lowest price per photo across all tiers
 * Used for displaying "até R$X por foto" promotions
 *
 * @param tiers - Available pricing tiers
 * @returns Lowest price per photo
 */
export function getLowestPricePerPhoto(tiers: PhotoPricingTier[]): number {
  if (tiers.length === 0) return 0

  const prices = tiers.map((t) => Number(t.price_per_photo))
  return Math.min(...prices)
}

/**
 * Check if event has valid pricing configuration
 * At minimum, should have a tier with min_quantity = 1
 *
 * @param tiers - Pricing tiers for the event
 * @returns True if pricing is valid
 */
export function hasValidPricingConfiguration(tiers: PhotoPricingTier[]): boolean {
  if (tiers.length === 0) return false

  // Must have at least one tier with min_quantity = 1 (base tier)
  return tiers.some((t) => t.min_quantity === 1)
}

/**
 * Calculate savings compared to base price
 * Useful for showing "Economize X%" messages
 *
 * @param tiers - Available pricing tiers
 * @param quantity - Number of photos
 * @returns Object with savings amount and percentage, or null if no savings
 */
export function calculateSavings(
  tiers: PhotoPricingTier[],
  quantity: number
): { amount: number; percentage: number } | null {
  if (quantity <= 1 || tiers.length <= 1) return null

  const basePricePerPhoto = getBasePricePerPhoto(tiers)
  const { pricePerPhoto: currentPricePerPhoto } = calculatePriceForQuantity(tiers, quantity)

  if (currentPricePerPhoto >= basePricePerPhoto) return null

  const savingsPerPhoto = basePricePerPhoto - currentPricePerPhoto
  const totalSavings = savingsPerPhoto * quantity
  const percentageSavings = (savingsPerPhoto / basePricePerPhoto) * 100

  return {
    amount: totalSavings,
    percentage: Math.round(percentageSavings),
  }
}
