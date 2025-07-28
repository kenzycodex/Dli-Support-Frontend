// services/ticket.service.ts - ENHANCED: Dynamic Categories & Crisis Detection

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

// ENHANCED: New interfaces for dynamic categories
export interface TicketCategory {
  id: number
  name: string
  slug: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  auto_assign: boolean
  crisis_detection_enabled: boolean
  sla_response_hours: number
  max_priority_level: number
  sort_order: number
  counselor_count?: number
  tickets_count?: number
  open_tickets_count?: number
}

export interface TicketOptions {
  categories: TicketCategory[]
  priorities: Array<{
    value: string
    label: string
    color: string
    description?: string
  }>
  statuses: Array<{
    value: string
    label: string
    color: string
  }>
  available_staff?: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  user_permissions: {
    can_create: boolean
    can_view_all: boolean
    can_assign: boolean
    can_modify: boolean
    can_delete: boolean
    can_add_internal_notes: boolean
    can_manage_tags: boolean
  }
  system_features: {
    crisis_detection_enabled: boolean
    auto_assignment_enabled: boolean
    categories_count: number
    counselors_available: number
  }
}

// ENHANCED: Crisis detection interfaces
export interface CrisisDetectionResult {
  is_crisis: boolean
  crisis_score: number
  detected_keywords: Array<{
    keyword: string
    severity_level: string
    severity_weight: number
  }>
  recommendation: string
}

// Enhanced request interfaces
export interface EnhancedCreateTicketRequest {
  subject: string
  description: string
  category_id: number // CHANGED: Now uses category ID instead of string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  attachments?: File[]
  created_for?: number
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
 * ENHANCED Ticket Service - Dynamic Categories & Crisis Detection Support
 */
class TicketService {
  private readonly apiClient = apiClient
  private downloadRetryCount = new Map<number, number>()
  private maxRetries = 3
  
  // ENHANCED: Cache for categories and options
  private categoriesCache: { data: TicketCategory[]; timestamp: number } | null = null
  private optionsCache: { data: TicketOptions; timestamp: number } | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * ENHANCED: Get ticket categories with caching
   */
  async getCategories(forceRefresh = false): Promise<StandardizedApiResponse<{
    categories: TicketCategory[]
  }>> {
    console.log('🎫 TicketService: Fetching ticket categories')

    // Check cache first
    if (!forceRefresh && this.categoriesCache) {
      const age = Date.now() - this.categoriesCache.timestamp
      if (age < this.CACHE_DURATION) {
        console.log('✅ TicketService: Using cached categories')
        return {
          success: true,
          status: 200,
          message: 'Categories retrieved from cache',
          data: { categories: this.categoriesCache.data }
        }
      }
    }

    try {
      const response = await this.apiClient.get('/ticket-categories')
      
      if (response.success && response.data?.categories) {
        // Cache the result
        this.categoriesCache = {
          data: response.data.categories,
          timestamp: Date.now()
        }
        
        console.log('✅ TicketService: Categories fetched and cached:', response.data.categories.length)
        return response
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch categories:', error)
      
      // Return cached data if available on error
      if (this.categoriesCache) {
        console.log('⚠️ TicketService: Using stale cached categories due to error')
        return {
          success: true,
          status: 200,
          message: 'Categories retrieved from cache (stale)',
          data: { categories: this.categoriesCache.data }
        }
      }
      
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch categories. Please try again.',
      }
    }
  }

