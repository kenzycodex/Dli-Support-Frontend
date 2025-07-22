// stores/ticket-store.ts - ENHANCED: Dynamic Categories & Crisis Detection Support

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiClient, StandardizedApiResponse } from '@/lib/api'
import { authService } from '@/services/auth.service'
import { ticketCategoriesService, TicketCategory } from '@/services/ticketCategories.service'

// ENHANCED: TicketData with dynamic categories and crisis detection
export interface TicketData {
  id: number
  ticket_number: string
  user_id: number
  subject: string
  description: string
  category_id: number // CHANGED: Now uses category ID
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: number
  crisis_flag: boolean
  tags?: string[] // ENHANCED: Now supports dynamic tags
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  
  // ENHANCED: Dynamic category relationship
  category?: TicketCategory
  
  // ENHANCED: Crisis detection fields
  detected_crisis_keywords?: Array<{
    keyword: string
    severity_level: string
    severity_weight: number
  }>
  priority_score?: number
  
  // ENHANCED: Assignment tracking fields
  auto_assigned?: 'yes' | 'manual' | 'no'
  assigned_at?: string
  assignment_reason?: string
  
  // ENHANCED: SLA tracking - FIXED: Made consistent with API response
  sla_deadline?: string | null
  is_overdue?: boolean
  
  // Existing relationships
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
  slug?: string
  
  // Data completeness tracking
  _dataComplete?: boolean
  _lastFullLoad?: number
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
  attachment_count?: number
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

// ENHANCED: Filters with category support
export interface TicketFilters {
  page?: number
  per_page?: number
  status?: string
  category_id?: number | string // ENHANCED: Support category ID filtering
  priority?: string
  assigned?: string
  search?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  tags?: string[]
  crisis_flag?: boolean // ENHANCED: Filter by crisis status
  auto_assigned?: string // ENHANCED: Filter by assignment type
  overdue?: boolean // ENHANCED: Filter overdue tickets
}

// ENHANCED: Create ticket with category ID
export interface CreateTicketRequest {
  subject: string
  description: string
  category_id: number // CHANGED: Now uses category ID
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

// ENHANCED: Update request with new fields
export interface UpdateTicketRequest {
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  assigned_to?: number | null
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  crisis_flag?: boolean
  tags?: string[]
  subject?: string
  description?: string
  category_id?: number // ENHANCED: Allow category changes
}

// ENHANCED: Store interface with categories and crisis detection
interface TicketState {
  // Core data - Enhanced with categories
  tickets: TicketData[]
  currentTicket: TicketData | null
  filters: TicketFilters
  
  // ENHANCED: Categories management
  categories: TicketCategory[]
  categoriesLoading: boolean
  categoriesError: string | null
  categoriesLastFetch: number
  
  // Enhanced loading states
  loading: {
    list: boolean
    details: boolean
    create: boolean
    update: boolean
    delete: boolean
    response: boolean
    assign: boolean
    download: boolean
    refresh: boolean
    categories: boolean
  }
  
  // Enhanced error states
  errors: {
    list: string | null
    details: string | null
    create: string | null
    update: string | null
    delete: string | null
    response: string | null
    assign: string | null
    download: string | null
    refresh: string | null
    categories: string | null
  }
  
  // Enhanced pagination
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  
  // Enhanced cache management
  lastFetch: number
  ticketCache: Map<number, { data: TicketData; lastUpdate: number; isComplete: boolean }>
  downloadCache: Map<number, { status: 'downloading' | 'completed' | 'failed'; timestamp: number }>
  
  // UI state
  selectedTickets: Set<number>
  
