// stores/ticket-store.ts (Fixed TypeScript issues)
import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
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

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  high_priority: number
  urgent: number
  crisis: number
  unassigned: number
}

export interface TicketFilters {
  page: number
  per_page: number
  status?: string
  category?: string
  priority?: string
  assigned?: string
  search?: string
  sort_by: string
  sort_direction: 'asc' | 'desc'
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

interface TicketState {
  // Data
  tickets: Record<number, TicketData>
  ticketsList: number[]
  currentTicket: TicketData | null
  stats: TicketStats
  filters: TicketFilters
  
  // UI State
  loading: {
    list: boolean
    create: boolean
    update: boolean
    response: boolean
    assign: boolean
    delete: boolean
    [key: string]: boolean
  }
  errors: {
    list?: string
    create?: string
    update?: string
    response?: string
    assign?: string
    delete?: string
    [key: string]: string | undefined
  }
  
  // Pagination
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  
  // Permissions
  permissions: {
    can_create: boolean
    can_view_all: boolean
    can_assign: boolean
    can_modify: boolean
    can_delete: boolean
    can_add_internal_notes: boolean
    can_manage_tags: boolean
    can_export: boolean
  }
  
  // Cache
  cache: {
    lastFetch: Date | null
    lastUpdate: Date | null
    invalidateAt: Date | null
  }
  
  // UI Helpers
  selectedTickets: Set<number>
  expandedTickets: Set<number>
  searchQuery: string
  searchTimeoutId?: NodeJS.Timeout // Fixed: Add optional property
  
