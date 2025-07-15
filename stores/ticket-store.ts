// stores/ticket-store.ts - UPDATED for Laravel Standardized Response Format

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiClient, StandardizedApiResponse } from '@/lib/api'
import { authService } from '@/services/auth.service'

// Enhanced TicketData with slug generation
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
  slug?: string
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

// UPDATED store interface with standardized response handling
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
  
  // COMPLETE ACTIONS INTERFACE - UPDATED for standardized responses
  actions: {
    // Data fetching
    fetchTickets: (params?: Partial<TicketFilters>) => Promise<void>
    fetchTicket: (id: number) => Promise<void>
    fetchTicketBySlug: (slug: string) => Promise<void>
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
    exportTickets: (format: 'csv' | 'excel' | 'json', filters?: Partial<TicketFilters>, selectedIds?: number[]) => Promise<void>
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

// ENHANCED: Generate dynamic slug for tickets
const generateTicketSlug = (ticket: TicketData): string => {
  const sanitizedSubject = ticket.subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  return `${ticket.id}-${sanitizedSubject}-${ticket.ticket_number.toLowerCase()}`
}

// ENHANCED: Parse ticket ID from slug with better validation
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

// UPDATED: Enhanced store with standardized response handling
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
        download: false,
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
      },

      pagination: { ...defaultPagination },
      lastFetch: 0,
      selectedTickets: new Set<number>(),

      actions: {
        // UPDATED: fetchTickets with standardized response handling
        fetchTickets: async (params?: Partial<TicketFilters>) => {
          const state = get();

          // Merge provided params with current filters
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters;

          // Prevent too frequent calls (unless forced with new params)
          if (!params && Date.now() - state.lastFetch < 1000) {
            console.log('🎫 TicketStore: Skipping fetch (too recent)');
            return;
          }

          set((state) => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
            filters: mergedFilters,
          }));

          try {
            console.log('🎫 TicketStore: Fetching tickets with params:', mergedFilters);

            const queryString = buildQueryString(mergedFilters);
            const response: StandardizedApiResponse<{
              tickets: any[]
              pagination: any
              stats: any
              user_role: string
            }> = await apiClient.get(`/tickets?${queryString}`);

            if (response.success && response.data) {
              const { tickets, pagination, stats } = response.data;

              // Generate slugs for all tickets
              const ticketsWithSlugs =
                tickets?.map((ticket: TicketData) => ({
                  ...ticket,
                  slug: generateTicketSlug(ticket),
                })) || [];

              set(() => ({
                tickets: ticketsWithSlugs,
                pagination: pagination || defaultPagination,
                lastFetch: Date.now(),
                loading: { ...get().loading, list: false },
              }));

              console.log(
                '✅ TicketStore: Tickets fetched successfully:',
                ticketsWithSlugs?.length || 0
              );
            } else {
              throw new Error(response.message || 'Failed to fetch tickets');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch tickets:', error);
            set((state) => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to fetch tickets' },
            }));
          }
        },

        // UPDATED: Fetch single ticket with standardized response handling
        fetchTicket: async (id: number) => {
          if (!id || isNaN(id)) {
            console.error('❌ TicketStore: Invalid ticket ID provided:', id);
            set((state) => ({
              errors: { ...state.errors, details: 'Invalid ticket ID' },
            }));
            return;
          }

          set((state) => ({
            loading: { ...state.loading, details: true },
            errors: { ...state.errors, details: null },
          }));

          try {
            console.log('🎫 TicketStore: Fetching ticket:', id);

            const response: StandardizedApiResponse<{ 
              ticket: any
              permissions?: any 
            }> = await apiClient.get(`/tickets/${id}`);

            if (response.success && response.data && response.data.ticket) {
              const ticket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                currentTicket: ticket,
                tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
                loading: { ...state.loading, details: false },
              }));

              console.log('✅ TicketStore: Ticket fetched successfully');
            } else {
              throw new Error(response.message || 'Ticket not found or access denied');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to fetch ticket:', error);

            let errorMessage = 'Failed to fetch ticket details';
            if (error.response?.status === 404) {
              errorMessage = 'Ticket not found';
            } else if (error.response?.status === 403) {
              errorMessage = 'You do not have permission to view this ticket';
            } else if (error.message && !error.message.includes('HTML')) {
              errorMessage = error.message;
            }

            set((state) => ({
              loading: { ...state.loading, details: false },
              errors: { ...state.errors, details: errorMessage },
              currentTicket: null,
            }));
          }
        },

        // UPDATED: Fetch ticket by slug with standardized response handling
        fetchTicketBySlug: async (slug: string) => {
          const ticketId = parseTicketIdFromSlug(slug);

          if (!ticketId) {
            console.error('❌ TicketStore: Invalid ticket slug:', slug);
            set((state) => ({
              errors: { ...state.errors, details: 'Invalid ticket URL format' },
              currentTicket: null,
            }));
            return;
          }

          console.log('🎫 TicketStore: Fetching ticket by slug:', slug, '-> ID:', ticketId);
          await get().actions.fetchTicket(ticketId);
        },

        // Refresh tickets
        refreshTickets: async () => {
          set(() => ({ lastFetch: 0 }));
          await get().actions.fetchTickets();
        },

        // UPDATED: Create ticket with standardized response handling
        createTicket: async (data: CreateTicketRequest) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }));

          try {
            console.log('🎫 TicketStore: Creating ticket');

            const formData = new FormData();
            formData.append('subject', data.subject.trim());
            formData.append('description', data.description.trim());
            formData.append('category', data.category);

            if (data.priority) {
              formData.append('priority', data.priority);
            }

            if (data.created_for) {
              formData.append('created_for', data.created_for.toString());
            }

            if (data.attachments) {
              data.attachments.forEach((file) => {
                formData.append('attachments[]', file, file.name);
              });
            }

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post('/tickets', formData);

            if (response.success && response.data?.ticket) {
              const newTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: [newTicket, ...state.tickets],
                currentTicket: newTicket,
                loading: { ...state.loading, create: false },
              }));

              console.log('✅ TicketStore: Ticket created successfully');
              return newTicket;
            } else {
              throw new Error(response.message || 'Failed to create ticket');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to create ticket:', error);
            let errorMessage = 'Failed to create ticket. Please try again.';

            if (error.response?.data?.errors) {
              const errors = Object.values(error.response.data.errors).flat();
              errorMessage = errors.join(', ');
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: errorMessage },
            }));
            return null;
          }
        },

        // UPDATED: Update ticket with standardized response handling
        updateTicket: async (id: number, data: UpdateTicketRequest) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }));

          try {
            console.log('🎫 TicketStore: Updating ticket:', id, data);

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.patch(`/tickets/${id}`, data);

            if (response.success && response.data?.ticket) {
              const updatedTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
                currentTicket: state.currentTicket?.id === id ? updatedTicket : state.currentTicket,
                loading: { ...state.loading, update: false },
              }));

              console.log('✅ TicketStore: Ticket updated successfully');
            } else {
              throw new Error(response.message || 'Failed to update ticket');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to update ticket:', error);

            let errorMessage = 'Failed to update ticket';
            if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: errorMessage },
            }));
          }
        },

        // UPDATED: Delete ticket with standardized response handling
        deleteTicket: async (id: number, reason = 'Deleted by admin', notifyUser = false) => {
          console.log('🎫 TicketStore: Starting ticket deletion:', id);

          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }));

          try {
            console.log('🎫 TicketStore: Calling delete API:', { id, reason, notifyUser });

            const response: StandardizedApiResponse<{
              ticket_number?: string
              deletion_reason?: string
              user_notified?: boolean
              deleted_by?: any
            }> = await apiClient.delete(`/tickets/${id}`, {
              reason: reason.trim(),
              notify_user: notifyUser,
            });

            if (response.success) {
              console.log('✅ TicketStore: Delete API call successful, updating state immediately');

              // Immediate and atomic state cleanup
              set((state) => {
                const newSelectedTickets = new Set(state.selectedTickets);
                newSelectedTickets.delete(id);

                const newTickets = state.tickets.filter((t) => t.id !== id);
                const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket;

                return {
                  tickets: newTickets,
                  currentTicket: newCurrentTicket,
                  selectedTickets: newSelectedTickets,
                  loading: { ...state.loading, delete: false },
                  errors: { ...state.errors, delete: null },
                };
              });

              console.log('✅ TicketStore: State updated successfully, ticket deleted');
            } else {
              let errorMessage = response.message || 'Failed to delete ticket';

              // For timeout errors, suggest the user refresh to check
              if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
                errorMessage =
                  'Delete operation timed out. Please refresh the page to check if the ticket was deleted.';

                // For timeouts, still remove from local state as it might have succeeded
                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets);
                  newSelectedTickets.delete(id);
                  const newTickets = state.tickets.filter((t) => t.id !== id);
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket;

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: errorMessage },
                  };
                });

                return;
              }

              throw new Error(errorMessage);
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to delete ticket:', error);

            let errorMessage = 'Failed to delete ticket';

            if (error.message) {
              if (error.message.includes('timeout')) {
                errorMessage =
                  'Delete operation timed out. Please refresh the page to check if the ticket was deleted.';

                // For timeout errors, optimistically remove from state
                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets);
                  newSelectedTickets.delete(id);
                  const newTickets = state.tickets.filter((t) => t.id !== id);
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket;

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: errorMessage },
                  };
                });
                return;
              } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
              } else if (error.message.includes('permission')) {
                errorMessage = 'You do not have permission to delete this ticket';
              } else if (error.message.includes('not found')) {
                errorMessage = 'Ticket not found or already deleted';

                // If ticket not found, remove it from local state
                set((state) => {
                  const newSelectedTickets = new Set(state.selectedTickets);
                  newSelectedTickets.delete(id);
                  const newTickets = state.tickets.filter((t) => t.id !== id);
                  const newCurrentTicket = state.currentTicket?.id === id ? null : state.currentTicket;

                  return {
                    tickets: newTickets,
                    currentTicket: newCurrentTicket,
                    selectedTickets: newSelectedTickets,
                    loading: { ...state.loading, delete: false },
                    errors: { ...state.errors, delete: null },
                  };
                });
                return;
              } else {
                errorMessage = error.message;
              }
            }

            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: errorMessage },
            }));

            throw new Error(errorMessage);
          }
        },

        // UPDATED: Add response with standardized response handling
        addResponse: async (ticketId: number, data: AddResponseRequest) => {
          set((state) => ({
            loading: { ...state.loading, response: true },
            errors: { ...state.errors, response: null },
          }));

          try {
            console.log('🎫 TicketStore: Adding response to ticket:', ticketId);

            const formData = new FormData();
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

            if (data.attachments && data.attachments.length > 0) {
              data.attachments.forEach((file) => {
                formData.append('attachments[]', file, file.name);
              });
            }

            const response: StandardizedApiResponse<{ response: any }> = await apiClient.post(`/tickets/${ticketId}/responses`, formData);

            if (response.success) {
              console.log('✅ TicketStore: Response added successfully');
              
              // Refresh the ticket to get updated conversation
              await get().actions.fetchTicket(ticketId);
              
              set((state) => ({
                loading: { ...state.loading, response: false },
              }));
            } else {
              throw new Error(response.message || 'Failed to add response');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add response:', error);

            let errorMessage = 'Failed to add response';
            if (error.message) {
              errorMessage = error.message;
            }

            set((state) => ({
              loading: { ...state.loading, response: false },
              errors: { ...state.errors, response: errorMessage },
            }));
          }
        },

        // UPDATED: Assign ticket with standardized response handling
        assignTicket: async (ticketId: number, assignedTo: number | null, reason = '') => {
          set((state) => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null },
          }));

          try {
            console.log('🎫 TicketStore: Assigning ticket:', ticketId, 'to:', assignedTo);

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/assign`, {
              assigned_to: assignedTo,
              reason,
            });

            if (response.success && response.data?.ticket) {
              const updatedTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
                loading: { ...state.loading, assign: false },
              }));

              console.log('✅ TicketStore: Ticket assigned successfully');
            } else {
              throw new Error(response.message || 'Failed to assign ticket');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to assign ticket:', error);

            let errorMessage = 'Failed to assign ticket';
            if (error.response?.status === 403) {
              errorMessage = 'You do not have permission to assign tickets';
            } else if (error.message) {
              errorMessage = error.message;
            }

            set((state) => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: errorMessage },
            }));
          }
        },

        // UPDATED: Bulk assign with standardized response handling
        bulkAssign: async (ticketIds: number[], assignedTo: number, reason = '') => {
          set((state) => ({
            loading: { ...state.loading, assign: true },
            errors: { ...state.errors, assign: null },
          }));

          try {
            console.log('🎫 TicketStore: Bulk assigning tickets:', {
              ticketIds,
              assignedTo,
              reason,
            });

            const response: StandardizedApiResponse<{ assigned_count: number }> = await apiClient.post('/admin/bulk-assign', {
              ticket_ids: ticketIds,
              assigned_to: assignedTo,
              reason,
            });

            if (response.success && response.data) {
              const assignedCount = response.data.assigned_count;

              // Refresh tickets to get updated assignments
              await get().actions.fetchTickets();

              set((state) => ({
                loading: { ...state.loading, assign: false },
                selectedTickets: new Set(),
              }));

              console.log('✅ TicketStore: Tickets bulk assigned successfully');
              return assignedCount;
            } else {
              throw new Error(response.message || 'Failed to assign tickets');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to bulk assign tickets:', error);
            set((state) => ({
              loading: { ...state.loading, assign: false },
              errors: { ...state.errors, assign: error.message || 'Failed to assign tickets' },
            }));
            return 0;
          }
        },

        // UPDATED: Tag management with standardized response handling
        addTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Adding tag:', tag, 'to ticket:', ticketId);

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'add',
              tags: [tag],
            });

            if (response.success && response.data?.ticket) {
              const updatedTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
              }));

              console.log('✅ TicketStore: Tag added successfully');
            } else {
              throw new Error(response.message || 'Failed to add tag');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to add tag:', error);
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to add tag' },
            }));
          }
        },

        removeTag: async (ticketId: number, tag: string) => {
          try {
            console.log('🎫 TicketStore: Removing tag:', tag, 'from ticket:', ticketId);

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'remove',
              tags: [tag],
            });

            if (response.success && response.data?.ticket) {
              const updatedTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
              }));

              console.log('✅ TicketStore: Tag removed successfully');
            } else {
              throw new Error(response.message || 'Failed to remove tag');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to remove tag:', error);
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to remove tag' },
            }));
          }
        },

        setTags: async (ticketId: number, tags: string[]) => {
          try {
            console.log('🎫 TicketStore: Setting tags for ticket:', ticketId, tags);

            const response: StandardizedApiResponse<{ ticket: any }> = await apiClient.post(`/tickets/${ticketId}/tags`, {
              action: 'set',
              tags,
            });

            if (response.success && response.data?.ticket) {
              const updatedTicket = {
                ...response.data.ticket,
                slug: generateTicketSlug(response.data.ticket),
              };

              set((state) => ({
                tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
                currentTicket:
                  state.currentTicket?.id === ticketId ? updatedTicket : state.currentTicket,
              }));

              console.log('✅ TicketStore: Tags set successfully');
            } else {
              throw new Error(response.message || 'Failed to set tags');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to set tags:', error);
            set((state) => ({
              errors: { ...state.errors, update: error.message || 'Failed to set tags' },
            }));
          }
        },

        // UPDATED: Download attachment with better error handling
        downloadAttachment: async (attachmentId: number, fileName: string) => {
          set((state) => ({
            loading: { ...state.loading, download: true },
            errors: { ...state.errors, download: null },
          }));

          try {
            console.log('🎫 TicketStore: Downloading attachment:', attachmentId);

            await apiClient.downloadFile(`/tickets/attachments/${attachmentId}/download`, fileName);

            set((state) => ({
              loading: { ...state.loading, download: false },
            }));

            console.log('✅ TicketStore: Attachment download initiated successfully');
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to download attachment:', error);
            set((state) => ({
              loading: { ...state.loading, download: false },
              errors: { ...state.errors, download: 'Failed to download attachment' },
            }));
          }
        },

        // Filter management with better state handling
        setFilters: (newFilters: TicketFilters, autoFetch = false) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 },
          }));

          if (autoFetch) {
            // Use setTimeout to ensure state is updated before fetch
            setTimeout(() => {
              get().actions.fetchTickets();
            }, 100);
          }
        },

        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters },
          }));

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchTickets();
            }, 100);
          }
        },

        // UI state management with proper cleanup
        setCurrentTicket: (ticket: TicketData | null) => {
          set(() => ({ currentTicket: ticket }));
        },

        selectTicket: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedTickets);
            newSet.add(id);
            return { selectedTickets: newSet };
          });
        },

        deselectTicket: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedTickets);
            newSet.delete(id);
            return { selectedTickets: newSet };
          });
        },

        clearSelection: () => {
          set(() => ({ selectedTickets: new Set<number>() }));
        },

        // Error handling
        clearError: (type: keyof TicketState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [type]: null },
          }));
        },

        setError: (type: keyof TicketState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message },
          }));
        },

        // Cache management
        invalidateCache: () => {
          set(() => ({ lastFetch: 0 }));
        },

        clearCache: () => {
          set(() => ({
            tickets: [],
            currentTicket: null,
            lastFetch: 0,
            selectedTickets: new Set(),
            pagination: { ...defaultPagination },
          }));
        },

        // UPDATED: Export tickets with standardized response handling
        exportTickets: async (
          format: 'csv' | 'excel' | 'json' = 'csv',
          filters = {},
          selectedIds?: number[]
        ) => {
          set((state) => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
          }));

          try {
            console.log('🎫 TicketStore: Exporting tickets:', { format, filters, selectedIds });

            const queryParams = new URLSearchParams();
            queryParams.append('format', format);

            // If specific ticket IDs are provided, use them
            if (selectedIds && selectedIds.length > 0) {
              selectedIds.forEach((id) => queryParams.append('ticket_ids[]', id.toString()));
            } else {
              // Add current filters
              const exportFilters = { ...get().filters, ...filters };
              Object.entries(exportFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                  if (Array.isArray(value)) {
                    value.forEach((v) => queryParams.append(`${key}[]`, v.toString()));
                  } else {
                    queryParams.append(key, value.toString());
                  }
                }
              });
            }

            const response: StandardizedApiResponse<{
              tickets: any[]
              filename: string
              count: number
              exported_at: string
            }> = await apiClient.get(`/admin/export-tickets?${queryParams.toString()}`);

            if (response.success && response.data) {
              // Handle client-side CSV generation
              const exportData = response.data.tickets;
              const filename = response.data.filename || `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;

              if (format === 'csv') {
                // Generate CSV content
                const headers = Object.keys(exportData[0] || {});
                const csvContent = [
                  headers.join(','),
                  ...exportData.map((row: any) =>
                    headers
                      .map((header) => {
                        const value = row[header] || '';
                        // Escape commas and quotes in CSV
                        return typeof value === 'string' &&
                          (value.includes(',') || value.includes('"'))
                          ? `"${value.replace(/"/g, '""')}"`
                          : value;
                      })
                      .join(',')
                  ),
                ].join('\n');

                // Create and download CSV file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              } else {
                // For JSON format
                const jsonContent = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename.replace('.csv', '.json');
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                setTimeout(() => {
                  window.URL.revokeObjectURL(url);
                }, 1000);
              }

              set((state) => ({
                loading: { ...state.loading, list: false },
              }));
              console.log('✅ TicketStore: Tickets exported successfully');
            } else {
              throw new Error(response.message || 'Failed to export tickets');
            }
          } catch (error: any) {
            console.error('❌ TicketStore: Failed to export tickets:', error);
            set((state) => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to export tickets' },
            }));
          }
        },
      },
    }),
    { name: 'ticket-store' }
  )
);

