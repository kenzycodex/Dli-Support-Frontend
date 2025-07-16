// stores/help-store.ts - FIXED: Stable and optimized like ticket store

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { helpService, type FAQ, type HelpCategory, type FAQFilters } from '@/services/help.service'
import { toast } from 'sonner'

// Enhanced interfaces with proper TypeScript compatibility
export interface HelpFAQ extends FAQ {
  slug: string // Always required
  is_suggestion?: boolean
  suggestion_type?: 'content_suggestion' | 'revision_requested'
  creator_name?: string
}

export interface HelpSuggestion extends HelpFAQ {
  is_suggestion: true
  suggestion_status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  submitted_at: string
  admin_feedback?: string
}

// FIXED: Use the actual HelpStats interface from service and extend it
export interface AdminHelpStats {
  total_faqs: number
  published_faqs: number
  draft_faqs: number
  featured_faqs: number
  categories_count: number
  active_categories: number
  suggested_faqs: number
  total_views: number
  total_helpful_votes: number
}

// Status filter type with proper literal types
export type StatusFilter = 'all' | 'published' | 'unpublished' | 'featured'

// Proper interface extension with correct typing
export interface ExtendedFAQFilters extends FAQFilters {
  status?: StatusFilter
}

// Store state interface - Simple and clean like ticket store
interface HelpState {
  // Core data - Simple arrays and objects only
  faqs: HelpFAQ[]
  categories: HelpCategory[]
  suggestions: HelpSuggestion[]
  currentFAQ: HelpFAQ | null
  currentCategory: HelpCategory | null
  filters: ExtendedFAQFilters
  
  // Simple loading states - ALL OPERATIONS COVERED
  loading: {
    faqs: boolean
    categories: boolean
    suggestions: boolean
    create: boolean
    update: boolean
    delete: boolean
    approve: boolean
    reject: boolean
    stats: boolean
  }
  
  // Simple error states - ALL OPERATIONS COVERED
  errors: {
    faqs: string | null
    categories: string | null
    suggestions: string | null
    create: string | null
    update: string | null
    delete: string | null
    approve: string | null
    reject: string | null
    stats: string | null
  }
  
  // Simple pagination
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  
  // Simple cache timestamp
  lastFetch: {
    faqs: number
    categories: number
    suggestions: number
    stats: number
  }
  
  // Simple UI state
  selectedFAQs: Set<number>
  stats: AdminHelpStats | null
  
  // COMPLETE ACTIONS INTERFACE
  actions: {
    // Data fetching
    fetchFAQs: (params?: Partial<ExtendedFAQFilters>) => Promise<void>
    fetchCategories: (includeInactive?: boolean) => Promise<void>
    fetchStats: () => Promise<void>
    refreshAll: () => Promise<void>
    
    // FAQ CRUD operations
    createFAQ: (data: Partial<FAQ>) => Promise<HelpFAQ | null>
    updateFAQ: (id: number, data: Partial<FAQ>) => Promise<void>
    deleteFAQ: (id: number) => Promise<void>
    togglePublishFAQ: (id: number) => Promise<void>
    toggleFeatureFAQ: (id: number) => Promise<void>
    
    // Category CRUD operations
    createCategory: (data: Partial<HelpCategory>) => Promise<HelpCategory | null>
    updateCategory: (id: number, data: Partial<HelpCategory>) => Promise<void>
    deleteCategory: (id: number) => Promise<void>
    
    // Suggestion management
    approveSuggestion: (id: number) => Promise<void>
    rejectSuggestion: (id: number, feedback?: string) => Promise<void>
    
    // Filter management
    setFilters: (filters: Partial<ExtendedFAQFilters>, autoFetch?: boolean) => void
    clearFilters: (autoFetch?: boolean) => void
    
    // UI state management
    setCurrentFAQ: (faq: HelpFAQ | null) => void
    setCurrentCategory: (category: HelpCategory | null) => void
    selectFAQ: (id: number) => void
    deselectFAQ: (id: number) => void
    clearSelection: () => void
    
    // Error handling
    clearError: (type: keyof HelpState['errors']) => void
    setError: (type: keyof HelpState['errors'], message: string) => void
    
    // Cache management
    invalidateCache: () => void
    clearCache: () => void
  }
}

// Default values
const defaultFilters: ExtendedFAQFilters = {
  page: 1,
  per_page: 20,
  sort_by: 'newest',
  include_drafts: true,
  status: 'all'
}

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
}

