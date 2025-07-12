// hooks/useTicketActions.ts
import { useCallback } from 'react'
import { TicketData, generateTicketURL } from '@/stores/ticket-store'
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"
import { BulkActionParams } from '@/types/tickets.types'

export const useTicketActions = (actions: any) => {
  const { toast } = useToast()
  const currentUser = authService.getStoredUser()

  const handleTicketAction = useCallback(
    async (action: string, ticket: TicketData) => {
      if (!actions) return

      try {
        console.log('🎫 Executing action:', action, 'on ticket:', ticket.id)

        switch (action) {
          case 'mark_in_progress':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets')
            }
            await actions.updateTicket(ticket.id, { status: 'In Progress' })
            toast({
              title: 'Success',
              description: `Ticket #${ticket.ticket_number} marked as In Progress`,
            })
            break

          case 'mark_resolved':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets')
            }
            await actions.updateTicket(ticket.id, { status: 'Resolved' })
            toast({
              title: 'Success',
              description: `Ticket #${ticket.ticket_number} marked as Resolved`,
            })
            break

          case 'assign_to_me':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets')
            }
            if (currentUser) {
              await actions.assignTicket(ticket.id, currentUser.id)
              toast({
                title: 'Success',
                description: `Ticket #${ticket.ticket_number} assigned to you`,
              })
            }
            break

          case 'copy_link':
            const url = generateTicketURL(ticket)
            await navigator.clipboard.writeText(url)
            toast({
              title: 'Success',
              description: 'Ticket link copied to clipboard',
            })
            break

          default:
            console.warn('Unknown action:', action)
        }
      } catch (error: any) {
        console.error(`Failed to ${action}:`, error)
        toast({
          title: 'Error',
          description: error.message || `Failed to ${action.replace('_', ' ')}`,
          variant: 'destructive',
        })
      }
    },
    [actions, currentUser, toast]
  )

  const handleBulkAction = useCallback(
    async (action: string, selectedTickets: TicketData[], params?: BulkActionParams) => {
      if (!actions || selectedTickets.length === 0) return

      try {
        console.log('🎫 Executing bulk action:', action, 'on', selectedTickets.length, 'tickets')

        switch (action) {
          case 'assign':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets')
            }

            if (params?.assignTo === 'me' && currentUser) {
              const ticketIds = selectedTickets.map((t) => t.id)
              const assignedCount = await actions.bulkAssign(
                ticketIds,
                currentUser.id,
                'Bulk assignment'
              )
              toast({
                title: 'Success',
                description: `${assignedCount} tickets assigned to you`,
              })
            } else if (params?.assignTo === 'unassign') {
              for (const ticket of selectedTickets) {
                await actions.assignTicket(ticket.id, null, 'Bulk unassignment')
              }
              toast({
                title: 'Success',
                description: `${selectedTickets.length} tickets unassigned`,
              })
            }
            break

          case 'update_status':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets')
            }

            for (const ticket of selectedTickets) {
              await actions.updateTicket(ticket.id, { status: params?.status })
            }
            toast({
              title: 'Success',
              description: `${selectedTickets.length} tickets updated to ${params?.status}`,
            })
            break

          case 'update_priority':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets')
            }

            for (const ticket of selectedTickets) {
              await actions.updateTicket(ticket.id, { priority: params?.priority })
            }
            toast({
              title: 'Success',
              description: `${selectedTickets.length} tickets priority updated to ${params?.priority}`,
            })
            break

          case 'export':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can export tickets')
            }

            const selectedIds = selectedTickets.map((t) => t.id)
            await actions.exportTickets('csv', {}, selectedIds)
            toast({
              title: 'Success',
              description: 'Export started successfully',
            })
            break
        }

        // Clear selection after successful action
        actions.clearSelection()
      } catch (error: any) {
        console.error(`Bulk ${action} failed:`, error)
        toast({
          title: 'Error',
          description: error.message || `Failed to ${action} tickets`,
          variant: 'destructive',
        })
      }
    },
    [actions, currentUser, toast]
  )

  const handleDeleteTicket = useCallback(
    async (ticket: TicketData, reason: string, notifyUser: boolean) => {
      if (!actions?.deleteTicket) return

      const ticketNumber = ticket.ticket_number
      const ticketId = ticket.id

      try {
        console.log('🎫 Deleting ticket:', ticketId, { reason, notifyUser })
        
        await actions.deleteTicket(ticketId, reason, notifyUser)
        
        toast({
          title: 'Success',
          description: `Ticket #${ticketNumber} deleted successfully`,
        })
        
        console.log('✅ Ticket deletion completed successfully')
        
      } catch (error: any) {
        console.error('❌ Delete failed:', error)
        
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete ticket',
          variant: 'destructive',
        })
        
        throw error
      }
    },
    [actions, toast]
  )

  return {
    handleTicketAction,
    handleBulkAction,
    handleDeleteTicket
  }
}