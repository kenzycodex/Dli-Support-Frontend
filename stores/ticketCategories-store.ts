// stores/ticketCategories-store.ts - Ticket Categories Management Store

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ticketCategoriesService, TicketCategory, CreateCategoryRequest, UpdateCategoryRequest, CategoriesOverview } from '@/services/ticketCategories.service'

// Category management interfaces
export interface CategoryWithStats extends TicketCategory {
  tickets_count?: number
  open_tickets_count?: number
  counselor_count?: number
  utilization_rate?: number
  avg_resolution_time?: number
  crisis_tickets_count?: number
  overdue_tickets_count?: number
}

export interface CategoryFilters {
  search?: string
  is_active?: boolean | 'all'
  auto_assign?: boolean | 'all'
  crisis_detection?: boolean | 'all'
  sort_by?: 'name' | 'created_at' | 'sort_order' | 'tickets_count' | 'counselor_count'
  sort_direction?: 'asc' | 'desc'
}

// Store interface
interface TicketCategoriesState {
  // Core data
  categories: CategoryWithStats[]
  currentCategory: CategoryWithStats | null
  filters: CategoryFilters
  
  // Loading states
  loading: {
    list: boolean
    details: boolean
    create: boolean
    update: boolean
    delete: boolean
    reorder: boolean
    stats: boolean
  }
  
  // Error states
  errors: {
    list: string | null
    details: string | null
    create: string | null
    update: string | null
    delete: string | null
    reorder: string | null
    stats: string | null
  }
  
  // Statistics
  overview: CategoriesOverview | null
  
  // Cache management
  lastFetch: number
  categoryCache: Map<number, { data: CategoryWithStats; lastUpdate: number }>
  
  // UI state
  selectedCategories: Set<number>
  
  // Actions
  actions: {
    // Data fetching
    fetchCategories: (params?: { include_inactive?: boolean; with_counselors?: boolean }, forceRefresh?: boolean) => Promise<void>
    fetchCategory: (id: number, forceRefresh?: boolean) => Promise<void>
    refreshCategories: () => Promise<void>
    
    // CRUD operations
    createCategory: (data: CreateCategoryRequest) => Promise<CategoryWithStats | null>
    updateCategory: (id: number, data: UpdateCategoryRequest) => Promise<void>
    deleteCategory: (id: number) => Promise<void>
    
    // Category management
    reorderCategories: (categories: Array<{ id: number; sort_order: number }>) => Promise<void>
    bulkToggleActive: (categoryIds: number[], isActive: boolean) => Promise<void>
    
    // Statistics
    fetchOverview: () => Promise<void>
    
    // Utilities
    getCategoryById: (id: number) => CategoryWithStats | null
    getCategoryBySlug: (slug: string) => CategoryWithStats | null
    getActiveCategories: () => CategoryWithStats[]
    getCategoriesWithAutoAssign: () => CategoryWithStats[]
    getCategoriesWithCrisisDetection: () => CategoryWithStats[]
    
    // Filter management
    setFilters: (filters: CategoryFilters) => void
    clearFilters: () => void
    
    // UI state management
    setCurrentCategory: (category: CategoryWithStats | null) => void
    selectCategory: (id: number) => void
    deselectCategory: (id: number) => void
    clearSelection: () => void
    
    // Error handling
    clearError: (type: keyof TicketCategoriesState['errors']) => void
    setError: (type: keyof TicketCategoriesState['errors'], message: string) => void
    
    // Cache management
    invalidateCache: (categoryId?: number) => void
    clearCache: () => void
    getCachedCategory: (id: number) => CategoryWithStats | null
    setCachedCategory: (category: CategoryWithStats) => void
    
    // Export
    exportCategories: (format: 'csv' | 'json') => Promise<void>
  }
}

// Default values
const defaultFilters: CategoryFilters = {
  search: '',
  is_active: 'all',
  auto_assign: 'all',
  crisis_detection: 'all',
  sort_by: 'sort_order',
  sort_direction: 'asc'
}

// Helper function to check if category data is complete
const isCategoryDataComplete = (category: CategoryWithStats): boolean => {
  return category.tickets_count !== undefined && category.counselor_count !== undefined
}

// Create store
export const useTicketCategoriesStore = create<TicketCategoriesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      categories: [],
      currentCategory: null,
      filters: { ...defaultFilters },
      
      loading: {
        list: false,
        details: false,
        create: false,
        update: false,
        delete: false,
        reorder: false,
        stats: false,
      },
      
      errors: {
        list: null,
        details: null,
        create: null,
        update: null,
        delete: null,
        reorder: null,
        stats: null,
      },
      
      overview: null,
      lastFetch: 0,
      categoryCache: new Map(),
      selectedCategories: new Set<number>(),

      actions: {
        // Fetch categories with filtering and caching
        fetchCategories: async (params = {}, forceRefresh = false) => {
          const state = get()
          
          // Check cache validity (5 minutes)
          const cacheAge = Date.now() - state.lastFetch
          if (!forceRefresh && cacheAge < 300000 && state.categories.length > 0) {
            console.log('📁 CategoriesStore: Using cached categories')
            return
          }

          set((state) => ({
            loading: { ...state.loading, list: true },
            errors: { ...state.errors, list: null },
          }))

          try {
            console.log('📁 CategoriesStore: Fetching categories with params:', params)

            const response = await ticketCategoriesService.getCategories(params)

            if (response.success && response.data?.categories) {
              const categories = response.data.categories

              // Update cache for each category
              const cache = new Map(state.categoryCache)
              categories.forEach((category: CategoryWithStats) => {
                cache.set(category.id, {
                  data: category,
                  lastUpdate: Date.now()
                })
              })

              set(() => ({
                categories,
                lastFetch: Date.now(),
                categoryCache: cache,
                loading: { ...get().loading, list: false },
              }))

              console.log('✅ CategoriesStore: Categories fetched successfully:', categories.length)
            } else {
              throw new Error(response.message || 'Failed to fetch categories')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to fetch categories:', error)
            set((state) => ({
              loading: { ...state.loading, list: false },
              errors: { ...state.errors, list: error.message || 'Failed to fetch categories' },
            }))
          }
        },

        // Fetch single category with details
        fetchCategory: async (id: number, forceRefresh = false) => {
          if (!id || isNaN(id)) {
            console.error('❌ CategoriesStore: Invalid category ID provided:', id)
            set((state) => ({
              errors: { ...state.errors, details: 'Invalid category ID' },
            }))
            return
          }

          const state = get()
          
          // Check cache for complete data (valid for 2 minutes)
          const cached = state.categoryCache.get(id)
          if (!forceRefresh && cached) {
            const cacheAge = Date.now() - cached.lastUpdate
            if (cacheAge < 120000) { // 2 minutes
              console.log('📁 CategoriesStore: Using cached category data for ID:', id)
              
              set((state) => ({
                currentCategory: cached.data,
                categories: state.categories.map(c => c.id === id ? cached.data : c),
              }))
              return
            }
          }

          set((state) => ({
            loading: { ...state.loading, details: true },
            errors: { ...state.errors, details: null },
          }))

          try {
            console.log('📁 CategoriesStore: Fetching category details for ID:', id)

            const response = await ticketCategoriesService.getCategory(id)

            if (response.success && response.data?.category) {
              const category = response.data.category

              // Update cache
              const cache = new Map(state.categoryCache)
              cache.set(category.id, {
                data: category,
                lastUpdate: Date.now()
              })

              set((state) => ({
                currentCategory: category,
                categories: state.categories.map((c) => (c.id === category.id ? category : c)),
                categoryCache: cache,
                loading: { ...state.loading, details: false },
              }))

              console.log('✅ CategoriesStore: Category details fetched successfully')
            } else {
              throw new Error(response.message || 'Category not found')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to fetch category:', error)

            let errorMessage = 'Failed to fetch category details'
            if (error.response?.status === 404) {
              errorMessage = 'Category not found'
            } else if (error.response?.status === 403) {
              errorMessage = 'You do not have permission to view this category'
            } else if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, details: false },
              errors: { ...state.errors, details: errorMessage },
              currentCategory: null,
            }))
          }
        },

        // Refresh categories
        refreshCategories: async () => {
          console.log('🔄 CategoriesStore: Refreshing categories (force)')
          set((state) => ({ 
            lastFetch: 0,
          }))
          
          await get().actions.fetchCategories(undefined, true)
        },

        // Create new category
        createCategory: async (data: CreateCategoryRequest) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }))

          try {
            console.log('📁 CategoriesStore: Creating category')

            // Validate data
            const validation = ticketCategoriesService.validateCategoryData(data)
            if (!validation.valid) {
              throw new Error(validation.errors.join(', '))
            }

            const response = await ticketCategoriesService.createCategory(data)

            if (response.success && response.data?.category) {
              const newCategory = response.data.category

              // Update cache
              const cache = new Map(get().categoryCache)
              cache.set(newCategory.id, {
                data: newCategory,
                lastUpdate: Date.now()
              })

              set((state) => ({
                categories: [newCategory, ...state.categories],
                currentCategory: newCategory,
                categoryCache: cache,
                loading: { ...state.loading, create: false },
              }))

              console.log('✅ CategoriesStore: Category created successfully')
              return newCategory
            } else {
              throw new Error(response.message || 'Failed to create category')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to create category:', error)
            
            let errorMessage = 'Failed to create category. Please try again.'
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

        // Update category
        updateCategory: async (id: number, data: UpdateCategoryRequest) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))

          try {
            console.log('📁 CategoriesStore: Updating category:', id, data)

            const response = await ticketCategoriesService.updateCategory(id, data)

            if (response.success && response.data?.category) {
              const updatedCategory = response.data.category

              // Update cache
              const cache = new Map(get().categoryCache)
              cache.set(updatedCategory.id, {
                data: updatedCategory,
                lastUpdate: Date.now()
              })

              set((state) => ({
                categories: state.categories.map((c) => (c.id === id ? updatedCategory : c)),
                currentCategory: state.currentCategory?.id === id ? updatedCategory : state.currentCategory,
                categoryCache: cache,
                loading: { ...state.loading, update: false },
              }))

              console.log('✅ CategoriesStore: Category updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update category')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to update category:', error)

            let errorMessage = 'Failed to update category'
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

        // Delete category
        deleteCategory: async (id: number) => {
          console.log('📁 CategoriesStore: Starting category deletion:', id)

          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }))

          try {
            console.log('📁 CategoriesStore: Calling delete API:', id)

            const response = await ticketCategoriesService.deleteCategory(id)

            if (response.success) {
              console.log('✅ CategoriesStore: Delete API call successful, updating state')

              // Clean up cache and state
              const cache = new Map(get().categoryCache)
              cache.delete(id)

              set((state) => {
                const newSelectedCategories = new Set(state.selectedCategories)
                newSelectedCategories.delete(id)

                const newCategories = state.categories.filter((c) => c.id !== id)
                const newCurrentCategory = state.currentCategory?.id === id ? null : state.currentCategory

                return {
                  categories: newCategories,
                  currentCategory: newCurrentCategory,
                  selectedCategories: newSelectedCategories,
                  categoryCache: cache,
                  loading: { ...state.loading, delete: false },
                  errors: { ...state.errors, delete: null },
                }
              })

              console.log('✅ CategoriesStore: Category deleted successfully')
            } else {
              throw new Error(response.message || 'Failed to delete category')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to delete category:', error)

            let errorMessage = 'Failed to delete category'
            if (error.message?.includes('tickets')) {
              errorMessage = 'Cannot delete category with existing tickets. Please move or resolve tickets first.'
            } else if (error.message) {
              errorMessage = error.message
            }

            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: errorMessage },
            }))

            throw new Error(errorMessage)
          }
        },

        // Reorder categories
        reorderCategories: async (categories: Array<{ id: number; sort_order: number }>) => {
          set((state) => ({
            loading: { ...state.loading, reorder: true },
            errors: { ...state.errors, reorder: null },
          }))

          try {
            console.log('📁 CategoriesStore: Reordering categories')

            const response = await ticketCategoriesService.reorderCategories(categories)

            if (response.success) {
              // Refresh categories to get updated order
              await get().actions.fetchCategories(undefined, true)

              set((state) => ({
                loading: { ...state.loading, reorder: false },
              }))

              console.log('✅ CategoriesStore: Categories reordered successfully')
            } else {
              throw new Error(response.message || 'Failed to reorder categories')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to reorder categories:', error)

            set((state) => ({
              loading: { ...state.loading, reorder: false },
              errors: { ...state.errors, reorder: error.message || 'Failed to reorder categories' },
            }))
          }
        },

        // Bulk toggle active status
        bulkToggleActive: async (categoryIds: number[], isActive: boolean) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))

          try {
            console.log('📁 CategoriesStore: Bulk toggling active status:', { categoryIds, isActive })

            // Update each category individually
            const promises = categoryIds.map(id => 
              ticketCategoriesService.updateCategory(id, { is_active: isActive })
            )

            await Promise.all(promises)

            // Refresh categories to get updated data
            await get().actions.fetchCategories(undefined, true)

            set((state) => ({
              loading: { ...state.loading, update: false },
              selectedCategories: new Set(),
            }))

            console.log('✅ CategoriesStore: Bulk status update successful')
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to bulk update status:', error)

            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message || 'Failed to update category status' },
            }))
          }
        },

        // Fetch overview statistics
        fetchOverview: async () => {
          set((state) => ({
            loading: { ...state.loading, stats: true },
            errors: { ...state.errors, stats: null },
          }))

          try {
            console.log('📁 CategoriesStore: Fetching overview statistics')

            const response = await ticketCategoriesService.getCategoryStats()

            if (response.success && response.data) {
              set((state) => ({
                overview: response.data,
                loading: { ...state.loading, stats: false },
              }))

              console.log('✅ CategoriesStore: Overview statistics fetched successfully')
            } else {
              throw new Error(response.message || 'Failed to fetch statistics')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to fetch overview:', error)

            set((state) => ({
              loading: { ...state.loading, stats: false },
              errors: { ...state.errors, stats: error.message || 'Failed to fetch statistics' },
            }))
          }
        },

        // Utility methods
        getCategoryById: (id: number) => {
          const state = get()
          return state.categories.find(c => c.id === id) || null
        },

        getCategoryBySlug: (slug: string) => {
          const state = get()
          return state.categories.find(c => c.slug === slug) || null
        },

        getActiveCategories: () => {
          const state = get()
          return state.categories.filter(c => c.is_active)
        },

        getCategoriesWithAutoAssign: () => {
          const state = get()
          return state.categories.filter(c => c.auto_assign)
        },

        getCategoriesWithCrisisDetection: () => {
          const state = get()
          return state.categories.filter(c => c.crisis_detection_enabled)
        },

        // Filter management
        setFilters: (newFilters: CategoryFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
          }))
        },

        clearFilters: () => {
          set(() => ({
            filters: { ...defaultFilters },
          }))
        },

        // UI state management
        setCurrentCategory: (category: CategoryWithStats | null) => {
          set(() => ({ currentCategory: category }))
        },

        selectCategory: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedCategories)
            newSet.add(id)
            return { selectedCategories: newSet }
          })
        },

        deselectCategory: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedCategories)
            newSet.delete(id)
            return { selectedCategories: newSet }
          })
        },

        clearSelection: () => {
          set(() => ({ selectedCategories: new Set<number>() }))
        },

        // Error handling
        clearError: (type: keyof TicketCategoriesState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [type]: null },
          }))
        },

        setError: (type: keyof TicketCategoriesState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message },
          }))
        },

        // Cache management
        invalidateCache: (categoryId?: number) => {
          if (categoryId) {
            const cache = new Map(get().categoryCache)
            cache.delete(categoryId)
            set(() => ({ categoryCache: cache }))
            console.log('🗑️ CategoriesStore: Invalidated cache for category:', categoryId)
          } else {
            set(() => ({ 
              lastFetch: 0,
              categoryCache: new Map(),
            }))
            console.log('🗑️ CategoriesStore: Invalidated all cache')
          }
        },

        clearCache: () => {
          set(() => ({
            categories: [],
            currentCategory: null,
            overview: null,
            lastFetch: 0,
            selectedCategories: new Set(),
            categoryCache: new Map(),
          }))
          console.log('🗑️ CategoriesStore: Cleared all cache and data')
        },

        getCachedCategory: (id: number) => {
          const cached = get().categoryCache.get(id)
          if (cached) {
            const maxAge = 300000 // 5 minutes
            if (Date.now() - cached.lastUpdate < maxAge) {
              console.log('📦 CategoriesStore: Retrieved valid cached category:', id)
              return cached.data
            } else {
              console.log('⏰ CategoriesStore: Cached category expired:', id)
            }
          }
          return null
        },

        setCachedCategory: (category: CategoryWithStats) => {
          const cache = new Map(get().categoryCache)
          cache.set(category.id, {
            data: category,
            lastUpdate: Date.now(),
          })
          set(() => ({ categoryCache: cache }))
          console.log('💾 CategoriesStore: Cached category:', category.id)
        },

        // Export categories
        exportCategories: async (format: 'csv' | 'json' = 'csv') => {
          try {
            console.log('📁 CategoriesStore: Exporting categories:', format)

            const response = await ticketCategoriesService.exportCategories(format)

            if (response.success) {
              console.log('✅ CategoriesStore: Categories exported successfully')
            } else {
              throw new Error(response.message || 'Failed to export categories')
            }
          } catch (error: any) {
            console.error('❌ CategoriesStore: Failed to export categories:', error)
            set((state) => ({
              errors: { ...state.errors, list: error.message || 'Failed to export categories' },
            }))
          }
        },
      },
    }),
    { name: 'ticket-categories-store' }
  )
)

// Selector hooks
export const useCategoryById = (id: number) => {
  return useTicketCategoriesStore((state) => {
    try {
      // First check cache
      const cached = state.actions.getCachedCategory(id)
      if (cached) {
        return cached
      }
      
      // Fallback to current state
      return state.categories.find((c) => c.id === id) || state.currentCategory || null
    } catch (error) {
      console.error('Error finding category by ID:', error)
      return null
    }
  })
}

export const useCategoryBySlug = (slug: string) => {
  return useTicketCategoriesStore((state) => {
    try {
      return state.categories.find((c) => c.slug === slug) || null
    } catch (error) {
      console.error('Error finding category by slug:', error)
      return null
    }
  })
}

export const useCategoriesLoading = (type: keyof TicketCategoriesState['loading'] = 'list') => {
  return useTicketCategoriesStore((state) => state.loading[type])
}

export const useCategoriesError = (type: keyof TicketCategoriesState['errors'] = 'list') => {
  return useTicketCategoriesStore((state) => state.errors[type])
}

// Data selectors
export const useCategoriesData = () => {
  return useTicketCategoriesStore((state) => ({
    categories: state.categories,
    currentCategory: state.currentCategory,
    overview: state.overview,
    filters: state.filters,
    loading: state.loading,
    errors: state.errors,
    lastFetch: state.lastFetch
  }))
}

export const useCategoriesSelectors = () => {
  const categories = useTicketCategoriesStore((state) => state.categories)
  
  return {
    categories,
    activeCategories: categories.filter(c => c.is_active),
    inactiveCategories: categories.filter(c => !c.is_active),
    categoriesWithAutoAssign: categories.filter(c => c.auto_assign),
    categoriesWithCrisisDetection: categories.filter(c => c.crisis_detection_enabled),
    categoriesWithTickets: categories.filter(c => (c.tickets_count || 0) > 0),
    categoriesWithoutTickets: categories.filter(c => (c.tickets_count || 0) === 0),
    categoriesWithCounselors: categories.filter(c => (c.counselor_count || 0) > 0),
    categoriesWithoutCounselors: categories.filter(c => (c.counselor_count || 0) === 0),

    selectedCategoriesArray: Array.from(useTicketCategoriesStore.getState().selectedCategories)
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as CategoryWithStats[],
  }
}

export const useCategoriesStats = () => {
  const categories = useTicketCategoriesStore((state) => state.categories)
  const overview = useTicketCategoriesStore((state) => state.overview)

  return {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
    withAutoAssign: categories.filter(c => c.auto_assign).length,
    withCrisisDetection: categories.filter(c => c.crisis_detection_enabled).length,
    withTickets: categories.filter(c => (c.tickets_count || 0) > 0).length,
    withCounselors: categories.filter(c => (c.counselor_count || 0) > 0).length,
    
    totalTickets: categories.reduce((sum, c) => sum + (c.tickets_count || 0), 0),
    totalCounselors: categories.reduce((sum, c) => sum + (c.counselor_count || 0), 0),
    avgTicketsPerCategory: categories.length > 0 
      ? Math.round((categories.reduce((sum, c) => sum + (c.tickets_count || 0), 0) / categories.length) * 10) / 10
      : 0,
    avgCounselorsPerCategory: categories.length > 0 
      ? Math.round((categories.reduce((sum, c) => sum + (c.counselor_count || 0), 0) / categories.length) * 10) / 10
      : 0,

    overview,
  }
}

export const useCategoriesActions = () => {
  return useTicketCategoriesStore((state) => state.actions)
}

export const useCategoriesCache = () => {
  const categoryCache = useTicketCategoriesStore((state) => state.categoryCache)
  
  return {
    categoryCache,
    getCacheStats: () => ({
      totalCachedCategories: categoryCache.size,
      oldestCacheEntry: Math.min(...Array.from(categoryCache.values()).map(c => c.lastUpdate)),
    }),
  }
}

// Utility hooks
export const useCategoryUtilities = () => {
  const categories = useTicketCategoriesStore((state) => state.categories)
  
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

    getCategoryById: (id: number) => categories.find(c => c.id === id),
    
    getCategoryBySlug: (slug: string) => categories.find(c => c.slug === slug),
    
    getActiveCategoriesCount: () => categories.filter(c => c.is_active).length,
    
    getCategoriesWithAutoAssign: () => categories.filter(c => c.auto_assign),
    
    getCategoriesWithCrisisDetection: () => categories.filter(c => c.crisis_detection_enabled),

    getCategoryColorStyles: (color: string) => {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null
      }

      const rgb = hexToRgb(color)
      
      if (!rgb) {
        return {
          background: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800'
        }
      }

      return {
        background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
        border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
        text: color,
        badge: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
      }
    },

    validateCategoryData: (data: CreateCategoryRequest) => {
      return ticketCategoriesService.validateCategoryData(data)
    },

    getDefaultCategorySettings: () => {
      return ticketCategoriesService.getDefaultCategorySettings()
    },

    getAvailableIcons: () => {
      return ticketCategoriesService.getAvailableIcons()
    },

    getAvailableColors: () => {
      return ticketCategoriesService.getAvailableColors()
    },

    generateSlug: (name: string) => {
      return ticketCategoriesService.generateSlug(name)
    },
  }
}

// Export store for direct access when needed
export default useTicketCategoriesStore