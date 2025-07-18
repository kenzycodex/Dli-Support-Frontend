// hooks/use-resources.ts - FIXED: API validation issues and pagination

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useResourcesStore, {
  useResourcesSelectors,
  useResourcesActions,
  useResourcesLoading,
  useResourcesErrors,
  useResourcesFilters,
  useResourcesStats,
  type ResourceItem,
  type ResourceBookmark,
} from '@/stores/resources-store';
import type { Resource, ResourceCategory, ResourceFilters } from '@/services/resources.service';
import { resourcesService } from '@/services/resources.service';
import { toast } from 'sonner'

// =============================================================================
// MAIN RESOURCE HOOKS - Complete store-based implementation
// =============================================================================

/**
 * Enhanced hook for resource categories with store integration
 */
export function useResourceCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, enabled = true } = options
  const { categories } = useResourcesSelectors()
  const { fetchCategories } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    if (!enabled || !user || isInitialized) return

    try {
      console.log('🔍 useResourceCategories: Initializing categories...')
      await fetchCategories(includeInactive)
      setIsInitialized(true)
      console.log('✅ useResourceCategories: Categories initialized successfully')
    } catch (error) {
      console.error('❌ useResourceCategories: Failed to initialize:', error)
    }
  }, [enabled, user, isInitialized, fetchCategories, includeInactive])

  useEffect(() => {
    initialize()
  }, [initialize])

  const refetch = useCallback(() => {
    console.log('🔄 useResourceCategories: Refetching categories...')
    return fetchCategories(includeInactive)
  }, [fetchCategories, includeInactive])

  return {
    categories: categories || [],
    isLoading: loading.categories && !isInitialized,
    error: errors.categories,
    isInitialized,
    refetch,
    // Additional computed data
    activeCategories: categories?.filter(c => c.is_active) || [],
    categoriesCount: categories?.length || 0,
  }
}

/**
 * FIXED: Enhanced resources hook with proper error handling and no invalid params
 */
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
  autoFetch?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true, autoFetch = true } = options
  const { resources } = useResourcesSelectors()
  const { fetchResources, setFilters } = useResourcesActions()
  const { filters: currentFilters } = useResourcesFilters()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  // FIXED: Clean filters to avoid API validation errors
  const cleanFilters = useCallback((rawFilters: ResourceFilters) => {
    const cleaned: ResourceFilters = {}
    
    // Only add valid, non-empty filters
    if (rawFilters.search && rawFilters.search.trim()) {
      cleaned.search = rawFilters.search.trim()
    }
    if (rawFilters.category && rawFilters.category !== 'all') {
      cleaned.category = rawFilters.category
    }
    if (rawFilters.type && rawFilters.type !== 'all') {
      cleaned.type = rawFilters.type
    }
    if (rawFilters.difficulty && rawFilters.difficulty !== 'all') {
      cleaned.difficulty = rawFilters.difficulty
    }
    if (rawFilters.sort_by && rawFilters.sort_by !== 'featured') {
      cleaned.sort_by = rawFilters.sort_by
    }
    if (rawFilters.page && rawFilters.page > 1) {
      cleaned.page = rawFilters.page
    }
    if (rawFilters.per_page && rawFilters.per_page !== 15) {
      cleaned.per_page = rawFilters.per_page
    }
    // FIXED: Only add include_drafts for admin users
    if (rawFilters.include_drafts && user?.role === 'admin') {
      cleaned.include_drafts = rawFilters.include_drafts
    }

    return cleaned
  }, [user?.role])

  // Merge filters and fetch resources
  const fetchWithFilters = useCallback(async (newFilters: ResourceFilters = {}) => {
    if (!enabled || !user) return

    try {
      console.log('🔍 useResources: Fetching with filters:', newFilters)
      const mergedFilters = { ...filters, ...newFilters }
      const cleanedFilters = cleanFilters(mergedFilters)
      
      setFilters(cleanedFilters, false) // Don't auto-fetch here
      await fetchResources(cleanedFilters)
      if (!isInitialized) setIsInitialized(true)
      console.log('✅ useResources: Resources fetched successfully')
    } catch (error) {
      console.error('❌ useResources: Failed to fetch:', error)
    }
  }, [enabled, user, filters, cleanFilters, setFilters, fetchResources, isInitialized])

  // Initialize on mount if autoFetch is enabled
  useEffect(() => {
    if (!isInitialized && autoFetch) {
      fetchWithFilters(filters)
    }
  }, [isInitialized, autoFetch, fetchWithFilters, filters])

  const refetch = useCallback(() => {
    console.log('🔄 useResources: Refetching resources...')
    const cleanedFilters = cleanFilters(currentFilters)
    return fetchResources(cleanedFilters)
  }, [fetchResources, currentFilters, cleanFilters])

  // Computed data
  const computedData = useMemo(() => {
    const publishedResources = resources?.filter(r => r.is_published) || []
    const featuredResources = resources?.filter(r => r.is_featured) || []
    const draftResources = resources?.filter(r => !r.is_published) || []

    return {
      publishedResources,
      featuredResources,
      draftResources,
      totalCount: resources?.length || 0,
      publishedCount: publishedResources.length,
      featuredCount: featuredResources.length,
      draftCount: draftResources.length,
    }
  }, [resources])

  // FIXED: Return pagination data with defaults
  return {
    resources: resources || [],
    // FIXED: Add pagination with safe defaults
    pagination: {
      current_page: currentFilters.page || 1,
      last_page: Math.ceil((resources?.length || 0) / (currentFilters.per_page || 15)),
      per_page: currentFilters.per_page || 15,
      total: resources?.length || 0
    },
    filters: currentFilters,
    isLoading: loading.resources && !isInitialized,
    error: errors.resources,
    isInitialized,
    fetchWithFilters,
    refetch,
    // Additional computed data
    ...computedData,
  }
}