const defaultStats: AdminHelpStats = {
  total_faqs: 0,
  published_faqs: 0,
  draft_faqs: 0,
  featured_faqs: 0,
  categories_count: 0,
  active_categories: 0,
  suggested_faqs: 0,
  total_views: 0,
  total_helpful_votes: 0
}

// Generate slug for FAQ - ensure it's always a string
const generateFAQSlug = (faq: FAQ): string => {
  const sanitizedQuestion = faq.question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  return `${faq.id}-${sanitizedQuestion}`
}

// Check if FAQ is a suggestion
const isFAQSuggestion = (faq: FAQ, currentUserId?: number): boolean => {
  return !faq.is_published && 
         !!faq.created_by && 
         faq.created_by !== currentUserId
}

// Convert FAQ to suggestion format with proper typing
const convertToSuggestion = (faq: HelpFAQ): HelpSuggestion => {
  return {
    ...faq,
    is_suggestion: true as const,
    suggestion_status: 'pending' as const,
    submitted_at: faq.created_at,
    suggestion_type: faq.tags?.includes('revision-requested') ? 'revision_requested' : 'content_suggestion',
    creator_name: faq.creator?.name || 'Unknown'
  }
}

// Enhanced help store - Clean and stable like ticket store
export const useHelpStore = create<HelpState>()(
  devtools(
    (set, get) => ({
      // Initial state - Simple and clean
      faqs: [],
      categories: [],
      suggestions: [],
      currentFAQ: null,
      currentCategory: null,
      filters: { ...defaultFilters },
      
      loading: {
        faqs: false,
        categories: false,
        suggestions: false,
        create: false,
        update: false,
        delete: false,
        approve: false,
        reject: false,
        stats: false,
      },
      
      errors: {
        faqs: null,
        categories: null,
        suggestions: null,
        create: null,
        update: null,
        delete: null,
        approve: null,
        reject: null,
        stats: null,
      },
      
      pagination: { ...defaultPagination },
      
      lastFetch: {
        faqs: 0,
        categories: 0,
        suggestions: 0,
        stats: 0,
      },
      
      selectedFAQs: new Set<number>(),
      stats: null,
      
      actions: {
        // Fetch FAQs with proper admin support
        fetchFAQs: async (params?: Partial<ExtendedFAQFilters>) => {
          const state = get()
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters
          
          // Prevent too frequent calls
          if (!params && Date.now() - state.lastFetch.faqs < 1000) {
            console.log('🎯 HelpStore: Skipping FAQ fetch (too recent)')
            return
          }
          
          set((state) => ({
            loading: { ...state.loading, faqs: true },
            errors: { ...state.errors, faqs: null },
            filters: mergedFilters,
          }))
          
          try {
            console.log('🎯 HelpStore: Fetching FAQs with filters:', mergedFilters)
            
            // Convert extended filters to base FAQ filters
            const { status, ...baseFAQFilters } = mergedFilters
            
            // Use admin endpoint if needed
            const response = await helpService.getAdminFAQs({
              ...baseFAQFilters,
              userRole: 'admin',
              forceRefresh: true
            })
            
            if (response.success && response.data) {
              const rawFAQs = response.data.faqs || []
              
              // Process FAQs ensuring slug is always present
              const processedFAQs: HelpFAQ[] = rawFAQs.map((faq: FAQ) => ({
                ...faq,
                slug: generateFAQSlug(faq),
                is_suggestion: isFAQSuggestion(faq),
                creator_name: faq.creator?.name || 'Unknown'
              }))
              
              // Filter by status if needed
              let filteredFAQs = processedFAQs
              if (status && status !== 'all') {
                switch (status) {
                  case 'published':
                    filteredFAQs = processedFAQs.filter(f => f.is_published)
                    break
                  case 'unpublished':
                    filteredFAQs = processedFAQs.filter(f => !f.is_published)
                    break
                  case 'featured':
                    filteredFAQs = processedFAQs.filter(f => f.is_featured)
                    break
                }
              }
              
              // Separate suggestions from regular FAQs
              const suggestions: HelpSuggestion[] = filteredFAQs
                .filter(faq => faq.is_suggestion)
                .map(convertToSuggestion)
              
              console.log('✅ HelpStore: Processed FAQs:', {
                total: filteredFAQs.length,
                suggestions: suggestions.length,
                published: filteredFAQs.filter(f => f.is_published).length
              })
              
              set((state) => ({
                faqs: filteredFAQs,
                suggestions,
                pagination: response.data!.pagination || { ...defaultPagination, total: filteredFAQs.length },
                lastFetch: { ...state.lastFetch, faqs: Date.now(), suggestions: Date.now() },
                loading: { ...state.loading, faqs: false },
              }))
            } else {
              throw new Error(response.message || 'Failed to fetch FAQs')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to fetch FAQs:', error)
            set((state) => ({
              loading: { ...state.loading, faqs: false },
              errors: { ...state.errors, faqs: error.message || 'Failed to fetch FAQs' },
            }))
          }
        },
        
        // Fetch categories
        fetchCategories: async (includeInactive = true) => {
          const state = get()
          
          if (Date.now() - state.lastFetch.categories < 1000) {
            return
          }
          
          set((state) => ({
            loading: { ...state.loading, categories: true },
            errors: { ...state.errors, categories: null },
          }))
          
          try {
            const response = await helpService.getAdminCategories({
              include_inactive: includeInactive,
              userRole: 'admin',
              forceRefresh: true
            })
            
            if (response.success && response.data) {
              set((state) => ({
                categories: response.data!.categories || [],
                lastFetch: { ...state.lastFetch, categories: Date.now() },
                loading: { ...state.loading, categories: false },
              }))
            } else {
              throw new Error(response.message || 'Failed to fetch categories')
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, categories: false },
              errors: { ...state.errors, categories: error.message },
            }))
          }
        },
        
        // Fetch stats
        fetchStats: async () => {
          const state = get()
          
          if (Date.now() - state.lastFetch.stats < 5000) {
            return
          }
          
          set((state) => ({
            loading: { ...state.loading, stats: true },
            errors: { ...state.errors, stats: null },
          }))
          
          try {
            const response = await helpService.getStats({
              userRole: 'admin',
              forceRefresh: true
            })
            
            if (response.success && response.data?.stats) {
              // FIXED: Map from service HelpStats to AdminHelpStats safely
              const serviceStats = response.data.stats
              const adminStats: AdminHelpStats = {
                total_faqs: serviceStats.total_faqs || 0,
                published_faqs: 0, // Calculate from current faqs data
                draft_faqs: 0, // Calculate from current faqs data  
                featured_faqs: 0, // Calculate from current faqs data
                categories_count: serviceStats.total_categories || 0,
                active_categories: 0, // Calculate from current categories data
                suggested_faqs: 0, // Calculate from current suggestions data
                total_views: 0, // Not available in service stats
                total_helpful_votes: 0 // Not available in service stats
              }
              
              // Calculate real-time stats from current store data
              const currentState = get()
              if (currentState.faqs.length > 0) {
                adminStats.published_faqs = currentState.faqs.filter(f => f.is_published).length
                adminStats.draft_faqs = currentState.faqs.filter(f => !f.is_published).length
                adminStats.featured_faqs = currentState.faqs.filter(f => f.is_featured).length
              }
              if (currentState.categories.length > 0) {
                adminStats.active_categories = currentState.categories.filter(c => c.is_active).length
              }
              if (currentState.suggestions.length > 0) {
                adminStats.suggested_faqs = currentState.suggestions.length
              }
              
              set((state) => ({
                stats: adminStats,
                lastFetch: { ...state.lastFetch, stats: Date.now() },
                loading: { ...state.loading, stats: false },
              }))
            } else {
              throw new Error(response.message || 'Failed to fetch stats')
            }
          } catch (error: any) {
            console.error('Failed to fetch stats:', error)
            set((state) => ({
              loading: { ...state.loading, stats: false },
              errors: { ...state.errors, stats: error.message || 'Failed to fetch stats' },
            }))
          }
        },
        
        // Refresh all data
        refreshAll: async () => {
          set((state) => ({
            lastFetch: { faqs: 0, categories: 0, suggestions: 0, stats: 0 }
          }))
          
          const actions = get().actions
          await Promise.all([
            actions.fetchFAQs(),
            actions.fetchCategories(),
            actions.fetchStats()
          ])
        },
        
        // Create FAQ
        createFAQ: async (data: Partial<FAQ>) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }))
          
          try {
            console.log('🎯 HelpStore: Creating FAQ:', data)
            
            const response = await helpService.createFAQ(data, 'admin')
            
            if (response.success && response.data?.faq) {
              const newFAQ: HelpFAQ = {
                ...response.data.faq,
                slug: generateFAQSlug(response.data.faq),
                is_suggestion: isFAQSuggestion(response.data.faq)
              }
              
              set((state) => ({
                faqs: [newFAQ, ...state.faqs],
                currentFAQ: newFAQ,
                loading: { ...state.loading, create: false },
                // Update stats immediately
                stats: state.stats ? {
                  ...state.stats,
                  total_faqs: state.stats.total_faqs + 1,
                  published_faqs: newFAQ.is_published ? state.stats.published_faqs + 1 : state.stats.published_faqs,
                  draft_faqs: !newFAQ.is_published ? state.stats.draft_faqs + 1 : state.stats.draft_faqs
                } : null
              }))
              
              console.log('✅ HelpStore: FAQ created successfully')
              toast.success('FAQ created successfully!')
              return newFAQ
            } else {
              throw new Error(response.message || 'Failed to create FAQ')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to create FAQ:', error)
            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message || 'Failed to create FAQ' },
            }))
            toast.error(error.message || 'Failed to create FAQ')
            return null
          }
        },
        
        // Update FAQ
        updateFAQ: async (id: number, data: Partial<FAQ>) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))
          
          try {
            console.log('🎯 HelpStore: Updating FAQ:', id, data)
            
            const response = await helpService.updateFAQ(id, data, 'admin')
            
            if (response.success && response.data?.faq) {
              const updatedFAQ: HelpFAQ = {
                ...response.data.faq,
                slug: generateFAQSlug(response.data.faq),
                is_suggestion: isFAQSuggestion(response.data.faq)
              }
              
              set((state) => ({
                faqs: state.faqs.map(f => f.id === id ? updatedFAQ : f),
                suggestions: state.suggestions.map(s => s.id === id ? convertToSuggestion(updatedFAQ) : s),
                currentFAQ: state.currentFAQ?.id === id ? updatedFAQ : state.currentFAQ,
                loading: { ...state.loading, update: false },
              }))
              
              console.log('✅ HelpStore: FAQ updated successfully')
              toast.success('FAQ updated successfully!')
            } else {
              throw new Error(response.message || 'Failed to update FAQ')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to update FAQ:', error)
            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message || 'Failed to update FAQ' },
            }))
            toast.error(error.message || 'Failed to update FAQ')
          }
        },
        
        // Delete FAQ
        deleteFAQ: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }))
          
          try {
            console.log('🎯 HelpStore: Deleting FAQ:', id)
            
            const response = await helpService.deleteFAQ(id, 'admin')
            
            if (response.success) {
              set((state) => {
                const newSelectedFAQs = new Set(state.selectedFAQs)
                newSelectedFAQs.delete(id)
                
                const newFAQs = state.faqs.filter(f => f.id !== id)
                const newSuggestions = state.suggestions.filter(s => s.id !== id)
                const newCurrentFAQ = state.currentFAQ?.id === id ? null : state.currentFAQ
                
                return {
                  faqs: newFAQs,
                  suggestions: newSuggestions,
                  currentFAQ: newCurrentFAQ,
                  selectedFAQs: newSelectedFAQs,
                  loading: { ...state.loading, delete: false },
                  // Update stats immediately
                  stats: state.stats ? {
                    ...state.stats,
                    total_faqs: Math.max(0, state.stats.total_faqs - 1),
                    suggested_faqs: newSuggestions.length
                  } : null
                }
              })
              
              console.log('✅ HelpStore: FAQ deleted successfully')
              toast.success('FAQ deleted successfully!')
            } else {
              throw new Error(response.message || 'Failed to delete FAQ')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to delete FAQ:', error)
            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message || 'Failed to delete FAQ' },
            }))
            toast.error(error.message || 'Failed to delete FAQ')
          }
        },
        
        // Toggle publish
        togglePublishFAQ: async (id: number) => {
          try {
            const state = get()
            const faq = state.faqs.find(f => f.id === id)
            if (!faq) return
            
            await get().actions.updateFAQ(id, { 
              is_published: !faq.is_published,
              published_at: !faq.is_published ? new Date().toISOString() : faq.published_at
            })
          } catch (error: any) {
            console.error('Failed to toggle publish:', error)
          }
        },
        
        // Toggle feature
        toggleFeatureFAQ: async (id: number) => {
          try {
            const state = get()
            const faq = state.faqs.find(f => f.id === id)
            if (!faq) return
            
            await get().actions.updateFAQ(id, { is_featured: !faq.is_featured })
          } catch (error: any) {
            console.error('Failed to toggle feature:', error)
          }
        },
        
        // Create category
        createCategory: async (data: Partial<HelpCategory>) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }))
          
          try {
            const response = await helpService.createCategory(data, 'admin')
            
            if (response.success && response.data?.category) {
              const newCategory = response.data.category
              
              set((state) => ({
                categories: [newCategory, ...state.categories],
                currentCategory: newCategory,
                loading: { ...state.loading, create: false },
                // Update stats immediately
                stats: state.stats ? {
                  ...state.stats,
                  categories_count: state.stats.categories_count + 1,
                  active_categories: newCategory.is_active ? state.stats.active_categories + 1 : state.stats.active_categories
                } : null
              }))
              
              toast.success('Category created successfully!')
              return newCategory
            } else {
              throw new Error(response.message || 'Failed to create category')
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message },
            }))
            toast.error(error.message || 'Failed to create category')
            return null
          }
        },
        
        // Update category
        updateCategory: async (id: number, data: Partial<HelpCategory>) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))
          
          try {
            const response = await helpService.updateCategory(id, data, 'admin')
            
            if (response.success && response.data?.category) {
              const updatedCategory = response.data.category
              
              set((state) => ({
                categories: state.categories.map(c => c.id === id ? updatedCategory : c),
                currentCategory: state.currentCategory?.id === id ? updatedCategory : state.currentCategory,
                loading: { ...state.loading, update: false },
              }))
              
              toast.success('Category updated successfully!')
            } else {
              throw new Error(response.message || 'Failed to update category')
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message },
            }))
            toast.error(error.message || 'Failed to update category')
          }
        },
        
        // Delete category
        deleteCategory: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }))
          
          try {
            const response = await helpService.deleteCategory(id, 'admin')
            
            if (response.success) {
              set((state) => ({
                categories: state.categories.filter(c => c.id !== id),
                currentCategory: state.currentCategory?.id === id ? null : state.currentCategory,
                loading: { ...state.loading, delete: false },
                // Update stats immediately
                stats: state.stats ? {
                  ...state.stats,
                  categories_count: Math.max(0, state.stats.categories_count - 1)
                } : null
              }))
              
              toast.success('Category deleted successfully!')
            } else {
              throw new Error(response.message || 'Failed to delete category')
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message },
            }))
            toast.error(error.message || 'Failed to delete category')
          }
        },
        
        // Approve suggestion
        approveSuggestion: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, approve: true },
            errors: { ...state.errors, approve: null },
          }))
          
          try {
            console.log('🎯 HelpStore: Approving suggestion:', id)
            
            const response = await helpService.updateFAQ(id, { 
              is_published: true,
              published_at: new Date().toISOString()
            }, 'admin')
            
            if (response.success && response.data?.faq) {
              const approvedFAQ: HelpFAQ = {
                ...response.data.faq,
                slug: generateFAQSlug(response.data.faq),
                is_suggestion: false
              }
              
              set((state) => ({
                faqs: state.faqs.map(f => f.id === id ? approvedFAQ : f),
                suggestions: state.suggestions.filter(s => s.id !== id),
                loading: { ...state.loading, approve: false },
                // Update stats immediately
                stats: state.stats ? {
                  ...state.stats,
                  published_faqs: state.stats.published_faqs + 1,
                  draft_faqs: Math.max(0, state.stats.draft_faqs - 1),
                  suggested_faqs: Math.max(0, state.stats.suggested_faqs - 1)
                } : null
              }))
              
              console.log('✅ HelpStore: Suggestion approved successfully')
              toast.success('FAQ suggestion approved and published!')
            } else {
              throw new Error(response.message || 'Failed to approve suggestion')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to approve suggestion:', error)
            set((state) => ({
              loading: { ...state.loading, approve: false },
              errors: { ...state.errors, approve: error.message || 'Failed to approve suggestion' },
            }))
            toast.error(error.message || 'Failed to approve suggestion')
          }
        },
        
        // Reject suggestion
        rejectSuggestion: async (id: number, feedback?: string) => {
          set((state) => ({
            loading: { ...state.loading, reject: true },
            errors: { ...state.errors, reject: null },
          }))
          
          try {
            console.log('🎯 HelpStore: Rejecting suggestion:', id)
            
            const response = await helpService.deleteFAQ(id, 'admin')
            
            if (response.success) {
              set((state) => ({
                faqs: state.faqs.filter(f => f.id !== id),
                suggestions: state.suggestions.filter(s => s.id !== id),
                loading: { ...state.loading, reject: false },
                // Update stats immediately
                stats: state.stats ? {
                  ...state.stats,
                  total_faqs: Math.max(0, state.stats.total_faqs - 1),
                  draft_faqs: Math.max(0, state.stats.draft_faqs - 1),
                  suggested_faqs: Math.max(0, state.stats.suggested_faqs - 1)
                } : null
              }))
              
              console.log('✅ HelpStore: Suggestion rejected successfully')
              toast.success('FAQ suggestion rejected successfully')
            } else {
              throw new Error(response.message || 'Failed to reject suggestion')
            }
          } catch (error: any) {
            console.error('❌ HelpStore: Failed to reject suggestion:', error)
            set((state) => ({
              loading: { ...state.loading, reject: false },
              errors: { ...state.errors, reject: error.message || 'Failed to reject suggestion' },
            }))
            toast.error(error.message || 'Failed to reject suggestion')
          }
        },
        
        // Filter management
        setFilters: (newFilters: Partial<ExtendedFAQFilters>, autoFetch = false) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 }
          }))

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchFAQs()
            }, 100)
          }
        },
        
        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters }
          }))

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchFAQs()
            }, 100)
          }
        },
        
        // UI state management
        setCurrentFAQ: (faq: HelpFAQ | null) => {
          set(() => ({ currentFAQ: faq }))
        },
        
        setCurrentCategory: (category: HelpCategory | null) => {
          set(() => ({ currentCategory: category }))
        },
        
        // Selection management
        selectFAQ: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedFAQs)
            newSet.add(id)
            return { selectedFAQs: newSet }
          })
        },
        
        deselectFAQ: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedFAQs)
            newSet.delete(id)
            return { selectedFAQs: newSet }
          })
        },
        
        clearSelection: () => {
          set(() => ({ selectedFAQs: new Set<number>() }))
        },
        
        // Error handling
        clearError: (type: keyof HelpState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [type]: null }
          }))
        },
        
        setError: (type: keyof HelpState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message }
          }))
        },
        
        // Cache management
        invalidateCache: () => {
          set(() => ({
            lastFetch: { faqs: 0, categories: 0, suggestions: 0, stats: 0 }
          }))
        },
        
        clearCache: () => {
          set(() => ({
            faqs: [],
            categories: [],
            suggestions: [],
            currentFAQ: null,
            currentCategory: null,
            selectedFAQs: new Set(),
            stats: null,
            lastFetch: { faqs: 0, categories: 0, suggestions: 0, stats: 0 }
          }))
        },
      },
    }),
    { name: 'help-store' }
  )
)

