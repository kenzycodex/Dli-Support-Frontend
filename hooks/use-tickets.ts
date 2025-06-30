// hooks/use-tickets.ts (Fixed - No more infinite loops)

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { 
  ticketService, 
  TicketData, 
  TicketListParams, 
  CreateTicketRequest, 
  AddResponseRequest, 
  UpdateTicketRequest,
  AssignTicketRequest,
  BulkAssignRequest,
  TagManagementRequest,
  TicketStats,
  TicketResponseData,
  TicketAnalytics,
  StaffMember
} from '@/services/ticket.service'
import { authService } from '@/services/auth.service'
import { apiRateLimiter } from '@/lib/api-rate-limiter'

interface TicketState {
  tickets: TicketData[]
  loading: boolean
  error: string | null
  stats: TicketStats
  analytics: TicketAnalytics | null
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  availableStaff: StaffMember[]
  permissions: {
    can_create: boolean
    can_view_all: boolean
    can_assign: boolean
    can_modify: boolean
    can_delete: boolean
    can_add_internal_notes: boolean
    can_manage_tags: boolean
    can_export: boolean
  }
  userRole: string
  lastFetch: Date | null
}

export function useTickets() {
  const [state, setState] = useState<TicketState>({
    tickets: [],
    loading: false,
    error: null,
    stats: {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      high_priority: 0,
      urgent: 0,
      crisis: 0,
      unassigned: 0,
    },
    analytics: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
    availableStaff: [],
    permissions: {
      can_create: false,
      can_view_all: false,
      can_assign: false,
      can_modify: false,
      can_delete: false,
      can_add_internal_notes: false,
      can_manage_tags: false,
      can_export: false,
    },
    userRole: '',
    lastFetch: null,
  })

  // Get current user from auth service - memoized to prevent re-renders
  const currentUser = useMemo(() => authService.getStoredUser(), [])
  
  // Use ref to track if we've initialized permissions
  const permissionsInitialized = useRef(false)

  // Initialize permissions based on user role - only run once
  useEffect(() => {
    if (currentUser && !permissionsInitialized.current) {
      const permissions = {
        can_create: currentUser.role === 'student' || currentUser.role === 'admin',
        can_view_all: currentUser.role === 'admin',
        can_assign: currentUser.role === 'admin',
        can_modify: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_delete: currentUser.role === 'admin',
        can_add_internal_notes: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_manage_tags: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_export: currentUser.role === 'admin',
      }

      setState(prev => ({
        ...prev,
        permissions,
        userRole: currentUser.role,
      }))
      
      permissionsInitialized.current = true
    }
  }, [currentUser])

  /**
   * Fetch tickets with comprehensive filtering and role-based access
   * This is the stable function that won't cause infinite loops
   */
  const fetchTickets = useCallback(async (params: TicketListParams = {}) => {
    console.log("🎫 useTickets: Fetching tickets with params:", params)
    
    // Generate a unique key for this request to prevent duplicates
    const requestKey = apiRateLimiter.generateKey('GET', '/tickets', params)
    
    return apiRateLimiter.deduplicateRequest(requestKey, async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const response = await ticketService.getTickets(params)
        
        if (response.success && response.data) {
          console.log("✅ useTickets: Tickets fetched successfully")
          setState(prev => ({
            ...prev,
            tickets: response.data!.tickets,
            pagination: response.data!.pagination,
            stats: response.data!.stats,
            userRole: response.data!.user_role,
            loading: false,
            error: null,
            lastFetch: new Date(),
          }))
        } else {
          console.error("❌ useTickets: Failed to fetch tickets:", response.message)
          setState(prev => ({
            ...prev,
            loading: false,
            error: response.message || 'Failed to fetch tickets',
          }))
        }
      } catch (error) {
        console.error("💥 useTickets: Error fetching tickets:", error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'An unexpected error occurred while fetching tickets',
        }))
      }
    }, 2000) // Wait at least 2 seconds between identical requests
  }, []) // Empty dependency array - this function is stable

  /**
   * Create new ticket with enhanced validation and retry
   */
  const createTicket = useCallback(async (data: CreateTicketRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Creating ticket:", data)
    
    if (!state.permissions.can_create) {
      setState(prev => ({ ...prev, error: 'You do not have permission to create tickets' }))
      return null
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await ticketService.createTicketWithRetry(data, 2)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Ticket created successfully")
        const newTicket = response.data.ticket
        
        setState(prev => ({
          ...prev,
          tickets: [newTicket, ...prev.tickets],
          stats: {
            ...prev.stats,
            total: prev.stats.total + 1,
            open: prev.stats.open + 1,
            crisis: newTicket.crisis_flag ? prev.stats.crisis + 1 : prev.stats.crisis,
          },
          loading: false,
          error: null,
        }))
        return newTicket
      } else {
        console.error("❌ useTickets: Failed to create ticket:", response.message)
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.message || 'Failed to create ticket',
        }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error creating ticket:", error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred while creating the ticket',
      }))
      return null
    }
  }, [state.permissions.can_create])

  /**
   * Get single ticket with role-based data
   */
  const getTicket = useCallback(async (ticketId: number): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Fetching ticket details:", ticketId)
    
    try {
      const ticket = await ticketService.getTicket(ticketId)
      
      if (ticket) {
        console.log("✅ useTickets: Ticket details fetched successfully")
        
        // Update the ticket in the list if it exists
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(t => t.id === ticketId ? ticket : t),
        }))
        
        return ticket
      } else {
        console.error("❌ useTickets: Failed to fetch ticket details")
        setState(prev => ({ ...prev, error: 'Failed to fetch ticket details' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error fetching ticket details:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [])

  /**
   * Update ticket with role-based permissions
   */
  const updateTicket = useCallback(async (ticketId: number, data: UpdateTicketRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Updating ticket:", { ticketId, data })
    
    if (!state.permissions.can_modify) {
      setState(prev => ({ ...prev, error: 'You do not have permission to modify tickets' }))
      return null
    }
    
    try {
      const response = await ticketService.updateTicket(ticketId, data)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Ticket updated successfully")
        const updatedTicket = response.data.ticket
        
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket =>
            ticket.id === ticketId ? updatedTicket : ticket
          ),
        }))
        return updatedTicket
      } else {
        console.error("❌ useTickets: Failed to update ticket:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to update ticket' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error updating ticket:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [state.permissions.can_modify])

  /**
   * Add response to ticket with enhanced file handling
   */
  const addResponse = useCallback(async (ticketId: number, data: AddResponseRequest): Promise<TicketResponseData | null> => {
    console.log("🎫 useTickets: Adding response:", { ticketId, data })
    
    try {
      const response = await ticketService.addResponseWithRetry(ticketId, data, 2)
      
      if (response) {
        console.log("✅ useTickets: Response added successfully")
        
        // Update the ticket in the list to reflect the new response
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket => {
            if (ticket.id === ticketId) {
              return {
                ...ticket,
                responses: [...(ticket.responses || []), response],
                updated_at: new Date().toISOString(),
              }
            }
            return ticket
          }),
        }))
        return response
      } else {
        console.error("❌ useTickets: Failed to add response")
        setState(prev => ({ ...prev, error: 'Failed to add response' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error adding response:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [])

  /**
   * Assign ticket to staff member (admin/staff only)
   */
  const assignTicket = useCallback(async (ticketId: number, data: AssignTicketRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Assigning ticket:", { ticketId, data })
    
    if (!state.permissions.can_assign) {
      setState(prev => ({ ...prev, error: 'You do not have permission to assign tickets' }))
      return null
    }
    
    try {
      const response = await ticketService.assignTicket(ticketId, data)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Ticket assigned successfully")
        const assignedTicket = response.data.ticket
        
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket =>
            ticket.id === ticketId ? assignedTicket : ticket
          ),
          stats: {
            ...prev.stats,
            unassigned: data.assigned_to 
              ? Math.max(0, (prev.stats.unassigned ?? 0) - 1) 
              : (prev.stats.unassigned ?? 0) + 1,
          },
        }))
        return assignedTicket
      } else {
        console.error("❌ useTickets: Failed to assign ticket:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to assign ticket' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error assigning ticket:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [state.permissions.can_assign])

  /**
   * Bulk assign tickets (admin only)
   */
  const bulkAssignTickets = useCallback(async (data: BulkAssignRequest): Promise<number> => {
    console.log("🎫 useTickets: Bulk assigning tickets:", data)
    
    if (!state.permissions.can_assign) {
      setState(prev => ({ ...prev, error: 'You do not have permission to assign tickets' }))
      return 0
    }
    
    try {
      const response = await ticketService.bulkAssignTickets(data)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Tickets bulk assigned successfully")
        const assignedCount = response.data.assigned_count
        
        // Refresh tickets to get updated assignments
        await fetchTickets()
        
        return assignedCount
      } else {
        console.error("❌ useTickets: Failed to bulk assign tickets:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to assign tickets' }))
        return 0
      }
    } catch (error) {
      console.error("💥 useTickets: Error bulk assigning tickets:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return 0
    }
  }, [state.permissions.can_assign, fetchTickets])

  /**
   * Manage ticket tags (staff only)
   */
  const manageTags = useCallback(async (ticketId: number, data: TagManagementRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Managing tags:", { ticketId, data })
    
    if (!state.permissions.can_manage_tags) {
      setState(prev => ({ ...prev, error: 'You do not have permission to manage tags' }))
      return null
    }
    
    try {
      const response = await ticketService.manageTags(ticketId, data)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Tags managed successfully")
        const updatedTicket = response.data.ticket
        
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket =>
            ticket.id === ticketId ? updatedTicket : ticket
          ),
        }))
        return updatedTicket
      } else {
        console.error("❌ useTickets: Failed to manage tags:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to update tags' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error managing tags:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [state.permissions.can_manage_tags])

  /**
   * Delete ticket (admin only)
   */
  const deleteTicket = useCallback(async (ticketId: number, reason: string, notifyUser: boolean = false): Promise<boolean> => {
    console.log("🎫 useTickets: Deleting ticket:", { ticketId, reason, notifyUser })
    
    if (!state.permissions.can_delete) {
      setState(prev => ({ ...prev, error: 'You do not have permission to delete tickets' }))
      return false
    }
    
    try {
      const response = await ticketService.deleteTicket(ticketId, reason, notifyUser)
      
      if (response.success) {
        console.log("✅ useTickets: Ticket deleted successfully")
        
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.filter(ticket => ticket.id !== ticketId),
          stats: {
            ...prev.stats,
            total: Math.max(0, prev.stats.total - 1),
          },
        }))
        return true
      } else {
        console.error("❌ useTickets: Failed to delete ticket:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to delete ticket' }))
        return false
      }
    } catch (error) {
      console.error("💥 useTickets: Error deleting ticket:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return false
    }
  }, [state.permissions.can_delete])

  /**
   * Get available staff for assignment
   */
  const getAvailableStaff = useCallback(async (ticketId: number): Promise<StaffMember[]> => {
    console.log("🎫 useTickets: Fetching available staff for ticket:", ticketId)
    
    try {
      const response = await ticketService.getAvailableStaff(ticketId)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Available staff fetched successfully")
        
        setState(prev => ({
          ...prev,
          availableStaff: response.data!.staff,
        }))
        
        return response.data.staff
      } else {
        console.error("❌ useTickets: Failed to fetch available staff:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch staff' }))
        return []
      }
    } catch (error) {
      console.error("💥 useTickets: Error fetching available staff:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return []
    }
  }, [])

  /**
   * Get analytics data
   */
  const getAnalytics = useCallback(async (timeframe: string = '30'): Promise<TicketAnalytics | null> => {
    console.log("🎫 useTickets: Fetching analytics for timeframe:", timeframe)
    
    try {
      const response = await ticketService.getAnalytics(timeframe)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Analytics fetched successfully")
        
        setState(prev => ({
          ...prev,
          analytics: response.data!,
        }))
        
        return response.data
      } else {
        console.error("❌ useTickets: Failed to fetch analytics:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to fetch analytics' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error fetching analytics:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [])

  /**
   * Export tickets data (admin only)
   */
  const exportTickets = useCallback(async (format: 'csv' | 'excel' | 'json' = 'csv', filters: Partial<TicketListParams> = {}) => {
    console.log("🎫 useTickets: Exporting tickets:", { format, filters })
    
    if (!state.permissions.can_export) {
      setState(prev => ({ ...prev, error: 'You do not have permission to export tickets' }))
      return null
    }
    
    try {
      const response = await ticketService.exportTickets(format, filters)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Tickets exported successfully")
        return response.data
      } else {
        console.error("❌ useTickets: Failed to export tickets:", response.message)
        setState(prev => ({ ...prev, error: response.message || 'Failed to export tickets' }))
        return null
      }
    } catch (error) {
      console.error("💥 useTickets: Error exporting tickets:", error)
      setState(prev => ({ ...prev, error: 'An unexpected error occurred' }))
      return null
    }
  }, [state.permissions.can_export])

  /**
   * Download attachment
   */
  const downloadAttachment = useCallback(async (attachmentId: number, fileName: string) => {
    console.log("🎫 useTickets: Downloading attachment:", { attachmentId, fileName })
    
    try {
      await ticketService.downloadAttachment(attachmentId, fileName)
      console.log("✅ useTickets: Attachment download initiated successfully")
    } catch (error) {
      console.error("💥 useTickets: Error downloading attachment:", error)
      setState(prev => ({ ...prev, error: 'Failed to download attachment' }))
    }
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    console.log("🎫 useTickets: Clearing error")
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Refresh tickets data
   */
  const refreshTickets = useCallback(async (params?: TicketListParams) => {
    console.log("🎫 useTickets: Refreshing tickets")
    await fetchTickets(params)
  }, [fetchTickets])

  /**
   * Computed values using useMemo for performance
   */
  const filteredTickets = useMemo(() => {
    return {
      all: state.tickets,
      open: state.tickets.filter(ticket => ticket.status === 'Open' || ticket.status === 'In Progress'),
      closed: state.tickets.filter(ticket => ticket.status === 'Resolved' || ticket.status === 'Closed'),
      crisis: state.tickets.filter(ticket => ticket.crisis_flag || ticket.priority === 'Urgent'),
      unassigned: state.tickets.filter(ticket => !ticket.assigned_to),
      byStatus: (status: string) => state.tickets.filter(ticket => ticket.status === status),
      byPriority: (priority: string) => state.tickets.filter(ticket => ticket.priority === priority),
      byCategory: (category: string) => state.tickets.filter(ticket => ticket.category === category),
      withTags: (tags: string[]) => state.tickets.filter(ticket => 
        ticket.tags && tags.some(tag => ticket.tags!.includes(tag))
      ),
    }
  }, [state.tickets])

  /**
   * Check if data needs refresh (older than 5 minutes)
   */
  const needsRefresh = useMemo(() => {
    if (!state.lastFetch) return true
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return state.lastFetch < fiveMinutesAgo
  }, [state.lastFetch])

  return {
    // State
    tickets: state.tickets,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    analytics: state.analytics,
    pagination: state.pagination,
    availableStaff: state.availableStaff,
    permissions: state.permissions,
    userRole: state.userRole,
    lastFetch: state.lastFetch,
    needsRefresh,
    
    // Actions
    fetchTickets,
    createTicket,
    getTicket,
    updateTicket,
    addResponse,
    assignTicket,
    bulkAssignTickets,
    manageTags,
    deleteTicket,
    getAvailableStaff,
    getAnalytics,
    exportTickets,
    downloadAttachment,
    clearError,
    refreshTickets,
    
    // Computed/Filtered data
    filteredTickets,
    
    // Utility methods
    service: ticketService, // Expose service for direct access if needed
  }
}