/**
 * Enhanced hook for single resource with smart caching
 */
export function useResource(id: number, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  const { fetchResources, setCurrentResource } = useResourcesActions()
  
  // Find resource in store first
  const resource = useMemo(() => {
    const found = resources.find(r => r.id === id) || null
    if (found) {
      setCurrentResource(found)
    }
    return found
  }, [resources, id, setCurrentResource])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch resource if not in store
  useEffect(() => {
    if (!enabled || !user || !id || resource) return

    const fetchResource = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('🔍 useResource: Resource not in store, fetching...', id)
        // Try to fetch all resources to populate store
        await fetchResources({ page: 1, per_page: 50 })
        console.log('✅ useResource: Resources fetched for single resource lookup')
      } catch (err: any) {
        console.error('❌ useResource: Failed to fetch:', err)
        setError(err.message || 'Failed to fetch resource')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResource()
  }, [enabled, user, id, resource, fetchResources])

  const refetch = useCallback(() => {
    console.log('🔄 useResource: Refetching resource data...')
    return fetchResources() // Refresh all resources
  }, [fetchResources])

  return {
    resource,
    isLoading: isLoading && !resource,
    error,
    refetch,
    // Additional computed data
    isBookmarked: resource?.is_bookmarked || false,
    isFeatured: resource?.is_featured || false,
    isPublished: resource?.is_published || false,
  }
}

/**
 * Enhanced resource statistics hook with store integration
 */
export function useResourceStats(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options
  const { stats } = useResourcesStats()
  const { fetchStats } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    if (!enabled || !user || isInitialized) return

    try {
      console.log('📊 useResourceStats: Initializing stats...')
      await fetchStats()
      setIsInitialized(true)
      console.log('✅ useResourceStats: Stats initialized successfully')
    } catch (error) {
      console.error('❌ useResourceStats: Failed to initialize:', error)
    }
  }, [enabled, user, isInitialized, fetchStats])

  useEffect(() => {
    initialize()
  }, [initialize])

  const refetch = useCallback(() => {
    console.log('🔄 useResourceStats: Refetching stats...')
    return fetchStats()
  }, [fetchStats])

  // Safe stats with defaults
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
    isLoading: loading.stats && !isInitialized,
    error: errors.stats,
    isInitialized,
    refetch,
    // Additional computed data
    hasData: isInitialized && !loading.stats,
  }
}

