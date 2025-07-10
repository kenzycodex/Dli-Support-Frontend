// lib/router.ts (FIXED - Safe navigation to prevent freezing)
"use client"

import { useState, useEffect, useCallback } from 'react'

export interface RouteParams {
  [key: string]: string | number | undefined
}

export interface ParsedRoute {
  page: string
  params: RouteParams
}

class AppRouter {
  private listeners: Set<(route: ParsedRoute) => void> = new Set()
  private currentRoute: ParsedRoute = { page: 'dashboard', params: {} }
  private isInitialized = false
  private isNavigating = false // FIXED: Prevent navigation during transitions

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentRoute = this.parseURL()
      this.isInitialized = true
      
      // Listen for browser navigation
      window.addEventListener('popstate', this.handlePopState)
      
      // Listen for manual URL changes
      window.addEventListener('hashchange', this.handlePopState)
      
      console.log('🌐 Router initialized with route:', this.currentRoute)
    }
  }

  private handlePopState = () => {
    // FIXED: Prevent handling popstate during navigation
    if (this.isNavigating) {
      console.log('🌐 Router: Ignoring popstate during navigation')
      return
    }

    const newRoute = this.parseURL()
    console.log('🌐 Router: Browser navigation detected:', newRoute)
    this.currentRoute = newRoute
    this.notifyListeners()
  }

  private parseURL(): ParsedRoute {
    if (typeof window === 'undefined') {
      return { page: 'dashboard', params: {} }
    }

    const path = window.location.pathname
    
    console.log('🌐 Router: Parsing URL:', path)

    // Remove leading slash and split path
    const segments = path.replace(/^\//, '').split('/').filter(Boolean)

    if (segments.length === 0) {
      return { page: 'dashboard', params: {} }
    }

    const [firstSegment, ...restSegments] = segments

    // Handle different route patterns dynamically
    switch (firstSegment) {
      case 'dashboard':
        return { page: 'dashboard', params: {} }
      
      case 'tickets':
        if (restSegments.length === 0) {
          return { page: 'tickets', params: {} }
        }
        
        // ENHANCED: Handle ticket details with proper slug parsing
        const ticketIdentifier = restSegments[0]
        console.log('🌐 Router: Parsing ticket identifier:', ticketIdentifier)
        
        // Check if it's a slug (contains hyphens) or just an ID
        if (ticketIdentifier.includes('-')) {
          // It's a slug: extract ticket ID from the beginning
          const slugParts = ticketIdentifier.split('-')
          const ticketId = parseInt(slugParts[0])
          
          if (!isNaN(ticketId)) {
            console.log('🌐 Router: Parsed slug - ID:', ticketId, 'Slug:', ticketIdentifier)
            return {
              page: 'ticket-details',
              params: { 
                ticketId, 
                slug: ticketIdentifier 
              }
            }
          }
        } else {
          // It's just an ID
          const ticketId = parseInt(ticketIdentifier)
          
          if (!isNaN(ticketId)) {
            console.log('🌐 Router: Parsed ID-only:', ticketId)
            return {
              page: 'ticket-details',
              params: { 
                ticketId,
                slug: undefined 
              }
            }
          }
        }
        
        // If we can't parse the ticket identifier, go back to tickets list
        console.warn('🌐 Router: Failed to parse ticket identifier:', ticketIdentifier)
        return { page: 'tickets', params: {} }
      
      case 'submit-ticket':
        return { page: 'submit-ticket', params: {} }
      
      case 'appointments':
        return { page: 'appointments', params: {} }
      
      case 'counseling':
        return { page: 'counseling', params: {} }
      
      case 'help':
        return { page: 'help', params: {} }
      
      case 'resources':
        return { page: 'resources', params: {} }
      
      case 'notifications':
        return { page: 'notifications', params: {} }
      
      case 'admin':
        if (restSegments.length > 0) {
          return { page: `admin-${restSegments[0]}`, params: {} }
        }
        break
    }

    // Default fallback
    console.log('🌐 Router: Using fallback route for:', path)
    return { page: 'dashboard', params: {} }
  }

  // FIXED: Safe navigation with anti-freeze protection
  public navigate(page: string, params: RouteParams = {}) {
    // FIXED: Prevent navigation during another navigation
    if (this.isNavigating) {
      console.warn('🌐 Router: Navigation blocked - already navigating')
      return
    }

    this.isNavigating = true
    
    try {
      const newRoute = { page, params }
      const url = this.buildURL(page, params)
      
      console.log('🌐 Router: Navigating to:', page, params, '-> URL:', url)
      
      // Update browser URL
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', url)
      }
      
      // Update current route and notify listeners
      this.currentRoute = newRoute
      
      // FIXED: Use setTimeout to prevent UI freeze
      setTimeout(() => {
        this.notifyListeners()
        this.isNavigating = false
      }, 0)
      
    } catch (error) {
      console.error('🌐 Router: Navigation error:', error)
      this.isNavigating = false
    }
  }

  // FIXED: Safe replace with anti-freeze protection
  public replace(page: string, params: RouteParams = {}) {
    // FIXED: Prevent replace during navigation
    if (this.isNavigating) {
      console.warn('🌐 Router: Replace blocked - already navigating')
      return
    }

    this.isNavigating = true
    
    try {
      const newRoute = { page, params }
      const url = this.buildURL(page, params)
      
      console.log('🌐 Router: Replacing route to:', page, params, '-> URL:', url)
      
      // Replace browser URL
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', url)
      }
      
      // Update current route and notify listeners
      this.currentRoute = newRoute
      
      // FIXED: Use setTimeout to prevent UI freeze
      setTimeout(() => {
        this.notifyListeners()
        this.isNavigating = false
      }, 0)
      
    } catch (error) {
      console.error('🌐 Router: Replace error:', error)
      this.isNavigating = false
    }
  }

  private buildURL(page: string, params: RouteParams): string {
    switch (page) {
      case 'dashboard':
        return '/dashboard'
      
      case 'tickets':
        return '/tickets'
      
      case 'submit-ticket':
        return '/submit-ticket'
      
      case 'ticket-details':
        // ENHANCED: Prefer slug over ID for better URLs
        if (params.slug) {
          return `/tickets/${params.slug}`
        } else if (params.ticketId) {
          return `/tickets/${params.ticketId}`
        }
        return '/tickets'
      
      case 'appointments':
        return '/appointments'
      
      case 'counseling':
        return '/counseling'
      
      case 'help':
        return '/help'
      
      case 'resources':
        return '/resources'
      
      case 'notifications':
        return '/notifications'
      
      default:
        // Handle admin routes dynamically
        if (page.startsWith('admin-')) {
          const adminPage = page.replace('admin-', '')
          return `/admin/${adminPage}`
        }
        
        return '/dashboard'
    }
  }

  public subscribe(listener: (route: ParsedRoute) => void) {
    this.listeners.add(listener)
    
    // Immediately call the listener with current route if initialized
    if (this.isInitialized) {
      // FIXED: Use setTimeout to prevent blocking
      setTimeout(() => {
        try {
          listener(this.currentRoute)
        } catch (error) {
          console.error('🌐 Router: Error in initial listener call:', error)
        }
      }, 0)
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // FIXED: Safe listener notification with error handling
  private notifyListeners() {
    console.log('🌐 Router: Notifying listeners of route change:', this.currentRoute)
    
    this.listeners.forEach(listener => {
      try {
        // FIXED: Use setTimeout to prevent blocking UI
        setTimeout(() => {
          try {
            listener(this.currentRoute)
          } catch (error) {
            console.error('🌐 Router: Error in route listener:', error)
          }
        }, 0)
      } catch (error) {
        console.error('🌐 Router: Error scheduling listener:', error)
      }
    })
  }

  public getCurrentRoute(): ParsedRoute {
    return this.currentRoute
  }

  // ENHANCED: Method to generate proper URLs for tickets with slugs
  public generateTicketURL(ticketId: number, slug?: string): string {
    const baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    
    if (slug) {
      return `${baseURL}/tickets/${slug}`
    } else {
      return `${baseURL}/tickets/${ticketId}`
    }
  }

  // ENHANCED: Method to validate ticket URLs
  public isValidTicketURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      const segments = path.replace(/^\//, '').split('/').filter(Boolean)
      
      if (segments.length !== 2 || segments[0] !== 'tickets') {
        return false
      }
      
      const ticketIdentifier = segments[1]
      
      // Check if it's a valid slug or ID
      if (ticketIdentifier.includes('-')) {
        // Slug format: should start with a number
        const firstPart = ticketIdentifier.split('-')[0]
        return !isNaN(parseInt(firstPart))
      } else {
        // ID format: should be a number
        return !isNaN(parseInt(ticketIdentifier))
      }
    } catch {
      return false
    }
  }

  // ENHANCED: Force re-parse of current URL
  public refreshRoute() {
    if (this.isNavigating) {
      console.warn('🌐 Router: Cannot refresh during navigation')
      return
    }
    
    console.log('🌐 Router: Force refreshing route')
    const newRoute = this.parseURL()
    this.currentRoute = newRoute
    
    // FIXED: Use setTimeout to prevent UI freeze
    setTimeout(() => {
      this.notifyListeners()
    }, 0)
  }

  // FIXED: Safe destroy method
  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState)
      window.removeEventListener('hashchange', this.handlePopState)
    }
    this.listeners.clear()
    this.isNavigating = false
    console.log('🌐 Router: Destroyed')
  }

  // Public method to reset navigation state
  public resetNavigationState() {
    this.isNavigating = false
  }
}