  /**
   * ENHANCED: Get single category with details
   */
  async getCategory(categoryId: number): Promise<StandardizedApiResponse<{
    category: TicketCategory & {
      counselorSpecializations?: any[]
      crisisKeywords?: any[]
      tickets?: any[]
    }
  }>> {
    console.log('🎫 TicketService: Fetching category details:', categoryId)

    try {
      const response = await this.apiClient.get(`/ticket-categories/${categoryId}`)
      
      if (response.success) {
        console.log('✅ TicketService: Category details fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Failed to fetch category details:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch category details.',
      }
    }
  }

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
   * ENHANCED: Get single ticket with complete conversation data
   */
  async getTicket(ticketId: number): Promise<StandardizedApiResponse<{ 
    ticket: any
    permissions?: any 
  }>> {
    console.log('🎫 TicketService: Fetching COMPLETE ticket details for ID:', ticketId)

    try {
      const response = await this.apiClient.get(`/tickets/${ticketId}`)
      
      if (response.success && response.data?.ticket) {
        const ticket = response.data.ticket
        
        console.log('✅ TicketService: Complete ticket details fetched successfully', {
          hasResponses: !!ticket.responses,
          responseCount: ticket.responses?.length || 0,
          hasAttachments: !!ticket.attachments,
          attachmentCount: ticket.attachments?.length || 0,
          hasCrisisDetection: !!ticket.detected_crisis_keywords,
          autoAssigned: ticket.auto_assigned || 'no'
        })
        
        // ENHANCED: Validate and structure response data
        if (ticket.responses) {
          console.log(`📬 TicketService: Loaded ${ticket.responses.length} responses`)
          
          ticket.responses.forEach((response: any, index: number) => {
            if (!response.user) {
              console.warn(`⚠️ Response ${index} missing user data`)
            }
            if (!response.attachments) {
              response.attachments = []
            }
            response.attachment_count = response.attachments.length
          })
        } else {
          ticket.responses = []
        }
        
        // ENHANCED: Validate and structure attachment data
        if (!ticket.attachments) {
          ticket.attachments = []
        }
        ticket.attachment_count = ticket.attachments.length
        
        // ENHANCED: Ensure crisis detection fields
        if (!ticket.detected_crisis_keywords) {
          ticket.detected_crisis_keywords = []
        }
        
        // ENHANCED: Ensure assignment tracking fields
        if (!ticket.auto_assigned) {
          ticket.auto_assigned = 'no'
        }
        
        console.log('📎 TicketService: Ticket data summary', {
          ticketAttachments: ticket.attachments.length,
          responseAttachments: ticket.responses.reduce((sum: number, r: any) => sum + (r.attachments?.length || 0), 0),
          crisisKeywords: ticket.detected_crisis_keywords.length,
          priorityScore: ticket.priority_score || 0,
          assignmentType: ticket.auto_assigned
        })
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
   * ENHANCED: Create new ticket with dynamic categories
   */
  async createTicket(data: EnhancedCreateTicketRequest): Promise<StandardizedApiResponse<{ ticket: any }>> {
    console.log('🎫 TicketService: Creating ticket:', data)

    try {
      // ENHANCED: Validate category_id is provided
      if (!data.category_id || isNaN(data.category_id)) {
        return {
          success: false,
          status: 422,
          message: 'Please select a valid category',
        }
      }

      const formData = new FormData()

      formData.append('subject', data.subject.trim())
      formData.append('description', data.description.trim())
      formData.append('category_id', data.category_id.toString()) // CHANGED: Use category_id

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
        console.log('✅ TicketService: Ticket created successfully', {
          crisisDetected: response.data?.ticket?.crisis_flag,
          autoAssigned: response.data?.ticket?.auto_assigned,
          priorityScore: response.data?.ticket?.priority_score
        })
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
   * ENHANCED: Add response with complete validation and error handling
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
   * ENHANCED: Download attachment with proper error handling and retry logic
   */
  async downloadAttachment(attachmentId: number, fileName?: string): Promise<void> {
    console.log('🎫 TicketService: Downloading attachment:', { attachmentId, fileName })

    // Check retry count
    const retryCount = this.downloadRetryCount.get(attachmentId) || 0
    if (retryCount >= this.maxRetries) {
      this.downloadRetryCount.delete(attachmentId)
      throw new Error(`Download failed after ${this.maxRetries} attempts`)
    }

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      const token = localStorage.getItem('auth_token')
      
      console.log('🔄 TicketService: Attempting authenticated API download')
      const downloadUrl = `${baseURL}/tickets/attachments/${attachmentId}/download`
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Accept': 'application/octet-stream, application/pdf, image/*, */*',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      })

      // Handle JSON error responses from backend
      const contentType = response.headers.get('Content-Type') || ''
      
      if (!response.ok) {
        let errorMessage = `Download failed: ${response.status} ${response.statusText}`
        
        // Check if response is JSON (error response)
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
            
            if (errorMessage.includes('permission') || errorMessage.includes('access')) {
              errorMessage = "You don't have permission to download this file"
            } else if (errorMessage.includes('not found') || response.status === 404) {
              errorMessage = "File not found or no longer available"
            } else if (errorMessage.includes('token') || response.status === 401) {
              errorMessage = "Authentication required. Please refresh the page and try again."
            } else if (response.status === 500) {
              errorMessage = "Server error occurred while downloading. Please try again."
            }
          } catch (jsonError) {
            console.warn('Failed to parse error response as JSON:', jsonError)
          }
        }
        
        throw new Error(errorMessage)
      }

      // Validate response is actually a file, not JSON error
      if (contentType.includes('application/json')) {
        try {
          const jsonResponse = await response.json()
          const errorMessage = jsonResponse.message || 'Server returned invalid response for download'
          throw new Error(errorMessage)
        } catch (jsonError) {
          throw new Error('Server returned invalid response for download')
        }
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
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }
      
      this.triggerDownload(blob, downloadFileName)
      this.downloadRetryCount.delete(attachmentId)

      console.log('✅ TicketService: Attachment downloaded successfully:', downloadFileName)

    } catch (error: any) {
      console.error(`❌ TicketService: Download attempt ${retryCount + 1} failed:`, error)
      
      // Increment retry count
      this.downloadRetryCount.set(attachmentId, retryCount + 1)
      
      // If we haven't exceeded max retries, try again with a delay
      if (retryCount < this.maxRetries - 1) {
        console.log(`🔄 TicketService: Retrying download in 2 seconds (attempt ${retryCount + 2}/${this.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        return this.downloadAttachment(attachmentId, fileName)
      }
      
      // Max retries exceeded, clean up and throw
      this.downloadRetryCount.delete(attachmentId)
      
      let userMessage = 'Failed to download attachment. '
      
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        userMessage += 'Please check your internet connection and try again.'
      } else if (error.message.includes('permission')) {
        userMessage += "You don't have permission to download this file."
      } else if (error.message.includes('not found')) {
        userMessage += "The file could not be found. It may have been deleted."
      } else if (error.message.includes('Authentication')) {
        userMessage += "Please refresh the page and try again."
      } else if (error.message.includes('empty')) {
        userMessage += "The file appears to be corrupted or empty."
      } else if (error.message.includes('Server error')) {
        userMessage += "Server error occurred. Please try again in a few moments."
      } else {
        userMessage += 'Please try again later or contact support if the problem persists.'
      }
      
      throw new Error(userMessage)
    }
  }

  /**
   * Improved download trigger with better filename handling
   */
  private triggerDownload(blob: Blob, filename: string): void {
    try {
      // Validate inputs
      if (!blob || blob.size === 0) {
        throw new Error('Invalid or empty file')
      }
      
      if (!filename || filename.trim() === '') {
        filename = `download_${Date.now()}`
      }
      
      // Clean filename
      filename = filename.replace(/[<>:"/\\|?*]/g, '_')
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.style.display = 'none'
      
      // Add to DOM temporarily for download
      document.body.appendChild(link)
      
      // Trigger download
      link.click()
      
      // Clean up immediately
      document.body.removeChild(link)
      
      // Clean up URL after delay to ensure download starts
      setTimeout(() => {
        try {
          window.URL.revokeObjectURL(downloadUrl)
        } catch (cleanupError) {
          console.warn('Failed to revoke object URL:', cleanupError)
        }
      }, 1000)
      
      console.log(`✅ TicketService: Download triggered successfully: ${filename} (${this.formatFileSize(blob.size)})`)
      
    } catch (error) {
      console.error(`❌ TicketService: Failed to trigger download:`, error)
      throw new Error(`Failed to start download: ${error}`)
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
          this.triggerDownload(blob, filename)
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
   * ENHANCED: Get ticket options with dynamic categories
   */
  async getOptions(forceRefresh = false): Promise<StandardizedApiResponse<TicketOptions>> {
    console.log('🎫 TicketService: Fetching ticket options')

    // Check cache first
    if (!forceRefresh && this.optionsCache) {
      const age = Date.now() - this.optionsCache.timestamp
      if (age < this.CACHE_DURATION) {
        console.log('✅ TicketService: Using cached options')
        return {
          success: true,
          status: 200,
          message: 'Options retrieved from cache',
          data: this.optionsCache.data
        }
      }
    }

    try {
      const response = await this.apiClient.get('/tickets/options')
      
      if (response.success && response.data) {
        // Cache the result
        this.optionsCache = {
          data: response.data,
          timestamp: Date.now()
        }
        
        console.log('✅ TicketService: Options fetched and cached')
        return response
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Options error:', error)
      
      // Return cached data if available on error
      if (this.optionsCache) {
        console.log('⚠️ TicketService: Using stale cached options due to error')
        return {
          success: true,
          status: 200,
          message: 'Options retrieved from cache (stale)',
          data: this.optionsCache.data
        }
      }
      
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch ticket options.',
      }
    }
  }

  /**
   * ENHANCED: Test crisis detection
   */
  async testCrisisDetection(text: string, categoryId?: number): Promise<StandardizedApiResponse<CrisisDetectionResult>> {
    console.log('🎫 TicketService: Testing crisis detection')

    try {
      const response = await this.apiClient.post('/admin/crisis-keywords/test-detection', {
        text,
        category_id: categoryId
      })
      
      if (response.success) {
        console.log('✅ TicketService: Crisis detection test completed')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Crisis detection test error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to test crisis detection.',
      }
    }
  }

  /**
   * ENHANCED: Get available counselors for category
   */
  async getAvailableCounselors(categoryId: number): Promise<StandardizedApiResponse<{
    counselors: any[]
    best_available: any
    total_available: number
    category: any
  }>> {
    console.log('🎫 TicketService: Fetching available counselors for category:', categoryId)

    try {
      const response = await this.apiClient.get(`/admin/counselor-specializations/category/${categoryId}/available`)
      
      if (response.success) {
        console.log('✅ TicketService: Available counselors fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ TicketService: Available counselors error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch available counselors.',
      }
    }
  }

  /**
   * UTILITY METHODS - Enhanced for dynamic categories
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
   * ENHANCED: Get category color and icon
   */
  getCategoryStyle(category: TicketCategory): { color: string; icon: string; backgroundColor: string } {
    return {
      color: category.color,
      icon: category.icon,
      backgroundColor: `${category.color}15` // Add transparency
    }
  }

  /**
   * ENHANCED: Get assignment type display
   */
  getAssignmentTypeDisplay(autoAssigned: string): { label: string; color: string; icon: string } {
    switch (autoAssigned) {
      case 'yes':
        return {
          label: 'Auto-assigned',
          color: 'bg-green-100 text-green-800',
          icon: 'Bot'
        }
      case 'manual':
        return {
          label: 'Manually assigned',
          color: 'bg-blue-100 text-blue-800',
          icon: 'User'
        }
      case 'no':
      default:
        return {
          label: 'Unassigned',
          color: 'bg-gray-100 text-gray-800',
          icon: 'UserX'
        }
    }
  }

  /**
   * ENHANCED: Calculate SLA deadline
   */
  calculateSLADeadline(createdAt: string, slaHours: number): Date {
    const created = new Date(createdAt)
    return new Date(created.getTime() + (slaHours * 60 * 60 * 1000))
  }

  /**
   * ENHANCED: Check if ticket is overdue
   */
  isTicketOverdue(createdAt: string, slaHours: number, status: string): boolean {
    if (['Resolved', 'Closed'].includes(status)) return false
    
    const deadline = this.calculateSLADeadline(createdAt, slaHours)
    return new Date() > deadline
  }

  /**
   * ENHANCED: Get time remaining for SLA
   */
  getTimeRemaining(deadline: Date): { time: string; urgent: boolean } {
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    
    if (diffMs <= 0) {
      return { time: 'Overdue', urgent: true }
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 1) {
      return { time: `${minutes}m`, urgent: true }
    } else if (hours < 24) {
      return { time: `${hours}h ${minutes}m`, urgent: hours < 2 }
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return { time: `${days}d ${remainingHours}h`, urgent: false }
    }
  }

  /**
   * ENHANCED: Detect if content contains crisis keywords (client-side check)
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
   * ENHANCED: Validate ticket creation data for dynamic categories
   */
  validateTicketData(data: EnhancedCreateTicketRequest): { valid: boolean; errors: string[] } {
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

    // ENHANCED: Validate category_id instead of category string
    if (!data.category_id) {
      errors.push('Please select a category')
    } else if (isNaN(data.category_id) || data.category_id <= 0) {
      errors.push('Invalid category selected')
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority selected')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate file uploads with detailed checks
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
   * ENHANCED: Clear cache and reset retry counts
   */
  clearCache(): void {
    console.log('🎫 TicketService: Clearing cache and retry counts')
    this.downloadRetryCount.clear()
    this.categoriesCache = null
    this.optionsCache = null
  }

  /**
   * ENHANCED: Invalidate specific cache
   */
  invalidateCache(type?: 'categories' | 'options' | 'all'): void {
    console.log('🎫 TicketService: Invalidating cache:', type || 'all')
    
    switch (type) {
      case 'categories':
        this.categoriesCache = null
        break
      case 'options':
        this.optionsCache = null
        break
      case 'all':
      default:
        this.categoriesCache = null
        this.optionsCache = null
        this.downloadRetryCount.clear()
        break
    }
  }

  /**
   * Get download retry information
   */
  getDownloadRetryInfo(attachmentId: number): { attempts: number; maxAttempts: number; canRetry: boolean } {
    const attempts = this.downloadRetryCount.get(attachmentId) || 0
    return {
      attempts,
      maxAttempts: this.maxRetries,
      canRetry: attempts < this.maxRetries
    }
  }

  /**
   * Reset download retry count for specific attachment
   */
  resetDownloadRetry(attachmentId: number): void {
    this.downloadRetryCount.delete(attachmentId)
    console.log('🔄 TicketService: Reset retry count for attachment:', attachmentId)
  }

  /**
   * ENHANCED: Get debug information for troubleshooting
   */
  getDebugInfo(): {
    apiBaseUrl: string
    hasAuthToken: boolean
    userRole: string
    browserSupport: {
      fetch: boolean
      blob: boolean
      url: boolean
      download: boolean
    }
    storageSupport: {
      localStorage: boolean
      sessionStorage: boolean
    }
    downloadRetryStatus: Array<{ attachmentId: number; attempts: number }>
    cacheStatus: {
      categoriesCache: boolean
      optionsCache: boolean
      categoriesCacheAge?: number
      optionsCacheAge?: number
    }
    environmentInfo: {
      userAgent: string
      platform: string
      language: string
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
        url: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
        download: typeof document !== 'undefined' && 'download' in document.createElement('a')
      },
      storageSupport: {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined'
      },
      downloadRetryStatus: Array.from(this.downloadRetryCount.entries()).map(([id, attempts]) => ({
        attachmentId: id,
        attempts
      })),
      cacheStatus: {
        categoriesCache: !!this.categoriesCache,
        optionsCache: !!this.optionsCache,
        categoriesCacheAge: this.categoriesCache ? Date.now() - this.categoriesCache.timestamp : undefined,
        optionsCacheAge: this.optionsCache ? Date.now() - this.optionsCache.timestamp : undefined,
      },
      environmentInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown'
      }
    }
  }

  /**
   * Get current user role from stored auth data
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
   * Check if user can perform specific actions
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
      case 'manage_tags':
        return ['counselor', 'admin'].includes(role)
      case 'bulk_operations':
        return role === 'admin'
      case 'manage_categories':
        return role === 'admin'
      case 'view_crisis_detection':
        return ['counselor', 'admin'].includes(role)
      case 'test_crisis_detection':
        return role === 'admin'
      default:
        return false
    }
  }

  /**
   * ENHANCED: Calculate ticket metrics with category support
   */
  calculateTicketMetrics(tickets: any[]): {
    totalTickets: number
    avgResolutionTime: number
    resolutionRate: number
    priorityDistribution: Record<string, number>
    categoryDistribution: Record<string, number>
    statusDistribution: Record<string, number>
    crisisTickets: number
    autoAssignedTickets: number
    overdueTickets: number
    downloadableAttachments: number
    totalConversationLength: number
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
    
    // Category distribution (now with category names)
    const categoryDistribution = tickets.reduce((acc, ticket) => {
      const categoryName = ticket.category?.name || 'Unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Status distribution
    const statusDistribution = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Count crisis, auto-assigned, and overdue tickets
    const crisisTickets = tickets.filter(t => t.crisis_flag || t.priority === 'Urgent').length
    const autoAssignedTickets = tickets.filter(t => t.auto_assigned === 'yes').length
    const overdueTickets = tickets.filter(t => {
      if (['Resolved', 'Closed'].includes(t.status)) return false
      const slaHours = t.category?.sla_response_hours || 24
      return this.isTicketOverdue(t.created_at, slaHours, t.status)
    }).length
    
    // Count downloadable attachments
    const downloadableAttachments = tickets.reduce((acc, ticket) => {
      const ticketAttachments = ticket.attachments?.length || 0
      const responseAttachments = ticket.responses?.reduce((sum: number, r: any) => 
        sum + (r.attachments?.length || 0), 0) || 0
      return acc + ticketAttachments + responseAttachments
    }, 0)
    
    // Calculate total conversation length
    const totalConversationLength = tickets.reduce((acc, ticket) => {
      const responseCount = ticket.responses?.length || 0
      return acc + responseCount + 1 // +1 for initial ticket message
    }, 0)
    
    return {
      totalTickets: total,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      priorityDistribution,
      categoryDistribution,
      statusDistribution,
      crisisTickets,
      autoAssignedTickets,
      overdueTickets,
      downloadableAttachments,
      totalConversationLength
    }
  }
}

// Export singleton instance
export const ticketService = new TicketService()
export default ticketService
