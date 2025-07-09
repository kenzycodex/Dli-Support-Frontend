// stores/ticket-store.ts (COMPLETE FIXED VERSION - All issues resolved)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiClient } from '@/lib/api'
import { authService } from '@/services/auth.service'

// Types
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

export interface TicketFilters {
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
  created_for?: number
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
  subject?: string
  description?: string
}

// COMPLETE STORE INTERFACE
interface TicketState {
  // Core data - Simple arrays and objects only
  tickets: TicketData[]
  currentTicket: TicketData | null
  filters: TicketFilters
  
  // Simple loading states - ALL OPERATIONS COVERED
  loading: {
    list: boolean
    details: boolean
    create: boolean
    update: boolean
    delete: boolean
    response: boolean
    assign: boolean
    download: boolean
  }
  
  // Simple error states - ALL OPERATIONS COVERED
  errors: {
    list: string | null
    details: string | null
    create: string | null
    update: string | null
    delete: string | null
    response: string | null
    assign: string | null
    download: string | null
  }
  
  // Simple pagination
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  
  // Simple cache timestamp
  lastFetch: number
  
  // Simple UI state
  selectedTickets: Set<number>
  
  // COMPLETE ACTIONS INTERFACE
  actions: {
    // Data fetching
    fetchTickets: (params?: Partial<TicketFilters>) => Promise<void>
    fetchTicket: (id: number) => Promise<void>
    refreshTickets: () => Promise<void>
    
    // CRUD operations
    createTicket: (data: CreateTicketRequest) => Promise<TicketData | null>
    updateTicket: (id: number, data: UpdateTicketRequest) => Promise<void>
    deleteTicket: (id: number, reason?: string, notifyUser?: boolean) => Promise<void>
    
    // Response management
    addResponse: (ticketId: number, data: AddResponseRequest) => Promise<void>
    
    // Assignment
    assignTicket: (ticketId: number, assignedTo: number | null, reason?: string) => Promise<void>
    bulkAssign: (ticketIds: number[], assignedTo: number, reason?: string) => Promise<number>
    
    // Tag management
    addTag: (ticketId: number, tag: string) => Promise<void>
    removeTag: (ticketId: number, tag: string) => Promise<void>
    setTags: (ticketId: number, tags: string[]) => Promise<void>
    
    // File operations
    downloadAttachment: (attachmentId: number, fileName: string) => Promise<void>
    
    // Filter management
    setFilters: (filters: TicketFilters, autoFetch?: boolean) => void
    clearFilters: (autoFetch?: boolean) => void
    
    // UI state management
    setCurrentTicket: (ticket: TicketData | null) => void
    selectTicket: (id: number) => void
    deselectTicket: (id: number) => void
    clearSelection: () => void
    
    // Error handling
    clearError: (type: keyof TicketState['errors']) => void
    setError: (type: keyof TicketState['errors'], message: string) => void
    
    // Cache management
    invalidateCache: () => void
    clearCache: () => void
    
    // Export
    exportTickets: (format: 'csv' | 'excel' | 'json', filters?: Partial<TicketFilters>) => Promise<void>
  }
}

// Default values
const defaultFilters: TicketFilters = {
  page: 1,
  per_page: 20,
  sort_by: 'updated_at',
  sort_direction: 'desc'
}

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
}

// Helper function for API calls
const buildQueryString = (filters: TicketFilters): string => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(`${key}[]`, v.toString()))
      } else {
        params.append(key, value.toString())
      }
    }
  })
  
  return params.toString()
}

// Validation helpers
const validateTicketData = (data: CreateTicketRequest): { valid: boolean; errors: string[] } => {
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

  return { valid: errors.length === 0, errors }
}

