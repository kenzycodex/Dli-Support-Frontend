// utils/rating-utils.ts (NEW - Safe rating handling utilities)

/**
 * Safely converts any value to a valid rating number (0-5)
 */
export function safeRating(rating: any): number {
  const numRating = Number(rating)
  if (isNaN(numRating)) return 0
  return Math.max(0, Math.min(5, numRating))
}

/**
 * Safely formats a rating for display with decimal places
 */
export function formatRating(rating: any, decimals: number = 1): string {
  return safeRating(rating).toFixed(decimals)
}

/**
 * Safely calculates rating percentage (0-100%)
 */
export function ratingPercentage(rating: any): number {
  return Math.round((safeRating(rating) / 5) * 100)
}

/**
 * Safely calculates helpfulness rate from helpful/not helpful counts
 */
export function helpfulnessRate(helpful: number, notHelpful: number): number {
  const total = (helpful || 0) + (notHelpful || 0)
  if (total === 0) return 0
  return Math.round(((helpful || 0) / total) * 100)
}

/**
 * Gets rating color based on value
 */
export function getRatingColor(rating: any): string {
  const safeVal = safeRating(rating)
  if (safeVal >= 4.5) return 'text-green-600'
  if (safeVal >= 3.5) return 'text-yellow-600'
  if (safeVal >= 2.5) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Gets rating label based on value
 */
export function getRatingLabel(rating: any): string {
  const safeVal = safeRating(rating)
  if (safeVal >= 4.5) return 'Excellent'
  if (safeVal >= 3.5) return 'Good'
  if (safeVal >= 2.5) return 'Fair'
  if (safeVal >= 1.5) return 'Poor'
  return 'No Rating'
}