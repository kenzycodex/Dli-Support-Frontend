// lib/router.ts - SIMPLIFIED: Removed complex slug logic to fix navigation issues
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
  private isNavigating = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentRoute = this.parseURL()
      this.isInitialized = true
      
      // Listen for browser navigation
      window.addEventListener('popstate', this.handlePopState)
      
      console.log('🌐 Router initialized with route:', this.currentRoute)
    }
  }

  private handlePopState = () => {
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

    // SIMPLIFIED: Handle route patterns without complex slug logic
    switch (firstSegment) {
      case 'dashboard':
        return { page: 'dashboard', params: {} }
      
      case 'tickets':
        if (restSegments.length === 0) {
          return { page: 'tickets', params: {} }
        }
        
        // SIMPLIFIED: Just use ticket ID, no slug complexity
        const ticketIdentifier = restSegments[0]
        const ticketId = parseInt(ticketIdentifier)
        
        if (!isNaN(ticketId)) {
          console.log('🌐 Router: Parsed ticket ID:', ticketId)
          return {
            page: 'ticket-details',
            params: { ticketId }
          }
        }
        
        // If we can't parse, go back to tickets list
        console.warn('🌐 Router: Failed to parse ticket ID:', ticketIdentifier)
        return { page: 'tickets', params: {} }
      
      case 'submit-ticket':
        return { page: 'submit-ticket', params: {} }
      
      case 'appointments':
        return { page: 'appointments', params: {} }
      
      case 'counseling':
        return { page: 'counseling', params: {} }
      
      case 'help':
        return { page: 'help', params: {} }

      case 'admin-help':
        return { page: 'admin-help', params: {} }
      
      case 'resources':
        return { page: 'resources', params: {} }

      case 'admin-resources':
        return { page: 'admin-resources', params: {} }
      
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

  // SIMPLIFIED: Navigation without complex slug handling
  public navigate(page: string, params: RouteParams = {}) {
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
      
      setTimeout(() => {
        this.notifyListeners()
        this.isNavigating = false
      }, 0)
      
    } catch (error) {
      console.error('🌐 Router: Navigation error:', error)
      this.isNavigating = false
    }
  }

  public replace(page: string, params: RouteParams = {}) {
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
        // SIMPLIFIED: Just use ticket ID in URL
        if (params.ticketId) {
          return `/tickets/${params.ticketId}`
        }
        return '/tickets'
      
      case 'appointments':
        return '/appointments'
      
      case 'counseling':
        return '/counseling'
      
      case 'help':
        return '/help'

      case 'admin-help':
        return '/admin-help'
      
      case 'resources':
        return '/resources'

      case 'admin-resources':
        return '/admin-resources'
      
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

  private notifyListeners() {
    console.log('🌐 Router: Notifying listeners of route change:', this.currentRoute)
    
    this.listeners.forEach(listener => {
      try {
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

  // SIMPLIFIED: Generate ticket URLs without slug complexity
  public generateTicketURL(ticketId: number): string {
    const baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseURL}/tickets/${ticketId}`
  }

  // SIMPLIFIED: Validate ticket URLs
  public isValidTicketURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      const segments = path.replace(/^\//, '').split('/').filter(Boolean)
      
      if (segments.length !== 2 || segments[0] !== 'tickets') {
        return false
      }
      
      const ticketIdentifier = segments[1]
      return !isNaN(parseInt(ticketIdentifier))
    } catch {
      return false
    }
  }

  // Force re-parse of current URL
  public refreshRoute() {
    if (this.isNavigating) {
      console.warn('🌐 Router: Cannot refresh during navigation')
      return
    }
    
    console.log('🌐 Router: Force refreshing route')
    const newRoute = this.parseURL()
    this.currentRoute = newRoute
    
    setTimeout(() => {
      this.notifyListeners()
    }, 0)
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState)
    }
    this.listeners.clear()
    this.isNavigating = false
    console.log('🌐 Router: Destroyed')
  }

  public resetNavigationState() {
    this.isNavigating = false
  }
}

// Singleton instance
export const appRouter = new AppRouter()

// SIMPLIFIED React hook for using the router
export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(() => {
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

  const generateTicketURL = useCallback((ticketId: number) => {
    return appRouter.generateTicketURL(ticketId)
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

// SIMPLIFIED: Utility function to handle ticket navigation
export function navigateToTicket(ticketId: number) {
  console.log('🌐 navigateToTicket:', ticketId)
  appRouter.navigate('ticket-details', { ticketId })
}

// Get current ticket info from URL
export function getCurrentTicketFromURL(): { ticketId: number | null } {
  const route = appRouter.getCurrentRoute()
  
  if (route.page === 'ticket-details') {
    return {
      ticketId: (route.params.ticketId as number) || null
    }
  }
  
  return { ticketId: null }
}

// Handle browser back/forward for ticket details
export function handleTicketNavigation(onTicketChange: (ticketId: number | null) => void) {
  return appRouter.subscribe((route) => {
    try {
      if (route.page === 'ticket-details') {
        const ticketId = (route.params.ticketId as number) || null
        onTicketChange(ticketId)
      } else {
        onTicketChange(null)
      }
    } catch (error) {
      console.error('🌐 handleTicketNavigation: Error in ticket navigation handler:', error)
      onTicketChange(null)
    }
  })
}

// Safe page transition helper
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

// Check if current navigation is safe
export function isNavigationSafe(): boolean {
  try {
    const router = appRouter as any
    return !router.isNavigating && router.isInitialized
  } catch {
    return false
  }
}

// Wait for safe navigation state
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

// Export router utilities
export { appRouter as router }
export default useAppRouter