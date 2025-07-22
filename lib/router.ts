// lib/router.ts - UPDATED: Added admin-tickets route

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

    // Handle route patterns
    switch (firstSegment) {
      case 'dashboard':
        return { page: 'dashboard', params: {} }
      
      case 'tickets':
        if (restSegments.length === 0) {
          return { page: 'tickets', params: {} }
        }
        
        // Parse ticket ID from URL
        const ticketIdentifier = restSegments[0]
        const ticketId = parseInt(ticketIdentifier)
        
        if (!isNaN(ticketId) && ticketId > 0) {
          console.log('🌐 Router: Parsed ticket ID:', ticketId)
          return {
            page: 'ticket-details',
            params: { ticketId }
          }
        }
        
        // If we can't parse, go back to tickets list
        console.warn('🌐 Router: Failed to parse ticket ID:', ticketIdentifier)
        return { page: 'tickets', params: {} }
      
      // NEW: Admin tickets route
      case 'admin-tickets':
        return { page: 'admin-tickets', params: {} }
      
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
          // Handle admin sub-routes
          const adminPage = restSegments[0]
          
          // Map admin routes
          switch (adminPage) {
            case 'tickets':
              return { page: 'admin-tickets', params: {} }
            case 'resources':
              return { page: 'admin-resources', params: {} }
            case 'users':
              return { page: 'admin-users', params: {} }
            case 'reports':
              return { page: 'admin-reports', params: {} }
            case 'settings':
              return { page: 'admin-settings', params: {} }
            case 'help':
              return { page: 'admin-help', params: {} }
            default:
              return { page: `admin-${adminPage}`, params: {} }
          }
        }
        break
    }

    // Default fallback
    console.log('🌐 Router: Using fallback route for:', path)
    return { page: 'dashboard', params: {} }
  }

  // Immediate navigation without delays
  public navigate(page: string, params: RouteParams = {}) {
    const newRoute = { page, params }
    const url = this.buildURL(page, params)
    
    console.log('🌐 Router: Immediate navigation to:', page, params, '-> URL:', url)
    
    // Update browser URL immediately
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', url)
    }
    
    // Update current route immediately
    this.currentRoute = newRoute
    
    // Notify listeners immediately (synchronously)
    this.notifyListeners()
  }

  public replace(page: string, params: RouteParams = {}) {
    const newRoute = { page, params }
    const url = this.buildURL(page, params)
    
    console.log('🌐 Router: Immediate replace to:', page, params, '-> URL:', url)
    
    // Replace browser URL immediately
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', url)
    }
    
    // Update current route immediately
    this.currentRoute = newRoute
    
    // Notify listeners immediately (synchronously)
    this.notifyListeners()
  }

  private buildURL(page: string, params: RouteParams): string {
    switch (page) {
      case 'dashboard':
        return '/dashboard'
      
      case 'tickets':
        return '/tickets'
      
      // NEW: Admin tickets URL
      case 'admin-tickets':
        return '/admin-tickets'
      
      case 'submit-ticket':
        return '/submit-ticket'
      
      case 'ticket-details':
        // Just use ticket ID in URL
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
    
    // Immediately call the listener with current route
    if (this.isInitialized) {
      try {
        listener(this.currentRoute)
      } catch (error) {
        console.error('🌐 Router: Error in initial listener call:', error)
      }
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Immediate synchronous notification
  private notifyListeners() {
    console.log('🌐 Router: Notifying listeners immediately:', this.currentRoute)
    
    this.listeners.forEach(listener => {
      try {
        listener(this.currentRoute)
      } catch (error) {
        console.error('🌐 Router: Error in route listener:', error)
      }
    })
  }

  public getCurrentRoute(): ParsedRoute {
    return this.currentRoute
  }

  public generateTicketURL(ticketId: number): string {
    const baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseURL}/tickets/${ticketId}`
  }

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
    console.log('🌐 Router: Force refreshing route')
    const newRoute = this.parseURL()
    this.currentRoute = newRoute
    this.notifyListeners()
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState)
    }
    this.listeners.clear()
    console.log('🌐 Router: Destroyed')
  }
}

// Singleton instance
export const appRouter = new AppRouter()

// React hook for immediate router updates
export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(() => {
    return appRouter.getCurrentRoute()
  })
  const [isReady, setIsReady] = useState(true) // Always ready for immediate navigation

  useEffect(() => {
    console.log('🌐 useAppRouter: Setting up router subscription')
    
    // Subscribe to route changes
    const unsubscribe = appRouter.subscribe((route) => {
      console.log('🌐 useAppRouter: Route changed to:', route)
      setCurrentRoute(route)
    })
    
    // Set initial route
    const initialRoute = appRouter.getCurrentRoute()
    setCurrentRoute(initialRoute)
    
    console.log('🌐 useAppRouter: Initial route set:', initialRoute)
    
    return unsubscribe
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

// Utility function to handle ticket navigation
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

// Export router utilities
export { appRouter as router }
export default useAppRouter