// STABLE SELECTORS - No more infinite loops
export const useHelpSelectors = () => {
  const faqs = useHelpStore((state) => state.faqs)
  const categories = useHelpStore((state) => state.categories)
  const suggestions = useHelpStore((state) => state.suggestions)
  const stats = useHelpStore((state) => state.stats)
  const selectedFAQs = useHelpStore((state) => state.selectedFAQs)
  
  // Stable derived data - calculated once per render
  return {
    faqs,
    categories,
    suggestions,
    stats,
    selectedFAQsArray: Array.from(selectedFAQs).map(id => 
      faqs.find(f => f.id === id)
    ).filter(Boolean) as HelpFAQ[],
    
    // Computed stats from current data
    publishedFAQs: faqs.filter(f => f.is_published),
    draftFAQs: faqs.filter(f => !f.is_published),
    featuredFAQs: faqs.filter(f => f.is_featured),
    regularFAQs: faqs.filter(f => !f.is_suggestion),
    pendingSuggestions: suggestions.filter(s => s.suggestion_status === 'pending'),
    revisionRequests: suggestions.filter(s => s.suggestion_type === 'revision_requested'),
    activeCategories: categories.filter(c => c.is_active),
    inactiveCategories: categories.filter(c => !c.is_active),
    
    // Safe stats access
    totalFAQs: stats?.total_faqs || faqs.length,
    publishedCount: stats?.published_faqs || faqs.filter(f => f.is_published).length,
    draftCount: stats?.draft_faqs || faqs.filter(f => !f.is_published).length,
    suggestionCount: stats?.suggested_faqs || suggestions.length,
  }
}

