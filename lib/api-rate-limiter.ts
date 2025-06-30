// lib/api-rate-limiter.ts - Prevents duplicate API calls and rate limits

class ApiRateLimiter {
  private pendingRequests = new Map<string, Promise<any>>()
  private lastRequestTimes = new Map<string, number>()
  private readonly minInterval = 1000 // Minimum 1 second between identical requests

  /**
   * Deduplicates identical requests and rate limits them
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    minInterval = this.minInterval
  ): Promise<T> {
    // Check if the same request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`🚫 API Rate Limiter: Deduplicating request for ${key}`)
      return this.pendingRequests.get(key)!
    }

    // Check if we need to rate limit
    const lastRequestTime = this.lastRequestTimes.get(key) || 0
    const timeSinceLastRequest = Date.now() - lastRequestTime
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      console.log(`⏱️ API Rate Limiter: Rate limiting ${key} for ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    // Make the request
    const requestPromise = requestFn()
    this.pendingRequests.set(key, requestPromise)
    this.lastRequestTimes.set(key, Date.now())

    try {
      const result = await requestPromise
      return result
    } finally {
      // Clean up
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPending(): void {
    this.pendingRequests.clear()
  }

  /**
   * Generate a unique key for a request
   */
  generateKey(method: string, url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${method}:${url}:${paramsStr}`
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter()

// Hook for using rate limiter in components
import { useCallback, useRef } from 'react'

export function useApiRateLimit() {
  const limiterRef = useRef(new ApiRateLimiter())

  const limitedRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    minInterval = 1000
  ): Promise<T> => {
    return limiterRef.current.deduplicateRequest(key, requestFn, minInterval)
  }, [])

  const generateKey = useCallback((method: string, url: string, params?: any): string => {
    return limiterRef.current.generateKey(method, url, params)
  }, [])

  return { limitedRequest, generateKey }
}