  // Actions
  actions: {
    // Data fetching
    fetchTickets: (params?: Partial<TicketFilters>) => Promise<void>
    fetchTicket: (id: number) => Promise<TicketData | null>
    refreshTickets: () => Promise<void>
    
    // CRUD operations
    createTicket: (data: CreateTicketRequest) => Promise<TicketData | null>
    updateTicket: (id: number, data: UpdateTicketRequest) => Promise<TicketData | null>
    deleteTicket: (id: number, reason: string, notifyUser?: boolean) => Promise<boolean>
    
    // Response management
    addResponse: (ticketId: number, data: AddResponseRequest) => Promise<TicketResponseData | null>
    
    // Assignment
    assignTicket: (ticketId: number, assignedTo: number | null, reason?: string) => Promise<TicketData | null>
    bulkAssign: (ticketIds: number[], assignedTo: number, reason?: string) => Promise<number>
    
    // Tag management
    addTag: (ticketId: number, tag: string) => Promise<void>
    removeTag: (ticketId: number, tag: string) => Promise<void>
    setTags: (ticketId: number, tags: string[]) => Promise<void>
    manageTags: (ticketId: number, action: 'add' | 'remove' | 'set', tags: string[]) => Promise<void> // Fixed: Add manageTags to interface
    
    // Filters and search
    setFilters: (filters: Partial<TicketFilters>) => void
    setSearch: (query: string) => void
    clearFilters: () => void
    
    // UI state
    selectTicket: (id: number) => void
    deselectTicket: (id: number) => void
    selectAllTickets: () => void
    clearSelection: () => void
    setCurrentTicket: (ticket: TicketData | null) => void
    expandTicket: (id: number) => void
    collapseTicket: (id: number) => void
    
    // Error handling
    clearError: (type?: string) => void
    setError: (type: string, message: string) => void
    
    // Cache management
    invalidateCache: () => void
    clearCache: () => void
    
    // Attachments
    downloadAttachment: (attachmentId: number, fileName: string) => Promise<void>
    
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

const defaultStats: TicketStats = {
  total: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
  high_priority: 0,
  urgent: 0,
  crisis: 0,
  unassigned: 0
}

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
}

// Helper functions
const buildQueryParams = (filters: Partial<TicketFilters>): string => {
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

// Create the store
export const useTicketStore = create<TicketState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          tickets: {},
          ticketsList: [],
          currentTicket: null,
          stats: defaultStats,
          filters: defaultFilters,
          
          loading: {
            list: false,
            create: false,
            update: false,
            response: false,
            assign: false,
            delete: false
          },
          
          errors: {},
          
          pagination: defaultPagination,
          
          permissions: {
            can_create: false,
            can_view_all: false,
            can_assign: false,
            can_modify: false,
            can_delete: false,
            can_add_internal_notes: false,
            can_manage_tags: false,
            can_export: false
          },
          
          cache: {
            lastFetch: null,
            lastUpdate: null,
            invalidateAt: null
          },
          
          selectedTickets: new Set(),
          expandedTickets: new Set(),
          searchQuery: '',
          
          actions: {
            // Fetch tickets with role-based filtering
            fetchTickets: async (params = {}) => {
              const state = get()
              const mergedFilters = { ...state.filters, ...params }
              
              set(draft => {
                draft.loading.list = true
                draft.errors.list = undefined
                draft.filters = mergedFilters
              })
              
              try {
                console.log('🎫 TicketStore: Fetching tickets with params:', mergedFilters)
                
                const queryString = buildQueryParams(mergedFilters)
                const response = await apiClient.get(`/tickets?${queryString}`)
                
                if (response.success && response.data) {
                  const { tickets, pagination, stats, user_role } = response.data
                  
                  set(draft => {
                    // Update tickets dictionary
                    tickets.forEach((ticket: TicketData) => {
                      draft.tickets[ticket.id] = ticket
                    })
                    
                    // Update tickets list (ordered)
                    draft.ticketsList = tickets.map((t: TicketData) => t.id)
                    
                    // Update pagination and stats
                    draft.pagination = pagination
                    draft.stats = stats
                    
                    // Update cache
                    draft.cache.lastFetch = new Date()
                    draft.cache.invalidateAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
                    
                    // Update permissions based on user role
                    const currentUser = authService.getStoredUser()
                    if (currentUser) {
                      draft.permissions = {
                        can_create: currentUser.role === 'student' || currentUser.role === 'admin',
                        can_view_all: currentUser.role === 'admin',
                        can_assign: currentUser.role === 'admin',
                        can_modify: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
                        can_delete: currentUser.role === 'admin',
                        can_add_internal_notes: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
                        can_manage_tags: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
                        can_export: currentUser.role === 'admin'
                      }
                    }
                    
                    draft.loading.list = false
                  })
                  
                  console.log('✅ TicketStore: Tickets fetched successfully')
                } else {
                  throw new Error(response.message || 'Failed to fetch tickets')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to fetch tickets:', error)
                set(draft => {
                  draft.loading.list = false
                  draft.errors.list = error.message || 'Failed to fetch tickets'
                })
              }
            },
            
            // Fetch single ticket with full details
            fetchTicket: async (id: number) => {
              set(draft => {
                draft.loading.update = true
                draft.errors.update = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Fetching ticket details:', id)
                
                const response = await apiClient.get(`/tickets/${id}`)
                
                if (response.success && response.data) {
                  const ticket = response.data.ticket
                  
                  set(draft => {
                    draft.tickets[ticket.id] = ticket
                    draft.currentTicket = ticket
                    draft.loading.update = false
                  })
                  
                  console.log('✅ TicketStore: Ticket details fetched successfully')
                  return ticket
                } else {
                  throw new Error(response.message || 'Failed to fetch ticket details')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to fetch ticket details:', error)
                set(draft => {
                  draft.loading.update = false
                  draft.errors.update = error.message || 'Failed to fetch ticket details'
                })
                return null
              }
            },
            
            // Refresh tickets (clear cache and refetch)
            refreshTickets: async () => {
              const state = get()
              set(draft => {
                draft.cache.invalidateAt = new Date() // Force refresh
              })
              await state.actions.fetchTickets()
            },
            
            // Create new ticket with validation and file upload
            createTicket: async (data: CreateTicketRequest) => {
              const state = get()
              
              if (!state.permissions.can_create) {
                const error = 'You do not have permission to create tickets'
                set(draft => { draft.errors.create = error })
                return null
              }
              
              // Validate data
              const validation = validateTicketData(data)
              if (!validation.valid) {
                const error = validation.errors.join(', ')
                set(draft => { draft.errors.create = error })
                return null
              }
              
              // Validate files if present
              if (data.attachments && data.attachments.length > 0) {
                const fileValidation = validateFiles(data.attachments, 5)
                if (!fileValidation.valid) {
                  const error = fileValidation.errors.join(', ')
                  set(draft => { draft.errors.create = error })
                  return null
                }
              }
              
              set(draft => {
                draft.loading.create = true
                draft.errors.create = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Creating ticket:', data)
                
                // Create FormData for file upload
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
                  data.attachments.forEach((file) => {
                    formData.append('attachments[]', file, file.name)
                  })
                }
                
                const response = await apiClient.post('/tickets', formData)
                
                if (response.success && response.data) {
                  const newTicket = response.data.ticket
                  
                  set(draft => {
                    // Add new ticket to store
                    draft.tickets[newTicket.id] = newTicket
                    draft.ticketsList.unshift(newTicket.id) // Add to beginning
                    
                    // Update stats
                    draft.stats.total += 1
                    draft.stats.open += 1
                    if (newTicket.crisis_flag) {
                      draft.stats.crisis += 1
                    }
                    
                    draft.loading.create = false
                    draft.currentTicket = newTicket
                  })
                  
                  console.log('✅ TicketStore: Ticket created successfully')
                  return newTicket
                } else {
                  throw new Error(response.message || 'Failed to create ticket')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to create ticket:', error)
                set(draft => {
                  draft.loading.create = false
                  draft.errors.create = error.message || 'Failed to create ticket'
                })
                return null
              }
            },
            
            // Update ticket with role-based validation
            updateTicket: async (id: number, data: UpdateTicketRequest) => {
              const state = get()
              
              if (!state.permissions.can_modify) {
                const error = 'You do not have permission to modify tickets'
                set(draft => { draft.errors.update = error })
                return null
              }
              
              set(draft => {
                draft.loading.update = true
                draft.errors.update = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Updating ticket:', { id, data })
                
                const response = await apiClient.patch(`/tickets/${id}`, data)
                
                if (response.success && response.data) {
                  const updatedTicket = response.data.ticket
                  
                  set(draft => {
                    draft.tickets[id] = updatedTicket
                    if (draft.currentTicket && draft.currentTicket.id === id) {
                      draft.currentTicket = updatedTicket
                    }
                    draft.loading.update = false
                  })
                  
                  console.log('✅ TicketStore: Ticket updated successfully')
                  return updatedTicket
                } else {
                  throw new Error(response.message || 'Failed to update ticket')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to update ticket:', error)
                set(draft => {
                  draft.loading.update = false
                  draft.errors.update = error.message || 'Failed to update ticket'
                })
                return null
              }
            },
            
            // Delete ticket (admin only)
            deleteTicket: async (id: number, reason: string, notifyUser = false) => {
              const state = get()
              
              if (!state.permissions.can_delete) {
                const error = 'You do not have permission to delete tickets'
                set(draft => { draft.errors.delete = error })
                return false
              }
              
              set(draft => {
                draft.loading.delete = true
                draft.errors.delete = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Deleting ticket:', { id, reason, notifyUser })
                
                const response = await apiClient.delete(`/tickets/${id}`, {
                  body: JSON.stringify({ reason, notify_user: notifyUser }),
                  headers: { 'Content-Type': 'application/json' }
                })
                
                if (response.success) {
                  set(draft => {
                    // Remove ticket from store
                    delete draft.tickets[id]
                    draft.ticketsList = draft.ticketsList.filter(ticketId => ticketId !== id)
                    
                    // Update stats
                    draft.stats.total = Math.max(0, draft.stats.total - 1)
                    
                    // Clear current ticket if it was deleted
                    if (draft.currentTicket && draft.currentTicket.id === id) {
                      draft.currentTicket = null
                    }
                    
                    // Remove from selections
                    draft.selectedTickets.delete(id)
                    draft.expandedTickets.delete(id)
                    
                    draft.loading.delete = false
                  })
                  
                  console.log('✅ TicketStore: Ticket deleted successfully')
                  return true
                } else {
                  throw new Error(response.message || 'Failed to delete ticket')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to delete ticket:', error)
                set(draft => {
                  draft.loading.delete = false
                  draft.errors.delete = error.message || 'Failed to delete ticket'
                })
                return false
              }
            },
            
            // Add response with file upload support
            addResponse: async (ticketId: number, data: AddResponseRequest) => {
              set(draft => {
                draft.loading.response = true
                draft.errors.response = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Adding response:', { ticketId, data })
                
                // Validate message
                if (!data.message?.trim() || data.message.length < 5) {
                  throw new Error('Response message must be at least 5 characters long')
                }
                
                // Validate files if present
                if (data.attachments && data.attachments.length > 0) {
                  const fileValidation = validateFiles(data.attachments, 3)
                  if (!fileValidation.valid) {
                    throw new Error(fileValidation.errors.join(', '))
                  }
                }
                
                // Create FormData
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
                  data.attachments.forEach((file) => {
                    formData.append('attachments[]', file, file.name)
                  })
                }
                
                const response = await apiClient.post(`/tickets/${ticketId}/responses`, formData)
                
                if (response.success && response.data) {
                  const newResponse = response.data.response
                  
                  set(draft => {
                    // Update ticket with new response
                    if (draft.tickets[ticketId]) {
                      if (!draft.tickets[ticketId].responses) {
                        draft.tickets[ticketId].responses = []
                      }
                      draft.tickets[ticketId].responses!.push(newResponse)
                      draft.tickets[ticketId].updated_at = new Date().toISOString()
                    }
                    
                    // Update current ticket if it matches
                    if (draft.currentTicket && draft.currentTicket.id === ticketId) {
                      if (!draft.currentTicket.responses) {
                        draft.currentTicket.responses = []
                      }
                      draft.currentTicket.responses.push(newResponse)
                      draft.currentTicket.updated_at = new Date().toISOString()
                    }
                    
                    draft.loading.response = false
                  })
                  
                  console.log('✅ TicketStore: Response added successfully')
                  return newResponse
                } else {
                  throw new Error(response.message || 'Failed to add response')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to add response:', error)
                set(draft => {
                  draft.loading.response = false
                  draft.errors.response = error.message || 'Failed to add response'
                })
                return null
              }
            },
            
            // Assign ticket to staff member
            assignTicket: async (ticketId: number, assignedTo: number | null, reason = '') => {
              const state = get()
              
              if (!state.permissions.can_assign) {
                const error = 'You do not have permission to assign tickets'
                set(draft => { draft.errors.assign = error })
                return null
              }
              
              set(draft => {
                draft.loading.assign = true
                draft.errors.assign = undefined
              })
              
              try {
                console.log('🎫 TicketStore: Assigning ticket:', { ticketId, assignedTo, reason })
                
                const response = await apiClient.post(`/tickets/${ticketId}/assign`, {
                  assigned_to: assignedTo,
                  reason
                })
                
                if (response.success && response.data) {
                  const assignedTicket = response.data.ticket
                  
                  set(draft => {
                    draft.tickets[ticketId] = assignedTicket
                    if (draft.currentTicket && draft.currentTicket.id === ticketId) {
                      draft.currentTicket = assignedTicket
                    }
                    
                    // Update stats
                    if (assignedTo && !draft.tickets[ticketId].assigned_to) {
                      draft.stats.unassigned = Math.max(0, draft.stats.unassigned - 1)
                    } else if (!assignedTo && draft.tickets[ticketId].assigned_to) {
                      draft.stats.unassigned += 1
                    }
                    
                    draft.loading.assign = false
                  })
                  
                  console.log('✅ TicketStore: Ticket assigned successfully')
                  return assignedTicket
                } else {
                  throw new Error(response.message || 'Failed to assign ticket')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to assign ticket:', error)
                set(draft => {
                  draft.loading.assign = false
                  draft.errors.assign = error.message || 'Failed to assign ticket'
                })
                return null
              }
            },
            
            // Bulk assign tickets
            bulkAssign: async (ticketIds: number[], assignedTo: number, reason = '') => {
              const state = get()
              
              if (!state.permissions.can_assign) {
                const error = 'You do not have permission to assign tickets'
                set(draft => { draft.errors.assign = error })
                return 0
              }
              
              set(draft => {
                draft.loading.assign = true
                draft.errors.assign = undefined
              })
              
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
                  await state.actions.fetchTickets()
                  
                  set(draft => {
                    draft.loading.assign = false
                    draft.selectedTickets.clear() // Clear selection after bulk action
                  })
                  
                  console.log('✅ TicketStore: Tickets bulk assigned successfully')
                  return assignedCount
                } else {
                  throw new Error(response.message || 'Failed to assign tickets')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to bulk assign tickets:', error)
                set(draft => {
                  draft.loading.assign = false
                  draft.errors.assign = error.message || 'Failed to assign tickets'
                })
                return 0
              }
            },
            
            // Tag management
            addTag: async (ticketId: number, tag: string) => {
              try {
                await get().actions.manageTags(ticketId, 'add', [tag]) // Fixed: Use get() instead of state
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to add tag:', error)
              }
            },
            
            removeTag: async (ticketId: number, tag: string) => {
              try {
                await get().actions.manageTags(ticketId, 'remove', [tag])
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to remove tag:', error)
              }
            },
            
            setTags: async (ticketId: number, tags: string[]) => {
              try {
                await get().actions.manageTags(ticketId, 'set', tags)
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to set tags:', error)
              }
            },
            
            // Internal tag management method
            manageTags: async (ticketId: number, action: 'add' | 'remove' | 'set', tags: string[]) => {
              const state = get()
              
              if (!state.permissions.can_manage_tags) {
                const error = 'You do not have permission to manage tags'
                set(draft => { draft.errors.update = error })
                return
              }
              
              try {
                console.log('🎫 TicketStore: Managing tags:', { ticketId, action, tags })
                
                const response = await apiClient.post(`/tickets/${ticketId}/tags`, {
                  action,
                  tags
                })
                
                if (response.success && response.data) {
                  const updatedTicket = response.data.ticket
                  
                  set(draft => {
                    draft.tickets[ticketId] = updatedTicket
                    if (draft.currentTicket && draft.currentTicket.id === ticketId) {
                      draft.currentTicket = updatedTicket
                    }
                  })
                  
                  console.log('✅ TicketStore: Tags managed successfully')
                } else {
                  throw new Error(response.message || 'Failed to update tags')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to manage tags:', error)
                set(draft => {
                  draft.errors.update = error.message || 'Failed to update tags'
                })
              }
            },
            
            // Filter and search management
            setFilters: (filters: Partial<TicketFilters>) => {
              set(draft => {
                draft.filters = { ...draft.filters, ...filters, page: 1 } // Reset page when filters change
              })
              
              // Auto-fetch with new filters
              setTimeout(() => {
                get().actions.fetchTickets()
              }, 100)
            },
            
            setSearch: (query: string) => {
              set(draft => {
                draft.searchQuery = query
                draft.filters.search = query || undefined
                draft.filters.page = 1
              })
              
              // Debounced search
              const timeoutId = setTimeout(() => {
                get().actions.fetchTickets()
              }, 500)
              
              // Store timeout ID for potential cleanup
              set(draft => {
                if (draft.searchTimeoutId) { // Fixed: Check if property exists
                  clearTimeout(draft.searchTimeoutId)
                }
                draft.searchTimeoutId = timeoutId
              })
            },
            
            clearFilters: () => {
              set(draft => {
                draft.filters = { ...defaultFilters }
                draft.searchQuery = ''
              })
              
              get().actions.fetchTickets()
            },
            
            // UI state management
            selectTicket: (id: number) => {
              set(draft => {
                draft.selectedTickets.add(id)
              })
            },
            
            deselectTicket: (id: number) => {
              set(draft => {
                draft.selectedTickets.delete(id)
              })
            },
            
            selectAllTickets: () => {
              const state = get()
              set(draft => {
                draft.selectedTickets = new Set(state.ticketsList)
              })
            },
            
            clearSelection: () => {
              set(draft => {
                draft.selectedTickets.clear()
              })
            },
            
            setCurrentTicket: (ticket: TicketData | null) => {
              set(draft => {
                draft.currentTicket = ticket
              })
            },
            
            expandTicket: (id: number) => {
              set(draft => {
                draft.expandedTickets.add(id)
              })
            },
            
            collapseTicket: (id: number) => {
              set(draft => {
                draft.expandedTickets.delete(id)
              })
            },
            
            // Error handling
            clearError: (type?: string) => {
              set(draft => {
                if (type) {
                  delete draft.errors[type]
                } else {
                  draft.errors = {}
                }
              })
            },
            
            setError: (type: string, message: string) => {
              set(draft => {
                draft.errors[type] = message
              })
            },
            
            // Cache management
            invalidateCache: () => {
              set(draft => {
                draft.cache.invalidateAt = new Date()
              })
            },
            
            clearCache: () => {
              set(draft => {
                draft.tickets = {}
                draft.ticketsList = []
                draft.currentTicket = null
                draft.cache = {
                  lastFetch: null,
                  lastUpdate: null,
                  invalidateAt: null
                }
              })
            },
            
            // Attachment download
            downloadAttachment: async (attachmentId: number, fileName: string) => {
              try {
                console.log('🎫 TicketStore: Downloading attachment:', { attachmentId, fileName })
                
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
                
                console.log('✅ TicketStore: Attachment download initiated successfully')
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to download attachment:', error)
                set(draft => {
                  draft.errors.update = 'Failed to download attachment'
                })
              }
            },
            
            // Export tickets
            exportTickets: async (format: 'csv' | 'excel' | 'json' = 'csv', filters = {}) => {
              const state = get()
              
              if (!state.permissions.can_export) {
                const error = 'You do not have permission to export tickets'
                set(draft => { draft.errors.update = error })
                return
              }
              
              try {
                console.log('🎫 TicketStore: Exporting tickets:', { format, filters })
                
                const queryParams = new URLSearchParams()
                queryParams.append('format', format)
                
                // Add current filters
                const exportFilters = { ...state.filters, ...filters }
                Object.entries(exportFilters).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                    queryParams.append(key, value.toString())
                  }
                })
                
                const response = await apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)
                
                if (response.success) {
                  console.log('✅ TicketStore: Tickets exported successfully')
                } else {
                  throw new Error(response.message || 'Failed to export tickets')
                }
              } catch (error: any) {
                console.error('❌ TicketStore: Failed to export tickets:', error)
                set(draft => {
                  draft.errors.update = error.message || 'Failed to export tickets'
                })
              }
            }
          }
        }))
      ),
      {
        name: 'ticket-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          filters: state.filters,
          searchQuery: state.searchQuery,
          expandedTickets: Array.from(state.expandedTickets), // Convert Set to Array for JSON
          permissions: state.permissions
        }),
        // Custom storage to handle Sets
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name)
            if (!str) return null
            const data = JSON.parse(str)
            // Convert arrays back to Sets
            if (data.state?.expandedTickets) {
              data.state.expandedTickets = new Set(data.state.expandedTickets)
            }
            return data
          },
          setItem: (name, value) => {
            // Convert Sets to arrays before JSON stringify
            const data = {
              ...value,
              state: {
                ...value.state,
                expandedTickets: value.state?.expandedTickets 
                  ? Array.from(value.state.expandedTickets) 
                  : []
              }
            }
            localStorage.setItem(name, JSON.stringify(data))
          },
          removeItem: (name) => localStorage.removeItem(name)
        }
      }
    ),
    {
      name: 'ticket-store'
    }
  )
)

