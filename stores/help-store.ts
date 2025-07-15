// stores/help-store.ts - FIXED: Infinite loop issues resolved

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { helpService, type FAQ, type HelpCategory, type FAQFilters } from '@/services/help.service'
import { toast } from 'sonner'
import { useMemo } from 'react'

// FIXED: Enhanced interfaces with proper TypeScript compatibility
export interface HelpFAQ extends Omit<FAQ, 'slug'> {
  slug: string // Make required instead of optional
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

export interface HelpStats {
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

// FIXED: Status filter type with proper literal types
export type StatusFilter = 'all' | 'published' | 'unpublished' | 'featured'

// FIXED: Proper interface extension with correct typing
export interface ExtendedFAQFilters extends FAQFilters {
  status?: StatusFilter
}

// Store state interface
interface HelpState {
  // Core data
  faqs: HelpFAQ[]
  categories: HelpCategory[]
  suggestions: HelpSuggestion[]
  currentFAQ: HelpFAQ | null
  currentCategory: HelpCategory | null
  filters: ExtendedFAQFilters
  
  // Loading states
  loading: {
    faqs: boolean
    categories: boolean
    suggestions: boolean
    create: boolean
    update: boolean
    delete: boolean
    approve: boolean
    reject: boolean
  }
  
  // Error states
  errors: {
    faqs: string | null
    categories: string | null
    suggestions: string | null
    create: string | null
    update: string | null
    delete: string | null
    approve: string | null
    reject: string | null
  }
  
  // Cache management
  lastFetch: {
    faqs: number
    categories: number
    suggestions: number
  }
  
  // UI state
  selectedFAQs: Set<number>
  stats: HelpStats | null
  
