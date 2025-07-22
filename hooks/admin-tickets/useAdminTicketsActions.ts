// hooks/admin-tickets/useAdminTicketsActions.ts - Enhanced admin ticket actions

import { useCallback } from 'react'
import { useTicketStore, TicketData, CreateTicketRequest } from '@/stores/ticket-store'
import { useTicketCategoriesStore } from '@/stores/ticketCategories-store'
import { useToast } from "@/hooks/use-toast"
import { authService } from '@/services/auth.service'

/**
 * Enhanced admin ticket actions hook with advanced management capabilities
 */
export const useAdminTicketsActions = () => {
  const ticketActions = useTicketStore((state) => state.actions)
  const categoryActions = useTicketCategoriesStore((state) => state.actions)
  const { toast } = useToast()

  // Enhanced ticket creation for admins
  const handleCreateTicket = useCallback(async (data: CreateTicketRequest) => {
    try {
      console.log('🎫 AdminTicketsActions: Creating ticket as admin:', data)
      
      const result = await ticketActions.createTicket(data)
      
      if (result) {
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
        
        return result
      }
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Create failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced ticket update with admin permissions
  const handleUpdateTicket = useCallback(async (ticketId: number, data: any) => {
    try {
      console.log('🎫 AdminTicketsActions: Updating ticket:', ticketId, data)
      
      await ticketActions.updateTicket(ticketId, data)
      
      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Update failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced ticket deletion with admin controls
  const handleDeleteTicket = useCallback(async (ticket: TicketData) => {
    try {
      console.log('🗑️ AdminTicketsActions: Deleting ticket:', ticket.id)
      
      // Enhanced deletion with admin reason
      const reason = `Deleted by administrator (${authService.getStoredUser()?.name || 'Admin'})`
      
      await ticketActions.deleteTicket(ticket.id, reason, false)
      
      toast({
        title: 'Success',
        description: `Ticket #${ticket.ticket_number} deleted successfully`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Delete failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ticket',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced bulk assignment
  const handleBulkAssignment = useCallback(async (ticketIds: number[], assignedTo: number | null) => {
    try {
      console.log('👥 AdminTicketsActions: Bulk assignment:', { ticketIds, assignedTo })
      
      const promises = ticketIds.map(ticketId => 
        ticketActions.assignTicket(
          ticketId, 
          assignedTo, 
          assignedTo ? 'Bulk assignment by admin' : 'Bulk unassignment by admin'
        )
      )
      
      await Promise.all(promises)
      
      toast({
        title: 'Success',
        description: `${ticketIds.length} tickets ${assignedTo ? 'assigned' : 'unassigned'} successfully`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Bulk assignment failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign tickets',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced bulk status update
  const handleBulkStatusUpdate = useCallback(async (ticketIds: number[], status: string) => {
    try {
      console.log('📊 AdminTicketsActions: Bulk status update:', { ticketIds, status })
      
      const promises = ticketIds.map(ticketId => 
        ticketActions.updateTicket(ticketId, { status })
      )
      
      await Promise.all(promises)
      
      toast({
        title: 'Success',
        description: `${ticketIds.length} tickets updated to ${status}`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Bulk status update failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket status',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced bulk priority update
  const handleBulkPriorityUpdate = useCallback(async (ticketIds: number[], priority: string) => {
    try {
      console.log('🔥 AdminTicketsActions: Bulk priority update:', { ticketIds, priority })
      
      const promises = ticketIds.map(ticketId => 
        ticketActions.updateTicket(ticketId, { priority })
      )
      
      await Promise.all(promises)
      
      toast({
        title: 'Success',
        description: `${ticketIds.length} tickets priority updated to ${priority}`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Bulk priority update failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket priority',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced bulk delete
  const handleBulkDelete = useCallback(async (tickets: TicketData[], reason: string, notifyUsers: boolean = false) => {
    try {
      console.log('🗑️ AdminTicketsActions: Bulk delete:', { count: tickets.length, reason, notifyUsers })
      
      const promises = tickets.map(ticket => 
        ticketActions.deleteTicket(ticket.id, reason, notifyUsers)
      )
      
      await Promise.all(promises)
      
      // Enhanced success message with category breakdown
      const categoryBreakdown = tickets.reduce((acc, ticket) => {
        const categoryName = ticket.category?.name || 'Unknown'
        acc[categoryName] = (acc[categoryName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const breakdownText = Object.entries(categoryBreakdown)
        .map(([cat, count]) => `${count} from ${cat}`)
        .join(', ')

      toast({
        title: 'Success',
        description: `${tickets.length} tickets deleted (${breakdownText})`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Bulk delete failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tickets',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced ticket export with admin data
  const handleExportTickets = useCallback(async (format: 'csv' | 'json' = 'csv', filters?: any, ticketIds?: number[]) => {
    try {
      console.log('📥 AdminTicketsActions: Exporting tickets:', { format, filters, ticketIds })
      
      if (ticketActions.exportTickets) {
        await ticketActions.exportTickets(format, filters, ticketIds)
        
        toast({
          title: 'Success',
          description: 'Tickets exported successfully',
        })
      }
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Export failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to export tickets',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced category management for admin
  const handleCreateCategory = useCallback(async (data: any) => {
    try {
      console.log('📁 AdminTicketsActions: Creating category:', data)
      
      const result = await categoryActions.createCategory(data)
      
      if (result) {
        toast({
          title: 'Success',
          description: `Category "${result.name}" created successfully`,
        })
        
        // Refresh tickets to update any cached category data
        ticketActions.invalidateCache()
        
        return result
      }
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Create category failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      })
      throw error
    }
  }, [categoryActions, ticketActions, toast])

  // Enhanced category update
  const handleUpdateCategory = useCallback(async (categoryId: number, data: any) => {
    try {
      console.log('📁 AdminTicketsActions: Updating category:', categoryId, data)
      
      await categoryActions.updateCategory(categoryId, data)
      
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      })
      
      // Refresh tickets to update category relationships
      ticketActions.invalidateCache()
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Update category failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      })
      throw error
    }
  }, [categoryActions, ticketActions, toast])

  // Enhanced category deletion
  const handleDeleteCategory = useCallback(async (category: any) => {
    try {
      console.log('🗑️ AdminTicketsActions: Deleting category:', category.id)
      
      await categoryActions.deleteCategory(category.id)
      
      toast({
        title: 'Success',
        description: `Category "${category.name}" deleted successfully`,
      })
      
      // Refresh tickets to update category relationships
      ticketActions.invalidateCache()
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Delete category failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      })
      throw error
    }
  }, [categoryActions, ticketActions, toast])

  // Enhanced crisis detection testing
  const handleTestCrisisDetection = useCallback(async (text: string, categoryId?: number) => {
    try {
      console.log('🚨 AdminTicketsActions: Testing crisis detection:', { text: text.substring(0, 50), categoryId })
      
      const result = await ticketActions.testCrisisDetection(text, categoryId)
      
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
      console.error('❌ AdminTicketsActions: Crisis detection test failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to test crisis detection',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced toggle publish for admin
  const handleTogglePublish = useCallback(async (ticket: TicketData) => {
    try {
      console.log('📄 AdminTicketsActions: Toggling publish status:', ticket.id)
      
      const newStatus = ticket.status === 'Open' ? 'Closed' : 'Open'
      await ticketActions.updateTicket(ticket.id, { status: newStatus })
      
      toast({
        title: 'Success',
        description: `Ticket ${newStatus === 'Closed' ? 'closed' : 'reopened'} successfully`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Toggle publish failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket status',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced toggle feature for admin
  const handleToggleFeature = useCallback(async (ticket: TicketData) => {
    try {
      console.log('⭐ AdminTicketsActions: Toggling feature status:', ticket.id)
      
      // Assuming there's a featured field - adjust based on your ticket model
      const newPriority = ticket.priority === 'Urgent' ? 'High' : 'Urgent'
      await ticketActions.updateTicket(ticket.id, { priority: newPriority })
      
      toast({
        title: 'Success',
        description: `Ticket priority updated to ${newPriority}`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Toggle feature failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ticket priority',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, toast])

  // Enhanced analytics and reporting
  const handleGenerateReport = useCallback(async (reportType: 'tickets' | 'categories' | 'analytics', filters?: any) => {
    try {
      console.log('📊 AdminTicketsActions: Generating report:', { reportType, filters })
      
      // This would integrate with your reporting service
      // For now, we'll export the data
      if (reportType === 'tickets') {
        await handleExportTickets('csv', filters)
      } else if (reportType === 'categories') {
        await categoryActions.exportCategories('csv')
      }
      
      toast({
        title: 'Success',
        description: `${reportType} report generated successfully`,
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Report generation failed:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      })
      throw error
    }
  }, [handleExportTickets, categoryActions, toast])

  // Enhanced system health check
  const handleSystemHealthCheck = useCallback(async () => {
    try {
      console.log('🏥 AdminTicketsActions: Performing system health check')
      
      // Refresh all data to check system health
      await Promise.all([
        ticketActions.fetchTickets(),
        categoryActions.fetchCategories()
      ])
      
      toast({
        title: 'Success',
        description: 'System health check completed successfully',
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Health check failed:', error)
      toast({
        title: 'Warning',
        description: 'System health check detected issues',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, categoryActions, toast])

  // Enhanced cache management
  const handleClearCache = useCallback(() => {
    try {
      console.log('🗑️ AdminTicketsActions: Clearing all caches')
      
      ticketActions.clearCache()
      categoryActions.clearCache()
      
      toast({
        title: 'Success',
        description: 'All caches cleared successfully',
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Cache clear failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear caches',
        variant: 'destructive',
      })
    }
  }, [ticketActions, categoryActions, toast])

  // Enhanced data refresh
  const handleRefreshAll = useCallback(async () => {
    try {
      console.log('🔄 AdminTicketsActions: Refreshing all data')
      
      await Promise.all([
        ticketActions.refreshTickets(),
        categoryActions.refreshCategories()
      ])
      
      toast({
        title: 'Success',
        description: 'All data refreshed successfully',
      })
    } catch (error: any) {
      console.error('❌ AdminTicketsActions: Refresh failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      })
      throw error
    }
  }, [ticketActions, categoryActions, toast])

  return {
    // Core ticket operations
    handleCreateTicket,
    handleUpdateTicket,
    handleDeleteTicket,
    
    // Bulk operations
    handleBulkAssignment,
    handleBulkStatusUpdate,
    handleBulkPriorityUpdate,
    handleBulkDelete,
    
    // Export and reporting
    handleExportTickets,
    handleGenerateReport,
    
    // Category management
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    
    // Advanced features
    handleTestCrisisDetection,
    handleTogglePublish,
    handleToggleFeature,
    
    // System management
    handleSystemHealthCheck,
    handleClearCache,
    handleRefreshAll,
  }
}

export default useAdminTicketsActions