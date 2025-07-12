// utils/smartCaching.utils.ts
export interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
  expiresIn: number
}

export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxAge: number // Maximum age before force refresh
  staleWhileRevalidate: number // Time to serve stale data while fetching new
}

export class SmartCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  
  private defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: 2 * 60 * 1000 // 2 minutes
  }

  generateKey(prefix: string, params?: Record<string, any>): string {
    if (!params) return prefix
    
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)
    
    return `${prefix}:${JSON.stringify(sortedParams)}`
  }

  isValid(entry: CacheEntry<any>, config: CacheConfig = this.defaultConfig): boolean {
    const now = Date.now()
    const age = now - entry.timestamp
    return age < config.ttl
  }

  isStale(entry: CacheEntry<any>, config: CacheConfig = this.defaultConfig): boolean {
    const now = Date.now()
    const age = now - entry.timestamp
    return age > config.staleWhileRevalidate && age < config.maxAge
  }

  isExpired(entry: CacheEntry<any>, config: CacheConfig = this.defaultConfig): boolean {
    const now = Date.now()
    const age = now - entry.timestamp
    return age > config.maxAge
  }

  get<T>(key: string, config?: CacheConfig): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const currentConfig = { ...this.defaultConfig, ...config }
    
    // If expired, remove from cache
    if (this.isExpired(entry, currentConfig)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set<T>(key: string, data: T, config?: CacheConfig): void {
    const currentConfig = { ...this.defaultConfig, ...config }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      expiresIn: currentConfig.ttl
    }

    this.cache.set(key, entry)
  }

  async getOrFetch<T>(
    key: string, 
    fetcher: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    const currentConfig = { ...this.defaultConfig, ...config }
    const entry = this.cache.get(key)

    // If we have valid cache, return it
    if (entry && this.isValid(entry, currentConfig)) {
      return entry.data
    }

    // If we have stale data, return it and fetch in background
    if (entry && this.isStale(entry, currentConfig)) {
      // Start background refresh but don't wait for it
      this.backgroundRefresh(key, fetcher, currentConfig)
      return entry.data
    }

    // If we have a pending request, wait for it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Fetch new data
    const promise = this.fetchAndCache(key, fetcher, currentConfig)
    this.pendingRequests.set(key, promise)

    try {
      const result = await promise
      this.pendingRequests.delete(key)
      return result
    } catch (error) {
      this.pendingRequests.delete(key)
      
      // If we have stale data, return it as fallback
      if (entry && !this.isExpired(entry, currentConfig)) {
        console.warn('Fetch failed, returning stale data:', error)
        return entry.data
      }
      
      throw error
    }
  }

  private async backgroundRefresh<T>(
    key: string, 
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      await this.fetchAndCache(key, fetcher, config)
    } catch (error) {
      console.warn('Background refresh failed:', error)
    }
  }

  private async fetchAndCache<T>(
    key: string, 
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const data = await fetcher()
    this.set(key, data, config)
    return data
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      this.pendingRequests.clear()
      return
    }

    // Remove entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }

    // Cancel pending requests matching pattern
    for (const [key, promise] of this.pendingRequests.entries()) {
      if (key.includes(pattern)) {
        this.pendingRequests.delete(key)
      }
    }
  }

  invalidateByKey(key: string): void {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  // Get cache stats for debugging
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        isValid: this.isValid(entry),
        isStale: this.isStale(entry),
        isExpired: this.isExpired(entry)
      }))
    }
  }

  // Cleanup expired entries
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const ticketsCache = new SmartCache()

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  TICKETS_LIST: {
    ttl: 2 * 60 * 1000, // 2 minutes
    maxAge: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: 30 * 1000 // 30 seconds
  },
  TICKET_DETAIL: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 30 * 60 * 1000, // 30 minutes
    staleWhileRevalidate: 60 * 1000 // 1 minute
  },
  STATS: {
    ttl: 1 * 60 * 1000, // 1 minute
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 15 * 1000 // 15 seconds
  },
  USER_DATA: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxAge: 60 * 60 * 1000, // 1 hour
    staleWhileRevalidate: 2 * 60 * 1000 // 2 minutes
  }
} as const

// Utility functions for common cache operations
export const cacheUtils = {
  // Invalidate all ticket-related cache when ticket is modified
  invalidateTicketCache: (ticketId?: number) => {
    ticketsCache.invalidate('tickets')
    if (ticketId) {
      ticketsCache.invalidateByKey(`ticket:${ticketId}`)
    }
  },

  // Invalidate cache when user performs actions
  invalidateUserActions: () => {
    ticketsCache.invalidate('tickets')
    ticketsCache.invalidate('stats')
  },

  // Get cache key for tickets list
  getTicketsListKey: (filters: Record<string, any>) => {
    return ticketsCache.generateKey('tickets:list', filters)
  },

  // Get cache key for ticket detail
  getTicketDetailKey: (ticketId: number) => {
    return `ticket:${ticketId}`
  },

  // Check if we should show loading state
  shouldShowLoading: (key: string) => {
    const entry = ticketsCache.get(key)
    return !entry // Only show loading if no cached data exists
  },

  // Get stale data for immediate display
  getStaleData: <T>(key: string): T | null => {
    return ticketsCache.get(key)
  }
}