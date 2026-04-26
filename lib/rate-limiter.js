import { NextResponse } from 'next/server'

// In-memory store for rate limiting (use Redis in production)
const requests = new Map()

export function rateLimit({
  interval = 60 * 1000, // 1 minute
  uniqueTokenPerInterval = 500, // Max 500 unique IPs per minute
  maxRequests = 10 // Max 10 requests per IP per minute
} = {}) {
  return async (request) => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - interval

    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (value.timestamp < windowStart) {
        requests.delete(key)
      }
    }

    // Check current IP
    const tokenKey = `${ip}`
    const tokenData = requests.get(tokenKey) || { count: 0, timestamp: now }

    if (tokenData.timestamp < windowStart) {
      // Reset if outside window
      tokenData.count = 1
      tokenData.timestamp = now
    } else {
      tokenData.count++
    }

    requests.set(tokenKey, tokenData)

    // Check limits
    if (tokenData.count > maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((tokenData.timestamp + interval - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((tokenData.timestamp + interval - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - tokenData.count).toString(),
            'X-RateLimit-Reset': new Date(tokenData.timestamp + interval).toISOString()
          }
        }
      )
    }

    if (requests.size > uniqueTokenPerInterval) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    return null // No rate limit hit
  }
}

// Specific rate limiters for different endpoints
export const aiApiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5 // 5 AI requests per minute per IP
})

export const uploadLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute  
  maxRequests: 10 // 10 uploads per minute per IP
})

export const generalApiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 30 // 30 requests per minute per IP
}) 