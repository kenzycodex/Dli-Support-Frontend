// hooks/useTicketAssignment.ts - Integration hook for ticket assignment

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { useCounselorSpecializationsActions } from '@/stores/counselorSpecializations-store'

export interface AssignmentOption {
  id: number
  name: string
  email: string
  role: string
  priority_level?: string
  current_workload?: number
  max_workload?: number
  expertise_rating?: number
  utilization_rate?: number
  can_take_ticket?: boolean
}

export interface AssignmentData {
  ticket: {
    id: number
    category_id: number
    category_name: string
    current_assignee: string | null
  }
  available_specialists: AssignmentOption[]
  admin_users: AssignmentOption[]
  recommendation: AssignmentOption | null
}

export function useTicketAssignment() {
  const [loading, setLoading] = useState(false)
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const counselorActions = useCounselorSpecializationsActions()

  // Get assignment options for a ticket
  const getAssignmentOptions = useCallback(async (ticketId: number): Promise<AssignmentData | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🎯 TicketAssignment: Fetching assignment options for ticket:', ticketId)

      const response = await apiClient.get(`/tickets/assignment-options/${ticketId}`)

      if (response.success && response.data) {
        const data: AssignmentData = {
          ticket: response.data.ticket,
          available_specialists: response.data.available_specialists.map((specialist: any) => ({
            ...specialist,
            utilization_rate: specialist.max_workload > 0 
              ? Math.round((specialist.current_workload / specialist.max_workload) * 100 * 10) / 10
              : 0,
            can_take_ticket: specialist.current_workload < specialist.max_workload
          })),
          admin_users: response.data.admin_users,
          recommendation: response.data.recommendation
        }

        setAssignmentData(data)
        console.log('✅ TicketAssignment: Assignment options fetched successfully')
        return data
      } else {
        throw new Error(response.message || 'Failed to fetch assignment options')
      }
    } catch (error: any) {
      console.error('❌ TicketAssignment: Failed to fetch assignment options:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch assignment options'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Assign ticket to staff member
  const assignTicket = useCallback(async (
    ticketId: number, 
    assignedTo: number | null, 
    reason?: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      console.log('🎯 TicketAssignment: Assigning ticket:', { ticketId, assignedTo, reason })

      const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
        assigned_to: assignedTo,
        reason: reason || (assignedTo ? 'Manually assigned by admin' : 'Unassigned by admin')
      })

      if (response.success) {
        console.log('✅ TicketAssignment: Ticket assigned successfully')
        
        // Refresh counselor specializations to update workload counts
        await counselorActions.refreshAll()
        
        const assigneeName = response.data?.assignment_details?.assigned_to_name
        if (assignedTo && assigneeName) {
          toast.success(`Ticket assigned to ${assigneeName} successfully!`)
        } else {
          toast.success('Ticket unassigned successfully!')
        }
        
        return true
      } else {
        throw new Error(response.message || 'Failed to assign ticket')
      }
    } catch (error: any) {
      console.error('❌ TicketAssignment: Failed to assign ticket:', error)
      
      let errorMessage = 'Failed to assign ticket'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Handle specific error cases
      if (errorMessage.includes('does not specialize')) {
        toast.error('Assignment failed: The selected counselor does not specialize in this category')
      } else if (errorMessage.includes('maximum workload')) {
        toast.error('Assignment failed: The selected counselor is at maximum capacity')
      } else if (errorMessage.includes('already assigned')) {
        toast.error('Assignment failed: Ticket is already assigned to this person')
      } else {
        toast.error(errorMessage)
      }
      
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [counselorActions])

  // Get recommended assignment for a ticket
  const getRecommendedAssignment = useCallback(async (ticketId: number): Promise<AssignmentOption | null> => {
    const data = await getAssignmentOptions(ticketId)
    return data?.recommendation || null
  }, [getAssignmentOptions])

  // Auto-assign ticket using best available counselor
  const autoAssignTicket = useCallback(async (ticketId: number): Promise<boolean> => {
    try {
      const recommendation = await getRecommendedAssignment(ticketId)
      
      if (!recommendation) {
        toast.error('No available counselors found for auto-assignment')
        return false
      }

      return await assignTicket(ticketId, recommendation.id, 'Auto-assigned to best available counselor')
    } catch (error: any) {
      console.error('❌ TicketAssignment: Auto-assignment failed:', error)
      toast.error('Auto-assignment failed: No suitable counselors available')
      return false
    }
  }, [getRecommendedAssignment, assignTicket])

  // Clear assignment data
  const clearAssignmentData = useCallback(() => {
    setAssignmentData(null)
    setError(null)
  }, [])

  return {
    loading,
    assignmentData,
    error,
    
    // Actions
    getAssignmentOptions,
    assignTicket,
    getRecommendedAssignment,
    autoAssignTicket,
    clearAssignmentData,
    
    // Computed values
    hasSpecialists: assignmentData?.available_specialists.length || 0 > 0,
    hasAvailableSpecialists: assignmentData?.available_specialists.filter(s => s.can_take_ticket).length || 0 > 0,
    totalSpecialists: assignmentData?.available_specialists.length || 0,
    availableSpecialists: assignmentData?.available_specialists.filter(s => s.can_take_ticket) || [],
  }
}

// Enhanced ticket operations with assignment integration
export function useEnhancedTicketOperations() {
  const ticketAssignment = useTicketAssignment()
  
  return {
    ...ticketAssignment,
    
    // Quick assign to recommended counselor
    quickAssign: async (ticketId: number) => {
      return await ticketAssignment.autoAssignTicket(ticketId)
    },
    
    // Reassign ticket with validation
    reassignTicket: async (ticketId: number, newAssigneeId: number, reason?: string) => {
      const options = await ticketAssignment.getAssignmentOptions(ticketId)
      
      if (!options) {
        toast.error('Failed to get assignment options')
        return false
      }
      
      // Check if the new assignee is available
      const newAssignee = [
        ...options.available_specialists, 
        ...options.admin_users
      ].find(user => user.id === newAssigneeId)
      
      if (!newAssignee) {
        toast.error('Selected staff member is not available for assignment')
        return false
      }
      
      if (newAssignee.role !== 'admin' && !newAssignee.can_take_ticket) {
        toast.error('Selected counselor is at maximum capacity')
        return false
      }
      
      return await ticketAssignment.assignTicket(
        ticketId, 
        newAssigneeId, 
        reason || `Reassigned to ${newAssignee.name}`
      )
    },
    
    // Unassign ticket
    unassignTicket: async (ticketId: number, reason?: string) => {
      return await ticketAssignment.assignTicket(ticketId, null, reason || 'Unassigned by admin')
    },
    
    // Bulk assignment operations
    bulkAssign: async (ticketIds: number[], assigneeId: number, reason?: string) => {
      let successCount = 0
      let failCount = 0
      
      for (const ticketId of ticketIds) {
        const success = await ticketAssignment.assignTicket(ticketId, assigneeId, reason)
        if (success) {
          successCount++
        } else {
          failCount++
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} tickets`)
      }
      
      if (failCount > 0) {
        toast.error(`Failed to assign ${failCount} tickets`)
      }
      
      return { successCount, failCount }
    }
  }
}