// ACTION HOOKS
export const useHelpActions = () => {
  return useHelpStore((state) => state.actions)
}

// LOADING HOOKS - FIXED: Return proper types
export const useHelpLoading = () => {
  return useHelpStore((state) => state.loading)
}

export const useHelpErrors = () => {
  return useHelpStore((state) => state.errors)
}

// Specific loading hooks for better type safety
export const useHelpLoadingState = (type: keyof HelpState['loading']) => {
  return useHelpStore((state) => state.loading[type])
}

export const useHelpErrorState = (type: keyof HelpState['errors']) => {
  return useHelpStore((state) => state.errors[type])
}

// FAQ-specific hooks
export const useFAQById = (id: number) => {
  return useHelpStore((state) => state.faqs.find(f => f.id === id) || null)
}

export const useCategoryById = (id: number) => {
  return useHelpStore((state) => state.categories.find(c => c.id === id) || null)
}

export const useSuggestionById = (id: number) => {
  return useHelpStore((state) => state.suggestions.find(s => s.id === id) || null)
}

// FILTERING HOOKS - Stable and clean
export const useHelpFilters = () => {
  const filters = useHelpStore((state) => state.filters)
  const { setFilters, clearFilters } = useHelpStore((state) => state.actions)
  
  // Stable filter helpers
  const filterHelpers = {
    filterByCategory: (categoryId: string) => setFilters({ category: categoryId }, true),
    filterByStatus: (status: StatusFilter) => setFilters({ status }, true),
    searchFAQs: (search: string) => setFilters({ search }, true),
  }
  
  // Stable hasActiveFilters calculation
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (['include_drafts', 'page', 'per_page'].includes(key)) return false
    return value !== undefined && value !== null && value !== '' && value !== 'all'
  })
  
  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    ...filterHelpers
  }
}

