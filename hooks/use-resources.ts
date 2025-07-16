// hooks/use-resources.ts (FIXED - Safe array access and enhanced error handling)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  resourcesService,
  type Resource,
  type ResourceCategory,
  type ResourceFilters,
} from '@/services/resources.service'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Ultra-stable query keys for consistent caching
export const resourcesQueryKeys = {
  all: ['resources'] as const,
  categories: (userRole?: string) => [...resourcesQueryKeys.all, 'categories', userRole] as const,
  resources: (filters?: ResourceFilters, userRole?: string) => 
    [...resourcesQueryKeys.all, 'resources', JSON.stringify(filters), userRole] as const,
  resource: (id: number) => [...resourcesQueryKeys.all, 'resource', id] as const,
  bookmarks: (page?: number, userRole?: string) => 
    [...resourcesQueryKeys.all, 'bookmarks', page, userRole] as const,
  stats: (userRole?: string) => [...resourcesQueryKeys.all, 'stats', userRole] as const,
  featured: (limit?: number) => [...resourcesQueryKeys.all, 'featured', limit] as const,
  popular: (limit?: number) => [...resourcesQueryKeys.all, 'popular', limit] as const,
  topRated: (limit?: number) => [...resourcesQueryKeys.all, 'top-rated', limit] as const,
}

// Enhanced hook for resource categories with ultra-stable caching
export function useResourceCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.categories(user?.role),
    queryFn: async () => {
      const response = await resourcesService.getCategories({
        include_inactive: includeInactive,
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource categories')
      }
      // SAFE ACCESS: Always return array, even if undefined
      return response.data?.categories || []
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - ultra stable
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Critical: Don't refetch on mount if data exists
  })
}

// CRITICAL FIX: Ultra-stable resources hook with enhanced error handling and safe data access
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.resources(filters, user?.role),
    queryFn: async () => {
      console.log('🔍 useResources: Starting fetch with filters:', filters)
      
      const response = await resourcesService.getResources({
        ...filters,
        userRole: user?.role,
        forceRefresh: false
      })
      
      console.log('📡 useResources: Service response:', response)
      
      if (!response.success) {
        console.error('❌ useResources: Service returned error:', response)
        throw new Error(response.message || 'Failed to fetch resources')
      }

      // CRITICAL FIX: Ensure safe data structure with defaults
      const data = response.data
      if (!data) {
        console.warn('⚠️ useResources: No data in successful response')
        return {
          resources: [],
          featured_resources: [],
          type_counts: {},
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 0,
            total: 0
          }
        }
      }

      // SAFE ACCESS: Use optional chaining and provide defaults
      const safeData = {
        resources: Array.isArray(data.resources) ? data.resources : [],
        featured_resources: Array.isArray(data.featured_resources) ? data.featured_resources : [],
        type_counts: data.type_counts || {},
        pagination: data.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: Array.isArray(data.resources) ? data.resources.length : 0,
          total: Array.isArray(data.resources) ? data.resources.length : 0
        }
      }

      console.log('✅ useResources: Successfully processed data:', {
        resourcesCount: safeData.resources.length,
        featuredCount: safeData.featured_resources.length,
        hasPagination: !!safeData.pagination
      })

      return safeData
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - longer for stability
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Critical: Don't refetch on mount if data exists
    retry: (failureCount, error) => {
      // Retry logic for resource loading
      if (failureCount >= 3) return false
      if (error.message?.includes('403') || error.message?.includes('401')) return false
      return true
    },
  })
}

