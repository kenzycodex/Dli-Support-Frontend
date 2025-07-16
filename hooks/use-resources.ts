// hooks/use-resources.ts (FIXED - All TypeScript errors resolved)

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

// CRITICAL FIX: Enhanced hook for resource categories with proper typing

export function useResourceCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.categories(user?.role),
    queryFn: async (): Promise<ResourceCategory[]> => {
      try {
        console.log('🔍 useResourceCategories: Fetching categories...')
        
        const response = await resourcesService.getCategories({
          include_inactive: includeInactive,
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useResourceCategories: Service response:', response)
        
        if (!response.success) {
          console.error('❌ useResourceCategories: Service error:', response.message)
          throw new Error(response.message || 'Failed to fetch resource categories')
        }
        
        // SAFE ACCESS: Always return array, handle all possible response formats
        let categories: ResourceCategory[] = []
        if (response.data?.categories && Array.isArray(response.data.categories)) {
          categories = response.data.categories
        } else if (Array.isArray(response.data)) {
          categories = response.data
        } else {
          console.warn('⚠️ useResourceCategories: Unexpected response format, returning empty array')
        }
        
        console.log('✅ useResourceCategories: Processed categories:', categories.length)
        return categories
      } catch (error) {
        console.error('❌ useResourceCategories: Error:', error)
        throw error
      }
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - ultra stable
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      if (error.message?.includes('403') || error.message?.includes('401')) return false
      return true
    },
  })
}

