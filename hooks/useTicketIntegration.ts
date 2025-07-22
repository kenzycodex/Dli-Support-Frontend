// hooks/useTicketIntegration.ts - Integration hooks for dynamic categories and enhanced features

import { useEffect, useCallback, useMemo } from 'react'
import { useTicketStore, TicketData, CreateTicketRequest } from '@/stores/ticket-store'
import { useTicketCategoriesStore, CategoryWithStats } from '@/stores/ticketCategories-store'
import { ticketService } from '@/services/ticket.service'
import { useToast } from "@/hooks/use-toast"
import { authService } from '@/services/auth.service'

/**
 * ENHANCED: Main integration hook that combines ticket and category management
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
  
  // Categories store
  const categoryActions = useTicketCategoriesStore((state) => state.actions)
  const categoryLoading = useTicketCategoriesStore((state) => state.loading)
  const categoryErrors = useTicketCategoriesStore((state) => state.errors)
  const categories = useTicketCategoriesStore((state) => state.categories)
  
  const { toast } = useToast()

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoadCategories) {
      categoryActions.fetchCategories()
    }
    if (autoLoadTickets && categories.length > 0) {
      ticketActions.fetchTickets()
    }
  }, [autoLoadCategories, autoLoadTickets, categoryActions, ticketActions, categories.length])

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

      // Check if user has permission for this category
      const currentUser = authService.getStoredUser()
      if (currentUser?.role === 'counselor' || currentUser?.role === 'advisor') {
        // Check if counselor has specialization in this category
        // This would require additional API call or data
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
    // Create ticket with category validation
    createTicket: createTicketWithValidation,
    
    // Update ticket with category change support
    updateTicket: async (id: number, data: any) => {
      try {
        // If category is being changed, validate it
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
    
    // Delete ticket with confirmation
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
    
    // Add response with validation
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
    
    // Assign ticket with counselor validation
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
    
    // Test crisis detection
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

  // Category operations
  const categoryOperations = useMemo(() => ({
    // Create category
    createCategory: async (data: any) => {
      try {
        const result = await categoryActions.createCategory(data)
        
        if (result) {
          toast({
            title: 'Success',
            description: 'Category created successfully',
          })
          
          // Refresh tickets to update any cached category data
          ticketActions.invalidateCache()
        }
        
        return result
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create category',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    // Update category
    updateCategory: async (id: number, data: any) => {
      try {
        await categoryActions.updateCategory(id, data)
        
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        })
        
        // Refresh tickets to update category relationships
        ticketActions.invalidateCache()
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update category',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    // Delete category
    deleteCategory: async (id: number) => {
      try {
        await categoryActions.deleteCategory(id)
        
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        })
        
        // Refresh tickets to update category relationships
        ticketActions.invalidateCache()
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete category',
          variant: 'destructive',
        })
        throw error
      }
    },
    
    // Reorder categories
    reorderCategories: async (reorderedCategories: Array<{ id: number; sort_order: number }>) => {
      try {
        await categoryActions.reorderCategories(reorderedCategories)
        
        toast({
          title: 'Success',
          description: 'Categories reordered successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to reorder categories',
          variant: 'destructive',
        })
        throw error
      }
    },
  }), [categoryActions, ticketActions, toast])

  // Enhanced data with category relationships
  const enhancedData = useMemo(() => {
    // Enrich tickets with category data
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

    // Category utilization stats
    const categoryStats = categories.map(category => {
      const categoryTickets = tickets.filter(t => t.category_id === category.id)
      const openTickets = categoryTickets.filter(t => ['Open', 'In Progress'].includes(t.status))
      const crisisTickets = categoryTickets.filter(t => t.crisis_flag)
      const autoAssignedTickets = categoryTickets.filter(t => t.auto_assigned === 'yes')
      
      return {
        ...category,
        actualTicketsCount: categoryTickets.length,
        openTicketsCount: openTickets.length,
        crisisTicketsCount: crisisTickets.length,
        autoAssignedCount: autoAssignedTickets.length,
        autoAssignRate: categoryTickets.length > 0 ? (autoAssignedTickets.length / categoryTickets.length) * 100 : 0,
        crisisRate: categoryTickets.length > 0 ? (crisisTickets.length / categoryTickets.length) * 100 : 0,
      }
    })

    return {
      tickets: enrichedTickets,
      categories: categoryStats,
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

  // Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        categoryActions.refreshCategories(),
        ticketActions.refreshTickets(),
      ])
      
      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      })
    }
  }, [categoryActions, ticketActions, toast])

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    ticketActions.clearCache()
    categoryActions.clearCache()
    
    toast({
      title: 'Success',
      description: 'All caches cleared',
    })
  }, [ticketActions, categoryActions, toast])

  return {
    // Enhanced data
    data: enhancedData,
    
    // Combined state
    state: combinedState,
    
    // Operations
    ticketOperations,
    categoryOperations,
    
    // Utilities
    refreshAll,
    clearAllCaches,
    
    // Direct access to stores for advanced usage
    stores: {
      tickets: { actions: ticketActions, loading: ticketLoading, errors: ticketErrors },
      categories: { actions: categoryActions, loading: categoryLoading, errors: categoryErrors },
    },
  }
}

/**
 * ENHANCED: Hook for category-aware ticket creation
 */