  // ENHANCED ACTIONS INTERFACE with categories support
  actions: {
    // ENHANCED: Category management
    fetchCategories: (forceRefresh?: boolean) => Promise<void>
    createCategory: (data: any) => Promise<TicketCategory | null>
    updateCategory: (id: number, data: any) => Promise<void>
    deleteCategory: (id: number) => Promise<void>
    getCategoryById: (id: number) => TicketCategory | null
    getCategoryBySlug: (slug: string) => TicketCategory | null
    
    // ENHANCED: Data fetching with smart caching
    fetchTickets: (params?: Partial<TicketFilters>, forceRefresh?: boolean) => Promise<void>
    fetchTicket: (id: number, forceRefresh?: boolean) => Promise<void>
    fetchTicketBySlug: (slug: string) => Promise<void>
    refreshTickets: () => Promise<void>
    refreshTicket: (id: number) => Promise<void>
    
    // CRUD operations
    createTicket: (data: CreateTicketRequest) => Promise<TicketData | null>
    updateTicket: (id: number, data: UpdateTicketRequest) => Promise<void>
    deleteTicket: (id: number, reason?: string, notifyUser?: boolean) => Promise<void>
    
    // ENHANCED: Response management with real-time updates
    addResponse: (ticketId: number, data: AddResponseRequest) => Promise<void>
    
    // Assignment
    assignTicket: (ticketId: number, assignedTo: number | null, reason?: string) => Promise<void>
    bulkAssign: (ticketIds: number[], assignedTo: number, reason?: string) => Promise<number>
    
    // ENHANCED: Tag management with dynamic support
    addTag: (ticketId: number, tag: string) => Promise<void>
    removeTag: (ticketId: number, tag: string) => Promise<void>
    setTags: (ticketId: number, tags: string[]) => Promise<void>
    
    // ENHANCED: File operations with progress tracking
    downloadAttachment: (attachmentId: number, fileName: string) => Promise<void>
    
    // Filter management
    setFilters: (filters: TicketFilters, autoFetch?: boolean) => void
    clearFilters: (autoFetch?: boolean) => void
    
    // UI state management
    setCurrentTicket: (ticket: TicketData | null) => void
    selectTicket: (id: number) => void
    deselectTicket: (id: number) => void
    clearSelection: () => void
    
    // ENHANCED: Error handling with auto-retry
    clearError: (type: keyof TicketState['errors']) => void
    setError: (type: keyof TicketState['errors'], message: string) => void
    
    // ENHANCED: Cache management
    invalidateCache: (ticketId?: number) => void
    clearCache: () => void
    getCachedTicket: (id: number) => TicketData | null
    setCachedTicket: (ticket: TicketData, isComplete?: boolean) => void
    
    // Export
    exportTickets: (format: 'csv' | 'excel' | 'json', filters?: Partial<TicketFilters>, selectedIds?: number[]) => Promise<void>
    
    // ENHANCED: Crisis detection
    testCrisisDetection: (text: string, categoryId?: number) => Promise<any>
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

// ENHANCED: Generate dynamic slug for tickets with category support
const generateTicketSlug = (ticket: TicketData): string => {
  const sanitizedSubject = ticket.subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  const categorySlug = ticket.category?.slug || 'general'
  
  return `${ticket.id}-${categorySlug}-${sanitizedSubject}-${ticket.ticket_number.toLowerCase()}`
}

// Parse ticket ID from slug with better validation
const parseTicketIdFromSlug = (slug: string): number | null => {
  if (!slug || typeof slug !== 'string') return null
  
  const parts = slug.split('-')
  if (parts.length < 2) return null
  
  const id = parseInt(parts[0])
  return isNaN(id) ? null : id
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

// ENHANCED: Check if ticket data is complete
const isTicketDataComplete = (ticket: TicketData): boolean => {
  return ticket.responses !== undefined && 
         ticket.attachments !== undefined &&
         ticket.category !== undefined
}

// ENHANCED: Calculate SLA deadline
const calculateSLADeadline = (ticket: TicketData): string | null => {
  if (!ticket.category?.sla_response_hours) return null
  
  const created = new Date(ticket.created_at)
  const deadline = new Date(created.getTime() + (ticket.category.sla_response_hours * 60 * 60 * 1000))
  return deadline.toISOString()
}

// ENHANCED: Check if ticket is overdue
const isTicketOverdue = (ticket: TicketData): boolean => {
  if (['Resolved', 'Closed'].includes(ticket.status)) return false
  if (!ticket.category?.sla_response_hours) return false
  
  const created = new Date(ticket.created_at)
  const deadline = new Date(created.getTime() + (ticket.category.sla_response_hours * 60 * 60 * 1000))
  return new Date() > deadline
}

// ENHANCED: Create store with categories and crisis detection support
export const useTicketStore = create<TicketState>()(
  devtools(
    (set, get) => ({
      // Initial state with enhanced properties
      tickets: [],
      currentTicket: null,
      filters: { ...defaultFilters },
      
      // ENHANCED: Categories state
      categories: [],
      categoriesLoading: false,
      categoriesError: null,
      categoriesLastFetch: 0,

      loading: {
        list: false,
        details: false,
        create: false,
        update: false,
        delete: false,
        response: false,
        assign: false,
        download: false,
        refresh: false,
        categories: false,
      },

      errors: {
        list: null,
        details: null,
        create: null,
        update: null,
        delete: null,
        response: null,
        assign: null,
        download: null,
        refresh: null,
        categories: null,
      },

      pagination: { ...defaultPagination },
      lastFetch: 0,
      ticketCache: new Map(),
      downloadCache: new Map(),
      selectedTickets: new Set<number>(),

      actions: {
        // ENHANCED: Category management actions
        fetchCategories: async (forceRefresh = false) => {
          const state = get()
          
          // Check cache validity (5 minutes for categories)
          const cacheAge = Date.now() - state.categoriesLastFetch
          if (!forceRefresh && cacheAge < 300000 && state.categories.length > 0) {
            console.log('📁 TicketStore: Using cached categories')
            return
          }

          set((state) => ({
            loading: { ...state.loading, categories: true },
            errors: { ...state.errors, categories: null },
          }))

          try {
            console.log('📁 TicketStore: Fetching categories')
            
            const response = await ticketCategoriesService.getCategories({
              include_inactive: false,
              with_counselors: true
            })

            if (response.success && response.data && response.data.categories) {
              set(() => ({
                categories: response.data!.categories,
                categoriesLastFetch: Date.now(),
                loading: { ...get().loading, categories: false },
              }))

              console.log('✅ TicketStore: Categories fetched successfully:', response.data.categories.length)
            } else {
              throw new Error(response.message || 'Failed to fetch categories')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch categories:', error)
            set((state) => ({
              loading: { ...state.loading, categories: false },
              errors: { ...state.errors, categories: error.message || 'Failed to fetch categories' },
            }))
          }
        },

        createCategory: async (data: any) => {
          set((state) => ({
            loading: { ...state.loading, categories: true },
            errors: { ...state.errors, categories: null },
          }))

          try {
            console.log('📁 TicketStore: Creating category')
            
            const response = await ticketCategoriesService.createCategory(data)

            if (response.success && response.data && response.data.category) {
              // Refresh categories list
              await get().actions.fetchCategories(true)
              
              console.log('✅ TicketStore: Category created successfully')
              return response.data.category
            } else {
              throw new Error(response.message || 'Failed to create category')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to create category:', error)
            set((state) => ({
              loading: { ...state.loading, categories: false },
              errors: { ...state.errors, categories: error.message || 'Failed to create category' },
            }))
            return null
          }
        },

        updateCategory: async (id: number, data: any) => {
          try {
            console.log('📁 TicketStore: Updating category:', id)
            
            const response = await ticketCategoriesService.updateCategory(id, data)

            if (response.success) {
              // Refresh categories list
              await get().actions.fetchCategories(true)
              
              console.log('✅ TicketStore: Category updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update category')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to update category:', error)
            set((state) => ({
              errors: { ...state.errors, categories: error.message || 'Failed to update category' },
            }))
          }
        },

        deleteCategory: async (id: number) => {
          try {
            console.log('📁 TicketStore: Deleting category:', id)
            
            const response = await ticketCategoriesService.deleteCategory(id)

            if (response.success) {
              // Refresh categories list
              await get().actions.fetchCategories(true)
              
              console.log('✅ TicketStore: Category deleted successfully')
            } else {
              throw new Error(response.message || 'Failed to delete category')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to delete category:', error)
            set((state) => ({
              errors: { ...state.errors, categories: error.message || 'Failed to delete category' },
            }))
          }
        },

        getCategoryById: (id: number) => {
          const state = get()
          return state.categories.find(c => c.id === id) || null
        },

        getCategoryBySlug: (slug: string) => {
          const state = get()
          return state.categories.find(c => c.slug === slug) || null
        },

        // ENHANCED: fetchTickets with category support
        fetchTickets: async (params?: Partial<TicketFilters>, forceRefresh = false) => {
          const state = get()

          // Ensure categories are loaded first
          if (state.categories.length === 0) {
            await get().actions.fetchCategories()
          }

          // Merge provided params with current filters
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters

          // Check cache validity (5 minutes for list data)
          const cacheAge = Date.now() - state.lastFetch
          if (!forceRefresh && !params && cacheAge < 300000 && state.tickets.length > 0) {
            console.log('🎫 TicketStore: Using cached ticket list')
            return
          }

          set((state) => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
            filters: mergedFilters,
          }))

          try {
            console.log('🎫 TicketStore: Fetching tickets with params:', mergedFilters)

            const queryString = buildQueryString(mergedFilters)
            const response: StandardizedApiResponse<{
              tickets: any[]
              pagination: any
              stats: any
              user_role: string
            }> = await apiClient.get(`/tickets?${queryString}`)

            if (response.success && response.data) {
              const { tickets, pagination } = response.data

              // ENHANCED: Process tickets with category relationships and enhanced fields
              const ticketsWithMetadata = tickets?.map((ticket: any) => {
                const category = state.categories.find(c => c.id === ticket.category_id)
                
                const enhancedTicket: TicketData = {
                  ...ticket,
                  category,
                  slug: generateTicketSlug({ ...ticket, category }),
                  sla_deadline: category ? calculateSLADeadline({ ...ticket, category }) : null,
                  is_overdue: category ? isTicketOverdue({ ...ticket, category }) : false,
                  _dataComplete: isTicketDataComplete(ticket),
                  _lastFullLoad: isTicketDataComplete(ticket) ? Date.now() : undefined,
                }

                return enhancedTicket
              }) || []

              // Update cache for each ticket
              const cache = new Map(state.ticketCache)
              ticketsWithMetadata.forEach((ticket: TicketData) => {
                cache.set(ticket.id, {
                  data: ticket,
                  lastUpdate: Date.now(),
                  isComplete: isTicketDataComplete(ticket)
                })
              })

              set(() => ({
                tickets: ticketsWithMetadata,
                pagination: pagination || defaultPagination,
                lastFetch: Date.now(),
                ticketCache: cache,
                loading: { ...get().loading, list: false },
              }))

              console.log('✅ TicketStore: Tickets fetched successfully:', ticketsWithMetadata?.length || 0)
            } else {
              throw new Error(response.message || 'Failed to fetch tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch tickets:', error)
            set((state) => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to fetch tickets' },
            }))
          }
        },

        // ENHANCED: fetchTicket with category support and crisis detection
        fetchTicket: async (id: number, forceRefresh = false) => {
          if (!id || isNaN(id)) {
            console.error('❌ TicketStore: Invalid ticket ID provided:', id)
            set((state) => ({
              errors: { ...state.errors, details: 'Invalid ticket ID' },
            }))
            return
          }

          const state = get()
          
          // Ensure categories are loaded first
          if (state.categories.length === 0) {
            await get().actions.fetchCategories()
          }
          
          // Check cache for complete data (valid for 2 minutes)
          const cached = state.ticketCache.get(id)
          if (!forceRefresh && cached && cached.isComplete) {
            const cacheAge = Date.now() - cached.lastUpdate
            if (cacheAge < 120000) { // 2 minutes
              console.log('🎫 TicketStore: Using cached complete ticket data for ID:', id)
              
              // Update current ticket and tickets array
              set((state) => ({
                currentTicket: cached.data,
                tickets: state.tickets.map(t => t.id === id ? cached.data : t),
              }))
              return
            }
          }

          set((state) => ({
            loading: { ...state.loading, details: true },
            errors: { ...state.errors, details: null },
          }))

          try {
            console.log('🎫 TicketStore: Fetching COMPLETE ticket details for ID:', id)

            const response: StandardizedApiResponse<{ 
              ticket: any
              permissions?: any 
            }> = await apiClient.get(`/tickets/${id}`)

            if (response.success && response.data && response.data.ticket) {
              const ticketData = response.data.ticket
              const category = state.categories.find(c => c.id === ticketData.category_id)
              
              const ticket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: true,
                _lastFullLoad: Date.now(),
              }

              // Ensure responses and attachments are properly structured
              if (!ticket.responses) {
                ticket.responses = []
              }
              if (!ticket.attachments) {
                ticket.attachments = []
              }
              if (!ticket.detected_crisis_keywords) {
                ticket.detected_crisis_keywords = []
              }
              if (!ticket.tags) {
                ticket.tags = []
              }

              // Update cache with complete data
              const cache = new Map(state.ticketCache)
              cache.set(ticket.id, {
                data: ticket,
                lastUpdate: Date.now(),
                isComplete: true
              })

              set((state) => ({
                currentTicket: ticket,
                tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
                ticketCache: cache,
                loading: { ...state.loading, details: false },
              }))

              console.log('✅ TicketStore: COMPLETE ticket fetched successfully', {
                hasResponses: !!ticket.responses,
                responseCount: ticket.responses?.length || 0,
                hasAttachments: !!ticket.attachments,
                attachmentCount: ticket.attachments?.length || 0,
                hasCrisisKeywords: ticket.detected_crisis_keywords?.length || 0,
                autoAssigned: ticket.auto_assigned || 'no',
                category: category?.name || 'Unknown'
              })
            } else {
              throw new Error(response.message || 'Ticket not found or access denied')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch ticket:', error)

            let errorMessage = 'Failed to fetch ticket details'
            if (error.response?.status === 404) {
              errorMessage = 'Ticket not found'
            } else if (error.response?.status === 403) {
              errorMessage = 'You do not have permission to view this ticket'
            } else if (error.message && !error.message.includes('HTML')) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, details: false },
              errors: { ...state.errors, details: errorMessage },
              currentTicket: null,
            }))
          }
        },

        // Fetch ticket by slug
        fetchTicketBySlug: async (slug: string) => {
          const ticketId = parseTicketIdFromSlug(slug)

          if (!ticketId) {
            console.error('❌ TicketStore: Invalid ticket slug:', slug)
            set((state) => ({
              errors: { ...state.errors, details: 'Invalid ticket URL format' },
              currentTicket: null,
            }))
            return
          }

          console.log('🎫 TicketStore: Fetching ticket by slug:', slug, '-> ID:', ticketId)
          await get().actions.fetchTicket(ticketId)
        },

        // Refresh with smart cache invalidation
        refreshTickets: async () => {
          console.log('🔄 TicketStore: Refreshing tickets (force)')
          set((state) => ({ 
            lastFetch: 0,
            loading: { ...state.loading, refresh: true },
            errors: { ...state.errors, refresh: null },
          }))
          
          try {
            await get().actions.fetchTickets(undefined, true)
            set((state) => ({ loading: { ...state.loading, refresh: false } }))
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, refresh: false },
              errors: { ...state.errors, refresh: error.message || 'Failed to refresh tickets' },
            }))
          }
        },

