/**
 * Simple in-memory rate limiting for serverless environments
 *
 * Note: This implementation uses in-memory storage which works well for
 * basic protection but may not be 100% effective in serverless environments
 * where each request might hit a different instance.
 *
 * For production with high security requirements, consider:
 * - Upstash Redis (https://upstash.com/docs/redis/features/rate-limiting)
 * - Vercel KV
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (will reset on cold starts)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * ```ts
 * const result = checkRateLimit(userId, { limit: 10, windowSeconds: 60 })
 * if (!result.success) {
 *   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupOldEntries()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `ratelimit:${identifier}`

  let entry = rateLimitStore.get(key)

  // If no entry or window has passed, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Create rate limit headers for the response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  }
}

// Preset configurations for different use cases
export const RATE_LIMITS = {
  /** Standard API endpoint: 100 requests per minute */
  standard: { limit: 100, windowSeconds: 60 },

  /** Admin operations: 30 requests per minute */
  admin: { limit: 30, windowSeconds: 60 },

  /** Export operations: 10 requests per minute (heavy operations) */
  export: { limit: 10, windowSeconds: 60 },

  /** Authentication: 5 attempts per minute */
  auth: { limit: 5, windowSeconds: 60 },

  /** Strict: 3 requests per minute (sensitive operations) */
  strict: { limit: 3, windowSeconds: 60 },
} as const
