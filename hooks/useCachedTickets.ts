// hooks/useCachedTickets.ts (FIXED TYPESCRIPT ISSUES)
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTicketStore, TicketData } from '@/stores/ticket-store'
import { ticketsCache, cacheUtils, CACHE_CONFIGS } from '@/utils/smartCaching.utils'
import { useToast } from "@/hooks/use-toast"

interface UseCachedTicketsOptions {
  filters?: Record<string, any>
  autoRefresh?: boolean
  refreshInterval?: number
}

interface CachedTicketsState {
  tickets: TicketData[]
  loading: boolean
  error: string | null
  isStale: boolean
  lastFetch: number
}

export function useCachedTickets(options: UseCachedTicketsOptions = {}) {
  const { filters = {}, autoRefresh = true, refreshInterval = 30000 } = options
  
  // Store access
  const storeTickets = useTicketStore((state) => state?.tickets || [])
  const storeLoading = useTicketStore((state) => state?.loading?.list || false)
  const storeError = useTicketStore((state) => state?.errors?.list || null)
  const actions = useTicketStore((state) => state?.actions)
  
  // FIXED: Provide initial value for useState
  const [state, setState] = useState<CachedTicketsState>({
    tickets: [],
    loading: false,
    error: null,
    isStale: false,
    lastFetch: 0
  })
  
  const { toast } = useToast()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMountedRef = useRef(true)
  
  // Generate cache key based on filters
  const cacheKey = cacheUtils.getTicketsListKey(filters)
  
  // Fetch tickets with caching
  const fetchTickets = useCallback(async (force = false) => {
    if (!actions?.fetchTickets) return
    
    try {
      const fetcherFunction = async () => {
        console.log('🔄 Fetching tickets from API:', { filters, force })
        await actions.fetchTickets({
          page: 1,
          per_page: 20,
          sort_by: 'updated_at',
          sort_direction: 'desc',
          ...filters
        })
        
        // Return the tickets from store after fetch
        return useTicketStore.getState()?.tickets || []
      }

      if (force) {
        // Force refresh - bypass cache
        ticketsCache.invalidateByKey(cacheKey)
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const tickets = await fetcherFunction()
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            tickets,
            loading: false,
            isStale: false,
            lastFetch: Date.now()
          }))
        }
      } else {
        // Use smart caching
        const cachedData = ticketsCache.get<TicketData[]>(cacheKey, CACHE_CONFIGS.TICKETS_LIST)
        const shouldShowLoading = cacheUtils.shouldShowLoading(cacheKey)
        
        if (shouldShowLoading && isMountedRef.current) {
          setState(prev => ({ ...prev, loading: true, error: null }))
        }
        
        const tickets = await ticketsCache.getOrFetch(
          cacheKey,
          fetcherFunction,
          CACHE_CONFIGS.TICKETS_LIST
        )
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            tickets,
            loading: false,
            isStale: false,
            lastFetch: Date.now()
          }))
        }
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch tickets:', error)
      
      // Try to get stale data as fallback
      const staleData = cacheUtils.getStaleData<TicketData[]>(cacheKey)
      
      if (isMountedRef.current) {
        if (staleData) {
          setState(prev => ({
            ...prev,
            tickets: staleData,
            loading: false,
            isStale: true,
            error: null
          }))
          
          toast({
            title: 'Using cached data',
            description: 'Unable to fetch latest tickets, showing cached data',
            variant: 'default'
          })
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to fetch tickets'
          }))
        }
      }
    }
  }, [cacheKey, filters, actions, toast])
  
  // Initial load with cache check
  useEffect(() => {
    // Check if we have cached data first
    const cachedData = ticketsCache.get<TicketData[]>(cacheKey, CACHE_CONFIGS.TICKETS_LIST)
    
    if (cachedData) {
      // Use cached data immediately
      setState(prev => ({
        ...prev,
        tickets: cachedData,
        loading: false,
        isStale: false,
        lastFetch: Date.now()
      }))
      
      console.log('✅ Using cached tickets:', cachedData.length)
    }
    
    // Then fetch in background if needed
    fetchTickets(false)
  }, [cacheKey]) // Only depend on cache key, not fetchTickets to avoid loops
  
  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return
    
    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Auto-refreshing tickets')
        fetchTickets(false) // Use cache-aware refresh
        setupAutoRefresh() // Schedule next refresh
      }, refreshInterval)
    }
    
    setupAutoRefresh()
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, fetchTickets])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])
  
  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchTickets(true) // Force refresh
  }, [fetchTickets])
  
  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cacheUtils.invalidateTicketCache()
    setState(prev => ({ ...prev, isStale: false }))
  }, [])
  
  // Update local cache when store changes (for real-time updates)
  useEffect(() => {
    if (storeTickets.length > 0 && !storeLoading) {
      // Update cache with fresh data from store
      ticketsCache.set(cacheKey, storeTickets, CACHE_CONFIGS.TICKETS_LIST)
      
      setState(prev => ({
        ...prev,
        tickets: storeTickets,
        isStale: false,
        lastFetch: Date.now()
      }))
    }
  }, [storeTickets, storeLoading, cacheKey])
  
  // Sync error state
  useEffect(() => {
    if (storeError && !state.error) {
      setState(prev => ({ ...prev, error: storeError }))
    }
  }, [storeError, state.error])
  
  return {
    tickets: state.tickets,
    loading: state.loading,
    error: state.error,
    isStale: state.isStale,
    lastFetch: state.lastFetch,
    refresh,
    invalidateCache,
    
    // Cache utilities
    cacheStats: ticketsCache.getStats(),
    hasCachedData: !!ticketsCache.get(cacheKey),
  }
}