        // Refresh single ticket
        refreshTicket: async (id: number) => {
          console.log('🔄 TicketStore: Refreshing single ticket:', id)
          await get().actions.fetchTicket(id, true)
        },

        // ENHANCED: Create ticket with category_id support
        createTicket: async (data: CreateTicketRequest) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }))

          try {
            console.log('🎫 TicketStore: Creating ticket with category_id:', data.category_id)

            // Validate category exists
            const state = get()
            const category = state.categories.find(c => c.id === data.category_id)
            if (!category) {
              throw new Error('Invalid category selected')
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

            if (data.attachments) {
              data.attachments.forEach((file) => {
                formData.append('attachments[]', file, file.name)
              })
            }

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post('/tickets', formData)

            if (response.success && response.data?.ticket) {
              const ticketData = response.data.ticket
              
              const newTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: calculateSLADeadline({ ...ticketData, category }),
                is_overdue: isTicketOverdue({ ...ticketData, category }),
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              cache.set(newTicket.id, {
                data: newTicket,
                lastUpdate: Date.now(),
                isComplete: isTicketDataComplete(newTicket)
              })

              set((state) => ({
                tickets: [newTicket, ...state.tickets],
                currentTicket: newTicket,
                ticketCache: cache,
                loading: { ...state.loading, create: false },
              }))

              console.log('✅ TicketStore: Ticket created successfully', {
                crisisDetected: newTicket.crisis_flag,
                autoAssigned: newTicket.auto_assigned,
                category: category.name
              })
              return newTicket
            } else {
              throw new Error(response.message || 'Failed to create ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to create ticket:', error)
            let errorMessage = 'Failed to create ticket. Please try again.'

            if (error.response?.data?.errors) {
              const errors = Object.values(error.response.data.errors).flat()
              errorMessage = errors.join(', ')
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message
            } else if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: errorMessage },
            }))
            return null
          }
        },

        // ENHANCED: Crisis detection test
        testCrisisDetection: async (text: string, categoryId?: number) => {
          try {
            console.log('🚨 TicketStore: Testing crisis detection')
            
            const response = await apiClient.post('/admin/crisis-keywords/test-detection', {
              text,
              category_id: categoryId
            })

            if (response.success) {
              console.log('✅ TicketStore: Crisis detection test completed')
              return response.data
            } else {
              throw new Error(response.message || 'Failed to test crisis detection')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Crisis detection test failed:', error)
            throw error
          }
        },

        // ENHANCED: Update ticket with category support
        updateTicket: async (id: number, data: UpdateTicketRequest) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))

          try {
            console.log('🎫 TicketStore: Updating ticket:', id, data)

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.patch(`/tickets/${id}`, data)

            if (response.success && response.data && response.data.ticket) {
              const state = get()
              const ticketData = response.data.ticket
              const category = data.category_id 
                ? state.categories.find(c => c.id === data.category_id)
                : state.categories.find(c => c.id === ticketData.category_id)

              const updatedTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              const existing = cache.get(id)
              cache.set(id, {
                data: updatedTicket,
                lastUpdate: Date.now(),
                isComplete: existing?.isComplete || isTicketDataComplete(updatedTicket)
              })

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
                currentTicket: state.currentTicket?.id === id ? updatedTicket : state.currentTicket,
                ticketCache: cache,
                loading: { ...state.loading, update: false },
              }))

              console.log('✅ TicketStore: Ticket updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to update ticket:', error)

            let errorMessage = 'Failed to update ticket'
            if (error.response?.data?.message) {
              errorMessage = error.response.data.message
            } else if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: errorMessage },
            }))
          }
        },

        // ENHANCED: Delete ticket with cache cleanup
        deleteTicket: async (id: number, reason = 'Deleted by admin', notifyUser = false) => {
          console.log('🎫 TicketStore: Starting ticket deletion:', id)

          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }))

          try {
            console.log('🎫 TicketStore: Calling delete API:', { id, reason, notifyUser })

            const response: StandardizedApiResponse<{
              ticket_number?: string
              deletion_reason?: string
              user_notified?: boolean
              deleted_by?: any
            }> = await apiClient.delete(`/tickets/${id}`, {
              reason: reason.trim(),
              notify_user: notifyUser,
            })

            if (response.success) {
              console.log('✅ TicketStore: Delete API call successful, updating state immediately')

              // Clean up cache and state
              const cache = new Map(get().ticketCache)
              cache.delete(id)

              const downloadCache = new Map(get().downloadCache)
              downloadCache.forEach((value, key) => {
                downloadCache.delete(key)
              })

              set((state) => {
                const newSelectedTickets = new Set(state.selectedTickets)
                newSelectedTickets.delete(id)

                const newTickets = state.tickets.filter((t) => t.id !== id)
                const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket

                return {
                  tickets: newTickets,
                  currentTicket: newCurrentTicket,
                  selectedTickets: newSelectedTickets,
                  ticketCache: cache,
                  downloadCache: downloadCache,
                  loading: { ...state.loading, delete: false },
                  errors: { ...state.errors, delete: null },
                }
              })

              console.log('✅ TicketStore: State updated successfully, ticket deleted')
              
            } else {
              let errorMessage = response.message || 'Failed to delete ticket'

              if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
                errorMessage = 'Delete operation timed out. Please refresh the page to check if the ticket was deleted.'

                const cache = new Map(get().ticketCache)
                cache.delete(id)

                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets)
                  newSelectedTickets.delete(id)
                  const newTickets = state.tickets.filter((t) => t.id !== id)
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    ticketCache: cache,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: errorMessage },
                  }
                })

                return
              }

              throw new Error(errorMessage)
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to delete ticket:', error)

            let errorMessage = 'Failed to delete ticket'

            if (error.message) {
              if (error.message.includes('timeout')) {
                errorMessage = 'Delete operation timed out. Please refresh the page to check if the ticket was deleted.'

                const cache = new Map(get().ticketCache)
                cache.delete(id)

                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets)
                  newSelectedTickets.delete(id)
                  const newTickets = state.tickets.filter((t) => t.id !== id)
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    ticketCache: cache,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: errorMessage },
                  }
                })
                return
              } else if (error.message.includes('not found')) {
                errorMessage = 'Ticket not found or already deleted'

                const cache = new Map(get().ticketCache)
                cache.delete(id)

                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets)
                  newSelectedTickets.delete(id)
                  const newTickets = state.tickets.filter((t) => t.id !== id)
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    ticketCache: cache,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: null },
                  }
                })
                return
              } else {
                errorMessage = error.message
              }
            }

            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: errorMessage },
            }))

            throw new Error(errorMessage)
          }
        },

        // ENHANCED: Add response with immediate ticket refresh
        addResponse: async (ticketId: number, data: AddResponseRequest) => {
          set((state) => ({
            loading: { ...state.loading, response: true },
            errors: { ...state.errors, response: null },
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
              data.attachments.forEach((file) => {
                formData.append('attachments[]', file, file.name)
              })
            }

            const response: StandardizedApiResponse<{ response: any }> = await apiClient.post(`/tickets/${ticketId}/responses`, formData)

            if (response.success) {
              console.log('✅ TicketStore: Response added successfully')
              
              // Immediately refresh the ticket to get updated conversation
              await get().actions.fetchTicket(ticketId, true)
              
              set((state) => ({
                loading: { ...state.loading, response: false },
              }))
            } else {
              throw new Error(response.message || 'Failed to add response')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add response:', error)

            let errorMessage = 'Failed to add response'
            if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, response: false },
              errors: { ...state.errors, response: errorMessage },
            }))
          }
        },

        // ENHANCED: Assign ticket with cache updates
        assignTicket: async (ticketId: number, assignedTo: number | null, reason = '') => {
          set((state) => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null },
          }))

          try {
            console.log('🎫 TicketStore: Assigning ticket:', ticketId, 'to:', assignedTo)

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/assign`, {
              assigned_to: assignedTo,
              reason,
            })

            if (response.success && response.data && response.data.ticket) {
              const state = get()
              const ticketData = response.data.ticket
              const category = state.categories.find(c => c.id === ticketData.category_id)

              const updatedTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              const existing = cache.get(ticketId)
              cache.set(ticketId, {
                data: updatedTicket,
                lastUpdate: Date.now(),
                isComplete: existing?.isComplete || isTicketDataComplete(updatedTicket)
              })

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                ticketCache: cache,
                loading: { ...state.loading, assign: false },
              }))

              console.log('✅ TicketStore: Ticket assigned successfully')
            } else {
              throw new Error(response.message || 'Failed to assign ticket')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to assign ticket:', error)

            let errorMessage = 'Failed to assign ticket'
            if (error.response?.status === 403) {
              errorMessage = 'You do not have permission to assign tickets'
            } else if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: errorMessage },
            }))
          }
        },

        // Bulk assign tickets
        bulkAssign: async (ticketIds: number[], assignedTo: number, reason = '') => {
          set((state) => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null },
          }))

          try {
            console.log('🎫 TicketStore: Bulk assigning tickets:', {
              ticketIds,
              assignedTo,
              reason,
            })

            const response: StandardizedApiResponse<{ assigned_count: number }> = await apiClient.post('/admin/bulk-assign', {
              ticket_ids: ticketIds,
              assigned_to: assignedTo,
              reason,
            })

            if (response.success && response.data) {
              const assignedCount = response.data.assigned_count

              // Refresh tickets to get updated assignments
              await get().actions.fetchTickets(undefined, true)

              set((state) => ({
                loading: { ...state.loading, assign: false },
                selectedTickets: new Set(),
              }))

              console.log('✅ TicketStore: Tickets bulk assigned successfully')
              return assignedCount
            } else {
              throw new Error(response.message || 'Failed to assign tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to bulk assign tickets:', error)

            set((state) => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: error.message || 'Failed to assign tickets' },
            }))
            return 0
          }
        },

        // ENHANCED: Tag management methods with cache updates
        addTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Adding tag:', tag, 'to ticket:', ticketId)

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'add',
              tags: [tag],
            })

            if (response.success && response.data && response.data.ticket) {
              const state = get()
              const ticketData = response.data.ticket
              const category = state.categories.find(c => c.id === ticketData.category_id)

              const updatedTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              const existing = cache.get(ticketId)
              cache.set(ticketId, {
                data: updatedTicket,
                lastUpdate: Date.now(),
                isComplete: existing?.isComplete || isTicketDataComplete(updatedTicket)
              })

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                ticketCache: cache,
              }))

              console.log('✅ TicketStore: Tag added successfully')
            } else {
              throw new Error(response.message || 'Failed to add tag')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add tag:', error)
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to add tag' },
            }))
          }
        },

        removeTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Removing tag:', tag, 'from ticket:', ticketId)

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'remove',
              tags: [tag],
            })

            if (response.success && response.data && response.data.ticket) {
              const state = get()
              const ticketData = response.data.ticket
              const category = state.categories.find(c => c.id === ticketData.category_id)

              const updatedTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              const existing = cache.get(ticketId)
              cache.set(ticketId, {
                data: updatedTicket,
                lastUpdate: Date.now(),
                isComplete: existing?.isComplete || isTicketDataComplete(updatedTicket)
              })

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                ticketCache: cache,
              }))

              console.log('✅ TicketStore: Tag removed successfully')
            } else {
              throw new Error(response.message || 'Failed to remove tag')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to remove tag:', error)
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to remove tag' },
            }))
          }
        },

        setTags: async (ticketId: number, tags: string[]) => {
          try {
            console.log('🎫 TicketStore: Setting tags for ticket:', ticketId, tags)

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'set',
              tags,
            })

            if (response.success && response.data && response.data.ticket) {
              const state = get()
              const ticketData = response.data.ticket
              const category = state.categories.find(c => c.id === ticketData.category_id)

              const updatedTicket: TicketData = {
                ...ticketData,
                category,
                slug: generateTicketSlug({ ...ticketData, category }),
                sla_deadline: category ? calculateSLADeadline({ ...ticketData, category }) : null,
                is_overdue: category ? isTicketOverdue({ ...ticketData, category }) : false,
                _dataComplete: isTicketDataComplete(ticketData),
                _lastFullLoad: isTicketDataComplete(ticketData) ? Date.now() : undefined,
              }

              // Update cache
              const cache = new Map(get().ticketCache)
              const existing = cache.get(ticketId)
              cache.set(ticketId, {
                data: updatedTicket,
                lastUpdate: Date.now(),
                isComplete: existing?.isComplete || isTicketDataComplete(updatedTicket)
              })

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                ticketCache: cache,
              }))

              console.log('✅ TicketStore: Tags set successfully')
            } else {
              throw new Error(response.message || 'Failed to set tags')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to set tags:', error)
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to set tags' },
            }))
          }
        },

        // ENHANCED: Download attachment with progress tracking
        downloadAttachment: async (attachmentId: number, fileName: string) => {
          // Track download state
          const downloadCache = new Map(get().downloadCache)
          downloadCache.set(attachmentId, { status: 'downloading', timestamp: Date.now() })
          
          set((state) => ({
            loading: { ...state.loading, download: true },
            errors: { ...state.errors, download: null },
            downloadCache: downloadCache,
          }))

          try {
            console.log('🎫 TicketStore: Starting download for attachment:', attachmentId, fileName)

            await apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`, fileName)

            // Update download cache with success
            const updatedCache = new Map(get().downloadCache)
            updatedCache.set(attachmentId, { status: 'completed', timestamp: Date.now() })

            set((state) => ({
              loading: { ...state.loading, download: false },
              downloadCache: updatedCache,
            }))

            console.log('✅ TicketStore: Attachment download initiated successfully')
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to download attachment:', error)
            
            // Update download cache with failure
            const updatedCache = new Map(get().downloadCache)
            updatedCache.set(attachmentId, { status: 'failed', timestamp: Date.now() })

            set((state) => ({
              loading: { ...state.loading, download: false },
              errors: { ...state.errors, download: error.message || 'Failed to download attachment' },
              downloadCache: updatedCache,
            }))

            throw error // Re-throw for component error handling
          }
        },

        // Filter management
        setFilters: (newFilters: TicketFilters, autoFetch = false) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 },
          }))

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchTickets()
            }, 100)
          }
        },

        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters },
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
          set((state) => {
            const newSet = new Set(state.selectedTickets)
            newSet.add(id)
            return { selectedTickets: newSet }
          })
        },

        deselectTicket: (id: number) => {
          set((state) => {
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
          set((state) => ({
            errors: { ...state.errors, [type]: null },
          }))
        },

        setError: (type: keyof TicketState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message },
          }))
        },

        // ENHANCED: Cache management methods
        invalidateCache: (ticketId?: number) => {
          if (ticketId) {
            // Invalidate specific ticket cache
            const cache = new Map(get().ticketCache)
            cache.delete(ticketId)
            set(() => ({ ticketCache: cache }))
            console.log('🗑️ TicketStore: Invalidated cache for ticket:', ticketId)
          } else {
            // Invalidate all cache
            set(() => ({ 
              lastFetch: 0,
              categoriesLastFetch: 0,
              ticketCache: new Map(),
              downloadCache: new Map(),
            }))
            console.log('🗑️ TicketStore: Invalidated all cache')
          }
        },

        clearCache: () => {
          set(() => ({
            tickets: [],
            currentTicket: null,
            categories: [],
            lastFetch: 0,
            categoriesLastFetch: 0,
            selectedTickets: new Set(),
            pagination: { ...defaultPagination },
            ticketCache: new Map(),
            downloadCache: new Map(),
          }))
          console.log('🗑️ TicketStore: Cleared all cache and data')
        },

        getCachedTicket: (id: number) => {
          const cached = get().ticketCache.get(id)
          if (cached) {
            // Check if cache is still valid (5 minutes for complete data, 2 minutes for partial)
            const maxAge = cached.isComplete ? 300000 : 120000
            if (Date.now() - cached.lastUpdate < maxAge) {
              console.log('📦 TicketStore: Retrieved valid cached ticket:', id)
              return cached.data
            } else {
              console.log('⏰ TicketStore: Cached ticket expired:', id)
            }
          }
          return null
        },

        setCachedTicket: (ticket: TicketData, isComplete = false) => {
          const cache = new Map(get().ticketCache)
          cache.set(ticket.id, {
            data: {
              ...ticket,
              _dataComplete: isComplete,
              _lastFullLoad: isComplete ? Date.now() : ticket._lastFullLoad,
            },
            lastUpdate: Date.now(),
            isComplete,
          })
          set(() => ({ ticketCache: cache }))
          console.log('💾 TicketStore: Cached ticket:', ticket.id, { isComplete })
        },

        // Export tickets with enhanced category support
        exportTickets: async (
          format: 'csv' | 'excel' | 'json' = 'csv',
          filters = {},
          selectedIds?: number[]
        ) => {
          set((state) => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
          }))

          try {
            console.log('🎫 TicketStore: Exporting tickets:', { format, filters, selectedIds })

            const queryParams = new URLSearchParams()
            queryParams.append('format', format)

            if (selectedIds && selectedIds.length > 0) {
              selectedIds.forEach((id) => queryParams.append('ticket_ids[]', id.toString()))
            } else {
              const exportFilters = { ...get().filters, ...filters }
              Object.entries(exportFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                  if (Array.isArray(value)) {
                    value.forEach((v) => queryParams.append(`${key}[]`, v.toString()))
                  } else {
                    queryParams.append(key, value.toString())
                  }
                }
              })
            }

            const response: StandardizedApiResponse<{
              tickets: any[]
              filename: string
              count: number
              exported_at: string
            }> = await apiClient.get(`/admin/export-tickets?${queryParams.toString()}`)

            if (response.success && response.data) {
              const exportData = response.data.tickets
              const filename = response.data.filename || `tickets-export-${new Date().toISOString().split('T')[0]}.csv`

              if (format === 'csv') {
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
              } else {
                const jsonContent = JSON.stringify(exportData, null, 2)
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = filename.replace('.csv', '.json')
                link.style.display = 'none'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                setTimeout(() => {
                  window.URL.revokeObjectURL(url)
                }, 1000)
              }

              set((state) => ({
                loading: { ...state.loading, list: false },
              }))
              console.log('✅ TicketStore: Tickets exported successfully')
            } else {
              throw new Error(response.message || 'Failed to export tickets')
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to export tickets:', error)
            set((state) => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to export tickets' },
            }))
          }
        },
      },
    }),
    { name: 'ticket-store' }
  )
)

