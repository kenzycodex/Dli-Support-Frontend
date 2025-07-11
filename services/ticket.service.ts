// services/ticket.service.ts - Simplified without special delete routes

import { apiClient, ApiResponse } from '@/lib/api'

// Re-export types from store for consistency
export type {
  TicketData,
  TicketResponseData,
  TicketAttachmentData,
  TicketFilters,
  CreateTicketRequest,
  AddResponseRequest,
  UpdateTicketRequest
} from '@/stores/ticket-store'

export interface AssignTicketRequest {
  assigned_to: number | null
  reason?: string
}

export interface BulkAssignRequest {
  ticket_ids: number[]
  assigned_to: number
  reason?: string
}

export interface TagManagementRequest {
  action: 'add' | 'remove' | 'set'
  tags: string[]
}

export interface TicketAnalytics {
  overview: any
  trends: {
    created_this_period: number
    resolved_this_period: number
    average_resolution_time: number
  }
  by_category: Record<string, number>
  by_priority: Record<string, number>
  staff_performance?: Array<{
    id: number
    name: string
    role: string
    total_assigned: number
    resolved_count: number
  }>
  unassigned_tickets?: number
}

export interface StaffMember {
  id: number
  name: string
  email: string
  role: string
  assigned_tickets_count: number
}

/**
 * Clean, simplified ticket service
 */
class TicketService {
  private readonly apiClient = apiClient