/**
 * Enhanced bookmarks hook with store integration
 */
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  const { user } = useAuth()
  const { bookmarks } = useResourcesSelectors()
  const { fetchBookmarks } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    if (!user || isInitialized) return

    try {
      console.log('🔖 useResourceBookmarks: Initializing bookmarks...')
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

  const refetch = useCallback(() => {
    console.log('🔄 useResourceBookmarks: Refetching bookmarks...')
    return fetchBookmarks(page, perPage)
  }, [fetchBookmarks, page, perPage])

  return {
    bookmarks: bookmarks || [],
    isLoading: loading.bookmarks && !isInitialized,
    error: errors.bookmarks,
    isInitialized,
    refetch,
    // Additional computed data
    bookmarksCount: bookmarks?.length || 0,
    hasBookmarks: (bookmarks?.length || 0) > 0,
  }
}

/**
 * FIXED: Featured resources hook - no invalid featured=true parameter
 */
export function useFeaturedResources(limit: number = 3, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  const { fetchResources } = useResourcesActions()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Get featured resources from existing data instead of making special API calls
  const featuredResources = useMemo(() => {
    return resources?.filter(r => r.is_featured && r.is_published) || []
  }, [resources])

  const fetchFeatured = useCallback(async () => {
    if (!enabled || !user || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🌟 useFeaturedResources: Fetching featured resources...')
      // FIXED: Just fetch regular resources, then filter for featured ones
      await fetchResources({ per_page: limit * 3 }) // Fetch more to ensure we get featured ones
      setIsInitialized(true)
      console.log('✅ useFeaturedResources: Featured resources fetched successfully')
    } catch (err: any) {
      console.error('❌ useFeaturedResources: Failed to fetch:', err)
      setError(err.message || 'Failed to fetch featured resources')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, user, isInitialized, fetchResources, limit])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  const limitedFeatured = useMemo(() => {
    return featuredResources.slice(0, limit)
  }, [featuredResources, limit])

  return {
    featured: limitedFeatured,
    isLoading,
    error,
    isInitialized,
    refetch: fetchFeatured,
    // Additional computed data
    featuredCount: limitedFeatured.length,
    hasFeatured: limitedFeatured.length > 0,
  }
}

/**
 * FIXED: Popular resources hook - use proper sort parameter
 */
export function usePopularResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  const { fetchResources } = useResourcesActions()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Get popular resources from store (sorted by views)
  const popularResources = useMemo(() => {
    return [...(resources || [])]
      .filter(r => r.is_published)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, limit)
  }, [resources, limit])

  const fetchPopular = useCallback(async () => {
    if (!enabled || !user || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔥 usePopularResources: Fetching popular resources...')
      // FIXED: Use 'popular' as sort parameter to match allowed types
      await fetchResources({ sort_by: 'popular', per_page: limit * 2 })
      setIsInitialized(true)
      console.log('✅ usePopularResources: Popular resources fetched successfully')
    } catch (err: any) {
      console.error('❌ usePopularResources: Failed to fetch:', err)
      setError(err.message || 'Failed to fetch popular resources')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, user, isInitialized, fetchResources, limit])

  useEffect(() => {
    fetchPopular()
  }, [fetchPopular])

  return {
    popular: popularResources,
    isLoading,
    error,
    isInitialized,
    refetch: fetchPopular,
    // Additional computed data
    popularCount: popularResources.length,
    hasPopular: popularResources.length > 0,
  }
}

/**
 * FIXED: Top rated resources hook - cleaner API calls
 */