// Singleton instance
export const appRouter = new AppRouter()

// ENHANCED React hook for using the router
export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(() => {
    // Initialize with current route from router
    return appRouter.getCurrentRoute()
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log('🌐 useAppRouter: Setting up router subscription')
    let mounted = true
    
    // Subscribe to route changes
    const unsubscribe = appRouter.subscribe((route) => {
      if (mounted) {
        console.log('🌐 useAppRouter: Route changed to:', route)
        setCurrentRoute(route)
        setIsReady(true)
      }
    })
    
    // Set initial route and mark as ready
    const initialRoute = appRouter.getCurrentRoute()
    if (mounted) {
      setCurrentRoute(initialRoute)
      setIsReady(true)
    }
    
    console.log('🌐 useAppRouter: Initial route set:', initialRoute)
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const navigate = useCallback((page: string, params: RouteParams = {}) => {
    console.log('🌐 useAppRouter: Navigate called:', page, params)
    appRouter.navigate(page, params)
  }, [])

  const replace = useCallback((page: string, params: RouteParams = {}) => {
    console.log('🌐 useAppRouter: Replace called:', page, params)
    appRouter.replace(page, params)
  }, [])

  const generateTicketURL = useCallback((ticketId: number, slug?: string) => {
    return appRouter.generateTicketURL(ticketId, slug)
  }, [])

  const isValidTicketURL = useCallback((url: string) => {
    return appRouter.isValidTicketURL(url)
  }, [])

  const refreshRoute = useCallback(() => {
    console.log('🌐 useAppRouter: Refresh route called')
    appRouter.refreshRoute()
  }, [])

  return {
    currentRoute,
    navigate,
    replace,
    page: currentRoute.page,
    params: currentRoute.params,
    generateTicketURL,
    isValidTicketURL,
    refreshRoute,
    isReady
  }
}

// ENHANCED: Utility function to handle ticket navigation with proper slug support
export function navigateToTicket(ticketId: number, slug?: string) {
  console.log('🌐 navigateToTicket:', ticketId, slug)
  if (slug) {
    appRouter.navigate('ticket-details', { ticketId, slug })
  } else {
    appRouter.navigate('ticket-details', { ticketId })
  }
}

// ENHANCED: Utility function to get current ticket info from URL
export function getCurrentTicketFromURL(): { ticketId: number | null; slug: string | null } {
  const route = appRouter.getCurrentRoute()
  
  if (route.page === 'ticket-details') {
    return {
      ticketId: (route.params.ticketId as number) || null,
      slug: (route.params.slug as string) || null
    }
  }
  
  return { ticketId: null, slug: null }
}

// ENHANCED: Utility function to handle browser back/forward for ticket details
export function handleTicketNavigation(onTicketChange: (ticketId: number | null, slug: string | null) => void) {
  return appRouter.subscribe((route) => {
    try {
      if (route.page === 'ticket-details') {
        const ticketId = (route.params.ticketId as number) || null
        const slug = (route.params.slug as string) || null
        onTicketChange(ticketId, slug)
      } else {
        onTicketChange(null, null)
      }
    } catch (error) {
      console.error('🌐 handleTicketNavigation: Error in ticket navigation handler:', error)
      onTicketChange(null, null)
    }
  })
}

// FIXED: Safe page transition helper
export function safePageTransition(page: string, params: RouteParams = {}, timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout
    let unsubscribe: (() => void) | null = null
    
    try {
      // Set up timeout to prevent hanging
      timeoutId = setTimeout(() => {
        console.warn('🌐 Router: Page transition timeout')
        if (unsubscribe) unsubscribe()
        resolve(false)
      }, timeout)
      
      // Subscribe to route changes
      unsubscribe = appRouter.subscribe((route) => {
        if (route.page === page) {
          console.log('✅ Router: Page transition completed:', page)
          clearTimeout(timeoutId)
          if (unsubscribe) unsubscribe()
          resolve(true)
        }
      })
      
      // Trigger navigation
      appRouter.navigate(page, params)
      
    } catch (error) {
      console.error('❌ Router: Page transition failed:', error)
      clearTimeout(timeoutId!)
      if (unsubscribe) unsubscribe()
      resolve(false)
    }
  })
}

