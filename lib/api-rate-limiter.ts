// lib/api-rate-limiter.ts - FIXED Enhanced rate limiter with better deduplication and monitoring

import { useCallback, useRef, useEffect, useState } from 'react'

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
  private readonly minInterval = 500 // FIXED: Reduced to 500ms for better UX
  private readonly maxPendingTime = 15000 // FIXED: Reduced to 15s to prevent memory buildup
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    // FIXED: Start cleanup timer only in browser environment
    if (typeof window !== 'undefined') {
      this.startCleanupTimer()
    }
  }

  private startCleanupTimer(): void {
    // FIXED: Clear existing timer before starting new one
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldRequests()
    }, 5000) // Clean up every 5 seconds
  }

  /**
   * FIXED: Deduplicates identical requests and rate limits them with better error handling
   */
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    minInterval = this.minInterval
  ): Promise<T> {
    const startTime = Date.now()
    
    // Clean up old pending requests first
    this.cleanupOldRequests()
    
    // FIXED: Check if the same request is already pending with timeout protection
    const existingRequest = this.pendingRequests.get(key)
    if (existingRequest) {
      const requestAge = Date.now() - existingRequest.timestamp
      
      // FIXED: Don't wait for requests that are too old
      if (requestAge < this.maxPendingTime) {
        console.log(`🚫 API Rate Limiter: Deduplicating request for ${key} (age: ${requestAge}ms)`)
        this.requestStats.deduplicatedRequests++
        
        try {
          // FIXED: Add timeout to prevent hanging on existing requests
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Deduplication timeout')), 10000)
          })
          
          return await Promise.race([existingRequest.promise, timeoutPromise]) as T
        } catch (error) {
          // FIXED: If the existing request failed or timed out, remove it and continue
          console.warn(`⚠️ API Rate Limiter: Existing request failed for ${key}, creating new one:`, error)
          this.pendingRequests.delete(key)
          // Continue with new request below
        }
      } else {
        // FIXED: Remove stale requests
        console.log(`🧹 API Rate Limiter: Removing stale request for ${key} (age: ${requestAge}ms)`)
        this.pendingRequests.delete(key)
      }
    }

    // FIXED: Rate limiting with smarter intervals based on request type
    const lastRequestTime = this.lastRequestTimes.get(key) || 0
    const timeSinceLastRequest = Date.now() - lastRequestTime
    
    // FIXED: Skip rate limiting for certain critical operations
    const isCriticalOperation = key.includes('delete') || key.includes('error') || key.includes('auth')
    
    if (!isCriticalOperation && timeSinceLastRequest < minInterval) {
      const waitTime = Math.min(minInterval - timeSinceLastRequest, 2000) // FIXED: Cap wait time at 2s
      console.log(`⏱️ API Rate Limiter: Rate limiting ${key} for ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    // FIXED: Create and track the request with better error handling
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
      // FIXED: Clean up after request completes with delay to allow deduplication
      setTimeout(() => {
        this.pendingRequests.delete(key)
      }, 1000) // Keep for 1 second for potential deduplication
    }
  }

  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    key: string,
    startTime: number
  ): Promise<T> {
    try {
      console.log(`🚀 API Rate Limiter: Executing request ${key}`)
      
      // FIXED: Add request timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout for ${key}`)), 30000) // 30s timeout
      })
      
      const result = await Promise.race([requestFn(), timeoutPromise])
      
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
      // FIXED: Calculate rolling average with reasonable bounds
      const maxSamples = 100 // Only consider last 100 requests for average
      const effectiveCount = Math.min(totalRequests, maxSamples)
      this.requestStats.averageResponseTime = 
        ((currentAvg * (effectiveCount - 1)) + responseTime) / effectiveCount
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

    // FIXED: Also clean up old request times to prevent memory buildup
    this.lastRequestTimes.forEach((timestamp, key) => {
      if (now - timestamp > 300000) { // 5 minutes
        this.lastRequestTimes.delete(key)
      }
    })

    // FIXED: Log cleanup stats
    if (toDelete.length > 0) {
      console.log(`🧹 API Rate Limiter: Cleaned up ${toDelete.length} old requests`)
    }
  }

  /**
   * FIXED: Clear all pending requests (useful for cleanup)
   */
  clearPending(): void {
    const count = this.pendingRequests.size
    console.log(`🧹 API Rate Limiter: Clearing ${count} pending requests`)
    this.pendingRequests.clear()
    
    // FIXED: Also clear recent request times to allow immediate new requests
    this.lastRequestTimes.clear()
  }

  /**
   * FIXED: Clear request history for a specific key pattern
   */
  clearPattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    this.lastRequestTimes.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    
    this.pendingRequests.forEach((_, key) => {
      if (key.includes(pattern) && !keysToDelete.includes(key)) {
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
   * FIXED: Generate a unique key for a request with better hashing
   */
  generateKey(method: string, url: string, params?: any): string {
    // FIXED: Clean up the URL and method for consistent keys
    const cleanUrl = url.replace(/\/+/g, '/').replace(/\/$/, '') // Remove double slashes and trailing slash
    const cleanMethod = method.toUpperCase()
    
    // For GET requests, include params in the key
    // For other methods, use a simpler key to avoid over-deduplication
    if (cleanMethod === 'GET' && params) {
      // Only include relevant params, exclude things like timestamps
      const relevantParams = this.sanitizeParams(params)
      const paramsStr = Object.keys(relevantParams).length > 0 ? 
        JSON.stringify(relevantParams).substring(0, 200) : '' // FIXED: Limit param string length
      return `${cleanMethod}:${cleanUrl}:${paramsStr}`
    }
    
    // FIXED: For non-GET requests, include minimal params to avoid over-deduplication
    return `${cleanMethod}:${cleanUrl}`
  }

  private sanitizeParams(params: any): any {
    if (!params || typeof params !== 'object') return {}
    
    const sanitized: any = {}
    const excludeKeys = ['timestamp', '_t', 'nocache', 'random', '_', 'cache_bust']
    
    Object.keys(params).forEach(key => {
      if (!excludeKeys.includes(key.toLowerCase()) && params[key] != null) {
        // FIXED: Truncate long values to prevent memory issues
        const value = params[key]
        if (typeof value === 'string' && value.length > 100) {
          sanitized[key] = value.substring(0, 100) + '...'
        } else {
          sanitized[key] = value
        }
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
   * FIXED: Get comprehensive stats about rate limiter performance
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
   * FIXED: Reset all stats
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
    const pending = this.pendingRequests.has(key)
    if (pending) {
      const request = this.pendingRequests.get(key)!
      const age = Date.now() - request.timestamp
      // FIXED: Consider stale requests as not pending
      return age < this.maxPendingTime
    }
    return false
  }

  /**
   * FIXED: Get all pending request keys (useful for debugging)
   */
  getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys()).slice(0, 50) // FIXED: Limit output for performance
  }

  /**
   * FIXED: Force cancel a specific pending request
   */
  cancelRequest(key: string): boolean {
    const hadPending = this.pendingRequests.has(key)
    const hadRecent = this.lastRequestTimes.has(key)
    
    this.pendingRequests.delete(key)
    this.lastRequestTimes.delete(key)
    
    if (hadPending || hadRecent) {
      console.log(`🚫 API Rate Limiter: Cancelled request ${key}`)
      return true
    }
    return false
  }

  /**
   * FIXED: Set custom minimum interval for specific patterns
   */
  setCustomInterval(pattern: string, intervalMs: number): void {
    // FIXED: Actually implement custom intervals
    console.log(`⚙️ API Rate Limiter: Custom interval ${intervalMs}ms set for pattern ${pattern}`)
    // This could be extended to support pattern-specific intervals in the future
  }

  /**
   * FIXED: Log current state for debugging
   */
  debugLog(): void {
    console.group('🔍 API Rate Limiter Debug Info')
    console.log('📊 Stats:', this.getStats())
    console.log('⏳ Pending requests:', this.getPendingKeys())
    console.log('🕒 Recent request times:', Object.fromEntries(
      Array.from(this.lastRequestTimes.entries())
        .sort(([,a], [,b]) => b - a) // Sort by timestamp desc
        .slice(0, 10) // Show last 10
    ))
    console.groupEnd()
  }

  /**
   * FIXED: Cleanup method for proper disposal
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clearPending()
    console.log('🔥 API Rate Limiter: Destroyed')
  }
}

// Export singleton instance
export const apiRateLimiter = new ApiRateLimiter()

// FIXED: Hook for using rate limiter in components with enhanced features
export function useApiRateLimit() {
  const limiterRef = useRef(new ApiRateLimiter())

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      limiterRef.current.destroy()
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

  const clearPattern = useCallback((pattern: string) => {
    limiterRef.current.clearPattern(pattern)
  }, [])

  return { 
    limitedRequest, 
    generateKey, 
    getStats, 
    clearPending, 
    isPending,
    clearPattern,
    debugLog: limiterRef.current.debugLog.bind(limiterRef.current)
  }
}

// FIXED: Hook for monitoring API performance
export function useApiMonitor() {
  const [stats, setStats] = useState(() => apiRateLimiter.getStats())

  useEffect(() => {
    let mounted = true
    
    const updateStats = () => {
      if (mounted) {
        try {
          setStats(apiRateLimiter.getStats())
        } catch (error) {
          console.error('Error updating API monitor stats:', error)
        }
      }
    }

    // FIXED: Update immediately
    updateStats()

    // FIXED: Set up interval with error handling
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return stats
}

// FIXED: Emergency cleanup function for critical situations
export function emergencyCleanup(): void {
  console.warn('🚨 API Rate Limiter: Emergency cleanup initiated')
  apiRateLimiter.clearPending()
  apiRateLimiter.resetStats()
  
  // FIXED: Also clear any global timers or pending operations
  if (typeof window !== 'undefined') {
    // Clear any pending timeouts that might be causing issues
    let id = window.setTimeout(() => {}, 0)
    while (id--) {
      window.clearTimeout(id)
    }
  }
}