export const parseTicketIdFromTicketSlug = (slug: string): number | null => {
  return parseTicketIdFromSlug(slug);
};

// ENHANCED: Export selectors with better error handling
export const useTicketById = (id: number) => {
  return useTicketStore((state) => {
    try {
      return state.tickets.find((t) => t.id === id) || null;
    } catch (error) {
      console.error('Error finding ticket by ID:', error);
      return null;
    }
  });
};

export const useTicketBySlug = (slug: string) => {
  return useTicketStore((state) => {
    try {
      const ticketId = parseTicketIdFromSlug(slug);
      return ticketId ? state.tickets.find((t) => t.id === ticketId) || null : null;
    } catch (error) {
      console.error('Error finding ticket by slug:', error);
      return null;
    }
  });
};

export const useTicketLoading = (type: keyof TicketState['loading'] = 'list') => {
  return useTicketStore((state) => state.loading[type]);
};

export const useTicketError = (type: keyof TicketState['errors'] = 'list') => {
  return useTicketStore((state) => state.errors[type]);
};

// UPDATED: Permissions with admin-only assignment
export const useTicketPermissions = () => {
  const currentUser = authService.getStoredUser();

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
    };
  }

  return {
    can_create: currentUser.role === 'student' || currentUser.role === 'admin',
    can_view_all: currentUser.role === 'admin',
    can_assign: currentUser.role === 'admin', // Only admin can assign
    can_modify: ['counselor', 'admin'].includes(currentUser.role),
    can_delete: currentUser.role === 'admin',
    can_export: currentUser.role === 'admin',
    can_manage_tags: ['counselor', 'admin'].includes(currentUser.role),
    can_add_internal_notes: ['counselor', 'admin'].includes(currentUser.role),
    can_bulk_assign: currentUser.role === 'admin', // Only admin can bulk assign
    can_download_attachments: true, // All users can download attachments
  };
};