// FIXED: Batch navigation for multiple route changes
export async function batchNavigate(routes: Array<{ page: string; params?: RouteParams; delay?: number }>) {
  console.log('🌐 Router: Starting batch navigation for', routes.length, 'routes')
  
  for (let i = 0; i < routes.length; i++) {
    const { page, params = {}, delay = 100 } = routes[i]
    
    try {
      console.log(`🌐 Router: Batch navigate ${i + 1}/${routes.length}:`, page)
      
      if (i === routes.length - 1) {
        // Last route - use normal navigation
        appRouter.navigate(page, params)
      } else {
        // Intermediate routes - use replace to avoid history buildup
        appRouter.replace(page, params)
      }
      
      // Add delay between navigations
      if (delay > 0 && i < routes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
    } catch (error) {
      console.error(`❌ Router: Batch navigation failed at step ${i + 1}:`, error)
      break
    }
  }
  
  console.log('✅ Router: Batch navigation completed')
}

// FIXED: Check if current navigation is safe
export function isNavigationSafe(): boolean {
  try {
    const router = appRouter as any
    return !router.isNavigating && router.isInitialized
  } catch {
    return false
  }
}

// FIXED: Wait for safe navigation state
export function waitForSafeNavigation(timeout: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isNavigationSafe()) {
      resolve(true)
      return
    }
    
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (isNavigationSafe()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        console.warn('🌐 Router: Wait for safe navigation timeout')
        resolve(false)
      }
    }, 100)
  })
}