// Computed selectors for better performance
export const useTicketSelectors = () => {
  const store = useTicketStore()
  
  return {
    // Get tickets as array (maintaining order)
    tickets: store.ticketsList.map(id => store.tickets[id]).filter(Boolean),
    
    // Get tickets by status
    openTickets: store.ticketsList
      .map(id => store.tickets[id])
      .filter(ticket => ticket && (ticket.status === 'Open' || ticket.status === 'In Progress')),
    
    closedTickets: store.ticketsList
      .map(id => store.tickets[id])
      .filter(ticket => ticket && (ticket.status === 'Resolved' || ticket.status === 'Closed')),
    
    crisisTickets: store.ticketsList
      .map(id => store.tickets[id])
      .filter(ticket => ticket && (ticket.crisis_flag || ticket.priority === 'Urgent')),
    
    unassignedTickets: store.ticketsList
      .map(id => store.tickets[id])
      .filter(ticket => ticket && !ticket.assigned_to),
    
    myAssignedTickets: store.ticketsList
      .map(id => store.tickets[id])
      .filter(ticket => {
        const currentUser = authService.getStoredUser()
        return ticket && currentUser && ticket.assigned_to === currentUser.id
      }),
    
    // Get selected tickets
    selectedTickets: Array.from(store.selectedTickets).map(id => store.tickets[id]).filter(Boolean),
    
    // Get expanded tickets
    expandedTickets: Array.from(store.expandedTickets).map(id => store.tickets[id]).filter(Boolean),
    
    // Check if cache is valid
    isCacheValid: store.cache.invalidateAt ? new Date() < store.cache.invalidateAt : false,
    
    // Check if any loading state is active
    isLoading: Object.values(store.loading).some(Boolean),
    
    // Check if any errors exist
    hasErrors: Object.keys(store.errors).length > 0,
    
    // Get all errors as array
    allErrors: Object.entries(store.errors)
      .filter(([_, error]) => error)
      .map(([type, error]) => ({ type, message: error })),
    
    // Get tickets by category
    getTicketsByCategory: (category: string) => 
      store.ticketsList
        .map(id => store.tickets[id])
        .filter(ticket => ticket && ticket.category === category),
    
    // Get tickets by priority
    getTicketsByPriority: (priority: string) =>
      store.ticketsList
        .map(id => store.tickets[id])
        .filter(ticket => ticket && ticket.priority === priority),
    
    // Get tickets with tags
    getTicketsWithTags: (tags: string[]) =>
      store.ticketsList
        .map(id => store.tickets[id])
        .filter(ticket => ticket && ticket.tags && tags.some(tag => ticket.tags!.includes(tag))),
    
    // Search in tickets
    searchTickets: (query: string) => {
      if (!query.trim()) return []
      const lowerQuery = query.toLowerCase()
      return store.ticketsList
        .map(id => store.tickets[id])
        .filter(ticket => 
          ticket && (
            ticket.ticket_number.toLowerCase().includes(lowerQuery) ||
            ticket.subject.toLowerCase().includes(lowerQuery) ||
            ticket.description.toLowerCase().includes(lowerQuery) ||
            ticket.user?.name.toLowerCase().includes(lowerQuery)
          )
        )
    }
  }
}

