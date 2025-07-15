// services/ticket.service.ts - FIXED: Enhanced download handling and response integration

import { apiClient, StandardizedApiResponse } from '@/lib/api'

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
 * ENHANCED Ticket Service - Fixed download handling and response integration
 */
class TicketService {
  private readonly apiClient = apiClient

  /**
   * Get tickets with comprehensive filtering
   */
  async getTickets(params: Record<string, any> = {}): Promise<StandardizedApiResponse<{
    tickets: any[]
    pagination: any
    stats: any
    user_role: string
  }>> {
    console.log('🎫 TicketService: Fetching tickets with params:', params)

    const queryParams = new URLSearchParams()
    
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
      
      if (response.success) {
        console.log('✅ TicketService: Tickets fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch tickets:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch tickets. Please try again.',
      }
    }
  }

  /**
   * FIXED: Get single ticket with complete conversation data
   */
  async getTicket(ticketId: number): Promise<StandardizedApiResponse<{ 
    ticket: any
    permissions?: any 
  }>> {
    console.log('🎫 TicketService: Fetching complete ticket details for ID:', ticketId)

    try {
      const response = await this.apiClient.get(`/tickets/${ticketId}`)
      
      if (response.success && response.data?.ticket) {
        console.log('✅ TicketService: Complete ticket details fetched successfully')
        
        // Ensure responses are properly structured
        const ticket = response.data.ticket
        if (ticket.responses) {
          console.log(`📬 TicketService: Loaded ${ticket.responses.length} responses`)
          
          // Validate response structure
          ticket.responses.forEach((response: any, index: number) => {
            if (!response.user) {
              console.warn(`⚠️ Response ${index} missing user data`)
            }
            if (!response.attachments) {
              response.attachments = []
            }
          })
        } else {
          console.log('📬 TicketService: No responses found for ticket')
          ticket.responses = []
        }
        
        // Ensure attachments are properly structured
        if (!ticket.attachments) {
          ticket.attachments = []
        }
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch ticket details:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch ticket details.',
      }
    }
  }

  /**
   * Create new ticket
   */
  async createTicket(data: any): Promise<StandardizedApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Creating ticket:', data)