// CRITICAL FIX: Enhanced resources hook with proper typing
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.resources(filters, user?.role),
    queryFn: async () => {
      try {
        console.log('🔍 useResources: Starting fetch with filters:', filters)
        
        const response = await resourcesService.getResources({
          ...filters,
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useResources: Raw service response:', response)
        
        if (!response.success) {
          console.error('❌ useResources: Service returned error:', response)
          throw new Error(response.message || 'Failed to fetch resources')
        }

        // CRITICAL FIX: Enhanced data processing with type safety
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

        // Direct resources structure (expected format)
        if (data.resources && Array.isArray(data.resources)) {
          console.log('✅ useResources: Found direct resources structure')
          return {
            resources: data.resources,
            featured_resources: data.featured_resources || [],
            type_counts: data.type_counts || {},
            pagination: data.pagination || {
              current_page: 1,
              last_page: 1,
              per_page: data.resources.length,
              total: data.resources.length
            }
          }
        }

        // Fallback: Direct array
        if (Array.isArray(data)) {
          console.log('✅ useResources: Found direct array structure')
          return {
            resources: data,
            featured_resources: data.filter((r: Resource) => r.is_featured) || [],
            type_counts: {},
            pagination: {
              current_page: 1,
              last_page: 1,
              per_page: data.length,
              total: data.length
            }
          }
        }

        console.warn('⚠️ useResources: Unknown response format:', {
          type: typeof data,
          keys: Object.keys(data),
          sample: JSON.stringify(data).substring(0, 200)
        })

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

      } catch (error) {
        console.error('❌ useResources: Critical error:', error)
        throw error
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
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

// CRITICAL FIX: Enhanced resource statistics hook with proper return type
export function useResourceStats(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.stats(user?.role),
    queryFn: async () => {
      try {
        console.log('🔍 useResourceStats: Fetching stats...')
        
        const response = await resourcesService.getStats({
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useResourceStats: Service response:', response)
        
        if (!response.success) {
          console.error('❌ useResourceStats: Service error:', response.message)
          // Return fallback stats instead of throwing
          return {
            total_resources: 0,
            total_categories: 0,
            most_popular_resource: null,
            highest_rated_resource: null,
            most_downloaded_resource: null,
            resources_by_type: {},
            resources_by_difficulty: {},
            categories_with_counts: []
          }
        }
        
        // CRITICAL FIX: Handle the stats response correctly
        // Backend now returns stats directly in data (not nested under stats)
        const stats = response.data
        
        console.log('✅ useResourceStats: Processed stats:', stats)
        return stats
      } catch (error) {
        console.error('❌ useResourceStats: Error:', error)
        // Return fallback instead of throwing to prevent cascade errors
        return {
          total_resources: 0,
          total_categories: 0,
          most_popular_resource: null,
          highest_rated_resource: null,
          most_downloaded_resource: null,
          resources_by_type: {},
          resources_by_difficulty: {},
          categories_with_counts: []
        }
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: false, // Don't retry stats to prevent console spam
  })
}

// CRITICAL FIX: Enhanced bookmarks hook with user tracking
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: resourcesQueryKeys.bookmarks(page, user?.role),
    queryFn: async () => {
      try {
        console.log('🔍 useResourceBookmarks: Fetching bookmarks...')
        
        const response = await resourcesService.getBookmarks(page, perPage, {
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useResourceBookmarks: Service response:', response)
        
        if (!response.success) {
          console.error('❌ useResourceBookmarks: Service error:', response.message)
          throw new Error(response.message || 'Failed to fetch bookmarks')
        }
        
        // SAFE ACCESS: Ensure bookmarks is always an array
        const data = response.data
        const result = {
          bookmarks: Array.isArray(data?.bookmarks) ? data.bookmarks : [],
          pagination: data?.pagination || {
            current_page: 1,
            last_page: 1,
            per_page: 0,
            total: 0
          }
        }
        
        console.log('✅ useResourceBookmarks: Processed bookmarks:', result.bookmarks.length)
        return result
      } catch (error) {
        console.error('❌ useResourceBookmarks: Error:', error)
        throw error
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  })
}

// SAFE: Enhanced featured resources with better error handling
export function useFeaturedResources(limit: number = 3, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.featured(limit),
    queryFn: async (): Promise<Resource[]> => {
      try {
        console.log('🌟 useFeaturedResources: Fetching featured resources...')
        
        const response = await resourcesService.getFeaturedResources(limit, {
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useFeaturedResources: Service response:', response)
        
        if (!response.success) {
          console.error('❌ useFeaturedResources: Service error:', response.message)
          return []
        }
        
        const featuredResources = Array.isArray(response.data) ? response.data : []
        console.log('✅ useFeaturedResources: Processed resources:', featuredResources.length)
        return featuredResources
      } catch (error) {
        console.error('❌ useFeaturedResources: Error:', error)
        return [] // Return empty array instead of throwing
      }
    },
    staleTime: 20 * 60 * 1000,
    gcTime: 40 * 60 * 1000,
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: false, // Don't retry to prevent console spam
  })
}

// SAFE: Enhanced popular resources
export function usePopularResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.popular(limit),
    queryFn: async (): Promise<Resource[]> => {
      try {
        console.log('🔥 usePopularResources: Fetching popular resources...')
        
        const response = await resourcesService.getPopularResources(limit, {
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 usePopularResources: Service response:', response)
        
        if (!response.success) {
          console.error('❌ usePopularResources: Service error:', response.message)
          return []
        }
        
        const popularResources = Array.isArray(response.data) ? response.data : []
        console.log('✅ usePopularResources: Processed resources:', popularResources.length)
        return popularResources
      } catch (error) {
        console.error('❌ usePopularResources: Error:', error)
        return []
      }
    },
    staleTime: 20 * 60 * 1000,
    gcTime: 40 * 60 * 1000,
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: false,
  })
}

// SAFE: Enhanced top rated resources
export function useTopRatedResources(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.topRated(limit),
    queryFn: async (): Promise<Resource[]> => {
      try {
        console.log('⭐ useTopRatedResources: Fetching top rated resources...')
        
        const response = await resourcesService.getTopRatedResources(limit, {
          userRole: user?.role,
          forceRefresh: false
        })
        
        console.log('📡 useTopRatedResources: Service response:', response)
        
        if (!response.success) {
          console.error('❌ useTopRatedResources: Service error:', response.message)
          return []
        }
        
        const topRatedResources = Array.isArray(response.data) ? response.data : []
        console.log('✅ useTopRatedResources: Processed resources:', topRatedResources.length)
        return topRatedResources
      } catch (error) {
        console.error('❌ useTopRatedResources: Error:', error)
        return []
      }
    },
    staleTime: 20 * 60 * 1000,
    gcTime: 40 * 60 * 1000,
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: false,
  })
}

// ENHANCED: Resource access with proper error handling
export function useResourceAccess() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: number) => {
      try {
        console.log('🔗 useResourceAccess: Accessing resource:', resourceId)
        
        const response = await resourcesService.accessResource(resourceId, {
          userRole: user?.role
        })
        
        console.log('📡 useResourceAccess: Service response:', response)
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to access resource')
        }
        
        return response.data
      } catch (error) {
        console.error('❌ useResourceAccess: Error:', error)
        throw error
      }
    },
    onSuccess: (data, resourceId) => {
      console.log('✅ useResourceAccess: Success:', data)
      
      if (data) {
        // Update resource counts in cache
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

        // Selectively invalidate only necessary queries
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.popular() })
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() })
      }
    },
    onError: (error: Error) => {
      console.error('❌ useResourceAccess: Mutation error:', error)
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

// CRITICAL FIX: Enhanced bookmark state management with user-specific tracking
export function useResourceBookmark() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceId: number) => {
      try {
        console.log('🔖 useResourceBookmark: Toggling bookmark for resource:', resourceId)
        
        const response = await resourcesService.toggleBookmark(resourceId, {
          userRole: user?.role
        })
        
        console.log('📡 useResourceBookmark: Service response:', response)
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to toggle bookmark')
        }
        
        return { resourceId, bookmarked: response.data?.bookmarked }
      } catch (error) {
        console.error('❌ useResourceBookmark: Error:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('✅ useResourceBookmark: Success:', data)
      
      // Invalidate bookmarks query to refresh the list
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.bookmarks() })
      
      // Update specific resource in cache if available
      queryClient.setQueryData(
        resourcesQueryKeys.resource(data.resourceId),
        (oldData: any) => {
          if (oldData?.resource) {
            return {
              ...oldData,
              resource: {
                ...oldData.resource,
                is_bookmarked: data.bookmarked
              }
            }
          }
          return oldData
        }
      )

      const message = data.bookmarked ? 'Resource bookmarked!' : 'Bookmark removed'
      toast.success(message)
    },
    onError: (error: Error) => {
      console.error('❌ useResourceBookmark: Mutation error:', error)
      toast.error(error.message || 'Failed to update bookmark')
    },
  })
}

// CRITICAL FIX: Enhanced dashboard hook with better data coordination and proper types
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
    console.log('🔄 useResourcesDashboard: Refetching all data...')
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

  // CRITICAL FIX: Always return arrays with proper typing, never undefined
  const result = {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    topRated: topRatedQuery.data || [],
    stats: statsQuery.data || {
      total_resources: 0,
      total_categories: 0,
      most_popular_resource: null,
      highest_rated_resource: null,
      most_downloaded_resource: null,
      resources_by_type: {},
      resources_by_difficulty: {},
      categories_with_counts: []
    },
    isLoading,
    error,
    refetch,
    forceRefresh,
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data || topRatedQuery.data),
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

  // hooks/use-resources.ts (FINAL PART - All TypeScript errors resolved)

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