// ENHANCED: Export selectors with cache-aware functions and category support
export const useTicketById = (id: number) => {
  return useTicketStore((state) => {
    try {
      // First check cache
      const cached = state.actions.getCachedTicket(id)
      if (cached) {
        return cached
      }
      
      // Fallback to current state
      return state.tickets.find((t) => t.id === id) || state.currentTicket || null
    } catch (error) {
      console.error('Error finding ticket by ID:', error)
      return null
    }
  })
}

export const useTicketBySlug = (slug: string) => {
  return useTicketStore((state) => {
    try {
      const ticketId = parseTicketIdFromSlug(slug)
      if (!ticketId) return null
      
      // Use cache-aware getter
      return state.actions.getCachedTicket(ticketId) || 
             state.tickets.find((t) => t.id === ticketId) || 
             null
    } catch (error) {
      console.error('Error finding ticket by slug:', error)
      return null
    }
  })
}

export const useTicketLoading = (type: keyof TicketState['loading'] = 'list') => {
  return useTicketStore((state) => state.loading[type])
}

export const useTicketError = (type: keyof TicketState['errors'] = 'list') => {
  return useTicketStore((state) => state.errors[type])
}

// ENHANCED: Categories selectors
export const useCategoriesData = () => {
  return useTicketStore((state) => ({
    categories: state.categories,
    loading: state.loading.categories,
    error: state.errors.categories,
    lastFetch: state.categoriesLastFetch
  }))
}

