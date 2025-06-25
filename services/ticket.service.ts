// services/ticket.service.ts (Frontend Service)

import { apiClient, ApiResponse } from '@/lib/api'

export interface TicketData {
  id: number
  ticket_number: string
  user_id: number
  subject: string
  description: string
  category: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: number
  crisis_flag: boolean
  resolved_at?: string
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
}

export interface TicketResponseData {
  id: number
  ticket_id: number
  user_id: number
  message: string
  is_internal: boolean
  visibility: string
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
  search?: string
}

export interface CreateTicketRequest {
  subject: string
  description: string
  category: string
  priority?: 'Low' | 'Medium' | 'High'
  attachments?: File[]
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
  priority?: 'Low' | 'Medium' | 'High'
  crisis_flag?: boolean
}

export interface TicketStats {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  closed_tickets: number
  high_priority_tickets: number
  crisis_tickets: number
}

class TicketService {
  /**
   * Get tickets based on user role
   */
  async getTickets(params: TicketListParams = {}): Promise<ApiResponse<{
    tickets: TicketData[]
    pagination: any
    stats: TicketStats
  }>> {
    console.log("🎫 TicketService: Fetching tickets with params:", params)
    
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.category && params.category !== 'all') queryParams.append('category', params.category)
    if (params.priority && params.priority !== 'all') queryParams.append('priority', params.priority)
    if (params.search) queryParams.append('search', params.search)

    const response = await apiClient.get(`/tickets?${queryParams.toString()}`)
    console.log("🎫 TicketService: Tickets response:", response)
    
    return response
  }

  /**
   * Create new ticket
   */
  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log("🎫 TicketService: Creating ticket:", data)
    
    const formData = new FormData()
    formData.append('subject', data.subject)
    formData.append('description', data.description)
    formData.append('category', data.category)
    if (data.priority) formData.append('priority', data.priority)
    
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append('attachments[]', file)
      })
    }

    const response = await apiClient.post('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    console.log("🎫 TicketService: Create response:", response)
    
    return response
  }

  /**
   * Get single ticket details
   */
  async getTicket(ticketId: number): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log("🎫 TicketService: Fetching ticket details:", ticketId)
    
    const response = await apiClient.get(`/tickets/${ticketId}`)
    console.log("🎫 TicketService: Ticket details response:", response)
    
    return response
  }

  /**
   * Update ticket (staff only)
   */
  async updateTicket(ticketId: number, data: UpdateTicketRequest): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log("🎫 TicketService: Updating ticket:", { ticketId, data })
    
    const response = await apiClient.put(`/tickets/${ticketId}`, data)
    console.log("🎫 TicketService: Update response:", response)
    
    return response
  }

  /**
   * Add response to ticket
   */
  async addResponse(ticketId: number, data: AddResponseRequest): Promise<ApiResponse<{ response: TicketResponseData }>> {
    console.log("🎫 TicketService: Adding response:", { ticketId, data })
    
    const formData = new FormData()
    formData.append('message', data.message)
    if (data.is_internal !== undefined) formData.append('is_internal', data.is_internal.toString())
    if (data.visibility) formData.append('visibility', data.visibility)
    if (data.is_urgent !== undefined) formData.append('is_urgent', data.is_urgent.toString())
    
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append('attachments[]', file)
      })
    }

    const response = await apiClient.post(`/tickets/${ticketId}/responses`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    console.log("🎫 TicketService: Add response response:", response)
    
    return response
  }

  /**
   * Assign ticket to staff member (admin only)
   */
  async assignTicket(ticketId: number, assignedTo: number): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log("🎫 TicketService: Assigning ticket:", { ticketId, assignedTo })
    
    const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
      assigned_to: assignedTo
    })
    console.log("🎫 TicketService: Assign response:", response)
    
    return response
  }

  /**
   * Download attachment
   */
  async downloadAttachment(attachmentId: number): Promise<Blob> {
    console.log("🎫 TicketService: Downloading attachment:", attachmentId)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/tickets/attachments/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to download file')
    }
    
    return response.blob()
  }

  /**
   * Get ticket options
   */
  async getOptions(): Promise<ApiResponse<{
    categories: Record<string, string>
    priorities: Record<string, string>
    statuses: Record<string, string>
  }>> {
    console.log("🎫 TicketService: Fetching options")
    
    const response = await apiClient.get('/tickets/options')
    console.log("🎫 TicketService: Options response:", response)
    
    return response
  }

  /**
   * Helper method to download file from blob
   */
  downloadFileFromBlob(blob: Blob, fileName: string): void {
    console.log("🎫 TicketService: Downloading file from blob:", fileName)
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    console.log("✅ TicketService: File download initiated")
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
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
}

export const ticketService = new TicketService()