export function useTopRatedResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options
  const { resources } = useResourcesSelectors()
  const { fetchResources } = useResourcesActions()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Get top rated resources from store
  const topRatedResources = useMemo(() => {
    return [...(resources || [])]
      .filter(r => r.is_published && r.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
  }, [resources, limit])

  const fetchTopRated = useCallback(async () => {
    if (!enabled || !user || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('⭐ useTopRatedResources: Fetching top rated resources...')
      // FIXED: Use clean parameters only
      await fetchResources({ sort_by: 'rating', per_page: limit * 2 })
      setIsInitialized(true)
      console.log('✅ useTopRatedResources: Top rated resources fetched successfully')
    } catch (err: any) {
      console.error('❌ useTopRatedResources: Failed to fetch:', err)
      setError(err.message || 'Failed to fetch top rated resources')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, user, isInitialized, fetchResources, limit])

  useEffect(() => {
    fetchTopRated()
  }, [fetchTopRated])

  return {
    topRated: topRatedResources,
    isLoading,
    error,
    isInitialized,
    refetch: fetchTopRated,
    // Additional computed data
    topRatedCount: topRatedResources.length,
    hasTopRated: topRatedResources.length > 0,
  }
}

// =============================================================================
// RESOURCE INTERACTION HOOKS - Complete store integration
// =============================================================================

/**
 * Enhanced resource access hook with store integration
 */
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
      console.log('🔗 useResourceAccess: Accessing resource:', resourceId)
      const result = await accessResource(resourceId)
      console.log('✅ useResourceAccess: Resource accessed successfully')
      return result
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

/**
 * Enhanced resource feedback hook with store integration
 */
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
      console.log('📝 useResourceFeedback: Submitting feedback for resource:', resourceId)
      await provideFeedback(resourceId, feedback)
      console.log('✅ useResourceFeedback: Feedback submitted successfully')
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

/**
 * Enhanced bookmark management hook with store integration
 */
export function useResourceBookmark() {
  const { user } = useAuth()
  const { toggleBookmark } = useResourcesActions()
  const loading = useResourcesLoading()

  const toggle = useCallback(async (resourceId: number) => {
    if (!user) {
      toast.error('Please log in to bookmark resources')
      return false
    }

    try {
      console.log('🔖 useResourceBookmark: Toggling bookmark for resource:', resourceId)
      await toggleBookmark(resourceId)
      console.log('✅ useResourceBookmark: Bookmark toggled successfully')
      return true
    } catch (error: any) {
      console.error('❌ useResourceBookmark: Bookmark toggle failed:', error)
      return false
    }
  }, [user, toggleBookmark])

  return {
    toggle,
    isLoading: loading.bookmark,
  }
}

// =============================================================================
// DASHBOARD AND AGGREGATED DATA HOOKS
// =============================================================================

/**
 * FIXED: Complete dashboard hook with optimized data coordination
 */
export function useResourcesDashboard(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  const categoriesQuery = useResourceCategories({ enabled })
  const featuredQuery = useFeaturedResources(3, { enabled })
  const popularQuery = usePopularResources(5, { enabled })
  const topRatedQuery = useTopRatedResources(5, { enabled })
  const statsQuery = useResourceStats({ enabled })

  // Enhanced loading state - only show loading for initial load
  const isLoading = (categoriesQuery.isLoading && !categoriesQuery.categories.length) || 
                   (featuredQuery.isLoading && !featuredQuery.featured.length) || 
                   (popularQuery.isLoading && !popularQuery.popular.length) || 
                   (topRatedQuery.isLoading && !topRatedQuery.topRated.length) ||
                   (statsQuery.isLoading && !statsQuery.stats)

  const error = categoriesQuery.error || 
                featuredQuery.error || 
                popularQuery.error || 
                topRatedQuery.error ||
                statsQuery.error

  const refetch = useCallback(() => {
    console.log('🔄 useResourcesDashboard: Refetching all dashboard data...')
    categoriesQuery.refetch()
    featuredQuery.refetch()
    popularQuery.refetch()
    topRatedQuery.refetch()
    statsQuery.refetch()
  }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery])

  const forceRefresh = useCallback(async () => {
    console.log('🔄 useResourcesDashboard: Force refreshing with cache clear...')
    // Clear cache first
    resourcesService.clearCache()
    
    // Then refetch all data
    await Promise.all([
      categoriesQuery.refetch(),
      featuredQuery.refetch(),
      popularQuery.refetch(),
      topRatedQuery.refetch(),
      statsQuery.refetch()
    ])
  }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery])

  // Comprehensive dashboard data
  const result = {
    categories: categoriesQuery.categories,
    featured: featuredQuery.featured,
    popular: popularQuery.popular,
    topRated: topRatedQuery.topRated,
    stats: statsQuery.stats,
    isLoading,
    error,
    refetch,
    forceRefresh,
    hasData: !!(categoriesQuery.categories.length || featuredQuery.featured.length || 
                popularQuery.popular.length || topRatedQuery.topRated.length),
    // Individual loading states for granular control
    loadingStates: {
      categories: categoriesQuery.isLoading,
      featured: featuredQuery.isLoading,
      popular: popularQuery.isLoading,
      topRated: topRatedQuery.isLoading,
      stats: statsQuery.isLoading,
    },
    // Individual initialization states
    initializationStates: {
      categories: categoriesQuery.isInitialized,
      featured: featuredQuery.isInitialized,
      popular: popularQuery.isInitialized,
      topRated: topRatedQuery.isInitialized,
      stats: statsQuery.isInitialized,
    },
  }

  console.log('📊 useResourcesDashboard: Current state:', {
    categoriesCount: result.categories.length,
    featuredCount: result.featured.length,
    popularCount: result.popular.length,
    topRatedCount: result.topRated.length,
    totalResources: result.stats.total_resources,
    isLoading: result.isLoading,
    hasData: result.hasData
  })

  return result
}