  /**
   * Get tickets with comprehensive filtering
   */
  async getTickets(params: Record<string, any> = {}): Promise<ApiResponse<{
    tickets: any[]
    pagination: any
    stats: any
    user_role: string
  }>> {
    console.log('🎫 TicketService: Fetching tickets with params:', params)

    const queryParams = new URLSearchParams()
    
    // Build query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(`${key}[]`, v.toString()))
        } else {
          queryParams.append(key, value.toString())
        }
      }
    })

    try {
      const response = await this.apiClient.get(`/tickets?${queryParams.toString()}`)
      console.log('✅ TicketService: Tickets fetched successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch tickets:', error)
      return {
        success: false,
        message: 'Failed to fetch tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get single ticket with full details
   */
  async getTicket(ticketId: number): Promise<ApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Fetching ticket details:', ticketId)

    try {
      const response = await this.apiClient.get(`/tickets/${ticketId}`)
      console.log('✅ TicketService: Ticket details fetched successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch ticket details:', error)
      return {
        success: false,
        message: 'Failed to fetch ticket details.',
        errors: error
      }
    }
  }

  /**
   * Create new ticket with proper FormData handling
   */
  async createTicket(data: any): Promise<ApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Creating ticket:', data)

    try {
      // Create FormData for file upload support
      const formData = new FormData()

      // Add text fields
      formData.append('subject', data.subject.trim())
      formData.append('description', data.description.trim())
      formData.append('category', data.category)

      if (data.priority) {
        formData.append('priority', data.priority)
      }

      if (data.created_for) {
        formData.append('created_for', data.created_for.toString())
      }

      // Add files with proper Laravel array notation
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file: File) => {
          formData.append('attachments[]', file, file.name)
        })
      }

      const response = await this.apiClient.post('/tickets', formData)
      
      if (response.success) {
        console.log('✅ TicketService: Ticket created successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Create ticket error:', error)
      return {
        success: false,
        message: 'Failed to create ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: number, data: any): Promise<ApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Updating ticket:', { ticketId, data })

    try {
      const response = await this.apiClient.patch(`/tickets/${ticketId}`, data)
      console.log('✅ TicketService: Ticket updated successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Update ticket error:', error)
      return {
        success: false,
        message: 'Failed to update ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Add response with file upload support
   */
  async addResponse(ticketId: number, data: any): Promise<ApiResponse<{ response: any }>> {
    console.log('🎫 TicketService: Adding response:', { ticketId, data })

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('message', data.message.trim())

      if (data.is_internal !== undefined) {
        formData.append('is_internal', data.is_internal.toString())
      }

      if (data.visibility) {
        formData.append('visibility', data.visibility)
      }

      if (data.is_urgent !== undefined) {
        formData.append('is_urgent', data.is_urgent.toString())
      }

      // Add files
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file: File) => {
          formData.append('attachments[]', file, file.name)
        })
      }

      const response = await this.apiClient.post(`/tickets/${ticketId}/responses`, formData)
      
      if (response.success) {
        console.log('✅ TicketService: Response added successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Add response error:', error)
      return {
        success: false,
        message: 'Failed to add response. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Assign ticket to staff member
   */
  async assignTicket(ticketId: number, data: AssignTicketRequest): Promise<ApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Assigning ticket:', { ticketId, data })

    try {
      const response = await this.apiClient.post(`/tickets/${ticketId}/assign`, data)
      console.log('✅ TicketService: Ticket assigned successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Assign ticket error:', error)
      return {
        success: false,
        message: 'Failed to assign ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Bulk assign tickets
   */
  async bulkAssignTickets(data: BulkAssignRequest): Promise<ApiResponse<{ assigned_count: number }>> {
    console.log('🎫 TicketService: Bulk assigning tickets:', data)

    try {
      const response = await this.apiClient.post('/admin/bulk-assign', data)
      console.log('✅ TicketService: Tickets bulk assigned successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Bulk assign error:', error)
      return {
        success: false,
        message: 'Failed to assign tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Manage ticket tags
   */
  async manageTags(ticketId: number, data: TagManagementRequest): Promise<ApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Managing tags:', { ticketId, data })

    try {
      const response = await this.apiClient.post(`/tickets/${ticketId}/tags`, data)
      console.log('✅ TicketService: Tags managed successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Tag management error:', error)
      return {
        success: false,
        message: 'Failed to update tags. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Delete ticket - Standard DELETE request
   */
  async deleteTicket(ticketId: number, reason?: string, notifyUser: boolean = false): Promise<ApiResponse<void>> {
    console.log('🎫 TicketService: Deleting ticket:', { ticketId, reason, notifyUser })

    try {
      const data = reason ? { reason, notify_user: notifyUser } : undefined
      const response = await this.apiClient.delete(`/tickets/${ticketId}`, data)
      console.log('✅ TicketService: Ticket deleted successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Delete ticket error:', error)
      return {
        success: false,
        message: 'Failed to delete ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Download attachment
   */
  async downloadAttachment(attachmentId: number): Promise<Blob> {
    console.log('🎫 TicketService: Downloading attachment:', attachmentId)

    try {
      const blob = await this.apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`)
      console.log('✅ TicketService: Attachment downloaded successfully')
      return blob
    } catch (error) {
      console.error('❌ TicketService: Download failed:', error)
      throw new Error('Failed to download attachment. Please try again.')
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(timeframe: string = '30'): Promise<ApiResponse<TicketAnalytics>> {
    console.log('🎫 TicketService: Fetching analytics for timeframe:', timeframe)

    try {
      const response = await this.apiClient.get(`/tickets/analytics?timeframe=${timeframe}`)
      console.log('✅ TicketService: Analytics fetched successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Analytics error:', error)
      return {
        success: false,
        message: 'Failed to fetch analytics. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get available staff for assignment
   */
  async getAvailableStaff(ticketId: number): Promise<ApiResponse<{ staff: StaffMember[] }>> {
    console.log('🎫 TicketService: Fetching available staff for ticket:', ticketId)

    try {
      const response = await this.apiClient.get(`/tickets/${ticketId}/available-staff`)
      console.log('✅ TicketService: Available staff fetched successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Available staff error:', error)
      return {
        success: false,
        message: 'Failed to fetch available staff. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Export tickets
   */
  async exportTickets(format: 'csv' | 'excel' | 'json' = 'csv', filters: Record<string, any> = {}): Promise<ApiResponse<any>> {
    console.log('🎫 TicketService: Exporting tickets:', { format, filters })

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', format)
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await this.apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)
      console.log('✅ TicketService: Tickets exported successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Export error:', error)
      return {
        success: false,
        message: 'Failed to export tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get ticket options
   */
  async getOptions(): Promise<ApiResponse<{
    categories: Record<string, string>
    priorities: Record<string, string>
    statuses: Record<string, string>
    tags: Record<string, string>
  }>> {
    console.log('🎫 TicketService: Fetching ticket options')

    try {
      const response = await this.apiClient.get('/tickets/options')
      console.log('✅ TicketService: Options fetched successfully')
      return response
    } catch (error) {
      console.error('❌ TicketService: Options error:', error)
      return {
        success: false,
        message: 'Failed to fetch ticket options.',
        errors: error
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const units = ['Bytes', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * Check if file is an image
   */
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/')
  }

  /**
   * Check if file is a document
   */
  isDocument(fileType: string): boolean {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    return docTypes.includes(fileType)
  }

  /**
   * Get status color class for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  /**
   * Get priority color class for UI
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200 animate-pulse'
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'general': 'General Inquiry',
      'academic': 'Academic Help',
      'mental-health': 'Mental Health',
      'crisis': 'Crisis Support',
      'technical': 'Technical Issue',
      'other': 'Other'
    }
    return categoryMap[category] || category
  }

  /**
   * Get role-appropriate categories
   */
  getRoleCategories(role: string): Array<{ value: string; label: string; description: string }> {
    return [
      { 
        value: 'general', 
        label: 'General Inquiry', 
        description: 'General questions and support requests' 
      },
      { 
        value: 'academic', 
        label: 'Academic Help', 
        description: 'Course support, study assistance, academic planning' 
      },
      { 
        value: 'mental-health', 
        label: 'Mental Health', 
        description: 'Counseling, stress management, wellbeing support' 
      },
      { 
        value: 'crisis', 
        label: 'Crisis Support', 
        description: 'Immediate help for urgent situations' 
      },
      { 
        value: 'technical', 
        label: 'Technical Issue', 
        description: 'Login problems, system errors, account access' 
      },
      { 
        value: 'other', 
        label: 'Other', 
        description: 'Issues not covered by other categories' 
      },
    ]
  }

  /**
   * Detect if content contains crisis keywords
   */
  detectCrisisKeywords(text: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'take my life',
      'suicidal', 'killing myself', 'ending it all', 'better off dead',
      'self harm', 'hurt myself', 'cutting', 'cut myself', 'self injury',
      'crisis', 'emergency', 'urgent help', 'immediate help', 'desperate',
      'can\'t cope', 'overwhelmed', 'breakdown', 'mental breakdown',
      'overdose', 'too many pills', 'drink to death',
      'hopeless', 'worthless', 'no point', 'give up', 'can\'t go on'
    ]

    const lowerText = text.toLowerCase()
    return crisisKeywords.some(keyword => lowerText.includes(keyword))
  }

  /**
   * Get time ago string
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  /**
   * Calculate resolution time
   */
  getResolutionTime(createdAt: string, resolvedAt: string): string {
    const created = new Date(createdAt)
    const resolved = new Date(resolvedAt)
    const diffInHours = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than 1 hour'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
  }

  /**
   * Validate ticket creation data
   */
  validateTicketData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.subject?.trim()) {
      errors.push('Subject is required')
    } else if (data.subject.length > 255) {
      errors.push('Subject must not exceed 255 characters')
    }

    if (!data.description?.trim()) {
      errors.push('Description is required')
    } else if (data.description.length < 20) {
      errors.push('Description must be at least 20 characters long')
    } else if (data.description.length > 5000) {
      errors.push('Description must not exceed 5000 characters')
    }

    if (!data.category) {
      errors.push('Category is required')
    }

    const validCategories = ['general', 'academic', 'mental-health', 'crisis', 'technical', 'other']
    if (data.category && !validCategories.includes(data.category)) {
      errors.push('Invalid category selected')
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority selected')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate file uploads
   */
  validateFiles(files: File[], maxCount: number = 5): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (files.length > maxCount) {
      errors.push(`Maximum ${maxCount} files allowed`)
      return { valid: false, errors }
    }

    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    const maxFileSize = 10 * 1024 * 1024 // 10MB

    for (const file of files) {
      if (file.size > maxFileSize) {
        errors.push(`File "${file.name}" exceeds 10MB limit`)
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`File type "${file.type}" is not allowed for "${file.name}"`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Health check for service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  /**
   * Clear cache (placeholder for future implementation)
   */
  clearCache(): void {
    console.log('🎫 TicketService: Clearing cache')
    // This would clear any service-level caches
  }
}

// Export singleton instance
export const ticketService = new TicketService()
export default ticketService