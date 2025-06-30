// services/ticket.service.ts (Comprehensive role-based ticket service)

import { apiClient, ApiResponse } from '@/lib/api'

export interface TicketData {
  id: number
  ticket_number: string
  user_id: number
  subject: string
  description: string
  category: 'general' | 'academic' | 'mental-health' | 'crisis' | 'technical' | 'other'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: number
  crisis_flag: boolean
  tags?: string[]
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
    role: string
  }
  assignedTo?: {
    id: number
    name: string
    email: string
    role: string
  }
  responses?: TicketResponseData[]
  attachments?: TicketAttachmentData[]
  response_count?: number
  attachment_count?: number
}

export interface TicketResponseData {
  id: number
  ticket_id: number
  user_id: number
  message: string
  is_internal: boolean
  visibility: 'all' | 'counselors' | 'admins'
  is_urgent: boolean
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
    role: string
  }
  attachments?: TicketAttachmentData[]
}

export interface TicketAttachmentData {
  id: number
  ticket_id: number
  response_id?: number
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
  updated_at: string
}

export interface TicketListParams {
  page?: number
  per_page?: number
  status?: string
  category?: string
  priority?: string
  assigned?: string
  search?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  tags?: string[]
}

export interface CreateTicketRequest {
  subject: string
  description: string
  category: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  attachments?: File[]
  created_for?: number // Admin creating on behalf of student
}

export interface AddResponseRequest {
  message: string
  is_internal?: boolean
  visibility?: 'all' | 'counselors' | 'admins'
  is_urgent?: boolean
  attachments?: File[]
}

export interface UpdateTicketRequest {
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: number | null
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  crisis_flag?: boolean
  tags?: string[]
  subject?: string // Students can update subject of open tickets
  description?: string // Students can update description of open tickets
}

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

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  high_priority: number
  urgent: number
  crisis: number
  unassigned: number // Make this required instead of optional
}

export interface TicketAnalytics {
  overview: TicketStats
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

class TicketService {
  /**
   * Get tickets based on user role with comprehensive filtering
   */
  async getTickets(params: TicketListParams = {}): Promise<
    ApiResponse<{
      tickets: TicketData[]
      pagination: any
      stats: TicketStats
      user_role: string
    }>
  > {
    console.log('🎫 TicketService: Fetching tickets with params:', params)

    const queryParams = new URLSearchParams()
    
    // Pagination
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    
    // Sorting
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction)
    
    // Filters
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.category && params.category !== 'all') queryParams.append('category', params.category)
    if (params.priority && params.priority !== 'all') queryParams.append('priority', params.priority)
    if (params.assigned && params.assigned !== 'all') queryParams.append('assigned', params.assigned)
    if (params.search) queryParams.append('search', params.search)
    