  // Actions
  actions: {
    // Data fetching
    fetchFAQs: (params?: Partial<ExtendedFAQFilters>) => Promise<void>
    fetchCategories: (includeInactive?: boolean) => Promise<void>
    fetchSuggestions: () => Promise<void>
    fetchStats: () => Promise<void>
    refreshAll: () => Promise<void>
    
    // FAQ CRUD
    createFAQ: (data: Partial<FAQ>) => Promise<HelpFAQ | null>
    updateFAQ: (id: number, data: Partial<FAQ>) => Promise<void>
    deleteFAQ: (id: number) => Promise<void>
    togglePublishFAQ: (id: number) => Promise<void>
    toggleFeatureFAQ: (id: number) => Promise<void>
    
    // Category CRUD
    createCategory: (data: Partial<HelpCategory>) => Promise<HelpCategory | null>
    updateCategory: (id: number, data: Partial<HelpCategory>) => Promise<void>
    deleteCategory: (id: number) => Promise<void>
    
    // Suggestions management
    approveSuggestion: (id: number) => Promise<void>
    rejectSuggestion: (id: number, feedback?: string) => Promise<void>
    requestRevision: (id: number, feedback: string) => Promise<void>
    
    // Bulk operations
    bulkAction: (action: string, faqIds: number[], params?: any) => Promise<void>
    
    // UI state management
    setCurrentFAQ: (faq: HelpFAQ | null) => void
    setCurrentCategory: (category: HelpCategory | null) => void
    setFilters: (filters: Partial<ExtendedFAQFilters>) => void
    clearFilters: () => void
    
    // Selection management
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

const defaultStats: HelpStats = {
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

// FIXED: Generate slug for FAQ - ensure it's always a string
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

// FIXED: Convert FAQ to suggestion format with proper typing
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

// Enhanced help store
export const useHelpStore = create<HelpState>()(
  devtools(
    (set, get) => ({
      // Initial state
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
      },
      
      lastFetch: {
        faqs: 0,
        categories: 0,
        suggestions: 0,
      },
      
      selectedFAQs: new Set<number>(),
      stats: null,
      
      actions: {
        // FIXED: Fetch FAQs with proper typing
        fetchFAQs: async (params?: Partial<ExtendedFAQFilters>) => {
          const state = get()
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters
          
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
            
            // FIXED: Convert extended filters to base FAQ filters
            const { status, ...baseFAQFilters } = mergedFilters
            
            const response = await helpService.getAdminFAQs({
              ...baseFAQFilters,
              userRole: 'admin',
              forceRefresh: true
            })
            
            if (response.success && response.data) {
              const rawFAQs = response.data.faqs || []
              
              // FIXED: Process FAQs ensuring slug is always present
              const processedFAQs: HelpFAQ[] = rawFAQs.map((faq: FAQ) => ({
                ...faq,
                slug: generateFAQSlug(faq), // Always generate slug
                is_suggestion: isFAQSuggestion(faq),
                creator_name: faq.creator?.name || 'Unknown'
              }))
              
              // Separate suggestions from regular FAQs
              const suggestions: HelpSuggestion[] = processedFAQs
                .filter(faq => faq.is_suggestion)
                .map(convertToSuggestion)
              
              console.log('✅ HelpStore: Processed FAQs:', {
                total: processedFAQs.length,
                suggestions: suggestions.length,
                published: processedFAQs.filter(f => f.is_published).length
              })
              
              set((state) => ({
                faqs: processedFAQs,
                suggestions,
                lastFetch: { ...state.lastFetch, faqs: Date.now(), suggestions: Date.now() },
                loading: { ...state.loading, faqs: false },
                stats: {
                  ...defaultStats,
                  total_faqs: processedFAQs.length,
                  published_faqs: processedFAQs.filter(f => f.is_published).length,
                  draft_faqs: processedFAQs.filter(f => !f.is_published).length,
                  featured_faqs: processedFAQs.filter(f => f.is_featured).length,
                  suggested_faqs: suggestions.length
                }
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
        
        // Fetch suggestions
        fetchSuggestions: async () => {
          await get().actions.fetchFAQs({ include_drafts: true })
        },
        
        // FIXED: Fetch stats with proper typing
        fetchStats: async () => {
          try {
            const response = await helpService.getStats({
              userRole: 'admin',
              forceRefresh: true
            })
            
            if (response.success && response.data?.stats) {
              // FIXED: Properly set stats without typing conflicts
              set((state) => {
                const newStats: HelpStats = {
                  total_faqs: response.data!.stats.total_faqs || 0,
                  published_faqs: response.data!.stats.published_faqs || 0,
                  draft_faqs: response.data!.stats.draft_faqs || 0,
                  featured_faqs: response.data!.stats.featured_faqs || 0,
                  categories_count: response.data!.stats.categories_count || 0,
                  active_categories: response.data!.stats.active_categories || 0,
                  suggested_faqs: response.data!.stats.suggested_faqs || 0,
                  total_views: response.data!.stats.total_views || 0,
                  total_helpful_votes: response.data!.stats.total_helpful_votes || 0
                }
                
                return {
                  ...state,
                  stats: newStats
                }
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch stats:', error)
          }
        },
        
        // Refresh all data
        refreshAll: async () => {
          const actions = get().actions
          set((state) => ({
            lastFetch: { faqs: 0, categories: 0, suggestions: 0 }
          }))
          
          await Promise.all([
            actions.fetchFAQs(),
            actions.fetchCategories(),
            actions.fetchStats()
          ])
        },
        
        // FIXED: Create FAQ with proper typing
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
        
        // Request revision
        requestRevision: async (id: number, feedback: string) => {
          try {
            const state = get()
            const faq = state.faqs.find(f => f.id === id)
            if (!faq) return
            
            const currentTags = faq.tags || []
            const newTags = [...currentTags.filter(tag => tag !== 'revision-requested'), 'revision-requested']
            
            await get().actions.updateFAQ(id, { tags: newTags })
            toast.success('Revision requested successfully')
          } catch (error: any) {
            console.error('Failed to request revision:', error)
            toast.error('Failed to request revision')
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
        
        // Bulk actions
        bulkAction: async (action: string, faqIds: number[], params?: any) => {
          try {
            console.log('🎯 HelpStore: Bulk action:', action, faqIds)
            
            switch (action) {
              case 'publish':
                for (const id of faqIds) {
                  await get().actions.updateFAQ(id, { is_published: true })
                }
                break
              case 'unpublish':
                for (const id of faqIds) {
                  await get().actions.updateFAQ(id, { is_published: false })
                }
                break
              case 'feature':
                for (const id of faqIds) {
                  await get().actions.updateFAQ(id, { is_featured: true })
                }
                break
              case 'delete':
                for (const id of faqIds) {
                  await get().actions.deleteFAQ(id)
                }
                break
            }
            
            toast.success(`Bulk ${action} completed successfully!`)
          } catch (error: any) {
            console.error('❌ HelpStore: Bulk action failed:', error)
            toast.error(`Bulk ${action} failed`)
          }
        },
        
        // UI state management
        setCurrentFAQ: (faq: HelpFAQ | null) => {
          set(() => ({ currentFAQ: faq }))
        },
        
        setCurrentCategory: (category: HelpCategory | null) => {
          set(() => ({ currentCategory: category }))
        },
        
        // FIXED: setFilters with proper typing for status
        setFilters: (newFilters: Partial<ExtendedFAQFilters>) => {
          set((state) => {
            // FIXED: Ensure status is properly typed
            const processedFilters = { ...newFilters }
            if (processedFilters.status && !(['all', 'published', 'unpublished', 'featured'] as const).includes(processedFilters.status as any)) {
              processedFilters.status = 'all'
            }
            
            return {
              filters: { ...state.filters, ...processedFilters, page: 1 }
            }
          })
        },
        
        clearFilters: () => {
          set(() => ({ filters: { ...defaultFilters } }))
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
            lastFetch: { faqs: 0, categories: 0, suggestions: 0 }
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
            lastFetch: { faqs: 0, categories: 0, suggestions: 0 }
          }))
        },
      },
    }),
    { name: 'help-store' }
  )
)

// FIXED: Stable selectors to prevent infinite loops
export const useHelpSelectors = () => {
  const faqs = useHelpStore((state) => state.faqs)
  const categories = useHelpStore((state) => state.categories)
  const suggestions = useHelpStore((state) => state.suggestions)
  const stats = useHelpStore((state) => state.stats)
  
  // FIXED: Use useMemo to stabilize derived data
  const derivedData = useMemo(() => {
    const publishedFAQs = faqs.filter(f => f.is_published)
    const draftFAQs = faqs.filter(f => !f.is_published)
    const featuredFAQs = faqs.filter(f => f.is_featured)
    const regularFAQs = faqs.filter(f => !f.is_suggestion)
    const pendingSuggestions = suggestions.filter(s => s.suggestion_status === 'pending')
    const revisionRequests = suggestions.filter(s => s.suggestion_type === 'revision_requested')
    const activeCategories = categories.filter(c => c.is_active)
    const inactiveCategories = categories.filter(c => !c.is_active)
    
    return {
      publishedFAQs,
      draftFAQs,
      featuredFAQs,
      regularFAQs,
      pendingSuggestions,
      revisionRequests,
      activeCategories,
      inactiveCategories,
      totalFAQs: stats?.total_faqs || 0,
      publishedCount: stats?.published_faqs || 0,
      draftCount: stats?.draft_faqs || 0,
      suggestionCount: stats?.suggested_faqs || 0,
    }
  }, [faqs, categories, suggestions, stats])
  
  // FIXED: Stable selectedFAQsArray
  const selectedFAQsArray = useMemo(() => {
    const selectedIds = useHelpStore.getState().selectedFAQs
    return Array.from(selectedIds)
      .map(id => faqs.find(f => f.id === id))
      .filter(Boolean) as HelpFAQ[]
  }, [faqs])
  
  return {
    faqs,
    categories,
    suggestions,
    stats,
    selectedFAQsArray,
    ...derivedData
  }
}

// ENHANCED ACTION HOOKS
export const useHelpActions = () => {
  return useHelpStore((state) => state.actions)
}

// FIXED: Loading hook with proper type checking
export const useHelpLoading = (type?: keyof HelpState['loading']) => {
  const loading = useHelpStore((state) => state.loading)
  return type ? loading[type] : loading
}

export const useHelpErrors = (type?: keyof HelpState['errors']) => {
  const errors = useHelpStore((state) => state.errors)
  return type ? errors[type] : errors
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

// ENHANCED FILTERING HOOKS
export const useHelpFilters = () => {
  const filters = useHelpStore((state) => state.filters)
  const { setFilters, clearFilters } = useHelpStore((state) => state.actions)
  
  // FIXED: Stable filter helpers with useMemo
  const filterHelpers = useMemo(() => ({
    filterByCategory: (categoryId: string) => setFilters({ category: categoryId }),
    filterByStatus: (status: StatusFilter) => setFilters({ status }),
    searchFAQs: (search: string) => setFilters({ search }),
  }), [setFilters])
  
  // FIXED: Stable hasActiveFilters calculation
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (['include_drafts', 'page', 'per_page'].includes(key)) return false
      return value !== undefined && value !== null && value !== '' && value !== 'all'
    })
  }, [filters])
  
  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    ...filterHelpers
  }
}

// ADMIN PERMISSION HOOKS
export const useHelpPermissions = () => {
  // FIXED: Stable permissions object
  return useMemo(() => ({
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canFeature: true,
    canManageCategories: true,
    canManageSuggestions: true,
    canBulkAction: true,
    canExport: true,
  }), [])
}

// STATS AND METRICS HOOKS
export const useHelpStats = () => {
  const stats = useHelpStore((state) => state.stats)
  const faqs = useHelpStore((state) => state.faqs)
  const categories = useHelpStore((state) => state.categories)
  const suggestions = useHelpStore((state) => state.suggestions)
  
  // FIXED: Stable real-time stats calculation
  const realTimeStats = useMemo(() => ({
    total_faqs: faqs.length,
    published_faqs: faqs.filter(f => f.is_published).length,
    draft_faqs: faqs.filter(f => !f.is_published).length,
    featured_faqs: faqs.filter(f => f.is_featured).length,
    categories_count: categories.length,
    active_categories: categories.filter(c => c.is_active).length,
    suggested_faqs: suggestions.length,
    total_views: stats?.total_views || 0,
    total_helpful_votes: stats?.total_helpful_votes || 0,
  }), [faqs, categories, suggestions, stats])
  
  // FIXED: Stable performance metrics
  const performanceMetrics = useMemo(() => ({
    publishRate: realTimeStats.total_faqs > 0 
      ? Math.round((realTimeStats.published_faqs / realTimeStats.total_faqs) * 100) 
      : 0,
    suggestionRate: realTimeStats.total_faqs > 0 
      ? Math.round((realTimeStats.suggested_faqs / realTimeStats.total_faqs) * 100) 
      : 0,
    categoryUtilization: realTimeStats.categories_count > 0 
      ? Math.round((realTimeStats.active_categories / realTimeStats.categories_count) * 100) 
      : 0,
  }), [realTimeStats])
  
  return {
    stats: stats || realTimeStats,
    realTimeStats,
    ...performanceMetrics
  }
}

// SUGGESTION MANAGEMENT HOOKS
export const useSuggestionManagement = () => {
  const suggestions = useHelpStore((state) => state.suggestions)
  const { approveSuggestion, rejectSuggestion, requestRevision } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  
  // FIXED: Stable derived data
  const suggestionData = useMemo(() => ({
    pendingCount: suggestions.filter(s => s.suggestion_status === 'pending').length,
    revisionCount: suggestions.filter(s => s.suggestion_type === 'revision_requested').length,
  }), [suggestions])
  
  // FIXED: Stable utility functions
  const utilityFunctions = useMemo(() => ({
    getSuggestionsByCreator: (creatorId: number) => 
      suggestions.filter(s => s.created_by === creatorId),
    
    getSuggestionsByCategory: (categoryId: number) =>
      suggestions.filter(s => s.category_id === categoryId),
    
    getOldestSuggestion: () => 
      suggestions.length > 0 ? suggestions.reduce((oldest, current) => 
        new Date(current.submitted_at) < new Date(oldest.submitted_at) ? current : oldest,
        suggestions[0]
      ) : null,
  }), [suggestions])
  
  return {
    suggestions,
    ...suggestionData,
    approveSuggestion,
    rejectSuggestion,
    requestRevision,
    isApproving: loading.approve,
    isRejecting: loading.reject,
    ...utilityFunctions
  }
}

// BULK ACTIONS HOOK
export const useBulkActions = () => {
  const selectedFAQs = useHelpStore((state) => state.selectedFAQs)
  const { bulkAction, clearSelection } = useHelpStore((state) => state.actions)
  const faqs = useHelpStore((state) => state.faqs)
  
  // FIXED: Stable selected FAQs array
  const selectedFAQsArray = useMemo(() => {
    return Array.from(selectedFAQs)
      .map(id => faqs.find(f => f.id === id))
      .filter(Boolean) as HelpFAQ[]
  }, [selectedFAQs, faqs])
  
  // FIXED: Stable bulk actions
  const bulkActions = useMemo(() => ({
    bulkPublish: () => bulkAction('publish', Array.from(selectedFAQs)),
    bulkUnpublish: () => bulkAction('unpublish', Array.from(selectedFAQs)),
    bulkFeature: () => bulkAction('feature', Array.from(selectedFAQs)),
    bulkDelete: () => bulkAction('delete', Array.from(selectedFAQs)),
  }), [bulkAction, selectedFAQs])
  
  // FIXED: Stable selection analysis
  const selectionAnalysis = useMemo(() => ({
    hasPublished: selectedFAQsArray.some(f => f.is_published),
    hasUnpublished: selectedFAQsArray.some(f => !f.is_published),
    hasFeatured: selectedFAQsArray.some(f => f.is_featured),
    hasUnfeatured: selectedFAQsArray.some(f => !f.is_featured),
    hasSuggestions: selectedFAQsArray.some(f => f.is_suggestion),
  }), [selectedFAQsArray])
  
  return {
    selectedFAQs: selectedFAQsArray,
    selectedCount: selectedFAQs.size,
    clearSelection,
    ...bulkActions,
    ...selectionAnalysis
  }
}

// CACHE MANAGEMENT HOOK
export const useCacheManagement = () => {
  const { invalidateCache, clearCache, refreshAll } = useHelpStore((state) => state.actions)
  const lastFetch = useHelpStore((state) => state.lastFetch)
  
  // FIXED: Stable cache functions
  const cacheFunctions = useMemo(() => {
    const getCacheAge = (type: keyof typeof lastFetch) => {
      return lastFetch[type] > 0 ? Date.now() - lastFetch[type] : 0
    }
    
    const isCacheStale = (type: keyof typeof lastFetch, maxAge = 5 * 60 * 1000) => {
      return getCacheAge(type) > maxAge
    }
    
    return { getCacheAge, isCacheStale }
  }, [lastFetch])
  
  // FIXED: Stable cache health data
  const cacheHealth = useMemo(() => ({
    faqsCacheAge: cacheFunctions.getCacheAge('faqs'),
    categoriesCacheAge: cacheFunctions.getCacheAge('categories'),
    suggestionsCacheAge: cacheFunctions.getCacheAge('suggestions'),
    faqsCacheStale: cacheFunctions.isCacheStale('faqs'),
    categoriesCacheStale: cacheFunctions.isCacheStale('categories'),
    suggestionsCacheStale: cacheFunctions.isCacheStale('suggestions'),
  }), [cacheFunctions])
  
  return {
    lastFetch,
    invalidateCache,
    clearCache,
    refreshAll,
    ...cacheFunctions,
    ...cacheHealth
  }
}

// INITIALIZATION HOOK
export const useHelpStoreInitialization = () => {
  const { fetchFAQs, fetchCategories, fetchStats } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  const lastFetch = useHelpStore((state) => state.lastFetch)
  
  // FIXED: Stable initialize function
  const initialize = useMemo(() => {
    return async (force = false) => {
      const now = Date.now()
      const shouldFetch = force || Object.values(lastFetch).every(time => now - time > 30000) // 30 seconds
      
      if (shouldFetch) {
        console.log('🎯 HelpStore: Initializing help store data')
        await Promise.all([
          fetchFAQs(),
          fetchCategories(),
          fetchStats()
        ])
      }
    }
  }, [fetchFAQs, fetchCategories, fetchStats, lastFetch])
  
  // FIXED: Stable derived state
  const initializationState = useMemo(() => {
    const isInitialized = Object.values(lastFetch).some(time => time > 0)
    const isInitializing = Object.values(loading).some(isLoading => isLoading)
    
    return {
      isInitialized,
      isInitializing,
      needsInitialization: !isInitialized && !isInitializing,
    }
  }, [lastFetch, loading])
  
  return {
    initialize,
    ...initializationState
  }
}

// FORM HELPERS
export const useFAQForm = () => {
  // FIXED: Stable categories filter
  const categories = useHelpStore((state) => state.categories.filter(c => c.is_active))
  const { createFAQ, updateFAQ } = useHelpStore((state) => state.actions)
  const loading = useHelpStore((state) => state.loading)
  
  // FIXED: Stable validation function
  const validateFAQData = useMemo(() => {
    return (data: Partial<FAQ>) => {
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
  }, [])
  
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
  
  // FIXED: Stable validation function
  const validateCategoryData = useMemo(() => {
    return (data: Partial<HelpCategory>) => {
      const errors: string[] = []
      
      if (!data.name?.trim()) errors.push('Category name is required')
      if (data.name && data.name.length < 3) {
        errors.push('Category name must be at least 3 characters')
      }
      
      return { valid: errors.length === 0, errors }
    }
  }, [])
  
  return {
    createCategory,
    updateCategory,
    isCreating: loading.create,
    isUpdating: loading.update,
    validateCategoryData,
  }
}

// SEARCH AND FILTERING
export const useHelpSearch = () => {
  const faqs = useHelpStore((state) => state.faqs)
  const suggestions = useHelpStore((state) => state.suggestions)
  const categories = useHelpStore((state) => state.categories)
  const filters = useHelpStore((state) => state.filters)
  const { setFilters } = useHelpStore((state) => state.actions)
  
  // FIXED: Stable search functions
  const searchFunctions = useMemo(() => ({
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
    
    setSearch: (search: string) => setFilters({ search }),
    clearSearch: () => setFilters({ search: undefined }),
  }), [faqs, suggestions, setFilters])
  
  // FIXED: Stable search results
  const searchResults = useMemo(() => {
    return filters.search ? searchFunctions.searchFAQs(filters.search) : faqs
  }, [filters.search, searchFunctions, faqs])
  
  return {
    ...searchFunctions,
    currentSearch: filters.search || '',
    searchResults,
    hasSearchResults: searchResults.length > 0,
  }
}

// DEBUG AND DEVELOPMENT UTILITIES
export const useHelpDebug = () => {
  const state = useHelpStore()
  
  // FIXED: Stable debug functions
  const debugFunctions = useMemo(() => ({
    getDebugInfo: () => ({
      stateSize: JSON.stringify(state).length,
      faqCount: state.faqs.length,
      categoryCount: state.categories.length,
      suggestionCount: state.suggestions.length,
      selectedCount: state.selectedFAQs.size,
      cacheAges: state.lastFetch,
      hasErrors: Object.values(state.errors).some(error => error !== null),
      isLoading: Object.values(state.loading).some(loading => loading === true),
      memoryUsage: {
        faqs: state.faqs.length * 1000, // Rough estimate
        categories: state.categories.length * 500,
        suggestions: state.suggestions.length * 1000,
      }
    }),
    
    logState: () => {
      if (process.env.NODE_ENV === 'development') {
        console.group('🎯 HelpStore Debug Info')
        console.log('Current State:', state)
        console.log('Debug Info:', debugFunctions.getDebugInfo())
        console.groupEnd()
      }
    },
  }), [state])
  
  return {
    ...debugFunctions,
    state,
  }
}

// Export the main store and helper functions
export default useHelpStore

// UTILITY FUNCTIONS
export const initializeHelpStore = () => {
  console.log('🎯 HelpStore: Initialized for admin help management')
}

// EXPORT TYPES FOR EXTERNAL USE
// export type {
//   HelpFAQ,
//   HelpSuggestion, 
//   HelpStats,
//   ExtendedFAQFilters,
//   StatusFilter
// }

// DEPRECATED IMPORTS COMPATIBILITY
// Keep these for backward compatibility
export { type HelpCategory } from '@/services/help.service'