/**
 * Enhanced resource filtering with stable state management
 */
export function useResourceFilters(initialFilters: ResourceFilters = {}) {
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters)
  const { setFilters: setStoreFilters, clearFilters: clearStoreFilters } = useResourcesActions()

  const updateFilter = useCallback((key: keyof ResourceFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when filtering, except when updating page itself
    }
    setFilters(newFilters)
    setStoreFilters(newFilters, false) // Update store but don't auto-fetch
  }, [filters, setStoreFilters])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    clearStoreFilters(false) // Clear store filters but don't auto-fetch
  }, [initialFilters, clearStoreFilters])

  const resetPagination = useCallback(() => {
    const newFilters = { ...filters, page: 1 }
    setFilters(newFilters)
    setStoreFilters(newFilters, false)
  }, [filters, setStoreFilters])

  const applyFilters = useCallback(() => {
    setStoreFilters(filters, true) // Apply filters and auto-fetch
  }, [filters, setStoreFilters])

  return {
    filters,
    updateFilter,
    clearFilters,
    resetPagination,
    setFilters,
    applyFilters,
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (['page', 'per_page'].includes(key)) return false
      return value !== undefined && value !== null && value !== '' && value !== 'all'
    }),
  }
}

// =============================================================================
// ADMIN HOOKS - Complete store integration
// =============================================================================