// Utility hooks for specific use cases
export const useTicketById = (id: number) => {
  return useTicketStore(state => state.tickets[id] || null)
}

export const useTicketLoading = (type: string = 'list') => {
  return useTicketStore(state => state.loading[type] || false)
}

export const useTicketError = (type: string = 'list') => {
  return useTicketStore(state => state.errors[type] || null)
}

export const useTicketStats = () => {
  return useTicketStore(state => state.stats)
}

export const useTicketFilters = () => {
  return useTicketStore(state => ({
    filters: state.filters,
    setFilters: state.actions.setFilters,
    clearFilters: state.actions.clearFilters
  }))
}

export const useTicketPermissions = () => {
  return useTicketStore(state => state.permissions)
}

// Initialize store with user permissions on app start
export const initializeTicketStore = () => {
  const currentUser = authService.getStoredUser()
  if (currentUser) {
    useTicketStore.setState(state => ({
      permissions: {
        can_create: currentUser.role === 'student' || currentUser.role === 'admin',
        can_view_all: currentUser.role === 'admin',
        can_assign: currentUser.role === 'admin',
        can_modify: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_delete: currentUser.role === 'admin',
        can_add_internal_notes: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_manage_tags: ['counselor', 'advisor', 'admin'].includes(currentUser.role),
        can_export: currentUser.role === 'admin'
      }
    }))
  }
}

// Auto-refresh functionality
export const setupTicketAutoRefresh = (intervalMs: number = 30000) => {
  let intervalId: NodeJS.Timeout
  
  const startAutoRefresh = () => {
    intervalId = setInterval(() => {
      const state = useTicketStore.getState()
      if (!state.cache.invalidateAt || new Date() > state.cache.invalidateAt) {
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

// Export store instance for direct access if needed
export default useTicketStore