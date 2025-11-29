/**
 * Shirt size constants and utilities for gender-based size selection
 */

export type ShirtGender = 'masculino' | 'feminino' | 'infantil'

export interface ShirtSizeConfig {
  gender: ShirtGender
  sizes: string[]
  label: string
}

/**
 * Default shirt size grids by gender
 */
export const DEFAULT_SHIRT_SIZES_BY_GENDER: Record<ShirtGender, string[]> = {
  masculino: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  feminino: ['PP', 'P', 'M', 'G', 'GG'],
  infantil: ['2', '4', '6', '8', '10', '12', '14'],
}

/**
 * Gender labels for UI display
 */
export const GENDER_LABELS: Record<ShirtGender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  infantil: 'Infantil',
}

/**
 * Get shirt sizes for a specific gender
 */
export function getShirtSizesByGender(
  gender: ShirtGender,
  customSizes?: Record<ShirtGender, string[]>
): string[] {
  if (customSizes && customSizes[gender]) {
    return customSizes[gender]
  }
  return DEFAULT_SHIRT_SIZES_BY_GENDER[gender]
}

/**
 * Format shirt size with gender for display
 */
export function formatShirtSizeWithGender(size: string, gender: ShirtGender): string {
  return `${size} (${GENDER_LABELS[gender]})`
}

/**
 * Parse shirt size string that may include gender
 */
export function parseShirtSize(sizeString: string): { size: string; gender?: ShirtGender } {
  // Check if size string includes gender info like "M (Masculino)"
  const match = sizeString.match(/^(.+?)\s*\((.+?)\)$/)

  if (match) {
    const size = match[1].trim()
    const genderLabel = match[2].trim().toLowerCase()

    // Find matching gender
    const gender = Object.entries(GENDER_LABELS).find(
      ([_, label]) => label.toLowerCase() === genderLabel
    )?.[0] as ShirtGender | undefined

    return { size, gender }
  }

  return { size: sizeString }
}

/**
 * Validate if a shirt size exists in the gender's size grid
 */
export function isValidShirtSize(
  size: string,
  gender: ShirtGender,
  customSizes?: Record<ShirtGender, string[]>
): boolean {
  const availableSizes = getShirtSizesByGender(gender, customSizes)
  return availableSizes.includes(size)
}