/**
 * Complete admin resource management hook with store integration
 */
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
    return resourcesService.canManageResources(user?.role || '') || user?.role === 'admin'
  }, [user?.role])

  // Resource operations
  const handleCreateResource = useCallback(async (data: Partial<Resource>) => {
    if (!canManage) {
      toast.error('You do not have permission to create resources')
      return null
    }

    try {
      console.log('➕ useAdminResourceManagement: Creating resource...')
      const result = await createResource(data)
      if (result) {
        console.log('✅ useAdminResourceManagement: Resource created successfully')
        // Refresh stats after creation
        setTimeout(() => refreshAll(), 1000)
      }
      return result
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Create failed:', error)
      return null
    }
  }, [canManage, createResource, refreshAll])

  const handleUpdateResource = useCallback(async (id: number, data: Partial<Resource>) => {
    if (!canManage) {
      toast.error('You do not have permission to update resources')
      return false
    }

    try {
      console.log('✏️ useAdminResourceManagement: Updating resource:', id)
      await updateResource(id, data)
      console.log('✅ useAdminResourceManagement: Resource updated successfully')
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Update failed:', error)
      return false
    }
  }, [canManage, updateResource])

  const handleDeleteResource = useCallback(async (id: number) => {
    if (!canManage) {
      toast.error('You do not have permission to delete resources')
      return false
    }

    try {
      console.log('🗑️ useAdminResourceManagement: Deleting resource:', id)
      await deleteResource(id)
      console.log('✅ useAdminResourceManagement: Resource deleted successfully')
      // Refresh stats after deletion
      setTimeout(() => refreshAll(), 1000)
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Delete failed:', error)
      return false
    }
  }, [canManage, deleteResource, refreshAll])

  const handleTogglePublish = useCallback(async (id: number) => {
    if (!canManage) {
      toast.error('You do not have permission to publish resources')
      return false
    }

    try {
      console.log('📢 useAdminResourceManagement: Toggling publish for resource:', id)
      await togglePublishResource(id)
      console.log('✅ useAdminResourceManagement: Publish status toggled successfully')
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Toggle publish failed:', error)
      return false
    }
  }, [canManage, togglePublishResource])

  const handleToggleFeature = useCallback(async (id: number) => {
    if (!canManage) {
      toast.error('You do not have permission to feature resources')
      return false
    }

    try {
      console.log('⭐ useAdminResourceManagement: Toggling feature for resource:', id)
      await toggleFeatureResource(id)
      console.log('✅ useAdminResourceManagement: Feature status toggled successfully')
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Toggle feature failed:', error)
      return false
    }
  }, [canManage, toggleFeatureResource])

  // Category operations
  const handleCreateCategory = useCallback(async (data: Partial<ResourceCategory>) => {
    if (!canManage) {
      toast.error('You do not have permission to create categories')
      return null
    }

    try {
      console.log('➕ useAdminResourceManagement: Creating category...')
      const result = await createCategory(data)
      if (result) {
        console.log('✅ useAdminResourceManagement: Category created successfully')
      }
      return result
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Category create failed:', error)
      return null
    }
  }, [canManage, createCategory])

  const handleUpdateCategory = useCallback(async (id: number, data: Partial<ResourceCategory>) => {
    if (!canManage) {
      toast.error('You do not have permission to update categories')
      return false
    }

    try {
      console.log('✏️ useAdminResourceManagement: Updating category:', id)
      await updateCategory(id, data)
      console.log('✅ useAdminResourceManagement: Category updated successfully')
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Category update failed:', error)
      return false
    }
  }, [canManage, updateCategory])

  const handleDeleteCategory = useCallback(async (id: number) => {
    if (!canManage) {
      toast.error('You do not have permission to delete categories')
      return false
    }

    try {
      console.log('🗑️ useAdminResourceManagement: Deleting category:', id)
      await deleteCategory(id)
      console.log('✅ useAdminResourceManagement: Category deleted successfully')
      return true
    } catch (error: any) {
      console.error('❌ useAdminResourceManagement: Category delete failed:', error)
      return false
    }
  }, [canManage, deleteCategory])

  return {
    // Resource operations
    createResource: handleCreateResource,
    updateResource: handleUpdateResource,
    deleteResource: handleDeleteResource,
    togglePublish: handleTogglePublish,
    toggleFeature: handleToggleFeature,
    
    // Category operations
    createCategory: handleCreateCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    
    // Loading states
    isCreating: loading.create,
    isUpdating: loading.update,
    isDeleting: loading.delete,
    
    // Error states
    createError: errors.create,
    updateError: errors.update,
    deleteError: errors.delete,
    
    // Permissions
    canManage,
    
    // Utility
    refreshAll,
  }
}

// =============================================================================
// UTILITY AND ANALYTICS HOOKS
// =============================================================================

/**
 * Hook for resource analytics tracking with store integration
 */
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

/**
 * Hook for recent resource searches with optimized persistence
 */
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
      const newSearches = [query, ...filtered].slice(0, 10) // Keep only 10 recent searches

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

/**
 * Utility hook for resource formatting and helpers
 */