// Hook for managing ticket actions with cache invalidation
export function useCachedTicketActions() {
  const actions = useTicketStore((state) => state?.actions)
  const { toast } = useToast()
  
  const performAction = useCallback(async (
    actionType: string,
    actionFn: () => Promise<any>,
    invalidatePattern?: string
  ) => {
    try {
      console.log(`🎯 Performing action: ${actionType}`)
      
      const result = await actionFn()
      
      // Invalidate relevant cache
      if (invalidatePattern) {
        ticketsCache.invalidate(invalidatePattern)
      } else {
        cacheUtils.invalidateTicketCache()
      }
      
      toast({
        title: 'Success',
        description: `${actionType} completed successfully`,
      })
      
      return result
    } catch (error: any) {
      console.error(`❌ Action failed: ${actionType}`, error)
      
      toast({
        title: 'Error',
        description: error.message || `Failed to ${actionType}`,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])
  
  return {
    updateTicket: useCallback(async (ticketId: number, updates: any) => {
      return performAction(
        'update ticket',
        () => actions?.updateTicket(ticketId, updates),
        'tickets'
      )
    }, [actions, performAction]),
    
    deleteTicket: useCallback(async (ticketId: number, reason: string, notifyUser: boolean) => {
      return performAction(
        'delete ticket',
        () => actions?.deleteTicket(ticketId, reason, notifyUser),
        'tickets'
      )
    }, [actions, performAction]),
    
    assignTicket: useCallback(async (ticketId: number, userId: number | null, reason?: string) => {
      return performAction(
        'assign ticket',
        () => actions?.assignTicket(ticketId, userId, reason),
        'tickets'
      )
    }, [actions, performAction]),
    
    bulkAction: useCallback(async (actionType: string, ticketIds: number[], params?: any) => {
      return performAction(
        `bulk ${actionType}`,
        () => {
          switch (actionType) {
            case 'assign':
              return actions?.bulkAssign(ticketIds, params.userId, params.reason)
            default:
              throw new Error(`Unknown bulk action: ${actionType}`)
          }
        },
        'tickets'
      )
    }, [actions, performAction])
  }
}