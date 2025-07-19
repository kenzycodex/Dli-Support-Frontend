// hooks/use-resources.ts - FINAL: Single fetch strategy like help system

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
// CORE HOOK: Single source of truth - like help system
// =============================================================================

/**
 * CRITICAL: Core hook that fetches ALL data ONCE and populates the store
 * All other hooks use this data - NO additional API calls
 */
function useResourcesCore(enabled: boolean = true) {
  const { user } = useAuth()
  const { resources, categories, stats } = useResourcesSelectors()
  const { fetchResources, fetchCategories, fetchStats } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  // SINGLE initialization that fetches everything once
  const initialize = useCallback(async () => {
    if (!enabled || !user || isInitialized) return
    
    // Don't fetch if we already have data
    if (resources.length > 0 && categories.length > 0 && stats) return

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
    }
  }, [enabled, user, isInitialized, resources.length, categories.length, stats, fetchResources, fetchCategories, fetchStats])

  useEffect(() => {
    initialize()
  }, [initialize])

  const refetch = useCallback(async () => {
    console.log('🔄 useResourcesCore: Refetching all data...')
    setIsInitialized(false) // Reset to force re-fetch
    await initialize()
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
 * - UPDATED with better pagination support
 */
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
  autoFetch?: boolean
} = {}) {
  const { enabled = true } = options
  const { resources, pagination } = useResourcesSelectors()
  
  // Use core hook to ensure data is loaded
  const core = useResourcesCore(enabled)

  // UPDATED: Local filtering only when not using server-side pagination
  const filteredResources = useMemo(() => {
    // If we have pagination data from server, don't filter locally
    if (pagination.total > 0 && pagination.last_page > 1) {
      return resources // Use server-filtered results
    }

    // Otherwise, filter locally (for small datasets or when server doesn't support filtering)
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

    // Sort locally if needed
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
  }, [resources, filters, pagination])

  // UPDATED: Computed data with pagination context
  const computedData = useMemo(() => {
    const workingResources = filteredResources
    const publishedResources = workingResources.filter(r => r.is_published)
    const featuredResources = workingResources.filter(r => r.is_featured)
    const draftResources = workingResources.filter(r => !r.is_published)

    return {
      publishedResources,
      featuredResources,
      draftResources,
      totalCount: pagination.total || workingResources.length, // Use server total if available
      currentPageCount: workingResources.length,
      publishedCount: publishedResources.length,
      featuredCount: featuredResources.length,
      draftCount: draftResources.length,
      pagination, // Include pagination info
    }
  }, [filteredResources, pagination])

  return {
    resources: filteredResources,
    isLoading: core.isLoading,
    error: core.error,
    isInitialized: core.isInitialized,
    fetchWithFilters: () => {}, // No-op since we filter server-side now
    refetch: core.refetch,
    ...computedData,
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
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  const { user } = useAuth()
  const { bookmarks } = useResourcesSelectors()
  const { fetchBookmarks } = useResourcesActions()
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    if (!user || isInitialized || bookmarks.length > 0) return

    try {
      console.log('🔖 useResourceBookmarks: Fetching bookmarks...')
      await fetchBookmarks(page, perPage)
      setIsInitialized(true)
      console.log('✅ useResourceBookmarks: Bookmarks fetched')
    } catch (error) {
      console.error('❌ useResourceBookmarks: Failed to initialize:', error)
    }
  }, [user, isInitialized, bookmarks.length, fetchBookmarks, page, perPage])

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    bookmarks,
    isLoading: loading.bookmarks && !isInitialized,
    error: errors.bookmarks,
    isInitialized,
    refetch: () => fetchBookmarks(page, perPage),
    bookmarksCount: bookmarks.length,
    hasBookmarks: bookmarks.length > 0,
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

  const toggle = useCallback(async (resourceId: number) => {
    if (!user) {
      toast.error('Please log in to bookmark resources')
      return false
    }

    try {
      await toggleBookmark(resourceId)
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
// DASHBOARD - Uses shared data from core hook
// =============================================================================

/**
 * UPDATED: Dashboard with pagination awareness
 */
export function useResourcesDashboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  
  // Use individual hooks that now all share the same data
  const categoriesQuery = useResourceCategories({ enabled })
  const featuredQuery = useFeaturedResources(6, { enabled }) // Show more featured resources
  const popularQuery = usePopularResources(8, { enabled }) // Show more popular resources
  const statsQuery = useResourceStats({ enabled })

  // Core ensures everything is loaded
  const core = useResourcesCore(enabled)

  // Top rated from store data
  const { resources } = useResourcesSelectors()
  const topRated = useMemo(() => {
    return [...resources]
      .filter(r => r.is_published && r.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8) // Show more top rated
  }, [resources])

  return {
    categories: categoriesQuery.categories,
    featured: featuredQuery.featured,
    popular: popularQuery.popular,
    topRated,
    stats: statsQuery.stats,
    isLoading: core.isLoading,
    error: core.error,
    refetch: core.refetch,
    forceRefresh: core.refetch,
    hasData: !!(categoriesQuery.categories.length || featuredQuery.featured.length || popularQuery.popular.length),
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
 * UPDATED: Enhanced filter hook with pagination support
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
    formatTimeAgo,
  }
}