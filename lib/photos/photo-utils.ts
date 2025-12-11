import type { EventPhoto, PhotoPackage } from '@/types/database.types'

export interface EventPhotoWithUrls extends EventPhoto {
  watermarkedUrl: string
  thumbnailUrl: string
}

export interface EventPhotosData {
  photos: EventPhotoWithUrls[]
  packages: PhotoPackage[]
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