// PERMISSION HOOKS
export const useHelpPermissions = () => {
  return {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canFeature: true,
    canManageCategories: true,
    canManageSuggestions: true,
    canBulkAction: true,
    canExport: true,
  }
}

// STATS HOOKS - Stable and reliable
export const useHelpStats = () => {
  const stats = useHelpStore((state) => state.stats)
  const faqs = useHelpStore((state) => state.faqs)
  const categories = useHelpStore((state) => state.categories)
  const suggestions = useHelpStore((state) => state.suggestions)
  
  // Real-time stats calculation
  const realTimeStats = {
    total_faqs: faqs.length,
    published_faqs: faqs.filter(f => f.is_published).length,
    draft_faqs: faqs.filter(f => !f.is_published).length,
    featured_faqs: faqs.filter(f => f.is_featured).length,
    categories_count: categories.length,
    active_categories: categories.filter(c => c.is_active).length,
    suggested_faqs: suggestions.length,
    total_views: stats?.total_views || 0,
    total_helpful_votes: stats?.total_helpful_votes || 0,
  }
  
  // Performance metrics
  const performanceMetrics = {
    publishRate: realTimeStats.total_faqs > 0 
      ? Math.round((realTimeStats.published_faqs / realTimeStats.total_faqs) * 100) 
      : 0,
    suggestionRate: realTimeStats.total_faqs > 0 
      ? Math.round((realTimeStats.suggested_faqs / realTimeStats.total_faqs) * 100) 
      : 0,
    categoryUtilization: realTimeStats.categories_count > 0 
      ? Math.round((realTimeStats.active_categories / realTimeStats.categories_count) * 100) 
      : 0,
  }
  
  return {
    stats: stats || realTimeStats,
    realTimeStats,
    ...performanceMetrics
  }
}