// Enhanced hook for single resource with smart caching
export function useResource(id: number, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.resource(id),
    queryFn: async () => {
      const response = await resourcesService.getResource(id, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource')
      }
      return response.data
    },
    enabled: enabled && !!id && !!user,
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 40 * 60 * 1000, // 40 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// SAFE: Ultra-stable hook for user bookmarks
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: resourcesQueryKeys.bookmarks(page, user?.role),
    queryFn: async () => {
      const response = await resourcesService.getBookmarks(page, perPage, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookmarks')
      }
      
      // SAFE ACCESS: Ensure bookmarks is always an array
      const data = response.data
      return {
        bookmarks: Array.isArray(data?.bookmarks) ? data.bookmarks : [],
        pagination: data?.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 0,
          total: 0
        }
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - bookmarks can change
    gcTime: 20 * 60 * 1000, // 20 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// Ultra-stable hook for resource statistics
export function useResourceStats(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.stats(user?.role),
    queryFn: async () => {
      const response = await resourcesService.getStats({
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource statistics')
      }
      return response.data?.stats
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - very long for stats
    gcTime: 60 * 60 * 1000, // 60 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// SAFE: Ultra-stable hook for featured resources
export function useFeaturedResources(limit: number = 3, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.featured(limit),
    queryFn: async () => {
      const response = await resourcesService.getFeaturedResources(limit, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured resources')
      }
      // SAFE ACCESS: Always return array
      return Array.isArray(response.data) ? response.data : []
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// SAFE: Ultra-stable hook for popular resources
export function usePopularResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.popular(limit),
    queryFn: async () => {
      const response = await resourcesService.getPopularResources(limit, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular resources')
      }
      // SAFE ACCESS: Always return array
      return Array.isArray(response.data) ? response.data : []
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// SAFE: Ultra-stable hook for top rated resources
export function useTopRatedResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.topRated(limit),
    queryFn: async () => {
      const response = await resourcesService.getTopRatedResources(limit, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch top rated resources')
      }
      // SAFE ACCESS: Always return array
      return Array.isArray(response.data) ? response.data : []
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// FIXED: Enhanced hook for accessing resources (tracking usage) with proper error handling
export function useResourceAccess() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.accessResource(resourceId, {
        userRole: user?.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to access resource')
      }
      return response.data
    },
    onSuccess: (data, resourceId) => {
      if (data) {
        // Update resource view/download counts in cache
        queryClient.setQueryData(resourcesQueryKeys.resource(resourceId), (oldData: any) => {
          if (!oldData) return oldData

          const updatedResource = { ...oldData.resource }
          if (data.action === 'download') {
            updatedResource.download_count = (updatedResource.download_count || 0) + 1
          } else {
            updatedResource.view_count = (updatedResource.view_count || 0) + 1
          }

          return {
            ...oldData,
            resource: updatedResource,
          }
        })

        // Selectively invalidate only necessary queries - not all resources
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.popular() })
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to access resource')
    },
  })
}

// FIXED: Enhanced hook for resource feedback/rating
export function useResourceFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      resourceId,
      feedback,
    }: {
      resourceId: number
      feedback: { rating: number; comment?: string; is_recommended?: boolean }
    }) => {
      const response = await resourcesService.provideFeedback(resourceId, feedback, {
        userRole: user?.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit feedback')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      // Update the resource in cache with new feedback
      queryClient.setQueryData(
        resourcesQueryKeys.resource(variables.resourceId),
        (oldData: any) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            user_feedback: data?.feedback,
          }
        }
      )

      // Selectively invalidate only necessary queries
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.topRated() })

      toast.success('Thank you for your feedback!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback')
    },
  })
}

// FIXED: Enhanced hook for bookmarking resources
export function useResourceBookmark() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.toggleBookmark(resourceId, {
        userRole: user?.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle bookmark')
      }
      return { resourceId, bookmarked: response.data?.bookmarked }
    },
    onSuccess: (data) => {
      // Invalidate bookmarks query to refresh the list
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.bookmarks() })

      const message = data.bookmarked ? 'Resource bookmarked!' : 'Bookmark removed'
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bookmark')
    },
  })
}

// CRITICAL FIX: OPTIMIZED DASHBOARD HOOK - NO CONSTANT RELOADING with SAFE data access
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

  // Only show loading for initial load
  const isLoading = (categoriesQuery.isLoading && !categoriesQuery.data) || 
                   (featuredQuery.isLoading && !featuredQuery.data) || 
                   (popularQuery.isLoading && !popularQuery.data) || 
                   (topRatedQuery.isLoading && !topRatedQuery.data) ||
                   (statsQuery.isLoading && !statsQuery.data)

  const error = categoriesQuery.error || 
                featuredQuery.error || 
                popularQuery.error || 
                topRatedQuery.error ||
                statsQuery.error

  const refetch = useCallback(() => {
    categoriesQuery.refetch()
    featuredQuery.refetch()
    popularQuery.refetch()
    topRatedQuery.refetch()
    statsQuery.refetch()
  }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery])

  // Force refresh with cache clearing - only when explicitly requested
  const forceRefresh = useCallback(async () => {
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

  // SAFE ACCESS: Always return arrays, never undefined
  return {
    categories: Array.isArray(categoriesQuery.data) ? categoriesQuery.data : [],
    featured: Array.isArray(featuredQuery.data) ? featuredQuery.data : [],
    popular: Array.isArray(popularQuery.data) ? popularQuery.data : [],
    topRated: Array.isArray(topRatedQuery.data) ? topRatedQuery.data : [],
    stats: statsQuery.data,
    isLoading,
    error,
    refetch,
    forceRefresh,
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data || topRatedQuery.data),
  }
}

