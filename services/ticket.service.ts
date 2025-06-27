// services/ticket.service.ts (FIXED - Better FormData handling)

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
  async getTickets(params: TicketListParams = {}): Promise<
    ApiResponse<{
      tickets: TicketData[];
      pagination: any;
      stats: TicketStats;
    }>
  > {
    console.log('🎫 TicketService: Fetching tickets with params:', params);

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.category && params.category !== 'all')
      queryParams.append('category', params.category);
    if (params.priority && params.priority !== 'all')
      queryParams.append('priority', params.priority);
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/tickets?${queryParams.toString()}`);
    console.log('🎫 TicketService: Tickets response:', response);

    return response;
  }

  /**
   * Create new ticket with PROPER FormData handling
   */
  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Creating ticket:', data);

    try {
      // Validate data before sending
      if (!data.subject?.trim()) {
        return {
          success: false,
          message: 'Subject is required',
        };
      }

      if (!data.description?.trim() || data.description.length < 20) {
        return {
          success: false,
          message: 'Description must be at least 20 characters long',
        };
      }

      if (!data.category) {
        return {
          success: false,
          message: 'Category is required',
        };
      }

      // Create FormData properly
      const formData = new FormData();

      // Add text fields
      formData.append('subject', data.subject.trim());
      formData.append('description', data.description.trim());
      formData.append('category', data.category);

      if (data.priority) {
        formData.append('priority', data.priority);
      }

      // Add files with CORRECT array notation for Laravel
      if (data.attachments && data.attachments.length > 0) {
        // Validate files first
        const validation = this.validateFiles(data.attachments, 5);
        if (!validation.valid) {
          return {
            success: false,
            message: validation.errors.join(', '),
          };
        }

        data.attachments.forEach((file, index) => {
          // Use Laravel's expected array notation
          formData.append('attachments[]', file, file.name);
        });
      }

      console.log('🎫 TicketService: FormData keys:', Array.from(formData.keys()));
      console.log('🎫 TicketService: FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Use apiClient.post which handles FormData properly
      const response = await apiClient.post('/tickets', formData);
      console.log('🎫 TicketService: Create response:', response);

      return response;
    } catch (error) {
      console.error('🎫 TicketService: Create ticket error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while creating the ticket.',
      };
    }
  }

  /**
   * Get single ticket details
   */
  async getTicket(ticketId: number): Promise<TicketData | null> {
    console.log('🎫 TicketService: Fetching ticket details:', ticketId);

    try {
      const response = await apiClient.get(`/tickets/${ticketId}`);
      
      if (response.success && response.data) {
        console.log('🎫 TicketService: Ticket details fetched successfully');
        return response.data.ticket;
      } else {
        console.error('🎫 TicketService: Failed to fetch ticket details:', response.message);
        return null;
      }
    } catch (error) {
      console.error('🎫 TicketService: Error fetching ticket details:', error);
      return null;
    }
  }

  /**
   * Update ticket (staff only)
   */
  async updateTicket(
    ticketId: number,
    data: UpdateTicketRequest
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Updating ticket:', { ticketId, data });

    const response = await apiClient.patch(`/tickets/${ticketId}`, data);
    console.log('🎫 TicketService: Update response:', response);

    return response;
  }

  /**
   * Add response to ticket with PROPER FormData handling
   */
  async addResponse(
    ticketId: number,
    data: AddResponseRequest
  ): Promise<TicketResponseData | null> {
    console.log('🎫 TicketService: Adding response:', { ticketId, data });

    try {
      // Validate message
      if (!data.message?.trim() || data.message.length < 5) {
        throw new Error('Response message must be at least 5 characters long');
      }

      // Create FormData properly
      const formData = new FormData();

      // Add text fields
      formData.append('message', data.message.trim());

      if (data.is_internal !== undefined) {
        formData.append('is_internal', data.is_internal.toString());
      }

      if (data.visibility) {
        formData.append('visibility', data.visibility);
      }

      if (data.is_urgent !== undefined) {
        formData.append('is_urgent', data.is_urgent.toString());
      }

      // Add files with CORRECT array notation
      if (data.attachments && data.attachments.length > 0) {
        // Validate files first
        const validation = this.validateFiles(data.attachments, 3);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        data.attachments.forEach((file) => {
          formData.append('attachments[]', file, file.name);
        });
      }

      console.log('🎫 TicketService: Response FormData keys:', Array.from(formData.keys()));

      // Use apiClient.post for responses
      const response = await apiClient.post(`/tickets/${ticketId}/responses`, formData);
      
      if (response.success && response.data) {
        console.log('🎫 TicketService: Response added successfully');
        return response.data.response;
      } else {
        console.error('🎫 TicketService: Failed to add response:', response.message);
        throw new Error(response.message || 'Failed to add response');
      }
    } catch (error) {
      console.error('🎫 TicketService: Add response error:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to staff member (admin only)
   */
  async assignTicket(
    ticketId: number,
    assignedTo: number
  ): Promise<ApiResponse<{ ticket: TicketData }>> {
    console.log('🎫 TicketService: Assigning ticket:', { ticketId, assignedTo });

    const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
      assigned_to: assignedTo,
    });
    console.log('🎫 TicketService: Assign response:', response);

    return response;
  }

  /**
   * Download attachment with proper error handling
   */
  async downloadAttachment(attachmentId: number, fileName: string): Promise<void> {
    console.log('🎫 TicketService: Downloading attachment:', { attachmentId, fileName });

    try {
      const blob = await apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`);
      this.downloadFileFromBlob(blob, fileName);
      console.log('✅ TicketService: File download initiated successfully');
    } catch (error) {
      console.error('💥 TicketService: Download failed:', error);
      throw new Error('Failed to download attachment. Please try again.');
    }
  }

  /**
   * Get ticket options
   */
  async getOptions(): Promise<
    ApiResponse<{
      categories: Record<string, string>;
      priorities: Record<string, string>;
      statuses: Record<string, string>;
    }>
  > {
    console.log('🎫 TicketService: Fetching options');

    const response = await apiClient.get('/tickets/options');
    console.log('🎫 TicketService: Options response:', response);

    return response;
  }

  /**
   * Helper method to download file from blob
   */
  downloadFileFromBlob(blob: Blob, fileName: string): void {
    console.log('🎫 TicketService: Downloading file from blob:', fileName);

    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      console.log('✅ TicketService: File download initiated');
    } catch (error) {
      console.error('❌ TicketService: File download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file is an image
   */
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  /**
   * Get status color class for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get priority color class for UI
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds 10MB limit`,
      };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[], maxCount: number = 5): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > maxCount) {
      errors.push(`Maximum ${maxCount} files allowed`);
      return { valid: false, errors };
    }

    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid && validation.error) {
        errors.push(validation.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create ticket with retry mechanism
   */
  async createTicketWithRetry(data: CreateTicketRequest, maxRetries: number = 2): Promise<ApiResponse<{ ticket: TicketData }>> {
    return apiClient.retryRequest(() => this.createTicket(data), maxRetries);
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
          const response = await this.addResponse(ticketId, data);
          return {
            success: true,
            message: 'Response added successfully',
            data: response
          };
        }, 
        maxRetries
      );
      
      return result.success ? (result.data ?? null) : null;
    } catch (error) {
      console.error('🎫 TicketService: Add response with retry failed:', error);
      return null;
    }
  }
}

export const ticketService = new TicketService();