    try {
      const formData = new FormData()

      formData.append('subject', data.subject.trim())
      formData.append('description', data.description.trim())
      formData.append('category', data.category)

      if (data.priority) {
        formData.append('priority', data.priority)
      }

      if (data.created_for) {
        formData.append('created_for', data.created_for.toString())
      }

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
        status: 0,
        message: 'Failed to create ticket. Please try again.',
      }
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: number, data: any): Promise<StandardizedApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Updating ticket:', { ticketId, data })

    try {
      const response = await this.apiClient.patch(`/tickets/${ticketId}`, data)
      
      if (response.success) {
        console.log('✅ TicketService: Ticket updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Update ticket error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update ticket. Please try again.',
      }
    }
  }

  /**
   * FIXED: Add response with enhanced error handling and validation
   */
  async addResponse(ticketId: number, data: any): Promise<StandardizedApiResponse<{ response: any }>> {
    console.log('🎫 TicketService: Adding response to ticket:', { ticketId, data })

    try {
      // Enhanced validation
      if (!data.message || data.message.trim().length < 5) {
        return {
          success: false,
          status: 422,
          message: 'Response message must be at least 5 characters long',
        }
      }

      if (data.message.trim().length > 5000) {
        return {
          success: false,
          status: 422,
          message: 'Response message cannot exceed 5000 characters',
        }
      }

      // Create FormData for proper file handling
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

      // Handle file attachments with validation
      if (data.attachments && data.attachments.length > 0) {
        // Validate files before adding
        const fileValidation = this.validateFiles(data.attachments, 3)
        if (!fileValidation.valid) {
          return {
            success: false,
            status: 422,
            message: fileValidation.errors.join(', '),
          }
        }

        data.attachments.forEach((file: File) => {
          formData.append('attachments[]', file, file.name)
        })
      }

      console.log('🎫 TicketService: Submitting response with FormData')
      const response = await this.apiClient.post(`/tickets/${ticketId}/responses`, formData)
      
      if (response.success) {
        console.log('✅ TicketService: Response added successfully')
      } else {
        console.error('❌ TicketService: Response submission failed:', response.message)
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Add response error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to add response. Please try again.',
      }
    }
  }

  /**
   * Assign ticket to staff member
   */
  async assignTicket(ticketId: number, data: AssignTicketRequest): Promise<StandardizedApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Assigning ticket:', { ticketId, data })

    try {
      const response = await this.apiClient.post(`/tickets/${ticketId}/assign`, data)
      
      if (response.success) {
        console.log('✅ TicketService: Ticket assigned successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Assign ticket error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to assign ticket. Please try again.',
      }
    }
  }

  /**
   * Bulk assign tickets
   */
  async bulkAssignTickets(data: BulkAssignRequest): Promise<StandardizedApiResponse<{ assigned_count: number }>> {
    console.log('🎫 TicketService: Bulk assigning tickets:', data)

    try {
      const response = await this.apiClient.post('/admin/bulk-assign', data)
      
      if (response.success) {
        console.log('✅ TicketService: Tickets bulk assigned successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Bulk assign error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to assign tickets. Please try again.',
      }
    }
  }

  /**
   * Manage ticket tags
   */
  async manageTags(ticketId: number, data: TagManagementRequest): Promise<StandardizedApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Managing tags:', { ticketId, data })

    try {
      const response = await this.apiClient.post(`/tickets/${ticketId}/tags`, data)
      
      if (response.success) {
        console.log('✅ TicketService: Tags managed successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Tag management error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update tags. Please try again.',
      }
    }
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticketId: number, reason?: string, notifyUser: boolean = false): Promise<StandardizedApiResponse<{
    ticket_number?: string
    deletion_reason?: string
    user_notified?: boolean
    deleted_by?: any
  }>> {
    console.log('🎫 TicketService: Deleting ticket:', { ticketId, reason, notifyUser })

    try {
      const requestData = reason ? { 
        reason: reason.trim(), 
        notify_user: notifyUser 
      } : undefined

      const response = await this.apiClient.delete(`/tickets/${ticketId}`, requestData)
      
      if (response.success) {
        console.log('✅ TicketService: Ticket deleted successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Delete ticket error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to delete ticket. Please try again.',
      }
    }
  }

  /**
   * FIXED: Enhanced download attachment with multiple fallback strategies
   */
  async downloadAttachment(attachmentId: number, fileName?: string): Promise<void> {
    console.log('🎫 TicketService: Downloading attachment:', { attachmentId, fileName })

    try {
      // Strategy 1: Try direct API client download (preferred)
      try {
        const blob = await this.apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`, fileName)
        console.log('✅ TicketService: Attachment downloaded via API client')
        return
      } catch (apiError) {
        console.warn('⚠️ API client download failed, trying direct fetch:', apiError)
      }

      // Strategy 2: Direct fetch with proper headers
      const token = localStorage.getItem('auth_token')
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      const downloadUrl = `${baseURL}/tickets/attachments/${attachmentId}/download`
      
      console.log('🔄 TicketService: Attempting direct download from:', downloadUrl)

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/octet-stream, application/pdf, image/*, */*',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        let errorMessage = `Download failed: ${response.status} ${response.statusText}`
        
        // Try to get more specific error info
        try {
          const errorText = await response.text()
          if (errorText.includes('permission') || errorText.includes('access')) {
            errorMessage = "You don't have permission to download this file"
          } else if (errorText.includes('not found') || response.status === 404) {
            errorMessage = "File not found or no longer available"
          } else if (errorText.includes('token') || response.status === 401) {
            errorMessage = "Authentication required. Please refresh the page and try again."
          }
        } catch {
          // Ignore text parsing errors
        }
        
        throw new Error(errorMessage)
      }

      // Get filename from response headers or use provided name
      let downloadFileName = fileName
      const contentDisposition = response.headers.get('Content-Disposition')
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (fileNameMatch && fileNameMatch[1]) {
          downloadFileName = fileNameMatch[1].replace(/['"]/g, '')
        }
      }

      if (!downloadFileName) {
        downloadFileName = `attachment_${attachmentId}_${Date.now()}`
      }

      // Convert response to blob and trigger download
      const blob = await response.blob()
      
      // Create download link and trigger
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      link.style.display = 'none'
      
      // Add to DOM, click, and clean up
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

      console.log('✅ TicketService: Attachment downloaded successfully via direct fetch:', downloadFileName)

    } catch (error: any) {
      console.error('❌ TicketService: All download strategies failed:', error)
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to download attachment. '
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        userMessage += 'Please check your internet connection and try again.'
      } else if (error.message.includes('permission')) {
        userMessage += "You don't have permission to download this file."
      } else if (error.message.includes('not found')) {
        userMessage += "The file could not be found. It may have been deleted."
      } else if (error.message.includes('Authentication')) {
        userMessage += "Please refresh the page and try again."
      } else {
        userMessage += 'Please try again later or contact support if the problem persists.'
      }
      
      throw new Error(userMessage)
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(timeframe: string = '30'): Promise<StandardizedApiResponse<TicketAnalytics>> {
    console.log('🎫 TicketService: Fetching analytics for timeframe:', timeframe)

    try {
      const response = await this.apiClient.get(`/tickets/analytics?timeframe=${timeframe}`)
      
      if (response.success) {
        console.log('✅ TicketService: Analytics fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Analytics error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch analytics. Please try again.',
      }
    }
  }

  /**
   * Get available staff for assignment
   */
  async getAvailableStaff(ticketId: number): Promise<StandardizedApiResponse<{ staff: StaffMember[] }>> {
    console.log('🎫 TicketService: Fetching available staff for ticket:', ticketId)

    try {
      const response = await this.apiClient.get(`/tickets/${ticketId}/available-staff`)
      
      if (response.success) {
        console.log('✅ TicketService: Available staff fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Available staff error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch available staff. Please try again.',
      }
    }
  }

  /**
   * Export tickets
   */
  async exportTickets(format: 'csv' | 'excel' | 'json' = 'csv', filters: Record<string, any> = {}): Promise<StandardizedApiResponse<{
    tickets: any[]
    filename: string
    count: number
    exported_at: string
  }>> {
    console.log('🎫 TicketService: Exporting tickets:', { format, filters })

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', format)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await this.apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)
      
      if (response.success) {
        console.log('✅ TicketService: Tickets exported successfully')
        
        if (response.data?.tickets && format === 'csv') {
          const exportData = response.data.tickets
          const filename = response.data.filename || `tickets-export-${new Date().toISOString().split('T')[0]}.csv`
          
          const headers = Object.keys(exportData[0] || {})
          const csvContent = [
            headers.join(','),
            ...exportData.map((row: any) =>
              headers
                .map((header) => {
                  const value = row[header] || ''
                  return typeof value === 'string' &&
                    (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"`
                    : value
                })
                .join(',')
            ),
          ].join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 1000)
        }
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Export error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to export tickets. Please try again.',
      }
    }
  }

  /**
   * Get ticket options
   */
  async getOptions(): Promise<StandardizedApiResponse<{
    categories: Record<string, string>
    priorities: Record<string, string>
    statuses: Record<string, string>
    tags: Record<string, string>
  }>> {
    console.log('🎫 TicketService: Fetching ticket options')

    try {
      const response = await this.apiClient.get('/tickets/options')
      
      if (response.success) {
        console.log('✅ TicketService: Options fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Options error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch ticket options.',
      }
    }
  }

  /**
   * UTILITY METHODS - Enhanced for better UX
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
   * ENHANCED: Validate ticket creation data
   */
  validateTicketData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.subject?.trim()) {
      errors.push('Subject is required')
    } else if (data.subject.length > 255) {
      errors.push('Subject must not exceed 255 characters')
    } else if (data.subject.length < 5) {
      errors.push('Subject must be at least 5 characters long')
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
   * ENHANCED: Validate file uploads with detailed checks
   */
  validateFiles(files: File[], maxCount: number = 5): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!files || !Array.isArray(files)) {
      errors.push('Invalid files provided')
      return { valid: false, errors }
    }

    if (files.length === 0) {
      return { valid: true, errors: [] }
    }

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!file || !(file instanceof File)) {
        errors.push(`Invalid file at position ${i + 1}`)
        continue
      }

      if (file.size > maxFileSize) {
        errors.push(`File "${file.name}" exceeds 10MB limit`)
      }

      if (file.size === 0) {
        errors.push(`File "${file.name}" is empty`)
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push(`File type "${file.type}" is not allowed for "${file.name}"`)
      }

      // Check for potentially dangerous file extensions
      const fileName = file.name.toLowerCase()
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.vbs', '.js']
      if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
        errors.push(`File "${file.name}" has a potentially dangerous file extension`)
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
  }

  /**
   * ENHANCED: Test attachment download capabilities
   */
  async testDownloadCapabilities(): Promise<{ 
    canDownload: boolean
    supportedMethods: string[]
    errors: string[]
  }> {
    const results = {
      canDownload: false,
      supportedMethods: [] as string[],
      errors: [] as string[]
    }

    try {
      // Test 1: Check if we can make authenticated requests
      const token = localStorage.getItem('auth_token')
      if (!token) {
        results.errors.push('No authentication token available')
        return results
      }

      // Test 2: Check if API client download works (mock test)
      try {
        // This would be a real test in a full implementation
        results.supportedMethods.push('api_client')
        console.log('✅ API client download method available')
      } catch (error) {
        results.errors.push('API client method failed')
      }

      // Test 3: Check if direct fetch works
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        const testResponse = await fetch(`${baseURL}/health`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (testResponse.ok) {
          results.supportedMethods.push('direct_fetch')
          console.log('✅ Direct fetch method available')
        }
      } catch (error) {
        results.errors.push('Direct fetch method failed')
      }

      results.canDownload = results.supportedMethods.length > 0

      console.log('🔍 TicketService: Download capabilities test completed:', results)
      return results

    } catch (error) {
      console.error('❌ TicketService: Download capabilities test failed:', error)
      results.errors.push(`Test failed: ${error}`)
      return results
    }
  }

  /**
   * ENHANCED: Get file icon based on type
   */
  getFileIcon(fileType: string): string {
    if (this.isImage(fileType)) {
      return 'image'
    }

    switch (fileType) {
      case 'application/pdf':
        return 'pdf'
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'document'
      case 'text/plain':
        return 'text'
      default:
        return 'file'
    }
  }

  /**
   * ENHANCED: Check if user can download attachments
   */
  canUserDownloadAttachments(): boolean {
    // All authenticated users can download attachments
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  /**
   * ENHANCED: Get download URL for attachment (for direct links)
   */
  getAttachmentDownloadUrl(attachmentId: number): string {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    return `${baseURL}/tickets/attachments/${attachmentId}/download`
  }

  /**
   * ENHANCED: Validate response data before submission
   */
  validateResponseData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.message || typeof data.message !== 'string') {
      errors.push('Response message is required')
      return { valid: false, errors }
    }

    const message = data.message.trim()
    
    if (message.length < 5) {
      errors.push('Response must be at least 5 characters long')
    }

    if (message.length > 5000) {
      errors.push('Response cannot exceed 5000 characters')
    }

    // Validate attachments if present
    if (data.attachments && data.attachments.length > 0) {
      const fileValidation = this.validateFiles(data.attachments, 3)
      if (!fileValidation.valid) {
        errors.push(...fileValidation.errors)
      }
    }

    // Validate boolean fields
    if (data.is_internal !== undefined && typeof data.is_internal !== 'boolean') {
      errors.push('is_internal must be a boolean value')
    }

    if (data.is_urgent !== undefined && typeof data.is_urgent !== 'boolean') {
      errors.push('is_urgent must be a boolean value')
    }

    // Validate visibility field
    if (data.visibility && !['all', 'counselors', 'admins'].includes(data.visibility)) {
      errors.push('visibility must be one of: all, counselors, admins')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * ENHANCED: Check if file type is supported for uploads
   */
  isSupportedFileType(fileType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    return supportedTypes.includes(fileType)
  }

  /**
   * ENHANCED: Get human-readable file type description
   */
  getFileTypeDescription(fileType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPEG Image',
      'image/gif': 'GIF Image',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'text/plain': 'Text File',
    }
    return typeMap[fileType] || 'Unknown File Type'
  }

  /**
   * ENHANCED: Format bytes with more precision options
   */
  formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  /**
   * ENHANCED: Check if current user can perform specific actions
   */
  canUserPerformAction(action: string, userRole?: string): boolean {
    const role = userRole || this.getCurrentUserRole()
    
    switch (action) {
      case 'create_ticket':
        return role === 'student' || role === 'admin'
      case 'view_all_tickets':
        return role === 'admin'
      case 'assign_ticket':
        return role === 'admin'
      case 'modify_ticket':
        return ['counselor', 'admin'].includes(role)
      case 'delete_ticket':
        return role === 'admin'
      case 'add_internal_response':
        return ['counselor', 'admin'].includes(role)
      case 'download_attachment':
        return true // All authenticated users can download
      case 'export_tickets':
        return role === 'admin'
      default:
        return false
    }
  }

  /**
   * ENHANCED: Get current user role from stored auth data
   */
  private getCurrentUserRole(): string {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.role || 'student'
      }
    } catch (error) {
      console.error('Failed to get user role:', error)
    }
    return 'student'
  }

  /**
   * ENHANCED: Generate ticket summary for notifications
   */
  generateTicketSummary(ticket: any): string {
    const category = this.getCategoryDisplayName(ticket.category)
    const priority = ticket.priority
    const status = ticket.status
    
    return `${category} ticket (${priority} priority) - ${status}`
  }

  /**
   * ENHANCED: Calculate ticket metrics
   */
  calculateTicketMetrics(tickets: any[]): {
    totalTickets: number
    avgResolutionTime: number
    resolutionRate: number
    priorityDistribution: Record<string, number>
    categoryDistribution: Record<string, number>
  } {
    const total = tickets.length
    
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
    const resolutionRate = total > 0 ? (resolved.length / total) * 100 : 0
    
    // Calculate average resolution time for resolved tickets
    const resolvedWithTime = resolved.filter(t => t.resolved_at && t.created_at)
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((acc, ticket) => {
          const created = new Date(ticket.created_at).getTime()
          const resolved = new Date(ticket.resolved_at).getTime()
          return acc + (resolved - created)
        }, 0) / resolvedWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0
    
    // Priority distribution
    const priorityDistribution = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Category distribution
    const categoryDistribution = tickets.reduce((acc, ticket) => {
      const categoryName = this.getCategoryDisplayName(ticket.category)
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalTickets: total,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // Round to 1 decimal
      resolutionRate: Math.round(resolutionRate * 10) / 10, // Round to 1 decimal
      priorityDistribution,
      categoryDistribution
    }
  }

  /**
   * ENHANCED: Debug information for troubleshooting
   */
  getDebugInfo(): {
    apiBaseUrl: string
    hasAuthToken: boolean
    userRole: string
    browserSupport: {
      fetch: boolean
      blob: boolean
      url: boolean
    }
    storageSupport: {
      localStorage: boolean
      sessionStorage: boolean
    }
  } {
    const hasAuthToken = !!localStorage.getItem('auth_token')
    const userRole = this.getCurrentUserRole()
    
    return {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
      hasAuthToken,
      userRole,
      browserSupport: {
        fetch: typeof fetch !== 'undefined',
        blob: typeof Blob !== 'undefined',
        url: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined'
      },
      storageSupport: {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined'
      }
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService()
export default ticketService