// OPTIMIZED resource filtering with stable state management
export function useResourceFilters(initialFilters: ResourceFilters = {}) {
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters)

  const updateFilter = useCallback((key: keyof ResourceFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when filtering, except when updating page itself
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const resetPagination = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }))
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
    resetPagination,
    setFilters,
    hasActiveFilters: Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    ),
  }
}

// Hook for resource analytics tracking
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
  }, [])

  const trackResourceCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'resource_category_click', {
        event_category: 'Resources',
        event_label: categoryName,
        value: categorySlug,
      })
    }
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

// Hook for recent resource searches with optimized persistence (local storage)
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
  }
}

// Admin-specific hooks for resource management
export function useAdminResourceManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Create Resource mutation
  const createResource = useMutation({
    mutationFn: async (resourceData: Partial<Resource>) => {
      const response = await resourcesService.createResource(resourceData, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to create resource')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.all })
      toast.success('Resource created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create resource')
    }
  })

  // Update Resource mutation
  const updateResource = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Resource> }) => {
      const response = await resourcesService.updateResource(id, data, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to update resource')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.all })
      queryClient.setQueryData(resourcesQueryKeys.resource(variables.id), (oldData: any) => ({
        ...oldData,
        resource: data?.resource
      }))
      toast.success('Resource updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update resource')
    }
  })

  // Delete Resource mutation
  const deleteResource = useMutation({
    mutationFn: async (id: number) => {
      const response = await resourcesService.deleteResource(id, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete resource')
      }
      return response.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.all })
      queryClient.removeQueries({ queryKey: resourcesQueryKeys.resource(id) })

      toast.success('Resource deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete resource')
    }
  })

  // Create Category mutation
  const createCategory = useMutation({
    mutationFn: async (categoryData: Partial<ResourceCategory>) => {
      const response = await resourcesService.createCategory(categoryData, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to create category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() })
      toast.success('Category created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    }
  })

  // Update Category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ResourceCategory> }) => {
      const response = await resourcesService.updateCategory(id, data, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to update category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() })
      toast.success('Category updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category')
    }
  })

  // Delete Category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const response = await resourcesService.deleteCategory(id, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() })
      toast.success('Category deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    }
  })

  return {
    createResource,
    updateResource,
    deleteResource,
    createCategory,
    updateCategory,
    deleteCategory,
    canManage: resourcesService.canManageResources(user?.role || '') || user?.role === 'admin',
  }
}

// SAFE: Utility hook for resource formatting and utils
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
    const safeCount = Number(count) || 0
    return resourcesService.formatCount(safeCount)
  }, [])

  const calculateRatingPercentage = useCallback((rating: number) => {
    return resourcesService.calculateRatingPercentage(rating)
  }, [])

  const isValidResourceUrl = useCallback((url: string) => {
    return resourcesService.isValidResourceUrl(url)
  }, [])

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    
    return date.toLocaleDateString()
  }, [])

  // Safe rating formatters
  const formatRating = useCallback((rating: any): number => {
    const numRating = Number(rating)
    if (isNaN(numRating)) return 0
    return Math.max(0, Math.min(5, numRating))
  }, [])

  const formatRatingDisplay = useCallback((rating: any): string => {
    return formatRating(rating).toFixed(1)
  }, [formatRating])

  const getCacheStats = useCallback(() => {
    return resourcesService.getCacheStats()
  }, [])

  const getAvailableTypes = useCallback(() => {
    return resourcesService.getAvailableTypes()
  }, [])

  const getAvailableDifficulties = useCallback(() => {
    return resourcesService.getAvailableDifficulties()
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
  }
}