export const useCategoryById = (id: number) => {
  return useTicketStore((state) => 
    state.categories.find(c => c.id === id) || null
  )
}

export const useCategoryBySlug = (slug: string) => {
  return useTicketStore((state) => 
    state.categories.find(c => c.slug === slug) || null
  )
}

// ENHANCED: Permissions with role-based access and category support
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
      can_download_attachments: false,
      can_manage_categories: false,
      can_view_crisis_detection: false,
      can_test_crisis_detection: false,
    }
  }

  return {
    can_create: currentUser.role === 'student' || currentUser.role === 'admin',
    can_view_all: currentUser.role === 'admin',
    can_assign: currentUser.role === 'admin',
    can_modify: ['counselor', 'admin'].includes(currentUser.role),
    can_delete: currentUser.role === 'admin',
    can_export: currentUser.role === 'admin',
    can_manage_tags: ['counselor', 'admin'].includes(currentUser.role),
    can_add_internal_notes: ['counselor', 'admin'].includes(currentUser.role),
    can_bulk_assign: currentUser.role === 'admin',
    can_download_attachments: true, // All authenticated users can download
    can_manage_categories: currentUser.role === 'admin',
    can_view_crisis_detection: ['counselor', 'admin'].includes(currentUser.role),
    can_test_crisis_detection: currentUser.role === 'admin',
  }
}