export function useResourceUtils() {
  const getTypeIcon = useCallback((type: string) => {
    return resourcesService.getTypeIcon(type)
  }, [])

  const getTypeLabel = useCallback((type: string) => {
    return resourcesService.getTypeLabel(type)
  }, [])

  const getDifficultyColor = useCallback((difficulty: string) => {
    return resourcesService.getDifficultyColor(difficulty)
  }, [])

  const getDifficultyLabel = useCallback((difficulty: string) => {
    return resourcesService.getDifficultyLabel(difficulty)
  }, [])

  const formatDuration = useCallback((duration?: string) => {
    return resourcesService.formatDuration(duration)
  }, [])

  const formatCount = useCallback((count: number | undefined | null) => {
    return resourcesService.formatCount(count)
  }, [])

  const calculateRatingPercentage = useCallback((rating: number) => {
    return resourcesService.calculateRatingPercentage(rating)
  }, [])

  const isValidResourceUrl = useCallback((url: string) => {
    return resourcesService.isValidResourceUrl(url)
  }, [])

  const formatTimeAgo = useCallback((dateString: string) => {
    return resourcesService.formatTimeAgo(dateString)
  }, [])

  const formatRating = useCallback((rating: any): number => {
    return resourcesService.formatRating(rating)
  }, [])

  const formatRatingDisplay = useCallback((rating: any): string => {
    return resourcesService.formatRatingDisplay(rating)
  }, [])

  const getCacheStats = useCallback(() => {
    return resourcesService.getCacheStats()
  }, [])

  const getAvailableTypes = useCallback(() => {
    return resourcesService.getAvailableTypes()
  }, [])

  const getAvailableDifficulties = useCallback(() => {
    return resourcesService.getAvailableDifficulties()
  }, [])

  const validateResourceData = useCallback((data: Partial<Resource>) => {
    return resourcesService.validateResourceData(data)
  }, [])

  const validateCategoryData = useCallback((data: Partial<ResourceCategory>) => {
    return resourcesService.validateCategoryData(data)
  }, [])

  return {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    getDifficultyLabel,
    formatDuration,
    formatCount,
    calculateRatingPercentage,
    isValidResourceUrl,
    formatTimeAgo,
    formatRating,
    formatRatingDisplay,
    getCacheStats,
    getAvailableTypes,
    getAvailableDifficulties,
    validateResourceData,
    validateCategoryData,
  }
}

/**
 * Advanced search hook with store integration and search analytics
 */
export function useResourceSearch() {
  const { user } = useAuth()
  const { fetchResources } = useResourcesActions()
  const { resources } = useResourcesSelectors()
  const { addRecentSearch } = useRecentResourceSearches()
  const { trackResourceSearch } = useResourceAnalytics()
  
  const [searchState, setSearchState] = useState({
    query: '',
    isSearching: false,
    searchResults: [] as ResourceItem[],
    error: null as string | null,
  })

  const search = useCallback(async (
    query: string, 
    filters: Omit<ResourceFilters, 'search'> = {}
  ) => {
    if (!query.trim() || query.length < 2) {
      setSearchState(prev => ({ ...prev, searchResults: [], error: null }))
      return []
    }

    setSearchState(prev => ({ 
      ...prev, 
      query, 
      isSearching: true, 
      error: null 
    }))

    try {
      console.log('🔍 useResourceSearch: Searching for:', query)
      
      await fetchResources({ 
        search: query, 
        ...filters,
        page: 1 // Reset to first page for new search
      })
      
      // Get search results from store
      const searchResults = resources.filter(resource => 
        resource.title.toLowerCase().includes(query.toLowerCase()) ||
        resource.description.toLowerCase().includes(query.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      
      setSearchState(prev => ({ 
        ...prev, 
        searchResults, 
        isSearching: false 
      }))
      
      // Track search and add to recent searches
      trackResourceSearch(query, searchResults.length)
      addRecentSearch(query)
      
      console.log('✅ useResourceSearch: Search completed:', {
        query,
        resultsCount: searchResults.length
      })
      
      return searchResults
    } catch (error: any) {
      console.error('❌ useResourceSearch: Search failed:', error)
      setSearchState(prev => ({ 
        ...prev, 
        isSearching: false, 
        error: error.message || 'Search failed'
      }))
      return []
    }
  }, [fetchResources, resources, trackResourceSearch, addRecentSearch])

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      isSearching: false,
      searchResults: [],
      error: null,
    })
  }, [])

  return {
    ...searchState,
    search,
    clearSearch,
    hasResults: searchState.searchResults.length > 0,
  }
}