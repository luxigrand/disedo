/**
 * IP-based rate limiting utility
 * Uses sliding window algorithm to track requests per IP address
 */

interface RateLimitEntry {
  requests: number[]
  lastCleanup: number
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval: remove old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

// Default limits
const DEFAULT_LIMITS = {
  requestsPerMinute: 10,
  requestsPerHour: 50,
}

/**
 * Clean up old entries from the rate limit store
 */
function cleanupOldEntries() {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  for (const [ip, entry] of rateLimitStore.entries()) {
    // Remove requests older than 1 hour
    entry.requests = entry.requests.filter((timestamp) => timestamp > oneHourAgo)

    // If no recent requests, remove the entry
    if (entry.requests.length === 0) {
      rateLimitStore.delete(ip)
    }
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback: use a default identifier if IP cannot be determined
  // In production, this should rarely happen
  return 'unknown'
}

/**
 * Check if a request should be rate limited
 * @param ip - Client IP address
 * @param limits - Rate limit configuration (optional)
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  ip: string,
  limits: {
    requestsPerMinute?: number
    requestsPerHour?: number
  } = {}
): {
  allowed: boolean
  remaining: number
  resetAt: number
  error?: string
} {
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000
  const oneHourAgo = now - 60 * 60 * 1000

  // Cleanup old entries periodically
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries()
    lastCleanup = now
  }

  const requestsPerMinute = limits.requestsPerMinute ?? DEFAULT_LIMITS.requestsPerMinute
  const requestsPerHour = limits.requestsPerHour ?? DEFAULT_LIMITS.requestsPerHour

  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip)
  if (!entry) {
    entry = {
      requests: [],
      lastCleanup: now,
    }
    rateLimitStore.set(ip, entry)
  }

  // Filter requests to only include recent ones
  entry.requests = entry.requests.filter((timestamp) => timestamp > oneHourAgo)

  // Count requests in the last minute and hour
  const requestsInLastMinute = entry.requests.filter((timestamp) => timestamp > oneMinuteAgo).length
  const requestsInLastHour = entry.requests.length

  // Check if limits are exceeded
  if (requestsInLastMinute >= requestsPerMinute) {
    // Find the oldest request in the last minute to calculate reset time
    const oldestInMinute = entry.requests
      .filter((timestamp) => timestamp > oneMinuteAgo)
      .sort((a, b) => a - b)[0]

    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInMinute + 60 * 1000,
      error: `Çok fazla istek gönderdiniz. Lütfen ${Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000)} saniye sonra tekrar deneyin.`,
    }
  }

  if (requestsInLastHour >= requestsPerHour) {
    // Find the oldest request to calculate reset time
    const oldestRequest = entry.requests.sort((a, b) => a - b)[0]

    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestRequest + 60 * 60 * 1000,
      error: `Saatlik limit aşıldı. Lütfen ${Math.ceil((oldestRequest + 60 * 60 * 1000 - now) / 1000 / 60)} dakika sonra tekrar deneyin.`,
    }
  }

  // Add current request to the list
  entry.requests.push(now)

  // Calculate remaining requests
  const remaining = Math.min(
    requestsPerMinute - requestsInLastMinute - 1,
    requestsPerHour - requestsInLastHour - 1
  )

  // Calculate reset time (when the oldest request in the current window expires)
  const oldestInMinute = entry.requests
    .filter((timestamp) => timestamp > oneMinuteAgo)
    .sort((a, b) => a - b)[0]

  const resetAt = oldestInMinute ? oldestInMinute + 60 * 1000 : now + 60 * 1000

  return {
    allowed: true,
    remaining: Math.max(0, remaining),
    resetAt,
  }
}