export const useTicketCreation = () => {
  const categories = useTicketCategoriesStore((state) => state.categories.filter(c => c.is_active))
  const createTicket = useTicketStore((state) => state.actions.createTicket)
  const testCrisisDetection = useTicketStore((state) => state.actions.testCrisisDetection)
  const { toast } = useToast()

  // Get category options for forms
  const categoryOptions = useMemo(() => 
    categories.map(c => ({
      value: c.id,
      label: c.name,
      description: c.description,
      color: c.color,
      icon: c.icon,
      slaHours: c.sla_response_hours,
      autoAssign: c.auto_assign,
      crisisDetection: c.crisis_detection_enabled,
    }))
  , [categories])

  // Enhanced create function with validation and feedback
  const createTicketEnhanced = useCallback(async (data: CreateTicketRequest & {
    enableCrisisTest?: boolean
  }) => {
    try {
      // Validate category
      const category = categories.find(c => c.id === data.category_id)
      if (!category) {
        throw new Error('Please select a valid category')
      }

      // Test for crisis if enabled and category supports it
      let crisisResult = null
      if (data.enableCrisisTest && category.crisis_detection_enabled) {
        try {
          crisisResult = await testCrisisDetection(
            `${data.subject} ${data.description}`,
            data.category_id
          )
        } catch (crisisError) {
          console.warn('Crisis detection test failed:', crisisError)
        }
      }

      // Create ticket
      const result = await createTicket(data)
      
      if (result) {
        // Success feedback
        let message = 'Ticket created successfully'
        
        if (result.crisis_flag) {
          message += ' (Crisis detected - escalated)'
        }
        
        if (result.auto_assigned === 'yes') {
          message += ` and auto-assigned to ${result.assignedTo?.name || 'counselor'}`
        }
        
        toast({
          title: 'Success',
          description: message,
        })
        
        // Additional crisis feedback
        if (crisisResult?.is_crisis) {
          toast({
            title: 'Crisis Alert',
            description: `Crisis keywords detected (Score: ${crisisResult.crisis_score}). Ticket has been escalated.`,
            variant: 'destructive',
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
  }, [categories, createTicket, testCrisisDetection, toast])

  return {
    categoryOptions,
    createTicket: createTicketEnhanced,
    categories,
    testCrisisDetection,
  }
}

/**
 * ENHANCED: Hook for category management with real-time stats
 */
export const useCategoryManagement = () => {
  const categoryActions = useTicketCategoriesStore((state) => state.actions)
  const categories = useTicketCategoriesStore((state) => state.categories)
  const overview = useTicketCategoriesStore((state) => state.overview)
  const loading = useTicketCategoriesStore((state) => state.loading)
  const errors = useTicketCategoriesStore((state) => state.errors)
  
  const tickets = useTicketStore((state) => state.tickets)
  const { toast } = useToast()

  // Calculate real-time category statistics
  const categoryStatsWithTickets = useMemo(() => 
    categories.map(category => {
      const categoryTickets = tickets.filter(t => t.category_id === category.id)
      const openTickets = categoryTickets.filter(t => ['Open', 'In Progress'].includes(t.status))
      const crisisTickets = categoryTickets.filter(t => t.crisis_flag)
      const autoAssignedTickets = categoryTickets.filter(t => t.auto_assigned === 'yes')
      const overdueTickets = categoryTickets.filter(t => t.is_overdue)
      
      return {
        ...category,
        realTimeStats: {
          totalTickets: categoryTickets.length,
          openTickets: openTickets.length,
          crisisTickets: crisisTickets.length,
          autoAssignedTickets: autoAssignedTickets.length,
          overdueTickets: overdueTickets.length,
          autoAssignRate: categoryTickets.length > 0 ? (autoAssignedTickets.length / categoryTickets.length) * 100 : 0,
          crisisRate: categoryTickets.length > 0 ? (crisisTickets.length / categoryTickets.length) * 100 : 0,
          overdueRate: categoryTickets.length > 0 ? (overdueTickets.length / categoryTickets.length) * 100 : 0,
        }
      }
    })
  , [categories, tickets])

  // Enhanced operations with validation
  const operations = useMemo(() => ({
    createCategory: async (data: any) => {
      try {
        const result = await categoryActions.createCategory(data)
        
        if (result) {
          toast({
            title: 'Success',
            description: `Category "${result.name}" created successfully`,
          })
        }
        
        return result
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create category',
          variant: 'destructive',
        })
        throw error
      }
    },

    updateCategory: async (id: number, data: any) => {
      try {
        await categoryActions.updateCategory(id, data)
        
        const category = categories.find(c => c.id === id)
        toast({
          title: 'Success',
          description: `Category "${category?.name || 'Unknown'}" updated successfully`,
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update category',
          variant: 'destructive',
        })
        throw error
      }
    },

    deleteCategory: async (id: number) => {
      try {
        const category = categories.find(c => c.id === id)
        const categoryName = category?.name || 'Unknown'
        
        await categoryActions.deleteCategory(id)
        
        toast({
          title: 'Success',
          description: `Category "${categoryName}" deleted successfully`,
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete category',
          variant: 'destructive',
        })
        throw error
      }
    },

    bulkToggleActive: async (categoryIds: number[], isActive: boolean) => {
      try {
        await categoryActions.bulkToggleActive(categoryIds, isActive)
        
        toast({
          title: 'Success',
          description: `${categoryIds.length} categories ${isActive ? 'activated' : 'deactivated'} successfully`,
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update categories',
          variant: 'destructive',
        })
        throw error
      }
    },

    reorderCategories: async (reorderedCategories: Array<{ id: number; sort_order: number }>) => {
      try {
        await categoryActions.reorderCategories(reorderedCategories)
        
        toast({
          title: 'Success',
          description: 'Categories reordered successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to reorder categories',
          variant: 'destructive',
        })
        throw error
      }
    },

    exportCategories: async (format: 'csv' | 'json' = 'csv') => {
      try {
        await categoryActions.exportCategories(format)
        
        toast({
          title: 'Success',
          description: 'Categories exported successfully',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to export categories',
          variant: 'destructive',
        })
        throw error
      }
    },
  }), [categoryActions, categories, toast])

  return {
    categories: categoryStatsWithTickets,
    overview,
    loading,
    errors,
    operations,
    
    // Utilities
    getActiveCategories: () => categoryStatsWithTickets.filter(c => c.is_active),
    getCategoriesWithAutoAssign: () => categoryStatsWithTickets.filter(c => c.auto_assign),
    getCategoriesWithCrisisDetection: () => categoryStatsWithTickets.filter(c => c.crisis_detection_enabled),
    getCategoryById: (id: number) => categoryStatsWithTickets.find(c => c.id === id),
  }
}

/**
 * ENHANCED: Hook for ticket filtering with category awareness
 */
export const useTicketFiltering = () => {
  const tickets = useTicketStore((state) => state.tickets)
  const categories = useTicketCategoriesStore((state) => state.categories)
  const filters = useTicketStore((state) => state.filters)
  const setFilters = useTicketStore((state) => state.actions.setFilters)
  const fetchTickets = useTicketStore((state) => state.actions.fetchTickets)

  // Enhanced filter options with category data
  const filterOptions = useMemo(() => ({
    categories: categories.filter(c => c.is_active).map(c => ({
      value: c.id.toString(),
      label: c.name,
      color: c.color,
      icon: c.icon,
      count: tickets.filter(t => t.category_id === c.id).length,
    })),
    
    statuses: [
      { value: 'Open', label: 'Open', count: tickets.filter(t => t.status === 'Open').length },
      { value: 'In Progress', label: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length },
      { value: 'Resolved', label: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
      { value: 'Closed', label: 'Closed', count: tickets.filter(t => t.status === 'Closed').length },
    ],
    
    priorities: [
      { value: 'Low', label: 'Low', count: tickets.filter(t => t.priority === 'Low').length },
      { value: 'Medium', label: 'Medium', count: tickets.filter(t => t.priority === 'Medium').length },
      { value: 'High', label: 'High', count: tickets.filter(t => t.priority === 'High').length },
      { value: 'Urgent', label: 'Urgent', count: tickets.filter(t => t.priority === 'Urgent').length },
    ],
    
    assignmentTypes: [
      { value: 'yes', label: 'Auto-assigned', count: tickets.filter(t => t.auto_assigned === 'yes').length },
      { value: 'manual', label: 'Manually assigned', count: tickets.filter(t => t.auto_assigned === 'manual').length },
      { value: 'no', label: 'Unassigned', count: tickets.filter(t => !t.assigned_to).length },
    ],
    
    specialFilters: [
      { value: 'crisis', label: 'Crisis tickets', count: tickets.filter(t => t.crisis_flag).length },
      { value: 'overdue', label: 'Overdue tickets', count: tickets.filter(t => t.is_overdue).length },
      { value: 'with_attachments', label: 'With attachments', count: tickets.filter(t => (t.attachment_count || 0) > 0).length },
    ],
  }), [tickets, categories])

  // Enhanced filter application
  const applyFilters = useCallback((newFilters: any, autoFetch = true) => {
    setFilters(newFilters, false)
    
    if (autoFetch) {
      // Small delay to allow UI to update
      setTimeout(() => {
        fetchTickets(newFilters)
      }, 100)
    }
  }, [setFilters, fetchTickets])

  // Quick filter presets
  const quickFilters = useMemo(() => ({
    myTickets: () => {
      const currentUser = authService.getStoredUser()
      if (currentUser?.role === 'student') {
        applyFilters({ ...filters, user_id: currentUser.id })
      } else if (['counselor', 'advisor'].includes(currentUser?.role || '')) {
        applyFilters({ ...filters, assigned: 'assigned' })
      }
    },
    
    openTickets: () => applyFilters({ ...filters, status: 'Open' }),
    crisisTickets: () => applyFilters({ ...filters, crisis_flag: true }),
    unassignedTickets: () => applyFilters({ ...filters, assigned: 'unassigned' }),
    overdueTickets: () => applyFilters({ ...filters, overdue: true }),
    autoAssignedTickets: () => applyFilters({ ...filters, auto_assigned: 'yes' }),
    
    byCategoryId: (categoryId: number) => applyFilters({ ...filters, category_id: categoryId }),
    byPriority: (priority: string) => applyFilters({ ...filters, priority }),
    byStatus: (status: string) => applyFilters({ ...filters, status }),
  }), [filters, applyFilters])

  return {
    filters,
    filterOptions,
    applyFilters,
    quickFilters,
    
    // Current filter state
    activeFilters: Object.entries(filters).filter(([key, value]) => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    ).length,
    
    // Clear filters
    clearFilters: () => applyFilters({}),
  }
}

/**
 * ENHANCED: Hook for crisis detection and management
 */
export const useCrisisDetection = () => {
  const testCrisisDetection = useTicketStore((state) => state.actions.testCrisisDetection)
  const categories = useTicketCategoriesStore((state) => state.categories)
  const tickets = useTicketStore((state) => state.tickets)
  const { toast } = useToast()

  // Get categories with crisis detection enabled
  const crisisEnabledCategories = useMemo(() => 
    categories.filter(c => c.crisis_detection_enabled)
  , [categories])

  // Crisis statistics
  const crisisStats = useMemo(() => {
    const crisisTickets = tickets.filter(t => t.crisis_flag)
    const totalCrisisKeywords = tickets.reduce((sum, t) => 
      sum + (t.detected_crisis_keywords?.length || 0), 0
    )
    
    return {
      totalCrisisTickets: crisisTickets.length,
      crisisRate: tickets.length > 0 ? (crisisTickets.length / tickets.length) * 100 : 0,
      totalCrisisKeywords,
      categoriesWithCrisisDetection: crisisEnabledCategories.length,
      crisisTicketsByCategory: crisisEnabledCategories.map(category => ({
        category: category.name,
        count: crisisTickets.filter(t => t.category_id === category.id).length,
      })),
    }
  }, [tickets, crisisEnabledCategories])

  // Test crisis detection with feedback
  const testCrisisWithFeedback = useCallback(async (text: string, categoryId?: number) => {
    try {
      const result = await testCrisisDetection(text, categoryId)
      
      if (result?.is_crisis) {
        toast({
          title: 'Crisis Detected',
          description: `Crisis score: ${result.crisis_score}. Keywords: ${result.detected_keywords?.map((k: { keyword: string }) => k.keyword).join(', ')}`,
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
  }, [testCrisisDetection, toast])

  return {
    crisisEnabledCategories,
    crisisStats,
    testCrisisDetection: testCrisisWithFeedback,
    
    // Utilities
    isCrisisDetectionEnabled: (categoryId: number) => 
      crisisEnabledCategories.some(c => c.id === categoryId),
    
    getCrisisKeywordsByCategory: (categoryId: number) => {
      const categoryTickets = tickets.filter(t => t.category_id === categoryId && t.crisis_flag)
      return categoryTickets.flatMap(t => t.detected_crisis_keywords || [])
    },
  }
}