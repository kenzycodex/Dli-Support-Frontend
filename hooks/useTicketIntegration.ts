// hooks/useTicketIntegration.ts - FIXED: Prevent multiple API calls

import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useTicketStore, TicketData, CreateTicketRequest } from '@/stores/ticket-store'
import { useTicketCategoriesStore, CategoryWithStats } from '@/stores/ticketCategories-store'
import { ticketService } from '@/services/ticket.service'
import { useToast } from "@/hooks/use-toast"
import { authService } from '@/services/auth.service'

/**
 * FIXED: Main integration hook that prevents multiple API calls
 */
export const useTicketIntegration = (options: {
  autoLoadCategories?: boolean
  autoLoadTickets?: boolean
  enableRealTimeUpdates?: boolean
} = {}) => {
  const { autoLoadCategories = true, autoLoadTickets = true, enableRealTimeUpdates = false } = options
  
  // Ticket store
  const ticketActions = useTicketStore((state) => state.actions)
  const ticketLoading = useTicketStore((state) => state.loading)
  const ticketErrors = useTicketStore((state) => state.errors)
  const tickets = useTicketStore((state) => state.tickets)
  const currentTicket = useTicketStore((state) => state.currentTicket)
  const ticketLastFetch = useTicketStore((state) => state.lastFetch)
  
  // Categories store
  const categoryActions = useTicketCategoriesStore((state) => state.actions)
  const categoryLoading = useTicketCategoriesStore((state) => state.loading)
  const categoryErrors = useTicketCategoriesStore((state) => state.errors)
  const categories = useTicketCategoriesStore((state) => state.categories)
  const categoriesLastFetch = useTicketCategoriesStore((state) => state.categoriesLastFetch)
  
  const { toast } = useToast()
  
  // FIXED: Track initialization to prevent duplicate calls
  const initializationRef = useRef({
    categoriesInitialized: false,
    ticketsInitialized: false,
    isInitializing: false
  })

  // FIXED: Single initialization effect with proper cache checking
  useEffect(() => {
    const init = async () => {
      // Prevent multiple simultaneous initializations
      if (initializationRef.current.isInitializing) {
        console.log('🎫 Integration: Already initializing, skipping...')
        return
      }

      initializationRef.current.isInitializing = true

      try {
        // Check if categories need loading
        if (autoLoadCategories && !initializationRef.current.categoriesInitialized) {
          const categoriesAge = Date.now() - categoriesLastFetch
          const shouldLoadCategories = categories.length === 0 || categoriesAge > 300000 // 5 minutes

          if (shouldLoadCategories) {
            console.log('🎫 Integration: Loading categories (not in cache or stale)')
            await categoryActions.fetchCategories()
          } else {
            console.log('🎫 Integration: Using cached categories:', categories.length)
          }
          
          initializationRef.current.categoriesInitialized = true
        }

        // Check if tickets need loading (only after categories are ready)
        if (autoLoadTickets && !initializationRef.current.ticketsInitialized) {
          const currentCategories = useTicketCategoriesStore.getState().categories
          
          if (currentCategories.length > 0) {
            const ticketsAge = Date.now() - ticketLastFetch
            const shouldLoadTickets = tickets.length === 0 || ticketsAge > 300000 // 5 minutes

            if (shouldLoadTickets) {
              console.log('🎫 Integration: Loading tickets (not in cache or stale)')
              await ticketActions.fetchTickets()
            } else {
              console.log('🎫 Integration: Using cached tickets:', tickets.length)
            }
            
            initializationRef.current.ticketsInitialized = true
          }
        }
      } catch (error) {
        console.error('❌ Integration: Initialization failed:', error)
      } finally {
        initializationRef.current.isInitializing = false
      }
    }

    // Only initialize if we haven't already
    if (!initializationRef.current.categoriesInitialized || !initializationRef.current.ticketsInitialized) {
      init()
    }
  }, []) // Empty dependency array - only run once on mount

  // FIXED: Reset initialization flags when data is manually cleared
  useEffect(() => {
    if (categories.length === 0 && initializationRef.current.categoriesInitialized) {
      console.log('🎫 Integration: Categories cleared, resetting initialization flag')
      initializationRef.current.categoriesInitialized = false
    }
    
    if (tickets.length === 0 && initializationRef.current.ticketsInitialized) {
      console.log('🎫 Integration: Tickets cleared, resetting initialization flag')
      initializationRef.current.ticketsInitialized = false
    }
  }, [categories.length, tickets.length])

  // Enhanced ticket creation with category validation
  const createTicketWithValidation = useCallback(async (data: CreateTicketRequest) => {
    try {
      // Validate category exists and is active
      const category = categories.find(c => c.id === data.category_id)
      if (!category) {
        throw new Error('Please select a valid category')
      }
      if (!category.is_active) {
        throw new Error('Selected category is not available')
      }

      const result = await ticketActions.createTicket(data)
      
      if (result) {
        toast({
          title: 'Success',
          description: `Ticket created successfully${result.crisis_flag ? ' (Crisis detected - escalated)' : ''}`,
        })
        
        // Show auto-assignment feedback
        if (result.auto_assigned === 'yes') {
          toast({
            title: 'Auto-assigned',
            description: `Ticket automatically assigned to ${result.assignedTo?.name || 'counselor'}`,
          })
        }
      }
      
      return result
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive',
      })
      throw error
    }
  }, [categories, ticketActions, toast])

  // Enhanced ticket operations with category context
  const ticketOperations = useMemo(() => ({
    createTicket: createTicketWithValidation,
    
    updateTicket: async (id: number, data: any) => {
      try {
        if (data.category_id) {
          const category = categories.find(c => c.id === data.category_id)
          if (!category || !category.is_active) {
            throw new Error('Invalid category selected')
          }
        }
        
        await ticketActions.updateTicket(id, data)
        toast({
          title: 'Success',
          description: 'Ticket updated successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update ticket',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    deleteTicket: async (id: number, reason: string, notifyUser: boolean = false) => {
      try {
        await ticketActions.deleteTicket(id, reason, notifyUser)
        toast({
          title: 'Success',
          description: 'Ticket deleted successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete ticket',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    addResponse: async (ticketId: number, data: any) => {
      try {
        await ticketActions.addResponse(ticketId, data)
        toast({
          title: 'Success',
          description: 'Response added successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add response',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    assignTicket: async (ticketId: number, assignedTo: number | null, reason?: string) => {
      try {
        await ticketActions.assignTicket(ticketId, assignedTo, reason)
        toast({
          title: 'Success',
          description: assignedTo ? 'Ticket assigned successfully' : 'Ticket unassigned successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to assign ticket',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    testCrisisDetection: async (text: string, categoryId?: number) => {
      try {
        const result = await ticketActions.testCrisisDetection(text, categoryId)
        
        if (result?.is_crisis) {
          toast({
            title: 'Crisis Detected',
            description: `Crisis keywords detected (Score: ${result.crisis_score})`,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'No Crisis Detected',
            description: 'No crisis keywords found in the text',
          })
        }
        
        return result
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to test crisis detection',
          variant: 'destructive',
        })
        throw error
      }
    },
  }), [categories, ticketActions, toast, createTicketWithValidation])

  // Enhanced data with category relationships
  const enhancedData = useMemo(() => {
    const enrichedTickets = tickets.map(ticket => {
      const category = categories.find(c => c.id === ticket.category_id)
      return {
        ...ticket,
        category,
        categoryName: category?.name || 'Unknown',
        categoryColor: category?.color || '#gray',
        categoryIcon: category?.icon || 'MessageSquare',
        slaHours: category?.sla_response_hours || 24,
        autoAssignEnabled: category?.auto_assign || false,
        crisisDetectionEnabled: category?.crisis_detection_enabled || false,
      }
    })

    return {
      tickets: enrichedTickets,
      categories,
      currentTicketWithCategory: currentTicket ? {
        ...currentTicket,
        category: categories.find(c => c.id === currentTicket.category_id)
      } : null,
    }
  }, [tickets, categories, currentTicket])

  // Combined loading and error states
  const combinedState = useMemo(() => ({
    loading: {
      any: Object.values(ticketLoading).some(Boolean) || Object.values(categoryLoading).some(Boolean),
      tickets: ticketLoading,
      categories: categoryLoading,
    },
    errors: {
      any: Object.values(ticketErrors).some(Boolean) || Object.values(categoryErrors).some(Boolean),
      tickets: ticketErrors,
      categories: categoryErrors,
    },
  }), [ticketLoading, categoryLoading, ticketErrors, categoryErrors])

  // FIXED: Smart refresh that uses cache when possible
  const refreshAll = useCallback(async () => {
    try {
      console.log('🔄 Integration: Smart refresh - checking cache first')
      
      // Only refresh if data is actually stale
      const categoriesAge = Date.now() - categoriesLastFetch
      const ticketsAge = Date.now() - ticketLastFetch
      
      const promises = []
      
      if (categoriesAge > 60000) { // Refresh categories if older than 1 minute
        console.log('🔄 Integration: Refreshing categories (stale)')
        promises.push(categoryActions.refreshCategories())
      }
      
      if (ticketsAge > 60000) { // Refresh tickets if older than 1 minute
        console.log('🔄 Integration: Refreshing tickets (stale)')
        promises.push(ticketActions.refreshTickets())
      }
      
      if (promises.length > 0) {
        await Promise.all(promises)
        toast({
          title: 'Success',
          description: 'Data refreshed successfully',
        })
      } else {
        console.log('✅ Integration: Data is fresh, no refresh needed')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      })
    }
  }, [categoryActions, ticketActions, toast, categoriesLastFetch, ticketLastFetch])

  // Clear all caches and reset flags
  const clearAllCaches = useCallback(() => {
    ticketActions.clearCache()
    categoryActions.clearCache()
    
    // Reset initialization flags
    initializationRef.current = {
      categoriesInitialized: false,
      ticketsInitialized: false,
      isInitializing: false
    }
    
    toast({
      title: 'Success',
      description: 'All caches cleared',
    })
  }, [ticketActions, categoryActions, toast])

  return {
    data: enhancedData,
    state: combinedState,
    ticketOperations,
    refreshAll,
    clearAllCaches,
    
    // Initialization status
    initializationStatus: {
      categoriesReady: initializationRef.current.categoriesInitialized,
      ticketsReady: initializationRef.current.ticketsInitialized,
      isInitializing: initializationRef.current.isInitializing,
    },
    
    stores: {
      tickets: { actions: ticketActions, loading: ticketLoading, errors: ticketErrors },
      categories: { actions: categoryActions, loading: categoryLoading, errors: categoryErrors },
    },
  }
}