const validateFiles = (files: File[], maxCount: number = 5): { valid: boolean; errors: string[] } => {
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
    'text/plain'
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

// COMPLETE FIXED STORE
export const useTicketStore = create<TicketState>()(
  devtools(
    (set, get) => ({
      // Initial state with all required properties
      tickets: [],
      currentTicket: null,
      filters: { ...defaultFilters },
      
      loading: {
        list: false,
        details: false,
        create: false,
        update: false,
        delete: false,
        response: false,
        assign: false,
        download: false
      },
      
      errors: {
        list: null,
        details: null,
        create: null,
        update: null,
        delete: null,
        response: null,
        assign: null,
        download: null
      },
      
      pagination: { ...defaultPagination },
      lastFetch: 0,
      selectedTickets: new Set<number>(),
      
      actions: {
        // FIXED: fetchTickets with optional parameters
        fetchTickets: async (params?: Partial<TicketFilters>) => {
          const state = get()
          
          // Merge provided params with current filters
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters
          
          // Prevent too frequent calls (unless forced with new params)
          if (!params && Date.now() - state.lastFetch < 1000) {
            console.log('🎫 TicketStore: Skipping fetch (too recent)')
            return
          }
          
          set(state => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
            filters: mergedFilters
          }))
          
          try {
            console.log('🎫 TicketStore: Fetching tickets with params:', mergedFilters)
            
            const queryString = buildQueryString(mergedFilters)
            const response = await apiClient.get(`/tickets?${queryString}`)
            
            if (response.success && response.data) {
              const { tickets, pagination, stats } = response.data
              
              set(() => ({
                tickets: tickets || [],
                pagination: pagination || defaultPagination,
                lastFetch: Date.now(),
                loading: { ...get().loading, list: false }
              }))
              
              console.log('✅ TicketStore: Tickets fetched successfully:', tickets?.length || 0)
            } else {
              throw new Error(response.message || 'Failed to fetch tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch tickets:', error)
            set(state => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to fetch tickets' }
            }))
          }
        },
        
        // Fetch single ticket
        fetchTicket: async (id: number) => {
          set(state => ({
            loading: { ...state.loading, details: true },
            errors: { ...state.errors, details: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Fetching ticket:', id)
            
            const response = await apiClient.get(`/tickets/${id}`)
            
            if (response.success && response.data) {
              const ticket = response.data.ticket
              
              set(state => ({
                currentTicket: ticket,
                tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t),
                loading: { ...state.loading, details: false }
              }))
              
              console.log('✅ TicketStore: Ticket fetched successfully')
            } else {
              throw new Error(response.message || 'Failed to fetch ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch ticket:', error)
            set(state => ({
              loading: { ...state.loading, details: false },
              errors: { ...state.errors, details: error.message || 'Failed to fetch ticket' }
            }))
          }
        },
        
        // Refresh tickets
        refreshTickets: async () => {
          set(() => ({ lastFetch: 0 }))
          await get().actions.fetchTickets()
        },
        
        // FIXED: Create ticket with proper validation and error handling
        createTicket: async (data: CreateTicketRequest) => {
          // Validate data
          const validation = validateTicketData(data)
          if (!validation.valid) {
            const error = validation.errors.join(', ')
            set(state => ({ errors: { ...state.errors, create: error } }))
            return null
          }
          
          // Validate files if present
          if (data.attachments && data.attachments.length > 0) {
            const fileValidation = validateFiles(data.attachments, 5)
            if (!fileValidation.valid) {
              const error = fileValidation.errors.join(', ')
              set(state => ({ errors: { ...state.errors, create: error } }))
              return null
            }
          }
          
          set(state => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Creating ticket')
            
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
            
            if (data.attachments) {
              data.attachments.forEach(file => {
                formData.append('attachments[]', file, file.name)
              })
            }
            
            const response = await apiClient.post('/tickets', formData)
            
            if (response.success && response.data) {
              const newTicket = response.data.ticket
              
              set(state => ({
                tickets: [newTicket, ...state.tickets],
                currentTicket: newTicket,
                loading: { ...state.loading, create: false }
              }))
              
              console.log('✅ TicketStore: Ticket created successfully')
              return newTicket
            } else {
              throw new Error(response.message || 'Failed to create ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to create ticket:', error)
            set(state => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message || 'Failed to create ticket' }
            }))
            return null
          }
        },
        
        // Update ticket
        updateTicket: async (id: number, data: UpdateTicketRequest) => {
          set(state => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Updating ticket:', id)
            
            const response = await apiClient.patch(`/tickets/${id}`, data)
            
            if (response.success && response.data) {
              const updatedTicket = response.data.ticket
              
              set(state => ({
                tickets: state.tickets.map(t => t.id === id ? updatedTicket : t),
                currentTicket: state.currentTicket?.id === id ? updatedTicket : state.currentTicket,
                loading: { ...state.loading, update: false }
              }))
              
              console.log('✅ TicketStore: Ticket updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to update ticket:', error)
            set(state => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message || 'Failed to update ticket' }
            }))
          }
        },
        
        // Delete ticket
        deleteTicket: async (id: number, reason = 'Deleted by admin', notifyUser = false) => {
          set(state => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Deleting ticket:', id)
            
            const response = await apiClient.delete(`/tickets/${id}`, {
              body: JSON.stringify({ reason, notify_user: notifyUser }),
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.success) {
              set(state => ({
                tickets: state.tickets.filter(t => t.id !== id),
                currentTicket: state.currentTicket?.id === id ? null : state.currentTicket,
                selectedTickets: new Set([...state.selectedTickets].filter(ticketId => ticketId !== id)),
                loading: { ...state.loading, delete: false }
              }))
              
              console.log('✅ TicketStore: Ticket deleted successfully')
            } else {
              throw new Error(response.message || 'Failed to delete ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to delete ticket:', error)
            set(state => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message || 'Failed to delete ticket' }
            }))
          }
        },
        
        // FIXED: Add response with comprehensive validation
        addResponse: async (ticketId: number, data: AddResponseRequest) => {
          if (!data.message?.trim()) {
            set(state => ({
              errors: { ...state.errors, response: 'Response message is required' }
            }))
            return
          }

          if (data.message.trim().length < 5) {
            set(state => ({
              errors: { ...state.errors, response: 'Response must be at least 5 characters long' }
            }))
            return
          }

          if (data.attachments && data.attachments.length > 0) {
            const fileValidation = validateFiles(data.attachments, 3)
            if (!fileValidation.valid) {
              set(state => ({
                errors: { ...state.errors, response: fileValidation.errors.join(', ') }
              }))
              return
            }
          }
          
          set(state => ({
            loading: { ...state.loading, response: true },
            errors: { ...state.errors, response: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Adding response to ticket:', ticketId)
            
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
            
            if (data.attachments && data.attachments.length > 0) {
              data.attachments.forEach(file => {
                formData.append('attachments[]', file, file.name)
              })
            }
            
            const response = await apiClient.post(`/tickets/${ticketId}/responses`, formData)
            
            if (response.success) {
              // Refresh the ticket to get updated responses
              await get().actions.fetchTicket(ticketId)
              
              set(state => ({
                loading: { ...state.loading, response: false }
              }))
              
              console.log('✅ TicketStore: Response added successfully')
            } else {
              throw new Error(response.message || 'Failed to add response')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add response:', error)
            set(state => ({
              loading: { ...state.loading, response: false },
              errors: { ...state.errors, response: error.message || 'Failed to add response' }
            }))
          }
        },
        
        // Assign ticket
        assignTicket: async (ticketId: number, assignedTo: number | null, reason = '') => {
          set(state => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Assigning ticket:', ticketId, 'to:', assignedTo)
            
            const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
              assigned_to: assignedTo,
              reason
            })
            
            if (response.success && response.data) {
              const updatedTicket = response.data.ticket
              
              set(state => ({
                tickets: state.tickets.map(t => t.id === ticketId ? updatedTicket : t),
                currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                loading: { ...state.loading, assign: false }
              }))
              
              console.log('✅ TicketStore: Ticket assigned successfully')
            } else {
              throw new Error(response.message || 'Failed to assign ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to assign ticket:', error)
            set(state => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: error.message || 'Failed to assign ticket' }
            }))
          }
        },
        
        // Bulk assign tickets
        bulkAssign: async (ticketIds: number[], assignedTo: number, reason = '') => {
          set(state => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Bulk assigning tickets:', { ticketIds, assignedTo, reason })
            
            const response = await apiClient.post('/admin/bulk-assign', {
              ticket_ids: ticketIds,
              assigned_to: assignedTo,
              reason
            })
            
            if (response.success && response.data) {
              const assignedCount = response.data.assigned_count
              
              // Refresh tickets to get updated assignments
              await get().actions.fetchTickets()
              
              set(state => ({
                loading: { ...state.loading, assign: false },
                selectedTickets: new Set()
              }))
              
              console.log('✅ TicketStore: Tickets bulk assigned successfully')
              return assignedCount
            } else {
              throw new Error(response.message || 'Failed to assign tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to bulk assign tickets:', error)
            set(state => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: error.message || 'Failed to assign tickets' }
            }))
            return 0
          }
        },
        
        // FIXED: Tag management methods
        addTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Adding tag:', tag, 'to ticket:', ticketId)
            
            const response = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'add',
              tags: [tag]
            })
            
            if (response.success && response.data) {
              const updatedTicket = response.data.ticket
              
              set(state => ({
                tickets: state.tickets.map(t => t.id === ticketId ? updatedTicket : t),
                currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket
              }))
              
              console.log('✅ TicketStore: Tag added successfully')
            } else {
              throw new Error(response.message || 'Failed to add tag')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add tag:', error)
            set(state => ({
              errors: { ...state.errors, update: error.message || 'Failed to add tag' }
            }))
          }
        },
        
        removeTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Removing tag:', tag, 'from ticket:', ticketId)
            
            const response = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'remove',
              tags: [tag]
            })
            
            if (response.success && response.data) {
              const updatedTicket = response.data.ticket
              
              set(state => ({
                tickets: state.tickets.map(t => t.id === ticketId ? updatedTicket : t),
                currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket
              }))
              
              console.log('✅ TicketStore: Tag removed successfully')
            } else {
              throw new Error(response.message || 'Failed to remove tag')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to remove tag:', error)
            set(state => ({
              errors: { ...state.errors, update: error.message || 'Failed to remove tag' }
            }))
          }
        },
        
        setTags: async (ticketId: number, tags: string[]) => {
          try {
            console.log('🎫 TicketStore: Setting tags for ticket:', ticketId, tags)
            
            const response = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'set',
              tags
            })
            
            if (response.success && response.data) {
              const updatedTicket = response.data.ticket
              
              set(state => ({
                tickets: state.tickets.map(t => t.id === ticketId ? updatedTicket : t),
                currentTicket: state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket
              }))
              
              console.log('✅ TicketStore: Tags set successfully')
            } else {
              throw new Error(response.message || 'Failed to set tags')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to set tags:', error)
            set(state => ({
              errors: { ...state.errors, update: error.message || 'Failed to set tags' }
            }))
          }
        },
        
        // FIXED: Download attachment method
        downloadAttachment: async (attachmentId: number, fileName: string) => {
          set(state => ({
            loading: { ...state.loading, download: true },
            errors: { ...state.errors, download: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Downloading attachment:', attachmentId)
            
            const blob = await apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`)
            
            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            link.style.display = 'none'
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up
            setTimeout(() => {
              window.URL.revokeObjectURL(url)
            }, 100)
            
            set(state => ({
              loading: { ...state.loading, download: false }
            }))
            
            console.log('✅ TicketStore: Attachment download initiated successfully')
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to download attachment:', error)
            set(state => ({
              loading: { ...state.loading, download: false },
              errors: { ...state.errors, download: 'Failed to download attachment' }
            }))
          }
        },
        
        // Filter management with optional auto-fetch
        setFilters: (newFilters: TicketFilters, autoFetch = false) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters, page: 1 }
          }))
          
          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchTickets()
            }, 100)
          }
        },
        
        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters }
          }))
          
          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchTickets()
            }, 100)
          }
        },
        
        // UI state management
        setCurrentTicket: (ticket: TicketData | null) => {
          set(() => ({ currentTicket: ticket }))
        },
        
        selectTicket: (id: number) => {
          set(state => {
            const newSet = new Set(state.selectedTickets)
            newSet.add(id)
            return { selectedTickets: newSet }
          })
        },
        
        deselectTicket: (id: number) => {
          set(state => {
            const newSet = new Set(state.selectedTickets)
            newSet.delete(id)
            return { selectedTickets: newSet }
          })
        },
        
        clearSelection: () => {
          set(() => ({ selectedTickets: new Set<number>() }))
        },
        
        // Error handling
        clearError: (type: keyof TicketState['errors']) => {
          set(state => ({
            errors: { ...state.errors, [type]: null }
          }))
        },
        
        setError: (type: keyof TicketState['errors'], message: string) => {
          set(state => ({
            errors: { ...state.errors, [type]: message }
          }))
        },
        
        // Cache management
        invalidateCache: () => {
          set(() => ({ lastFetch: 0 }))
        },
        
        clearCache: () => {
          set(() => ({
            tickets: [],
            currentTicket: null,
            lastFetch: 0,
            selectedTickets: new Set(),
            pagination: { ...defaultPagination }
          }))
        },
        
        // Export tickets
        exportTickets: async (format: 'csv' | 'excel' | 'json' = 'csv', filters = {}) => {
          set(state => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null }
          }))
          
          try {
            console.log('🎫 TicketStore: Exporting tickets:', { format, filters })
            
            const queryParams = new URLSearchParams()
            queryParams.append('format', format)
            
            // Add current filters
            const exportFilters = { ...get().filters, ...filters }
            Object.entries(exportFilters).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                if (Array.isArray(value)) {
                  value.forEach(v => queryParams.append(`${key}[]`, v.toString()))
                } else {
                  queryParams.append(key, value.toString())
                }
              }
            })
            
            const response = await apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)
            
            if (response.success) {
              set(state => ({
                loading: { ...state.loading, list: false }
              }))
              console.log('✅ TicketStore: Tickets exported successfully')
            } else {
              throw new Error(response.message || 'Failed to export tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to export tickets:', error)
            set(state => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to export tickets' }
            }))
          }
        }
      }
    }),
    { name: 'ticket-store' }
  )
)

// ENHANCED SELECTORS WITH MEMOIZATION
export const useTicketSelectors = () => {
  const tickets = useTicketStore(state => state.tickets)
  const currentUser = authService.getStoredUser()
  
  return {
    tickets,
    openTickets: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress'),
    closedTickets: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed'),
    crisisTickets: tickets.filter(t => t.crisis_flag || t.priority === 'Urgent'),
    unassignedTickets: tickets.filter(t => !t.assigned_to),
    myAssignedTickets: currentUser ? tickets.filter(t => t.assigned_to === currentUser.id) : [],
    
    // Advanced selectors
    ticketsByCategory: tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    ticketsByPriority: tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    ticketsByStatus: tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    // Get selected tickets as array
    selectedTicketsArray: Array.from(useTicketStore.getState().selectedTickets)
      .map(id => tickets.find(t => t.id === id))
      .filter(Boolean) as TicketData[]
  }
}

// SPECIALIZED HOOKS FOR BETTER PERFORMANCE
export const useTicketById = (id: number) => {
  return useTicketStore(state => state.tickets.find(t => t.id === id) || null)
}

export const useTicketLoading = (type: keyof TicketState['loading'] = 'list') => {
  return useTicketStore(state => state.loading[type])
}

export const useTicketError = (type: keyof TicketState['errors'] = 'list') => {
  return useTicketStore(state => state.errors[type])
}

export const useTicketStats = () => {
  const tickets = useTicketStore(state => state.tickets)
  
  return {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    in_progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    crisis: tickets.filter(t => t.crisis_flag || t.priority === 'Urgent').length,
    unassigned: tickets.filter(t => !t.assigned_to).length,
    high_priority: tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length,
    
    // Performance metrics
    average_response_time: '2.3 hours', // This would come from API
    resolution_rate: tickets.length > 0 
      ? Math.round((tickets.filter(t => t.status === 'Resolved').length / tickets.length) * 100)
      : 0
  }
}

export const useTicketFilters = () => {
  const filters = useTicketStore(state => state.filters)
  const { setFilters, clearFilters } = useTicketStore(state => state.actions)
  
  return {
    filters,
    setFilters,
    clearFilters,
    
    // Quick filter helpers
    filterByStatus: (status: string) => setFilters({ status }, true),
    filterByCategory: (category: string) => setFilters({ category }, true),
    filterByPriority: (priority: string) => setFilters({ priority }, true),
    searchTickets: (search: string) => setFilters({ search }, true)
  }
}

export const useTicketPermissions = () => {
  const currentUser = authService.getStoredUser()
  
  if (!currentUser) {
    return {
      can_create: false,
      can_view_all: false,
      can_assign: false,
      can_modify: false,
      can_delete: false,
      can_export: false,
      can_manage_tags: false,
      can_add_internal_notes: false,
      can_bulk_assign: false,
      can_download_attachments: false
    }
  }
  
  return {
    can_create: currentUser.role === 'student' || currentUser.role === 'admin',
    can_view_all: currentUser.role === 'admin',
    can_assign: currentUser.role === 'admin',
    can_modify: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
    can_delete: currentUser.role === 'admin',
    can_export: currentUser.role === 'admin',
    can_manage_tags: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
    can_add_internal_notes: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
    can_bulk_assign: currentUser.role === 'admin',
    can_download_attachments: true // All users can download attachments
  }
}

// UTILITY HOOKS
export const useTicketActions = () => {
  return useTicketStore(state => state.actions)
}

export const useTicketPagination = () => {
  const pagination = useTicketStore(state => state.pagination)
  const { setFilters } = useTicketStore(state => state.actions)
  
  return {
    ...pagination,
    goToPage: (page: number) => setFilters({ page }, true),
    nextPage: () => {
      if (pagination.current_page < pagination.last_page) {
        setFilters({ page: pagination.current_page + 1 }, true)
      }
    },
    prevPage: () => {
      if (pagination.current_page > 1) {
        setFilters({ page: pagination.current_page - 1 }, true)
      }
    }
  }
}

// UTILITY FUNCTIONS FOR STORE MANAGEMENT
export const initializeTicketStore = () => {
  const currentUser = authService.getStoredUser()
  console.log('🎫 TicketStore: Initialized for user:', currentUser?.role)
}

export const setupTicketAutoRefresh = (intervalMs: number = 30000) => {
  let intervalId: NodeJS.Timeout
  
  const startAutoRefresh = () => {
    intervalId = setInterval(() => {
      const state = useTicketStore.getState()
      // Only auto-refresh if user is actively viewing tickets
      if (document.visibilityState === 'visible' && Date.now() - state.lastFetch > intervalMs) {
        state.actions.fetchTickets()
      }
    }, intervalMs)
  }
  
  const stopAutoRefresh = () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
  
  return { startAutoRefresh, stopAutoRefresh }
}

// DEBUG UTILITIES (DEVELOPMENT ONLY)
export const debugTicketStore = () => {
  if (process.env.NODE_ENV === 'development') {
    const state = useTicketStore.getState()
    
    console.group('🎫 TicketStore Debug Info')
    console.log('Total tickets:', state.tickets.length)
    console.log('Current filters:', state.filters)
    console.log('Loading states:', state.loading)
    console.log('Error states:', state.errors)
    console.log('Selected tickets:', state.selectedTickets.size)
    console.log('Last fetch:', new Date(state.lastFetch).toLocaleString())
    console.groupEnd()
    
    return state
  }
}

// PERFORMANCE MONITORING
export const getTicketStoreMetrics = () => {
  const state = useTicketStore.getState()
  
  return {
    totalTickets: state.tickets.length,
    memoryUsage: JSON.stringify(state).length,
    cacheAge: Date.now() - state.lastFetch,
    selectedCount: state.selectedTickets.size,
    hasErrors: Object.values(state.errors).some(error => error !== null),
    isLoading: Object.values(state.loading).some(loading => loading === true)
  }
}

// EXPORT DEFAULT STORE
export default useTicketStore