// ENHANCED SELECTORS WITH MEMOIZATION
export const useTicketSelectors = () => {
  const tickets = useTicketStore((state) => state.tickets);
  const currentUser = authService.getStoredUser();

  return {
    tickets,
    openTickets: tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress'),
    closedTickets: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed'),
    crisisTickets: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent'),
    unassignedTickets: tickets.filter((t) => !t.assigned_to),
    myAssignedTickets: currentUser ? tickets.filter((t) => t.assigned_to === currentUser.id) : [],

    // Advanced selectors
    ticketsByCategory: tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    ticketsByPriority: tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    ticketsByStatus: tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    // Get selected tickets as array
    selectedTicketsArray: Array.from(useTicketStore.getState().selectedTickets)
      .map((id) => tickets.find((t) => t.id === id))
      .filter(Boolean) as TicketData[],
  };
};

export const useTicketStats = () => {
  const tickets = useTicketStore((state) => state.tickets);

  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    in_progress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
    crisis: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent').length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    high_priority: tickets.filter((t) => t.priority === 'High' || t.priority === 'Urgent').length,

    // Performance metrics
    average_response_time: '2.3 hours', // This would come from API
    resolution_rate:
      tickets.length > 0
        ? Math.round((tickets.filter((t) => t.status === 'Resolved').length / tickets.length) * 100)
        : 0,
  };
};