    // Tags
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags[]', tag))
    }

    try {
      const response = await apiClient.get(`/tickets?${queryParams.toString()}`)
      console.log('🎫 TicketService: Tickets response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Failed to fetch tickets:', error)
      return {
        success: false,
        message: 'Failed to fetch tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Create new ticket with enhanced validation and file handling
   */
  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Creating ticket:', data)

    try {
      // Enhanced client-side validation
      const validation = this.validateTicketData(data)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.errors.join(', '),
        }
      }

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

      // Add files with Laravel array notation
      if (data.attachments && data.attachments.length > 0) {
        const fileValidation = this.validateFiles(data.attachments, 5)
        if (!fileValidation.valid) {
          return {
            success: false,
            message: fileValidation.errors.join(', '),
          }
        }

        data.attachments.forEach((file) => {
          formData.append('attachments[]', file, file.name)
        })
      }

      console.log('🎫 TicketService: Sending ticket creation request')
      const response = await apiClient.post('/tickets', formData)
      
      if (response.success) {
        console.log('🎫 TicketService: Ticket created successfully')
      }
      
      return response
    } catch (error) {
      console.error('🎫 TicketService: Create ticket error:', error)
      return {
        success: false,
        message: 'An unexpected error occurred while creating the ticket.',
        errors: error
      }
    }
  }

  /**
   * Get single ticket details with role-based data
   */
  async getTicket(ticketId: number): Promise<TicketData | null> {
    console.log('🎫 TicketService: Fetching ticket details:', ticketId)

    try {
      const response = await apiClient.get(`/tickets/${ticketId}`)
      
      if (response.success && response.data) {
        console.log('🎫 TicketService: Ticket details fetched successfully')
        return response.data.ticket
      } else {
        console.error('🎫 TicketService: Failed to fetch ticket details:', response.message)
        return null
      }
    } catch (error) {
      console.error('🎫 TicketService: Error fetching ticket details:', error)
      return null
    }
  }

  /**
   * Update ticket with role-based permissions
   */
  async updateTicket(
    ticketId: number,
    data: UpdateTicketRequest
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Updating ticket:', { ticketId, data })

    try {
      const response = await apiClient.patch(`/tickets/${ticketId}`, data)
      console.log('🎫 TicketService: Update response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Update ticket error:', error)
      return {
        success: false,
        message: 'Failed to update ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Add response to ticket with enhanced file handling
   */
  async addResponse(
    ticketId: number,
    data: AddResponseRequest
  ): Promise<TicketResponseData | null> {
    console.log('🎫 TicketService: Adding response:', { ticketId, data })

    try {
      // Validate message
      if (!data.message?.trim() || data.message.length < 5) {
        throw new Error('Response message must be at least 5 characters long')
      }

      // Create FormData for file upload support
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
        const fileValidation = this.validateFiles(data.attachments, 3)
        if (!fileValidation.valid) {
          throw new Error(fileValidation.errors.join(', '))
        }

        data.attachments.forEach((file) => {
          formData.append('attachments[]', file, file.name)
        })
      }

      const response = await apiClient.post(`/tickets/${ticketId}/responses`, formData)
      
      if (response.success && response.data) {
        console.log('🎫 TicketService: Response added successfully')
        return response.data.response
      } else {
        console.error('🎫 TicketService: Failed to add response:', response.message)
        throw new Error(response.message || 'Failed to add response')
      }
    } catch (error) {
      console.error('🎫 TicketService: Add response error:', error)
      throw error
    }
  }

  /**
   * Assign ticket to staff member (admin/staff only)
   */
  async assignTicket(
    ticketId: number,
    data: AssignTicketRequest
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Assigning ticket:', { ticketId, data })

    try {
      const response = await apiClient.post(`/tickets/${ticketId}/assign`, data)
      console.log('🎫 TicketService: Assign response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Assign ticket error:', error)
      return {
        success: false,
        message: 'Failed to assign ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Bulk assign tickets (admin only)
   */
  async bulkAssignTickets(data: BulkAssignRequest): Promise<ApiResponse<{ assigned_count: number }>> {
    console.log('🎫 TicketService: Bulk assigning tickets:', data)

    try {
      const response = await apiClient.post('/admin/bulk-assign', data)
      console.log('🎫 TicketService: Bulk assign response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Bulk assign error:', error)
      return {
        success: false,
        message: 'Failed to assign tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Manage ticket tags (staff only)
   */
  async manageTags(
    ticketId: number,
    data: TagManagementRequest
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Managing tags:', { ticketId, data })

    try {
      const response = await apiClient.post(`/tickets/${ticketId}/tags`, data)
      console.log('🎫 TicketService: Tag management response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Tag management error:', error)
      return {
        success: false,
        message: 'Failed to update tags. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Delete ticket (admin only)
   */
  async deleteTicket(
    ticketId: number,
    reason: string,
    notifyUser: boolean = false
  ): Promise<ApiResponse<void>> {
    console.log('🎫 TicketService: Deleting ticket:', { ticketId, reason, notifyUser })

    try {
      const response = await apiClient.delete(`/tickets/${ticketId}`, {
        body: JSON.stringify({ reason, notify_user: notifyUser }),
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('🎫 TicketService: Delete response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Delete ticket error:', error)
      return {
        success: false,
        message: 'Failed to delete ticket. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get ticket analytics based on user role
   */
  async getAnalytics(timeframe: string = '30'): Promise<ApiResponse<TicketAnalytics>> {
    console.log('🎫 TicketService: Fetching analytics for timeframe:', timeframe)

    try {
      const response = await apiClient.get(`/tickets/analytics?timeframe=${timeframe}`)
      console.log('🎫 TicketService: Analytics response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Analytics error:', error)
      return {
        success: false,
        message: 'Failed to fetch analytics. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get available staff for ticket assignment
   */
  async getAvailableStaff(ticketId: number): Promise<ApiResponse<{ staff: StaffMember[] }>> {
    console.log('🎫 TicketService: Fetching available staff for ticket:', ticketId)

    try {
      const response = await apiClient.get(`/tickets/${ticketId}/available-staff`)
      console.log('🎫 TicketService: Available staff response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Available staff error:', error)
      return {
        success: false,
        message: 'Failed to fetch available staff. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Download attachment with proper error handling
   */
  async downloadAttachment(attachmentId: number, fileName: string): Promise<void> {
    console.log('🎫 TicketService: Downloading attachment:', { attachmentId, fileName })

    try {
      const blob = await apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`)
      this.downloadFileFromBlob(blob, fileName)
      console.log('✅ TicketService: File download initiated successfully')
    } catch (error) {
      console.error('💥 TicketService: Download failed:', error)
      throw new Error('Failed to download attachment. Please try again.')
    }
  }

  /**
   * Export tickets data (admin only)
   */
  async exportTickets(
    format: 'csv' | 'excel' | 'json' = 'csv',
    filters: Partial<TicketListParams> = {}
  ): Promise<ApiResponse<any>> {
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

      const response = await apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)
      console.log('🎫 TicketService: Export response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Export error:', error)
      return {
        success: false,
        message: 'Failed to export tickets. Please try again.',
        errors: error
      }
    }
  }

  /**
   * Get ticket options and metadata
   */
  async getOptions(): Promise<
    ApiResponse<{
      categories: Record<string, string>
      priorities: Record<string, string>
      statuses: Record<string, string>
      tags: Record<string, string>
    }>
  > {
    console.log('🎫 TicketService: Fetching ticket options')

    try {
      const response = await apiClient.get('/tickets/options')
      console.log('🎫 TicketService: Options response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Options error:', error)
      return {
        success: false,
        message: 'Failed to fetch ticket options.',
        errors: error
      }
    }
  }

  /**
   * Get role-specific dashboard data
   */
  async getDashboardData(role: string): Promise<ApiResponse<any>> {
    console.log('🎫 TicketService: Fetching dashboard data for role:', role)

    try {
      let endpoint = '/user/dashboard'
      
      switch (role) {
        case 'student':
          endpoint = '/student/dashboard'
          break
        case 'counselor':
          endpoint = '/counselor/dashboard'
          break
        case 'advisor':
          endpoint = '/advisor/dashboard'
          break
        case 'admin':
          endpoint = '/admin/dashboard'
          break
      }

      const response = await apiClient.get(endpoint)
      console.log('🎫 TicketService: Dashboard data response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Dashboard data error:', error)
      return {
        success: false,
        message: 'Failed to fetch dashboard data.',
        errors: error
      }
    }
  }

  /**
   * Get user permissions based on role
   */
  async getUserPermissions(): Promise<ApiResponse<any>> {
    console.log('🎫 TicketService: Fetching user permissions')

    try {
      const response = await apiClient.get('/user/permissions')
      console.log('🎫 TicketService: Permissions response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Permissions error:', error)
      return {
        success: false,
        message: 'Failed to fetch user permissions.',
        errors: error
      }
    }
  }

  /**
   * Get role-specific ticket statistics
   */
  async getTicketStats(role: string): Promise<ApiResponse<TicketStats>> {
    console.log('🎫 TicketService: Fetching ticket stats for role:', role)

    try {
      let endpoint = '/user/ticket-summary'
      
      switch (role) {
        case 'student':
          endpoint = '/student/stats'
          break
        case 'counselor':
        case 'advisor':
          endpoint = '/staff/stats'
          break
        case 'admin':
          endpoint = '/admin/analytics'
          break
      }

      const response = await apiClient.get(endpoint)
      console.log('🎫 TicketService: Stats response:', response)
      return response
    } catch (error) {
      console.error('🎫 TicketService: Stats error:', error)
      return {
        success: false,
        message: 'Failed to fetch ticket statistics.',
        errors: error
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Validate ticket creation data
   */
  private validateTicketData(data: CreateTicketRequest): { valid: boolean; errors: string[] } {
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

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate file uploads
   */
  private validateFiles(files: File[], maxCount: number = 5): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (files.length > maxCount) {
      errors.push(`Maximum ${maxCount} files allowed`)
      return { valid: false, errors }
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
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

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Download file from blob
   */
  private downloadFileFromBlob(blob: Blob, fileName: string): void {
    console.log('🎫 TicketService: Downloading file from blob:', fileName)

    try {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)

      console.log('✅ TicketService: File download initiated')
    } catch (error) {
      console.error('❌ TicketService: File download failed:', error)
      throw new Error('Failed to download file')
    }
  }

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
    return categoryMap[category as keyof typeof categoryMap] || category
  }

  /**
   * Get role-appropriate categories
   */
  getRoleCategories(role: string): Array<{ value: string; label: string; description: string }> {
    const allCategories = [
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

    // All users can access all categories
    return allCategories
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
   * Create ticket with retry mechanism
   */
  async createTicketWithRetry(
    data: CreateTicketRequest, 
    maxRetries: number = 2
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    return apiClient.retryRequest(() => this.createTicket(data), maxRetries)
  }

  /**
   * Add response with retry mechanism
   */
  async addResponseWithRetry(
    ticketId: number, 
    data: AddResponseRequest, 
    maxRetries: number = 2
  ): Promise<TicketResponseData | null> {
    try {
      const result = await apiClient.retryRequest(
        async () => {
          const response = await this.addResponse(ticketId, data)
          return {
            success: true,
            message: 'Response added successfully',
            data: response
          }
        }, 
        maxRetries
      )
      
      return result.success ? (result.data ?? null) : null
    } catch (error) {
      console.error('🎫 TicketService: Add response with retry failed:', error)
      return null
    }
  }

  /**
   * Batch operations helper
   */
  async batchUpdateTickets(
    ticketIds: number[],
    updates: Partial<UpdateTicketRequest>
  ): Promise<ApiResponse<{ updated_count: number }>> {
    console.log('🎫 TicketService: Batch updating tickets:', { ticketIds, updates })

    try {
      // This would be implemented as a separate batch endpoint
      const promises = ticketIds.map(id => this.updateTicket(id, updates))
      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length

      return {
        success: true,
        message: `Successfully updated ${successful} out of ${ticketIds.length} tickets`,
        data: { updated_count: successful }
      }
    } catch (error) {
      console.error('🎫 TicketService: Batch update error:', error)
      return {
        success: false,
        message: 'Failed to update tickets in batch',
        errors: error
      }
    }
  }

  /**
   * Real-time updates helper (would integrate with WebSocket)
   */
  subscribeToTicketUpdates(ticketId: number, callback: (update: any) => void): () => void {
    console.log('🎫 TicketService: Subscribing to ticket updates:', ticketId)
    
    // This would implement WebSocket or Server-Sent Events
    // For now, return a no-op unsubscribe function
    return () => {
      console.log('🎫 TicketService: Unsubscribing from ticket updates:', ticketId)
    }
  }

  /**
   * Cache management
   */
  clearCache(): void {
    console.log('🎫 TicketService: Clearing cache')
    // Clear any cached data
  }

  /**
   * Health check for service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService()