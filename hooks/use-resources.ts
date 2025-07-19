// hooks/use-resources.ts - COMPLETE FIXED VERSION: Single initialization pattern like help system

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useResourcesStore, {
  useResourcesSelectors,
  useResourcesActions,
  useResourcesLoading,
  useResourcesErrors,
  type ResourceItem,
} from '@/stores/resources-store';
import type { ResourceFilters } from '@/services/resources.service';
import { toast } from 'sonner'

// =============================================================================
// CORE HOOK: Single source of truth - EXACTLY like help system
// =============================================================================

/**
 * FINAL FIXED: Core hook that fetches ALL data ONCE and populates the store
 * All other hooks use this data - NO additional API calls
 */
function useResourcesCore(enabled: boolean = true) {
  const { user } = useAuth()
  const { resources, categories, stats } = useResourcesSelectors()
  const { fetchResources, fetchCategories, fetchStats } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)
  const [initializationAttempted, setInitializationAttempted] = useState(false)

  // FIXED: Stable initialization with minimal dependencies
  const initialize = useCallback(async () => {
    if (!enabled || !user) {
      console.log('🎯 useResourcesCore: Skipping - not enabled or no user')
      return
    }
    
    if (initializationAttempted) {
      console.log('🎯 useResourcesCore: Already attempted initialization')
      return
    }
    
    if (isInitialized) {
      console.log('🎯 useResourcesCore: Already initialized')
      return
    }
    
    setInitializationAttempted(true)
    
    // Don't fetch if we already have substantial data
    if (resources.length > 0 && categories.length > 0 && stats) {
      console.log('🎯 useResourcesCore: Data already exists, marking as initialized')
      setIsInitialized(true)
      return
    }

    try {
      console.log('🎯 useResourcesCore: Single initialization - fetching ALL data...')
      
      // Fetch everything in parallel - ONCE
      await Promise.all([
        fetchResources({ per_page: 50, sort_by: 'featured' }), // Get enough for all use cases
        fetchCategories(false), // Get active categories
        fetchStats() // Get stats
      ])
      
      setIsInitialized(true)
      console.log('✅ useResourcesCore: ALL data fetched successfully - store populated')
    } catch (error) {
      console.error('❌ useResourcesCore: Failed to initialize:', error)
      setInitializationAttempted(false) // Allow retry on error
    }
  }, [
    enabled, 
    user, 
    initializationAttempted, 
    isInitialized,
    fetchResources, 
    fetchCategories, 
    fetchStats
    // REMOVED: resources.length, categories.length, stats - these cause re-runs!
  ])

  // FIXED: Only run once when dependencies actually change
  useEffect(() => {
    if (enabled && user && !initializationAttempted && !isInitialized) {
      initialize()
    }
  }, [enabled, user, initializationAttempted, isInitialized, initialize])

  const refetch = useCallback(async () => {
    console.log('🔄 useResourcesCore: Manual refetch requested')
    setIsInitialized(false)
    setInitializationAttempted(false)
    // Force re-initialization
    setTimeout(() => {
      initialize()
    }, 100)
  }, [initialize])

  return {
    isInitialized,
    isLoading: loading.resources || loading.categories || loading.stats,
    error: errors.resources || errors.categories || errors.stats,
    refetch
  }
}

// =============================================================================
// ALL OTHER HOOKS: Use store data only - NO API calls
// =============================================================================

/**
 * Resource categories - uses store data only
 */
export function useResourceCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
} = {}) {
  const { enabled = true } = options
  const { categories } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  const filteredCategories = useMemo(() => {
    if (options.includeInactive) return categories
    return categories.filter(c => c.is_active)
  }, [categories, options.includeInactive])

  return {
    categories: filteredCategories,
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    refetch: core.refetch,
    activeCategories: categories.filter(c => c.is_active),
    categoriesCount: filteredCategories.length,
  }
}

/**
 * Main resources - uses store data + local filtering only
 * - FIXED: Remove duplicate pagination property
 */
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
  autoFetch?: boolean
} = {}) {
  const { enabled = true } = options
  const { resources, pagination } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  // Local filtering only - no API calls
  const filteredResources = useMemo(() => {
    let filtered = [...resources]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(r => r.category?.slug === filters.category)
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type)
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      filtered = filtered.filter(r => r.difficulty === filters.difficulty)
    }

    if (filters.featured) {
      filtered = filtered.filter(r => r.is_featured)
    }

    if (!filters.include_drafts) {
      filtered = filtered.filter(r => r.is_published)
    }

    // Sort locally
    const sortBy = filters.sort_by || 'featured'
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        break
      case 'downloads':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return filtered
  }, [resources, filters])

  // Client-side pagination
  const paginatedResources = useMemo(() => {
    const page = filters.page || 1
    const perPage = filters.per_page || 25
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    
    return filteredResources.slice(startIndex, endIndex)
  }, [filteredResources, filters.page, filters.per_page])

  // Calculate pagination metadata
  const calculatedPagination = useMemo(() => {
    const page = filters.page || 1
    const perPage = filters.per_page || 25
    const total = filteredResources.length
    const lastPage = Math.ceil(total / perPage)
    
    return {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total: total,
      from: total > 0 ? ((page - 1) * perPage) + 1 : 0,
      to: Math.min(page * perPage, total),
      has_more_pages: page < lastPage
    }
  }, [filteredResources, filters.page, filters.per_page])

  // Computed data with pagination context
  const computedData = useMemo(() => {
    const workingResources = filteredResources
    const publishedResources = workingResources.filter(r => r.is_published)
    const featuredResources = workingResources.filter(r => r.is_featured)
    const draftResources = workingResources.filter(r => !r.is_published)

    return {
      publishedResources,
      featuredResources,
      draftResources,
      totalCount: workingResources.length,
      currentPageCount: paginatedResources.length,
      publishedCount: publishedResources.length,
      featuredCount: featuredResources.length,
      draftCount: draftResources.length,
      // REMOVED: pagination: calculatedPagination, (this was the duplicate)
    }
  }, [filteredResources, paginatedResources, calculatedPagination])

  return {
    resources: paginatedResources,
    pagination: calculatedPagination, // ONLY pagination property here
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    fetchWithFilters: () => {}, // No-op since we filter locally
    refetch: core.refetch,
    ...computedData, // This spread no longer contains pagination
  }
}

/**
 * Single resource - uses store data only
 */
export function useResource(id: number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  const { setCurrentResource } = useResourcesActions()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  const resource = useMemo(() => {
    const found = resources.find(r => r.id === id) || null
    if (found) {
      setCurrentResource(found)
    }
    return found
  }, [resources, id, setCurrentResource])

  return {
    resource,
    isLoading: core.isLoading && !resource,
    error: core.error,
    refetch: core.refetch,
    isBookmarked: resource?.is_bookmarked || false,
    isFeatured: resource?.is_featured || false,
    isPublished: resource?.is_published || false,
  }
}

/**
 * Resource stats - uses store data only
 */
export function useResourceStats(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { stats } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  const safeStats = useMemo(() => ({
    total_resources: stats?.total_resources || 0,
    published_resources: stats?.published_resources || 0,
    draft_resources: stats?.draft_resources || 0,
    featured_resources: stats?.featured_resources || 0,
    categories_count: stats?.categories_count || 0,
    active_categories: stats?.active_categories || 0,
    total_views: stats?.total_views || 0,
    total_downloads: stats?.total_downloads || 0,
    average_rating: stats?.average_rating || 0,
  }), [stats])

  return {
    stats: safeStats,
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    refetch: core.refetch,
    hasData: core.isInitialized,
  }
}

/**
 * Resource bookmarks - separate fetch (doesn't interfere with main data)
 */
export function useResourceBookmarks(page: number = 1, perPage: number = 25) {
  const { user } = useAuth()
  const { bookmarks } = useResourcesSelectors()
  const { fetchBookmarks } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    if (!user) {
      console.log('🔖 useResourceBookmarks: No user, skipping bookmark fetch')
      return
    }

    if (isInitialized) {
      console.log('🔖 useResourceBookmarks: Already initialized, skipping')
      return
    }

    try {
      console.log('🔖 useResourceBookmarks: Initializing bookmarks fetch...', { page, perPage })
      await fetchBookmarks(page, perPage)
      setIsInitialized(true)
      console.log('✅ useResourceBookmarks: Bookmarks initialized successfully')
    } catch (error) {
      console.error('❌ useResourceBookmarks: Failed to initialize:', error)
    }
  }, [user, isInitialized, fetchBookmarks, page, perPage])

  useEffect(() => {
    initialize()
  }, [initialize])

  const refetch = useCallback(async () => {
    if (!user) return
    
    console.log('🔄 useResourceBookmarks: Refetching bookmarks...')
    setIsInitialized(false)
    await fetchBookmarks(page, perPage)
    setIsInitialized(true)
  }, [user, fetchBookmarks, page, perPage])

  // Ensure bookmarks is always an array
  const safeBookmarks = useMemo(() => {
    return Array.isArray(bookmarks) ? bookmarks : []
  }, [bookmarks])

  return {
    bookmarks: safeBookmarks,
    isLoading: loading.bookmarks && !isInitialized,
    error: errors.bookmarks,
    isInitialized,
    refetch,
    bookmarksCount: safeBookmarks.length,
    hasBookmarks: safeBookmarks.length > 0,
  }
}

/**
 * Featured resources - uses store data only (NO API call)
 */
export function useFeaturedResources(limit: number = 3, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  const featuredResources = useMemo(() => {
    return resources
      .filter(r => r.is_featured && r.is_published)
      .slice(0, limit)
  }, [resources, limit])

  return {
    featured: featuredResources,
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    refetch: core.refetch,
    featuredCount: featuredResources.length,
    hasFeatured: featuredResources.length > 0,
  }
}

/**
 * Popular resources - uses store data only (NO API call)
 */
export function usePopularResources(limit: number = 5, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  const popularResources = useMemo(() => {
    return [...resources]
      .filter(r => r.is_published)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, limit)
  }, [resources, limit])

  return {
    popular: popularResources,
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    refetch: core.refetch,
    popularCount: popularResources.length,
    hasPopular: popularResources.length > 0,
  }
}

// =============================================================================
// INTERACTION HOOKS - Keep as is
// =============================================================================

export function useResourceAccess() {
  const { user } = useAuth()
  const { accessResource } = useResourcesActions()
  const loading = useResourcesLoading()

  const access = useCallback(async (resourceId: number) => {
    if (!user) {
      toast.error('Please log in to access resources')
      return null
    }

    try {
      return await accessResource(resourceId)
    } catch (error: any) {
      console.error('❌ useResourceAccess: Access failed:', error)
      return null
    }
  }, [user, accessResource])

  return {
    access,
    isLoading: loading.access,
  }
}

export function useResourceFeedback() {
  const { user } = useAuth()
  const { provideFeedback } = useResourcesActions()
  const loading = useResourcesLoading()

  const submitFeedback = useCallback(async (
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean }
  ) => {
    if (!user) {
      toast.error('Please log in to provide feedback')
      return false
    }

    try {
      await provideFeedback(resourceId, feedback)
      return true
    } catch (error: any) {
      console.error('❌ useResourceFeedback: Feedback failed:', error)
      return false
    }
  }, [user, provideFeedback])

  return {
    submitFeedback,
    isLoading: loading.feedback,
  }
}

export function useResourceBookmark() {
  const { user } = useAuth()
  const { toggleBookmark } = useResourcesActions()
  const loading = useResourcesLoading()

  const toggle = useCallback(async (resourceId: number): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to bookmark resources')
      return false
    }

    try {
      console.log('🔖 useResourceBookmark: Toggling bookmark for resource:', resourceId)
      
      // The store's toggleBookmark now returns a boolean indicating success
      const result = await toggleBookmark(resourceId)
      
      if (typeof result === 'boolean' && result) {
        console.log('✅ useResourceBookmark: Bookmark toggled successfully')
        return true
      } else if (typeof result === 'boolean' && !result) {
        console.error('❌ useResourceBookmark: Bookmark toggle returned false')
        return false
      } else {
        console.error('❌ useResourceBookmark: Bookmark toggle did not return a boolean')
        return false
      }
    } catch (error: any) {
      console.error('❌ useResourceBookmark: Bookmark toggle failed:', error)
      toast.error(error.message || 'Failed to toggle bookmark')
      return false
    }
  }, [user, toggleBookmark])

  return {
    toggle,
    isLoading: loading.bookmark,
  }
}

// =============================================================================
// DASHBOARD - Uses shared data from core hook
// =============================================================================

/**
 * UPDATED: Dashboard with pagination awareness and single initialization
 */
export function useResourcesDashboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  
  // Use core hook to ensure data is loaded ONCE
  const core = useResourcesCore(enabled)
  
  // Get all data from selectors (no additional API calls)
  const { 
    resources, 
    categories, 
    stats,
    activeCategories 
  } = useResourcesSelectors()

  // Computed data from store only
  const computedData = useMemo(() => {
    // Featured resources from store
    const featured = resources
      .filter(r => r.is_featured && r.is_published)
      .slice(0, 6)

    // Popular resources from store
    const popular = [...resources]
      .filter(r => r.is_published)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 8)

    // Top rated from store data
    const topRated = [...resources]
      .filter(r => r.is_published && r.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8)

    // Safe stats
    const safeStats = stats || {
      total_resources: resources.length,
      published_resources: resources.filter(r => r.is_published).length,
      draft_resources: resources.filter(r => !r.is_published).length,
      featured_resources: resources.filter(r => r.is_featured).length,
      categories_count: categories.length,
      active_categories: activeCategories.length,
      total_views: 0,
      total_downloads: 0,
      average_rating: 0,
    }

    return {
      featured,
      popular,
      topRated,
      stats: safeStats
    }
  }, [resources, categories, stats, activeCategories])

  return {
    categories: activeCategories,
    featured: computedData.featured,
    popular: computedData.popular,
    topRated: computedData.topRated,
    stats: computedData.stats,
    isLoading: core.isLoading,
    error: core.error,
    refetch: core.refetch,
    forceRefresh: core.refetch,
    hasData: !!(activeCategories.length || computedData.featured.length || computedData.popular.length),
    loadingStates: {
      categories: core.isLoading,
      featured: core.isLoading,
      popular: core.isLoading,
      stats: core.isLoading,
    },
    initializationStates: {
      categories: core.isInitialized,
      featured: core.isInitialized,
      popular: core.isInitialized,
      stats: core.isInitialized,
    },
  }
}

// =============================================================================
// ADMIN AND UTILITY HOOKS - Keep as is
// =============================================================================

/**
 * Enhanced filter hook with pagination support
 */
export function useResourceFilters(initialFilters: ResourceFilters = {}) {
  const [filters, setFilters] = useState<ResourceFilters>({
    page: 1,
    per_page: 25, // Default to 25 instead of 15
    sort_by: 'featured',
    ...initialFilters
  })

  const updateFilter = useCallback((key: keyof ResourceFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
      // Reset to page 1 when changing non-pagination filters
      page: key !== 'page' && key !== 'per_page' ? 1 : (key === 'page' ? value : filters.page),
    }
    setFilters(newFilters)
  }, [filters])

  const updatePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const updatePerPage = useCallback((perPage: number) => {
    setFilters(prev => ({ ...prev, per_page: perPage, page: 1 })) // Reset to page 1 when changing per page
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      per_page: filters.per_page, // Keep per_page setting
      sort_by: 'featured',
      ...initialFilters
    })
  }, [initialFilters, filters.per_page])

  return {
    filters,
    updateFilter,
    updatePage,
    updatePerPage,
    clearFilters,
    setFilters,
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (['page', 'per_page'].includes(key)) return false
      return value !== undefined && value !== null && value !== '' && value !== 'all'
    }),
  }
}

export function useAdminResourceManagement() {
  const { user } = useAuth()
  const { 
    createResource, 
    updateResource, 
    deleteResource, 
    togglePublishResource, 
    toggleFeatureResource,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshAll 
  } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const canManage = useMemo(() => {
    return user?.role === 'admin'
  }, [user?.role])

  return {
    createResource,
    updateResource,
    deleteResource,
    togglePublish: togglePublishResource,
    toggleFeature: toggleFeatureResource,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: loading.create,
    isUpdating: loading.update,
    isDeleting: loading.delete,
    createError: errors.create,
    updateError: errors.update,
    deleteError: errors.delete,
    canManage,
    refreshAll,
  }
}