export const useTicketFilters = () => {
  const filters = useTicketStore((state) => state.filters);
  const { setFilters, clearFilters } = useTicketStore((state) => state.actions);

  return {
    filters,
    setFilters,
    clearFilters,

    // Quick filter helpers
    filterByStatus: (status: string) => setFilters({ status }, true),
    filterByCategory: (category: string) => setFilters({ category }, true),
    filterByPriority: (priority: string) => setFilters({ priority }, true),
    searchTickets: (search: string) => setFilters({ search }, true),
  };
};

// UTILITY HOOKS
export const useTicketActions = () => {
  return useTicketStore((state) => state.actions);
};

export const useTicketPagination = () => {
  const pagination = useTicketStore((state) => state.pagination);
  const { setFilters } = useTicketStore((state) => state.actions);

  return {
    ...pagination,
    goToPage: (page: number) => setFilters({ page }, true),
    nextPage: () => {
      if (pagination.current_page < pagination.last_page) {
        setFilters({ page: pagination.current_page + 1 }, true);
      }
    },
    prevPage: () => {
      if (pagination.current_page > 1) {
        setFilters({ page: pagination.current_page - 1 }, true);
      }
    },
  };
};

// UTILITY FUNCTIONS FOR STORE MANAGEMENT
export const initializeTicketStore = () => {
  const currentUser = authService.getStoredUser();
  console.log('🎫 TicketStore: Initialized for user:', currentUser?.role);
};

