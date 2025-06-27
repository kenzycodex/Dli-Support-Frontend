// hooks/use-tickets.ts (FIXED - TypeScript errors resolved)

import { useState, useCallback } from 'react'
import { 
  ticketService, 
  TicketData, 
  TicketListParams, 
  CreateTicketRequest, 
  AddResponseRequest, 
  UpdateTicketRequest,
  TicketStats,
  TicketResponseData 
} from '@/services/ticket.service'

interface TicketState {
  tickets: TicketData[]
  loading: boolean
  error: string | null
  stats: TicketStats
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export function useTickets() {
  const [state, setState] = useState<TicketState>({
    tickets: [],
    loading: false,
    error: null,
    stats: {
      total_tickets: 0,
      open_tickets: 0,
      in_progress_tickets: 0,
      resolved_tickets: 0,
      closed_tickets: 0,
      high_priority_tickets: 0,
      crisis_tickets: 0,
    },
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  })

  /**
   * Fetch tickets
   */
  const fetchTickets = useCallback(async (params: TicketListParams = {}) => {
    console.log("🎫 useTickets: Fetching tickets with params:", params)
    
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
          loading: false,
          error: null,
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
        error: 'An unexpected error occurred',
      }))
    }
  }, [])

  /**
   * Create new ticket - FIXED to handle direct response
   */
  const createTicket = useCallback(async (data: CreateTicketRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Creating ticket:", data)
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await ticketService.createTicket(data)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Ticket created successfully")
        const newTicket = response.data.ticket
        setState(prev => ({
          ...prev,
          tickets: [newTicket, ...prev.tickets],
          stats: {
            ...prev.stats,
            total_tickets: prev.stats.total_tickets + 1,
            open_tickets: prev.stats.open_tickets + 1,
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
        error: 'An unexpected error occurred',
      }))
      return null
    }
  }, [])

  /**
   * Get single ticket - FIXED to handle direct ticket response
   */
  const getTicket = useCallback(async (ticketId: number): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Fetching ticket details:", ticketId)
    
    try {
      const ticket = await ticketService.getTicket(ticketId)
      
      if (ticket) {
        console.log("✅ useTickets: Ticket details fetched successfully")
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
   * Update ticket (staff only)
   */
  const updateTicket = useCallback(async (ticketId: number, data: UpdateTicketRequest): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Updating ticket:", { ticketId, data })
    
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
  }, [])

  /**
   * Add response to ticket - FIXED to handle direct response
   */
  const addResponse = useCallback(async (ticketId: number, data: AddResponseRequest): Promise<TicketResponseData | null> => {
    console.log("🎫 useTickets: Adding response:", { ticketId, data })
    
    try {
      const response = await ticketService.addResponse(ticketId, data)
      
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
   * Assign ticket to staff member (admin only)
   */
  const assignTicket = useCallback(async (ticketId: number, assignedTo: number): Promise<TicketData | null> => {
    console.log("🎫 useTickets: Assigning ticket:", { ticketId, assignedTo })
    
    try {
      const response = await ticketService.assignTicket(ticketId, assignedTo)
      
      if (response.success && response.data) {
        console.log("✅ useTickets: Ticket assigned successfully")
        const assignedTicket = response.data.ticket
        setState(prev => ({
          ...prev,
          tickets: prev.tickets.map(ticket =>
            ticket.id === ticketId ? assignedTicket : ticket
          ),
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
  }, [])

  /**
   * Download attachment - FIXED to handle void return and proper parameters
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
   * Clear error
   */
  const clearError = useCallback(() => {
    console.log("🎫 useTickets: Clearing error")
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Refresh tickets
   */
  const refreshTickets = useCallback(() => {
    console.log("🎫 useTickets: Refreshing tickets")
    fetchTickets()
  }, [fetchTickets])

  /**
   * Filter tickets by status
   */
  const getTicketsByStatus = useCallback((status: string) => {
    if (status === 'all') return state.tickets
    return state.tickets.filter(ticket => ticket.status === status)
  }, [state.tickets])

  /**
   * Filter tickets by priority
   */
  const getTicketsByPriority = useCallback((priority: string) => {
    if (priority === 'all') return state.tickets
    return state.tickets.filter(ticket => ticket.priority === priority)
  }, [state.tickets])

  /**
   * Get crisis tickets
   */
  const getCrisisTickets = useCallback(() => {
    return state.tickets.filter(ticket => ticket.crisis_flag)
  }, [state.tickets])

  return {
    // State
    tickets: state.tickets,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    pagination: state.pagination,
    
    // Actions
    fetchTickets,
    createTicket,
    getTicket,
    updateTicket,
    addResponse,
    assignTicket,
    downloadAttachment,
    clearError,
    refreshTickets,
    
    // Computed
    getTicketsByStatus,
    getTicketsByPriority,
    getCrisisTickets,
  }
}