export function useRecentResourceSearches() {
  const { user } = useAuth()
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return []
    try {
      const stored = localStorage.getItem(`recent_resource_searches_${user.id}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((search) => search.toLowerCase() !== query.toLowerCase())
      const newSearches = [query, ...filtered].slice(0, 10)

      if (user?.id) {
        try {
          localStorage.setItem(`recent_resource_searches_${user.id}`, JSON.stringify(newSearches))
        } catch (error) {
          console.error('Failed to save recent resource searches:', error)
        }
      }

      return newSearches
    })
  }, [user?.id])

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((search) => search !== query)

      if (user?.id) {
        try {
          localStorage.setItem(`recent_resource_searches_${user.id}`, JSON.stringify(newSearches))
        } catch (error) {
          console.error('Failed to update recent resource searches:', error)
        }
      }

      return newSearches
    })
  }, [user?.id])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (user?.id) {
      try {
        localStorage.removeItem(`recent_resource_searches_${user.id}`)
      } catch (error) {
        console.error('Failed to clear recent resource searches:', error)
      }
    }
  }, [user?.id])

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    hasRecentSearches: recentSearches.length > 0,
  }
}

export function useResourceAnalytics() {
  const trackResourceView = useCallback((resourceId: number, title: string, type: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'resource_view', {
        event_category: 'Resources',
        event_label: title,
        value: resourceId,
        custom_parameters: {
          resource_type: type,
        },
      })
    }
    console.log('📊 Analytics: Resource view tracked:', { resourceId, title, type })
  }, [])

  const trackResourceAccess = useCallback(
    (resourceId: number, title: string, type: string, action: string) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'resource_access', {
          event_category: 'Resources',
          event_label: title,
          value: resourceId,
          custom_parameters: {
            resource_type: type,
            action_type: action,
          },
        })
      }
      console.log('📊 Analytics: Resource access tracked:', { resourceId, title, type, action })
    },
    []
  )

  const trackResourceRating = useCallback((resourceId: number, title: string, rating: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'resource_rating', {
        event_category: 'Resources',
        event_label: title,
        value: resourceId,
        custom_parameters: {
          rating: rating,
        },
      })
    }
    console.log('📊 Analytics: Resource rating tracked:', { resourceId, title, rating })
  }, [])

  const trackResourceBookmark = useCallback(
    (resourceId: number, title: string, bookmarked: boolean) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'resource_bookmark', {
          event_category: 'Resources',
          event_label: title,
          value: resourceId,
          custom_parameters: {
            bookmarked: bookmarked,
          },
        })
      }
      console.log('📊 Analytics: Resource bookmark tracked:', { resourceId, title, bookmarked })
    },
    []
  )

  const trackResourceSearch = useCallback((query: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'resource_search', {
        event_category: 'Resources',
        event_label: query,
        value: resultsCount,
      })
    }
    console.log('📊 Analytics: Resource search tracked:', { query, resultsCount })
  }, [])

  const trackResourceCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'resource_category_click', {
        event_category: 'Resources',
        event_label: categoryName,
        value: categorySlug,
      })
    }
    console.log('📊 Analytics: Resource category click tracked:', { categorySlug, categoryName })
  }, [])

  return {
    trackResourceView,
    trackResourceAccess,
    trackResourceRating,
    trackResourceBookmark,
    trackResourceSearch,
    trackResourceCategoryClick,
  }
}

export function useResourceUtils() {
  const getTypeIcon = useCallback((type: string) => {
    const types = {
      article: 'FileText',
      video: 'Video',
      audio: 'Headphones',
      exercise: 'Brain',
      tool: 'Heart',
      worksheet: 'Download',
    } as const
    return types[type as keyof typeof types] || 'BookOpen'
  }, [])

  const getTypeLabel = useCallback((type: string) => {
    const types = {
      article: 'Article',
      video: 'Video',
      audio: 'Audio',
      exercise: 'Exercise',
      tool: 'Tool',
      worksheet: 'Worksheet',
    } as const
    return types[type as keyof typeof types] || type
  }, [])

  const getDifficultyColor = useCallback((difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    } as const
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }, [])

  const getDifficultyLabel = useCallback((difficulty: string) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    } as const
    return labels[difficulty as keyof typeof labels] || difficulty
  }, [])

  const formatDuration = useCallback((duration?: string) => {
    if (!duration) return 'Self-paced'
    return duration
  }, [])

  const formatCount = useCallback((count: number | undefined | null) => {
    const safeCount = Number(count) || 0
    if (safeCount < 1000) return safeCount.toString()
    if (safeCount < 1000000) return `${(safeCount / 1000).toFixed(1)}K`
    return `${(safeCount / 1000000).toFixed(1)}M`
  }, [])

  const formatRating = useCallback((rating: any): number => {
    const numRating = Number(rating)
    if (isNaN(numRating)) return 0
    return Math.max(0, Math.min(5, numRating))
  }, [])

  const formatRatingDisplay = useCallback((rating: any): string => {
    return formatRating(rating).toFixed(1)
  }, [])

  // FIXED: Add the missing calculateRatingPercentage function
  const calculateRatingPercentage = useCallback((rating: number): number => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0))
    return Math.round((safeRating / 5) * 100)
  }, [])

  const formatTimeAgo = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
      
      return date.toLocaleDateString()
    } catch (error) {
      return 'Unknown time'
    }
  }, [])

  return {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    getDifficultyLabel,
    formatDuration,
    formatCount,
    formatRating,
    formatRatingDisplay,
    calculateRatingPercentage, // FIXED: Added missing function
    formatTimeAgo,
  }
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

export function useResourcePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => ({
    canManageResources: user?.role === 'admin',
    canSuggestContent: user?.role === 'counselor' || user?.role === 'admin',
    canAccessResources: !!user,
    canBookmarkResources: !!user,
    canProvideRatings: !!user,
    canViewAnalytics: user?.role === 'admin' || user?.role === 'counselor',
  }), [user])

  return permissions
}

export function useResourceValidation() {
  const validateResourceData = useCallback((data: Partial<ResourceItem>) => {
    const errors: string[] = []

    if (!data.title?.trim() || data.title.length < 5) {
      errors.push('Title must be at least 5 characters long')
    }

    if (!data.description?.trim() || data.description.length < 20) {
      errors.push('Description must be at least 20 characters long')
    }

    if (!data.category_id) {
      errors.push('Category is required')
    }

    if (!data.external_url?.trim()) {
      errors.push('External URL is required')
    }

    if (!data.type) {
      errors.push('Resource type is required')
    }

    if (!data.difficulty) {
      errors.push('Difficulty level is required')
    }

    return { valid: errors.length === 0, errors }
  }, [])

  const validateCategoryData = useCallback((data: any) => {
    const errors: string[] = []

    if (!data.name?.trim() || data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long')
    }

    return { valid: errors.length === 0, errors }
  }, [])

  const isValidResourceUrl = useCallback((url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    validateResourceData,
    validateCategoryData,
    isValidResourceUrl,
  }
}

export function useResourceMetrics() {
  const { resources } = useResourcesSelectors()

  const metrics = useMemo(() => {
    if (!resources || resources.length === 0) {
      return {
        totalResources: 0,
        publishedResources: 0,
        draftResources: 0,
        featuredResources: 0,
        averageRating: 0,
        totalViews: 0,
        totalDownloads: 0,
        resourcesByType: {},
        resourcesByDifficulty: {},
        topCategories: [],
        recentResources: [],
      }
    }

    const published = resources.filter(r => r.is_published)
    const drafts = resources.filter(r => !r.is_published)
    const featured = resources.filter(r => r.is_featured)

    const totalRating = resources.reduce((sum, r) => sum + (r.rating || 0), 0)
    const averageRating = resources.length > 0 ? totalRating / resources.length : 0

    const totalViews = resources.reduce((sum, r) => sum + (r.view_count || 0), 0)
    const totalDownloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0)

    // Group by type
    const resourcesByType = resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by difficulty
    const resourcesByDifficulty = resources.reduce((acc, r) => {
      acc[r.difficulty] = (acc[r.difficulty] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent resources (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentResources = resources.filter(r => 
      new Date(r.created_at) > thirtyDaysAgo
    ).slice(0, 10)

    return {
      totalResources: resources.length,
      publishedResources: published.length,
      draftResources: drafts.length,
      featuredResources: featured.length,
      averageRating,
      totalViews,
      totalDownloads,
      resourcesByType,
      resourcesByDifficulty,
      recentResources,
    }
  }, [resources])

  return metrics
}

export function useResourceSearch() {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<ResourceItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { resources } = useResourcesSelectors()

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    try {
      // Local search implementation
      const searchTerm = query.toLowerCase()
      const results = resources.filter(resource => {
        return (
          resource.title.toLowerCase().includes(searchTerm) ||
          resource.description.toLowerCase().includes(searchTerm) ||
          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          resource.author_name?.toLowerCase().includes(searchTerm) ||
          resource.category?.name.toLowerCase().includes(searchTerm)
        )
      })

      setSearchResults(results)
      
      // Add to search history
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== query)
        return [query, ...filtered].slice(0, 10)
      })
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [resources])

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  const clearSearchResults = useCallback(() => {
    setSearchResults([])
  }, [])

  return {
    searchResults,
    searchHistory,
    isSearching,
    performSearch,
    clearSearchHistory,
    clearSearchResults,
  }
}

export function useResourceExport() {
  const { resources, categories } = useResourcesSelectors()

  const exportToCSV = useCallback((data: ResourceItem[], filename: string = 'resources.csv') => {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Type',
      'Difficulty',
      'Category',
      'Author',
      'Rating',
      'Views',
      'Downloads',
      'Published',
      'Featured',
      'Created Date'
    ]

    const csvContent = [
      headers.join(','),
      ...data.map(resource => [
        resource.id,
        `"${resource.title.replace(/"/g, '""')}"`,
        `"${resource.description.replace(/"/g, '""')}"`,
        resource.type,
        resource.difficulty,
        resource.category?.name || '',
        resource.author_name || '',
        resource.rating || 0,
        resource.view_count || 0,
        resource.download_count || 0,
        resource.is_published ? 'Yes' : 'No',
        resource.is_featured ? 'Yes' : 'No',
        new Date(resource.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const exportToJSON = useCallback((data: ResourceItem[], filename: string = 'resources.json') => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const exportResources = useCallback((format: 'csv' | 'json' = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `resources_export_${timestamp}`
    
    if (format === 'csv') {
      exportToCSV(resources, `${filename}.csv`)
    } else {
      exportToJSON(resources, `${filename}.json`)
    }
  }, [resources, exportToCSV, exportToJSON])

  const exportCategories = useCallback((format: 'csv' | 'json' = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `categories_export_${timestamp}`
    
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Description', 'Color', 'Active', 'Sort Order', 'Resources Count']
      const csvContent = [
        headers.join(','),
        ...categories.map(category => [
          category.id,
          `"${category.name.replace(/"/g, '""')}"`,
          `"${(category.description || '').replace(/"/g, '""')}"`,
          category.color,
          category.is_active ? 'Yes' : 'No',
          category.sort_order,
          category.resources_count || 0
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      exportToJSON(categories as any, `${filename}.json`)
    }
  }, [categories, exportToJSON])

  return {
    exportResources,
    exportCategories,
    exportToCSV,
    exportToJSON,
  }
}

// =============================================================================
// DEBUG AND PERFORMANCE HOOKS
// =============================================================================

export function useResourceDebug() {
  const { user } = useAuth()
  const store = useResourcesStore()
  const selectors = useResourcesSelectors()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const debugInfo = useMemo(() => ({
    user: {
      id: user?.id,
      role: user?.role,
      isAuthenticated: !!user,
    },
    store: {
      resourcesCount: selectors.resources.length,
      categoriesCount: selectors.categories.length,
      bookmarksCount: selectors.bookmarks.length,
      hasStats: !!selectors.stats,
    },
    loading: {
      hasAnyLoading: Object.values(loading).some(Boolean),
      loadingStates: loading,
    },
    errors: {
      hasAnyError: Object.values(errors).some(Boolean),
      errorStates: errors,
    },
    performance: {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    }
  }), [user, selectors, loading, errors])

  const logDebugInfo = useCallback(() => {
    console.group('🐛 Resource System Debug Info')
    console.table(debugInfo)
    console.groupEnd()
  }, [debugInfo])

  return {
    debugInfo,
    logDebugInfo,
  }
}

export function useResourcePerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastFetchTime: 0,
    averageFetchTime: 0,
    totalFetches: 0,
    cacheHitRate: 0,
  })

  const trackFetchTime = useCallback((duration: number) => {
    setPerformanceMetrics(prev => {
      const totalFetches = prev.totalFetches + 1
      const averageFetchTime = (prev.averageFetchTime * prev.totalFetches + duration) / totalFetches
      
      return {
        ...prev,
        lastFetchTime: duration,
        averageFetchTime,
        totalFetches,
      }
    })
  }, [])

  const updateCacheHitRate = useCallback((rate: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      cacheHitRate: rate,
    }))
  }, [])

  return {
    performanceMetrics,
    trackFetchTime,
    updateCacheHitRate,
  }
}

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

// Default export for convenience
export default {
  // Core data hooks
  useResourcesDashboard,
  useResources,
  useResourceCategories,
  useResource,
  useResourceStats,
  useResourceBookmarks,
  useFeaturedResources,
  usePopularResources,

  // Interaction hooks
  useResourceAccess,
  useResourceFeedback,
  useResourceBookmark,

  // Utility hooks
  useResourceFilters,
  useResourceAnalytics,
  useResourceUtils,
  useResourcePermissions,
  useResourceValidation,

  // Admin hooks
  useAdminResourceManagement,

  // Search and history
  useRecentResourceSearches,
  useResourceSearch,

  // Export and debug
  useResourceExport,
  useResourceDebug,
  useResourcePerformance,
}