export const setupTicketAutoRefresh = (intervalMs: number = 60000) => {
  let intervalId: NodeJS.Timeout;

  const startAutoRefresh = () => {
    intervalId = setInterval(() => {
      const state = useTicketStore.getState();
      // Only auto-refresh if user is actively viewing tickets
      if (document.visibilityState === 'visible' && Date.now() - state.lastFetch > intervalMs) {
        state.actions.fetchTickets();
      }
    }, intervalMs);
  };

  const stopAutoRefresh = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };

  return { startAutoRefresh, stopAutoRefresh };
};

// DEBUG UTILITIES (DEVELOPMENT ONLY)
export const debugTicketStore = () => {
  if (process.env.NODE_ENV === 'development') {
    const state = useTicketStore.getState();

    console.group('🎫 TicketStore Debug Info');
    console.log('Total tickets:', state.tickets.length);
    console.log('Current filters:', state.filters);
    console.log('Loading states:', state.loading);
    console.log('Error states:', state.errors);
    console.log('Selected tickets:', state.selectedTickets.size);
    console.log('Last fetch:', new Date(state.lastFetch).toLocaleString());
    console.groupEnd();

    return state;
  }
};

// PERFORMANCE MONITORING
export const getTicketStoreMetrics = () => {
  const state = useTicketStore.getState();

  return {
    totalTickets: state.tickets.length,
    memoryUsage: JSON.stringify(state).length,
    cacheAge: Date.now() - state.lastFetch,
    selectedCount: state.selectedTickets.size,
    hasErrors: Object.values(state.errors).some((error) => error !== null),
    isLoading: Object.values(state.loading).some((loading) => loading === true),
  };
};

// Export default store
export default useTicketStore;