// lib/api-rate-limiter.ts - Enhanced rate limiter with better deduplication and monitoring

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
  key: string
}

interface RateLimitStats {
  totalRequests: number
  deduplicatedRequests: number
  averageResponseTime: number
  lastRequestTime: number
}

class ApiRateLimiter {
  private pendingRequests = new Map<string, PendingRequest>()
  private lastRequestTimes = new Map<string, number>()
  private requestStats: RateLimitStats = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: 0
  }
  private readonly minInterval = 1000 // Minimum 1 second between identical requests
  private readonly maxPendingTime = 30000 // Max time to keep pending requests (30s)

  /**
   * Deduplicates identical requests and rate limits them
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    minInterval = this.minInterval
  ): Promise<T> {
    const startTime = Date.now()
    
    // Clean up old pending requests first
    this.cleanupOldRequests()
    
    // Check if the same request is already pending
    const existingRequest = this.pendingRequests.get(key)
    if (existingRequest) {
      console.log(`🚫 API Rate Limiter: Deduplicating request for ${key}`)
      this.requestStats.deduplicatedRequests++
      
      try {
        return await existingRequest.promise
      } catch (error) {
        // If the existing request failed, allow a new one
        this.pendingRequests.delete(key)
        throw error
      }
    }

    // Check if we need to rate limit
    const lastRequestTime = this.lastRequestTimes.get(key) || 0
    const timeSinceLastRequest = Date.now() - lastRequestTime
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      console.log(`⏱️ API Rate Limiter: Rate limiting ${key} for ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    // Create and track the request
    const requestPromise = this.executeRequest(requestFn, key, startTime)
    
    const pendingRequest: PendingRequest = {
      promise: requestPromise,
      timestamp: Date.now(),
      key
    }
    
    this.pendingRequests.set(key, pendingRequest)
    this.lastRequestTimes.set(key, Date.now())
    this.requestStats.totalRequests++
    this.requestStats.lastRequestTime = Date.now()

    try {
      const result = await requestPromise
      return result
    } finally {
      // Clean up after request completes
      this.pendingRequests.delete(key)
    }
  }

  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    key: string,
    startTime: number
  ): Promise<T> {
    try {
      console.log(`🚀 API Rate Limiter: Executing request ${key}`)
      const result = await requestFn()
      
      // Update average response time
      const responseTime = Date.now() - startTime
      this.updateAverageResponseTime(responseTime)
      
      console.log(`✅ API Rate Limiter: Request ${key} completed in ${responseTime}ms`)
      return result
    } catch (error) {
      console.error(`❌ API Rate Limiter: Request ${key} failed:`, error)
      throw error
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    const currentAvg = this.requestStats.averageResponseTime
    const totalRequests = this.requestStats.totalRequests
    
    if (totalRequests === 1) {
      this.requestStats.averageResponseTime = responseTime
    } else {
      // Calculate rolling average
      this.requestStats.averageResponseTime = 
        ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests
    }
  }

  private cleanupOldRequests(): void {
    const now = Date.now()
    const toDelete: string[] = []
    
    this.pendingRequests.forEach((request, key) => {
      if (now - request.timestamp > this.maxPendingTime) {
        console.log(`🧹 API Rate Limiter: Cleaning up old request ${key}`)
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => {
      this.pendingRequests.delete(key)
    })
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPending(): void {
    console.log(`🧹 API Rate Limiter: Clearing ${this.pendingRequests.size} pending requests`)
    this.pendingRequests.clear()
  }

  /**
   * Clear request history for a specific key pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    this.lastRequestTimes.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.lastRequestTimes.delete(key)
      this.pendingRequests.delete(key)
    })
    
    console.log(`🧹 API Rate Limiter: Cleared ${keysToDelete.length} requests matching pattern: ${pattern}`)
  }

  /**
   * Generate a unique key for a request
   */
  generateKey(method: string, url: string, params?: any): string {
    // For GET requests, include params in the key
    // For other methods, use a simpler key to avoid over-deduplication
    if (method === 'GET' && params) {
      // Only include relevant params, exclude things like timestamps
      const relevantParams = this.sanitizeParams(params)
      const paramsStr = Object.keys(relevantParams).length > 0 ? JSON.stringify(relevantParams) : ''
      return `${method}:${url}:${paramsStr}`
    }
    
    return `${method}:${url}`
  }

  private sanitizeParams(params: any): any {
    if (!params || typeof params !== 'object') return {}
    
    const sanitized: any = {}
    const excludeKeys = ['timestamp', '_t', 'nocache', 'random']
    
    Object.keys(params).forEach(key => {
      if (!excludeKeys.includes(key.toLowerCase()) && params[key] != null) {
        sanitized[key] = params[key]
      }
    })
    
    return sanitized
  }

  /**
   * Get current pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }

  /**
   * Get last request time
   */
  getLastRequestTime(): number {
    return this.requestStats.lastRequestTime
  }

  /**
   * Get comprehensive stats about rate limiter performance
   */
  getStats(): RateLimitStats & { pendingCount: number; cacheHitRate: number } {
    const cacheHitRate = this.requestStats.totalRequests > 0 
      ? (this.requestStats.deduplicatedRequests / this.requestStats.totalRequests) * 100 
      : 0

    return {
      ...this.requestStats,
      pendingCount: this.pendingRequests.size,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }
  }

  /**
   * Reset all stats
   */
  resetStats(): void {
    this.requestStats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    }
    console.log('📊 API Rate Limiter: Stats reset')
  }

  /**
   * Check if a specific request is currently pending
   */
  isPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  /**
   * Get all pending request keys (useful for debugging)
   */
  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys())
  }

  /**
   * Force cancel a specific pending request
   */
  cancelRequest(key: string): boolean {
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.delete(key)
      this.lastRequestTimes.delete(key)
      console.log(`🚫 API Rate Limiter: Cancelled request ${key}`)
      return true
    }
    return false
  }

  /**
   * Set custom minimum interval for specific patterns
   */
  setCustomInterval(pattern: string, intervalMs: number): void {
    // This could be extended to support pattern-specific intervals
    console.log(`⚙️ API Rate Limiter: Custom interval ${intervalMs}ms set for pattern ${pattern}`)
  }

  /**
   * Log current state for debugging
   */
  debugLog(): void {
    console.group('🔍 API Rate Limiter Debug Info')
    console.log('📊 Stats:', this.getStats())
    console.log('⏳ Pending requests:', this.getPendingKeys())
    console.log('🕒 Last request times:', Object.fromEntries(
      Array.from(this.lastRequestTimes.entries()).slice(-10) // Show last 10
    ))
    console.groupEnd()
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter()

// Hook for using rate limiter in components with enhanced features
import { useCallback, useRef, useEffect } from 'react'

export function useApiRateLimit() {
  const limiterRef = useRef(new ApiRateLimiter())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      limiterRef.current.clearPending()
    }
  }, [])

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

  const getStats = useCallback(() => {
    return limiterRef.current.getStats()
  }, [])

  const clearPending = useCallback(() => {
    limiterRef.current.clearPending()
  }, [])

  const isPending = useCallback((key: string) => {
    return limiterRef.current.isPending(key)
  }, [])

  return { 
    limitedRequest, 
    generateKey, 
    getStats, 
    clearPending, 
    isPending,
    debugLog: limiterRef.current.debugLog.bind(limiterRef.current)
  }
}

// Hook for monitoring API performance
export function useApiMonitor() {
  const [stats, setStats] = useState(apiRateLimiter.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiRateLimiter.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return stats
}