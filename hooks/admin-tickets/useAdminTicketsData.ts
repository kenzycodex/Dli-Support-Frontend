// hooks/admin-tickets/useAdminTicketsData.ts - Data management for admin tickets

import { useMemo } from 'react'
import { useTicketStore } from '@/stores/ticket-store'
import { useTicketCategoriesStore } from '@/stores/ticketCategories-store'
import { useAdminTicketsActions } from './useAdminTicketsActions'

/**
 * Admin tickets data management hook
 * Provides comprehensive data access and management for admin ticket operations
 */
export const useAdminTicketsData = () => {
  // Ticket store data
  const tickets = useTicketStore((state) => state.tickets)
  const currentTicket = useTicketStore((state) => state.currentTicket)
  const pagination = useTicketStore((state) => state.pagination)
  const filters = useTicketStore((state) => state.filters)
  const selectedTickets = useTicketStore((state) => state.selectedTickets)
  const ticketLoading = useTicketStore((state) => state.loading)
  const ticketErrors = useTicketStore((state) => state.errors)

  // Category store data
  const categories = useTicketCategoriesStore((state) => state.categories)
  const currentCategory = useTicketCategoriesStore((state) => state.currentCategory)
  const categoryOverview = useTicketCategoriesStore((state) => state.overview)
  const categoryLoading = useTicketCategoriesStore((state) => state.loading)
  const categoryErrors = useTicketCategoriesStore((state) => state.errors)

  // Store actions
  const ticketActions = useTicketStore((state) => state.actions)
  const categoryActions = useTicketCategoriesStore((state) => state.actions)

  // Enhanced admin actions
  const enhancedActions = useAdminTicketsActions()

  // Helper functions
  const helpers = useMemo(() => ({
    // Data refresh
    refresh: async () => {
      await Promise.all([
        ticketActions.refreshTickets(),
        categoryActions.refreshCategories()
      ])
    },

    // Cache management
    clearCache: () => {
      ticketActions.clearCache()
      categoryActions.clearCache()
    },

    // Get ticket by ID with category data
    getTicketById: (id: number) => {
      const ticket = tickets.find(t => t.id === id)
      if (ticket) {
        const category = categories.find(c => c.id === ticket.category_id)
        return { ...ticket, category }
      }
      return null
    },

    // Get category by ID with ticket stats
    getCategoryById: (id: number) => {
      const category = categories.find(c => c.id === id)
      if (category) {
        const categoryTickets = tickets.filter(t => t.category_id === id)
        return {
          ...category,
          ticketStats: {
            total: categoryTickets.length,
            open: categoryTickets.filter(t => t.status === 'Open').length,
            inProgress: categoryTickets.filter(t => t.status === 'In Progress').length,
            resolved: categoryTickets.filter(t => t.status === 'Resolved').length,
            crisis: categoryTickets.filter(t => t.crisis_flag).length,
            autoAssigned: categoryTickets.filter(t => t.auto_assigned === 'yes').length,
          }
        }
      }
      return null
    },

    // Get filtered tickets
    getFilteredTickets: (customFilters?: any) => {
      const activeFilters = customFilters || filters
      return tickets.filter(ticket => {
        // Apply filters logic here
        if (activeFilters.status && activeFilters.status !== 'all') {
          if (ticket.status !== activeFilters.status) return false
        }
        if (activeFilters.category_id && activeFilters.category_id !== 'all') {
          if (ticket.category_id.toString() !== activeFilters.category_id.toString()) return false
        }
        if (activeFilters.priority && activeFilters.priority !== 'all') {
          if (ticket.priority !== activeFilters.priority) return false
        }
        if (activeFilters.crisis_flag && activeFilters.crisis_flag !== 'all') {
          const isCrisis = activeFilters.crisis_flag === 'true'
          if (ticket.crisis_flag !== isCrisis) return false
        }
        return true
      })
    },

    // Get selected tickets with full data
    getSelectedTicketsWithData: () => {
      return Array.from(selectedTickets)
        .map(id => helpers.getTicketById(id))
        .filter(Boolean)
    },
  }), [tickets, categories, filters, selectedTickets, ticketActions, categoryActions])

  // Admin statistics
  const adminStats = useMemo(() => {
    const ticketStats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      in_progress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length,
      crisis: tickets.filter(t => t.crisis_flag).length,
      unassigned: tickets.filter(t => !t.assigned_to).length,
      auto_assigned: tickets.filter(t => t.auto_assigned === 'yes').length,
      with_responses: tickets.filter(t => (t.responses?.length || 0) > 0).length,
      with_attachments: tickets.filter(t => (t.attachments?.length || 0) > 0).length,
      overdue: tickets.filter(t => t.is_overdue).length,
    }

    const categoryStats = {
      total: categories.length,
      active: categories.filter(c => c.is_active).length,
      inactive: categories.filter(c => !c.is_active).length,
      with_auto_assign: categories.filter(c => c.auto_assign).length,
      with_crisis_detection: categories.filter(c => c.crisis_detection_enabled).length,
      published_resources: 0, // This would come from your data
      draft_resources: 0,
      featured_resources: 0,
    }

    return {
      ...ticketStats,
      categories_count: categoryStats.total,
      ...categoryStats,
    }
  }, [tickets, categories])

  // Loading states
  const loading = useMemo(() => ({
    any: Object.values(ticketLoading).some(Boolean) || Object.values(categoryLoading).some(Boolean),
    tickets: ticketLoading,
    categories: categoryLoading,
    create: ticketLoading.create || categoryLoading.create,
    update: ticketLoading.update || categoryLoading.update,
    delete: ticketLoading.delete || categoryLoading.delete,
  }), [ticketLoading, categoryLoading])

  // Error states
  const errors = useMemo(() => ({
    any: Object.values(ticketErrors).some(Boolean) || Object.values(categoryErrors).some(Boolean),
    tickets: ticketErrors,
    categories: categoryErrors,
  }), [ticketErrors, categoryErrors])

  // Check if system is initialized
  const isInitialized = useMemo(() => {
    return tickets.length > 0 || categories.length > 0
  }, [tickets.length, categories.length])

  // Check if there are any errors
  const hasError = useMemo(() => {
    return errors.any
  }, [errors.any])

  // Check if system is loading
  const isLoading = useMemo(() => {
    return loading.any
  }, [loading.any])

  return {
    // Core data
    tickets,
    categories,
    currentTicket,
    currentCategory,
    categoryOverview,
    
    // UI state
    pagination,
    filters,
    selectedTickets,
    
    // Statistics
    adminStats,
    
    // State flags
    loading,
    errors,
    isLoading,
    hasError,
    isInitialized,
    
    // Actions
    actions: {
      tickets: ticketActions,
      categories: categoryActions,
    },
    enhancedActions,
    
    // Helpers
    helpers,
  }
}

export default useAdminTicketsData