// Export utility functions
export const parseTicketIdFromTicketSlug = (slug: string): number | null => {
  return parseTicketIdFromSlug(slug)
}

// ENHANCED: Generate ticket URL with category support
export const generateTicketURL = (ticket: TicketData): string => {
  const baseURL = typeof window !== 'undefined' ? window.location.origin : ''
  const slug = ticket.slug || generateTicketSlug(ticket)
  return `${baseURL}/tickets/${slug}`
}

// ENHANCED: Additional selector hooks with category support
export const useTicketSelectors = () => {
  const tickets = useTicketStore((state) => state.tickets)
  const categories = useTicketStore((state) => state.categories)
  const currentUser = authService.getStoredUser()

  return {
    tickets,
    categories,
    openTickets: tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress'),
    closedTickets: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed'),
    crisisTickets: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent'),
    unassignedTickets: tickets.filter((t) => !t.assigned_to),
    myAssignedTickets: currentUser ? tickets.filter((t) => t.assigned_to === currentUser.id) : [],
    completeTickets: tickets.filter((t) => t._dataComplete),
    incompleteTickets: tickets.filter((t) => !t._dataComplete),
    autoAssignedTickets: tickets.filter((t) => t.auto_assigned === 'yes'),
    manuallyAssignedTickets: tickets.filter((t) => t.auto_assigned === 'manual'),
    overdueTickets: tickets.filter((t) => t.is_overdue),

    // ENHANCED: Category-based groupings
    ticketsByCategory: tickets.reduce((acc, ticket) => {
      const categoryName = ticket.category?.name || 'Unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    ticketsByCategoryId: tickets.reduce((acc, ticket) => {
      const categoryId = ticket.category_id || 0
      acc[categoryId] = (acc[categoryId] || 0) + 1
      return acc
    }, {} as Record<number, number>),

    ticketsByPriority: tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    ticketsByStatus: tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    ticketsByAssignmentType: tickets.reduce((acc, ticket) => {
      const type = ticket.auto_assigned || 'no'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    // ENHANCED: Category analytics
    categoriesWithTickets: categories.filter(c => 
      tickets.some(t => t.category_id === c.id)
    ),

    categoriesWithoutTickets: categories.filter(c => 
      !tickets.some(t => t.category_id === c.id)
    ),

    selectedTicketsArray: Array.from(useTicketStore.getState().selectedTickets)
      .map((id) => tickets.find((t) => t.id === id))
      .filter(Boolean) as TicketData[],
  }
}

// ENHANCED: Ticket stats with crisis detection and category support
export const useTicketStats = () => {
  const tickets = useTicketStore((state) => state.tickets)
  const categories = useTicketStore((state) => state.categories)

  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    in_progress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
    crisis: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent').length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    high_priority: tickets.filter((t) => t.priority === 'High' || t.priority === 'Urgent').length,
    auto_assigned: tickets.filter((t) => t.auto_assigned === 'yes').length,
    manually_assigned: tickets.filter((t) => t.auto_assigned === 'manual').length,
    overdue: tickets.filter((t) => t.is_overdue).length,
    with_crisis_keywords: tickets.filter((t) => t.detected_crisis_keywords && t.detected_crisis_keywords.length > 0).length,

    // Category stats
    categories_total: categories.length,
    categories_active: categories.filter(c => c.is_active).length,
    categories_with_auto_assign: categories.filter(c => c.auto_assign).length,
    categories_with_crisis_detection: categories.filter(c => c.crisis_detection_enabled).length,

    // Performance metrics
    average_response_time: '2.3 hours', // This would come from API
    resolution_rate:
      tickets.length > 0
        ? Math.round((tickets.filter((t) => t.status === 'Resolved').length / tickets.length) * 100)
        : 0,
    auto_assignment_rate:
      tickets.length > 0
        ? Math.round((tickets.filter((t) => t.auto_assigned === 'yes').length / tickets.length) * 100)
        : 0,
    crisis_detection_rate:
      tickets.length > 0
        ? Math.round((tickets.filter((t) => t.crisis_flag).length / tickets.length) * 100)
        : 0,
  }
}

export const useTicketActions = () => {
  return useTicketStore((state) => state.actions)
}

// ENHANCED: Cache management with categories
export const useTicketCache = () => {
  const ticketCache = useTicketStore((state) => state.ticketCache)
  const downloadCache = useTicketStore((state) => state.downloadCache)
  const categoriesLastFetch = useTicketStore((state) => state.categoriesLastFetch)
  
  return {
    ticketCache,
    downloadCache,
    categoriesLastFetch,
    getCacheStats: () => ({
      totalCachedTickets: ticketCache.size,
      completeTickets: Array.from(ticketCache.values()).filter(c => c.isComplete).length,
      activeDownloads: Array.from(downloadCache.values()).filter(d => d.status === 'downloading').length,
      oldestCacheEntry: Math.min(...Array.from(ticketCache.values()).map(c => c.lastUpdate)),
      categoriesCacheAge: categoriesLastFetch > 0 ? Date.now() - categoriesLastFetch : 0,
    }),
  }
}

// ENHANCED: Category utilities
export const useCategoryUtilities = () => {
  const categories = useTicketStore((state) => state.categories)
  
  return {
    getCategoryOptions: () => categories.filter(c => c.is_active).map(c => ({
      value: c.id,
      label: c.name,
      description: c.description,
      color: c.color,
      icon: c.icon,
      sla_hours: c.sla_response_hours,
      auto_assign: c.auto_assign,
      crisis_detection: c.crisis_detection_enabled
    })),

    getCategorySelectOptions: () => categories.filter(c => c.is_active).map(c => ({
      value: c.id.toString(),
      label: c.name,
      description: c.description
    })),

    getCategoryByIdSafe: (id: number) => categories.find(c => c.id === id),
    
    getCategoryBySlugSafe: (slug: string) => categories.find(c => c.slug === slug),
    
    getActiveCategoriesCount: () => categories.filter(c => c.is_active).length,
    
    getCategoriesWithAutoAssign: () => categories.filter(c => c.auto_assign),
    
    getCategoriesWithCrisisDetection: () => categories.filter(c => c.crisis_detection_enabled),
  }
}

// ENHANCED: Crisis detection utilities
export const useCrisisDetectionUtilities = () => {
  const testCrisisDetection = useTicketStore((state) => state.actions.testCrisisDetection)
  
  return {
    testCrisisDetection,
    
    detectCrisisKeywords: (text: string): boolean => {
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
    },
    
    getCrisisLevelColor: (level: string): string => {
      switch (level) {
        case 'critical':
          return 'bg-red-100 text-red-800 border-red-200'
        case 'high':
          return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'medium':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'low':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    },
    
    getCrisisScoreColor: (score: number): string => {
      if (score >= 1000) return 'text-red-600 font-bold'
      if (score >= 500) return 'text-orange-600 font-semibold'
      if (score >= 100) return 'text-yellow-600'
      return 'text-gray-600'
    }
  }
}

// ENHANCED: SLA and deadline utilities
export const useSLAUtilities = () => {
  return {
    calculateSLADeadline: (ticket: TicketData): string | null => {
      return calculateSLADeadline(ticket)
    },
    
    isTicketOverdue: (ticket: TicketData): boolean => {
      return isTicketOverdue(ticket)
    },
    
    getTimeRemaining: (deadline: string): { time: string; urgent: boolean; overdue: boolean } => {
      const deadlineDate = new Date(deadline)
      const now = new Date()
      const diffMs = deadlineDate.getTime() - now.getTime()
      
      if (diffMs <= 0) {
        return { time: 'Overdue', urgent: true, overdue: true }
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (hours < 1) {
        return { time: `${minutes}m`, urgent: true, overdue: false }
      } else if (hours < 24) {
        return { time: `${hours}h ${minutes}m`, urgent: hours < 2, overdue: false }
      } else {
        const days = Math.floor(hours / 24)
        const remainingHours = hours % 24
        return { time: `${days}d ${remainingHours}h`, urgent: false, overdue: false }
      }
    },
    
    getSLAStatusColor: (ticket: TicketData): string => {
      if (ticket.is_overdue) {
        return 'bg-red-100 text-red-800 border-red-200'
      }
      
      if (ticket.sla_deadline) {
        const deadline = new Date(ticket.sla_deadline)
        const now = new Date()
        const diffMs = deadline.getTime() - now.getTime()
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        
        if (hours < 2) {
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      }
      
      return 'bg-green-100 text-green-800 border-green-200'
    }
  }
}

// Export store for direct access when needed
export default useTicketStore