// FIXED: Router performance monitor
export function getRouterPerformance() {
  try {
    const router = appRouter as any
    return {
      isNavigating: router.isNavigating || false,
      isInitialized: router.isInitialized || false,
      currentRoute: router.currentRoute || { page: 'unknown', params: {} },
      listenerCount: router.listeners?.size || 0,
      lastNavigationTime: router.lastNavigationTime || 0,
      navigationCount: router.navigationCount || 0
    }
  } catch (error) {
    console.error('Error getting router performance:', error)
    return {
      isNavigating: false,
      isInitialized: false,
      currentRoute: { page: 'error', params: {} },
      listenerCount: 0,
      lastNavigationTime: 0,
      navigationCount: 0
    }
  }
}

// FIXED: Router health check
export function routerHealthCheck(): { healthy: boolean; issues: string[] } {
  const issues: string[] = []
  
  try {
    const perf = getRouterPerformance()
    
    if (!perf.isInitialized) {
      issues.push('Router not initialized')
    }
    
    if (perf.isNavigating && Date.now() - perf.lastNavigationTime > 10000) {
      issues.push('Navigation stuck for more than 10 seconds')
    }
    
    if (perf.listenerCount > 50) {
      issues.push(`Too many listeners: ${perf.listenerCount}`)
    }
    
    if (perf.navigationCount > 1000) {
      issues.push(`High navigation count: ${perf.navigationCount}`)
    }
    
    // Check browser history state
    if (typeof window !== 'undefined') {
      try {
        const historyLength = window.history.length
        if (historyLength > 500) {
          issues.push(`History too large: ${historyLength}`)
        }
      } catch (error) {
        issues.push('Cannot access browser history')
      }
    }
    
  } catch (error) {
    issues.push(`Health check failed: ${error}`)
  }
  
  return {
    healthy: issues.length === 0,
    issues
  }
}

// Export router utilities
export { appRouter as router }
export default useAppRouter