// SUGGESTION MANAGEMENT HOOKS
export const useSuggestionManagement = () => {
  const suggestions = useHelpStore((state) => state.suggestions)
  const { approveSuggestion, rejectSuggestion } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  
  // Derived data
  const suggestionData = {
    pendingCount: suggestions.filter(s => s.suggestion_status === 'pending').length,
    revisionCount: suggestions.filter(s => s.suggestion_type === 'revision_requested').length,
  }
  
  // Utility functions
  const utilityFunctions = {
    getSuggestionsByCreator: (creatorId: number) => 
      suggestions.filter(s => s.created_by === creatorId),
    
    getSuggestionsByCategory: (categoryId: number) =>
      suggestions.filter(s => s.category_id === categoryId),
    
    getOldestSuggestion: () => 
      suggestions.length > 0 ? suggestions.reduce((oldest, current) => 
        new Date(current.submitted_at) < new Date(oldest.submitted_at) ? current : oldest,
        suggestions[0]
      ) : null,
  }
  
  return {
    suggestions,
    ...suggestionData,
    approveSuggestion,
    rejectSuggestion,
    isApproving: loading.approve,
    isRejecting: loading.reject,
    ...utilityFunctions
  }
}

// FORM HELPERS
export const useFAQForm = () => {
  const categories = useHelpStore((state) => state.categories.filter(c => c.is_active))
  const { createFAQ, updateFAQ } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  
  // Validation function
  const validateFAQData = (data: Partial<FAQ>) => {
    const errors: string[] = []
    
    if (!data.question?.trim()) errors.push('Question is required')
    if (!data.answer?.trim()) errors.push('Answer is required')
    if (!data.category_id) errors.push('Category is required')
    
    if (data.question && data.question.length < 10) {
      errors.push('Question must be at least 10 characters')
    }
    if (data.answer && data.answer.length < 20) {
      errors.push('Answer must be at least 20 characters')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  return {
    categories,
    createFAQ,
    updateFAQ,
    isCreating: loading.create,
    isUpdating: loading.update,
    validateFAQData,
  }
}

export const useCategoryForm = () => {
  const { createCategory, updateCategory } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  
  // Validation function
  const validateCategoryData = (data: Partial<HelpCategory>) => {
    const errors: string[] = []
    
    if (!data.name?.trim()) errors.push('Category name is required')
    if (data.name && data.name.length < 3) {
      errors.push('Category name must be at least 3 characters')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  return {
    createCategory,
    updateCategory,
    isCreating: loading.create,
    isUpdating: loading.update,
    validateCategoryData,
  }
}

// SEARCH FUNCTIONALITY
export const useHelpSearch = () => {
  const faqs = useHelpStore((state) => state.faqs)
  const suggestions = useHelpStore((state) => state.suggestions)
  const filters = useHelpStore((state) => state.filters)
  const { setFilters } = useHelpStore((state) => state.actions)
  
  // Search functions
  const searchFunctions = {
    searchFAQs: (query: string) => {
      if (!query.trim()) return faqs
      
      const searchTerm = query.toLowerCase()
      return faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    },
    
    searchSuggestions: (query: string) => {
      if (!query.trim()) return suggestions
      
      const searchTerm = query.toLowerCase()
      return suggestions.filter(suggestion => 
        suggestion.question.toLowerCase().includes(searchTerm) ||
        suggestion.answer.toLowerCase().includes(searchTerm) ||
        suggestion.creator_name?.toLowerCase().includes(searchTerm)
      )
    },
    
    setSearch: (search: string) => setFilters({ search }, true),
    clearSearch: () => setFilters({ search: undefined }, true),
  }
  
  // Search results
  const searchResults = filters.search ? searchFunctions.searchFAQs(filters.search) : faqs
  
  return {
    ...searchFunctions,
    currentSearch: filters.search || '',
    searchResults,
    hasSearchResults: searchResults.length > 0,
  }
}

// INITIALIZATION HOOK
export const useHelpStoreInitialization = () => {
  const { fetchFAQs, fetchCategories, fetchStats } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  const lastFetch = useHelpStore((state) => state.lastFetch)
  
  // Initialize function
  const initialize = async (force = false) => {
    const now = Date.now()
    const shouldFetch = force || Object.values(lastFetch).every(time => now - time > 30000)
    
    if (shouldFetch) {
      console.log('🎯 HelpStore: Initializing help store data')
      await Promise.all([
        fetchFAQs(),
        fetchCategories(),
        fetchStats()
      ])
    }
  }
  
  // Initialization state
  const isInitialized = Object.values(lastFetch).some(time => time > 0)
  const isInitializing = Object.values(loading).some(isLoading => isLoading)
  
  return {
    initialize,
    isInitialized,
    isInitializing,
    needsInitialization: !isInitialized && !isInitializing,
  }
}

// UTILITY FUNCTIONS
export const initializeHelpStore = () => {
  console.log('🎯 HelpStore: Initialized for admin help management')
}

// Export the main store and helper functions
export default useHelpStore

// Export types for backward compatibility
export type { FAQ, HelpCategory } from '@/services/help.service'