// hooks/use-help.ts (UPDATED - Enhanced with smart caching and role-based access)
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { helpService, helpCache, type FAQ, type HelpCategory, type FAQFilters, type ContentSuggestion } from '@/services/help.service'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'

// Query keys for consistent caching
export const helpQueryKeys = {
  all: ['help'] as const,
  categories: (userRole?: string) => [...helpQueryKeys.all, 'categories', userRole] as const,
  faqs: (filters?: FAQFilters, userRole?: string) => [...helpQueryKeys.all, 'faqs', filters, userRole] as const,
  faq: (id: number) => [...helpQueryKeys.all, 'faq', id] as const,
  stats: (userRole?: string) => [...helpQueryKeys.all, 'stats', userRole] as const,
  featured: (limit?: number) => [...helpQueryKeys.all, 'featured', limit] as const,
  popular: (limit?: number) => [...helpQueryKeys.all, 'popular', limit] as const,
  search: (query: string, filters?: Omit<FAQFilters, 'search'>) => 
    [...helpQueryKeys.all, 'search', query, filters] as const,
}

// Enhanced hook for help categories with smart caching
export function useHelpCategories(options: {
  includeInactive?: boolean
  useCache?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, useCache = true } = options

  return useQuery({
    queryKey: helpQueryKeys.categories(user?.role),
    queryFn: async () => {
      const response = await helpService.getCategories({
        include_inactive: includeInactive,
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help categories')
      }
      return response.data?.categories || []
    },
    staleTime: useCache ? 5 * 60 * 1000 : 0, // 5 minutes if using cache
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user, // Only fetch when user is available
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  })
}

// Enhanced hook for FAQs with smart caching and role filtering
export function useFAQs(filters: FAQFilters = {}, options: {
  useCache?: boolean
  backgroundRefresh?: boolean
} = {}) {
  const { user } = useAuth()
  const { useCache = true, backgroundRefresh = true } = options

  const query = useQuery({
    queryKey: helpQueryKeys.faqs(filters, user?.role),
    queryFn: async () => {
      const response = await helpService.getFAQs({
        ...filters,
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQs')
      }
      return response.data
    },
    staleTime: useCache ? 2 * 60 * 1000 : 0, // 2 minutes if using cache
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  })

  // Background refresh effect
  useEffect(() => {
    if (backgroundRefresh && query.data && useCache) {
      const refreshInterval = setInterval(() => {
        helpService.backgroundRefresh(user?.role)
      }, 5 * 60 * 1000) // Refresh every 5 minutes

      return () => clearInterval(refreshInterval)
    }
  }, [backgroundRefresh, query.data, useCache, user?.role])

  return query
}

// Enhanced hook for single FAQ with caching
export function useFAQ(id: number, options: {
  enabled?: boolean
  useCache?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true, useCache = true } = options

  return useQuery({
    queryKey: helpQueryKeys.faq(id),
    queryFn: async () => {
      const response = await helpService.getFAQ(id, {
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQ')
      }
      return response.data
    },
    enabled: enabled && !!id && !!user,
    staleTime: useCache ? 5 * 60 * 1000 : 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// Enhanced hook for help statistics with longer caching
export function useHelpStats(options: {
  useCache?: boolean
} = {}) {
  const { user } = useAuth()
  const { useCache = true } = options

  return useQuery({
    queryKey: helpQueryKeys.stats(user?.role),
    queryFn: async () => {
      const response = await helpService.getStats({
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help statistics')
      }
      return response.data?.stats
    },
    staleTime: useCache ? 10 * 60 * 1000 : 0, // 10 minutes for stats
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
  })
}

// Enhanced hook for featured FAQs with caching
export function useFeaturedFAQs(limit: number = 3, options: {
  useCache?: boolean
} = {}) {
  const { user } = useAuth()
  const { useCache = true } = options

  return useQuery({
    queryKey: helpQueryKeys.featured(limit),
    queryFn: async () => {
      const response = await helpService.getFeaturedFAQs(limit, {
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured FAQs')
      }
      return response.data || []
    },
    staleTime: useCache ? 5 * 60 * 1000 : 0,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
    refetchOnWindowFocus: false,
  })
}

// Enhanced hook for popular FAQs with caching
export function usePopularFAQs(limit: number = 5, options: {
  useCache?: boolean
} = {}) {
  const { user } = useAuth()
  const { useCache = true } = options

  return useQuery({
    queryKey: helpQueryKeys.popular(limit),
    queryFn: async () => {
      const response = await helpService.getPopularFAQs(limit, {
        userRole: user?.role,
        useCache
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular FAQs')
      }
      return response.data || []
    },
    staleTime: useCache ? 5 * 60 * 1000 : 0,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
    refetchOnWindowFocus: false,
  })
}

// Enhanced hook for FAQ feedback with cache invalidation
export function useFAQFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ faqId, feedback }: { 
      faqId: number
      feedback: { is_helpful: boolean; comment?: string }
    }) => {
      const response = await helpService.provideFeedback(faqId, feedback, {
        userRole: user?.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit feedback')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      // Update the FAQ in cache with new feedback counts
      queryClient.setQueryData(
        helpQueryKeys.faq(variables.faqId),
        (oldData: any) => {
          if (!oldData) return oldData
          
          const updatedFAQ = { ...oldData.faq }
          if (variables.feedback.is_helpful) {
            updatedFAQ.helpful_count = (updatedFAQ.helpful_count || 0) + 1
          } else {
            updatedFAQ.not_helpful_count = (updatedFAQ.not_helpful_count || 0) + 1
          }
          
          return {
            ...oldData,
            faq: updatedFAQ,
            user_feedback: data?.feedback
          }
        }
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.popular() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() })
      
      // Clear service cache
      helpService.clearCache('faqs')
      helpService.clearCache('stats')
      
      toast.success('Thank you for your feedback!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback')
    }
  })
}

// Enhanced hook for content suggestion with role validation
export function useContentSuggestion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestion: ContentSuggestion) => {
      const response = await helpService.suggestContent(suggestion, {
        userRole: user?.role
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit content suggestion')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() })
      
      // Clear service cache
      helpService.clearCache('faqs')
      helpService.clearCache('stats')

      toast.success(
        'Content suggestion submitted successfully! It will be reviewed by administrators.'
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit content suggestion')
    },
  })
}

// Combined hook for help dashboard data with smart caching
export function useHelpDashboard(options: {
  useCache?: boolean
  preloadData?: boolean
} = {}) {
  const { user } = useAuth()
  const { useCache = true, preloadData = true } = options

  const categoriesQuery = useHelpCategories({ useCache })
  const featuredQuery = useFeaturedFAQs(3, { useCache })
  const popularQuery = usePopularFAQs(5, { useCache })
  const statsQuery = useHelpStats({ useCache })

  // Preload essential data on first mount
  useEffect(() => {
    if (preloadData && user?.role) {
      helpService.preloadEssentialData(user.role)
    }
  }, [preloadData, user?.role])

  const canSuggestContent = useMemo(() => {
    return user ? helpService.canSuggestContent(user.role) : false
  }, [user])

  const canManageContent = useMemo(() => {
    return user ? helpService.canManageContent(user.role) : false
  }, [user])

  const isLoading = categoriesQuery.isLoading || 
                   featuredQuery.isLoading || 
                   popularQuery.isLoading || 
                   statsQuery.isLoading

  const error = categoriesQuery.error || 
                featuredQuery.error || 
                popularQuery.error || 
                statsQuery.error

  const refetch = useCallback(() => {
    // Clear cache and refetch
    helpService.clearCache()
    categoriesQuery.refetch()
    featuredQuery.refetch()
    popularQuery.refetch()
    statsQuery.refetch()
  }, [categoriesQuery, featuredQuery, popularQuery, statsQuery])

  return {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    stats: statsQuery.data,
    canSuggestContent,
    canManageContent,
    isLoading,
    error,
    refetch,
    // Cache information
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data),
    isStale: categoriesQuery.isStale || featuredQuery.isStale || popularQuery.isStale || statsQuery.isStale,
  }
}

// Hook for FAQ filtering and sorting with smart defaults
export function useFAQFilters(initialFilters: FAQFilters = {}) {
  const [filters, setFilters] = useState<FAQFilters>(initialFilters)

  const updateFilter = useCallback((key: keyof FAQFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filtering
    }))
    
    // Clear relevant cache when filters change significantly
    if (['category', 'search', 'featured'].includes(key)) {
      helpService.clearCache('faqs')
    }
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    helpService.clearCache('faqs')
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

// Hook for FAQ analytics tracking
export function useFAQAnalytics() {
  const trackFAQView = useCallback((faqId: number, question: string) => {
    // Track FAQ view event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_view', {
        event_category: 'Help',
        event_label: question,
        value: faqId,
      })
    }
  }, [])

  const trackFAQFeedback = useCallback((faqId: number, isHelpful: boolean, question: string) => {
    // Track FAQ feedback event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_feedback', {
        event_category: 'Help',
        event_label: question,
        value: faqId,
        custom_parameters: {
          helpful: isHelpful,
        },
      })
    }
  }, [])

  const trackFAQSearch = useCallback((query: string, resultsCount: number) => {
    // Track FAQ search event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_search', {
        event_category: 'Help',
        event_label: query,
        value: resultsCount,
      })
    }
  }, [])

  const trackCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
    // Track category click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'help_category_click', {
        event_category: 'Help',
        event_label: categoryName,
        value: categorySlug,
      })
    }
  }, [])

  return {
    trackFAQView,
    trackFAQFeedback,
    trackFAQSearch,
    trackCategoryClick,
  }
}

// Hook for managing FAQ favorites/bookmarks with persistence
export function useFAQBookmarks() {
  const { user } = useAuth()
  const [bookmarkedFAQs, setBookmarkedFAQs] = useState<number[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return []
    try {
      const stored = localStorage.getItem(`faq_bookmarks_${user.id}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Update localStorage when bookmarks change
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`faq_bookmarks_${user.id}`, JSON.stringify(bookmarkedFAQs))
      } catch (error) {
        console.error('Failed to save FAQ bookmarks:', error)
      }
    }
  }, [bookmarkedFAQs, user?.id])

  const toggleBookmark = useCallback((faqId: number) => {
    setBookmarkedFAQs((prev) => {
      return prev.includes(faqId)
        ? prev.filter((id) => id !== faqId)
        : [...prev, faqId]
    })
  }, [])

  const isBookmarked = useCallback(
    (faqId: number) => {
      return bookmarkedFAQs.includes(faqId)
    },
    [bookmarkedFAQs]
  )

  const clearBookmarks = useCallback(() => {
    setBookmarkedFAQs([])
    if (user?.id) {
      try {
        localStorage.removeItem(`faq_bookmarks_${user.id}`)
      } catch (error) {
        console.error('Failed to clear FAQ bookmarks:', error)
      }
    }
  }, [user?.id])

  return {
    bookmarkedFAQs,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  }
}

// Hook for recent FAQ searches with user-specific storage
export function useRecentFAQSearches() {
  const { user } = useAuth()
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return []
    try {
      const stored = localStorage.getItem(`recent_faq_searches_${user.id}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Update localStorage when searches change
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`recent_faq_searches_${user.id}`, JSON.stringify(recentSearches))
      } catch (error) {
        console.error('Failed to save recent FAQ searches:', error)
      }
    }
  }, [recentSearches, user?.id])

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((search) => search.toLowerCase() !== query.toLowerCase())
      return [query, ...filtered].slice(0, 10) // Keep only 10 recent searches
    })
  }, [])

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => prev.filter((search) => search !== query))
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (user?.id) {
      try {
        localStorage.removeItem(`recent_faq_searches_${user.id}`)
      } catch (error) {
        console.error('Failed to clear recent FAQ searches:', error)
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

// Admin-specific hooks for content management
export function useAdminFAQManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Create FAQ mutation
  const createFAQ = useMutation({
    mutationFn: async (faqData: Partial<FAQ>) => {
      const response = await helpService.createFAQ(faqData, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to create FAQ')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.all })
      helpService.clearCache()
      toast.success('FAQ created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create FAQ')
    }
  })

  // Update FAQ mutation
  const updateFAQ = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FAQ> }) => {
      const response = await helpService.updateFAQ(id, data, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to update FAQ')
      }
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.all })
      queryClient.setQueryData(helpQueryKeys.faq(variables.id), (oldData: any) => ({
        ...oldData,
        faq: data?.faq
      }))
      helpService.clearCache()
      toast.success('FAQ updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update FAQ')
    }
  })

  // Delete FAQ mutation
  const deleteFAQ = useMutation({
    mutationFn: async (id: number) => {
      const response = await helpService.deleteFAQ(id, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete FAQ')
      }
      return response.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.all })
      queryClient.removeQueries({ queryKey: helpQueryKeys.faq(id) })
      helpService.clearCache()
      toast.success('FAQ deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete FAQ')
    }
  })

  return {
    createFAQ,
    updateFAQ,
    deleteFAQ,
    canManage: helpService.canManageContent(user?.role || ''),
  }
}

// Utility hook for FAQ formatting and helpers
export function useFAQUtils() {
  const formatTimeAgo = useCallback((dateString: string) => {
    return helpService.formatTimeAgo(dateString)
  }, [])

  const calculateHelpfulnessRate = useCallback((helpful: number, notHelpful: number) => {
    return helpService.calculateHelpfulnessRate(helpful, notHelpful)
  }, [])

  const getHelpfulnessColor = useCallback((rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    if (rate >= 40) return 'text-orange-600'
    return 'text-red-600'
  }, [])

  const getHelpfulnessLabel = useCallback((rate: number) => {
    if (rate >= 90) return 'Excellent'
    if (rate >= 80) return 'Very Helpful'
    if (rate >= 60) return 'Helpful'
    if (rate >= 40) return 'Somewhat Helpful'
    return 'Needs Improvement'
  }, [])

  const getCacheStats = useCallback(() => {
    return helpService.getCacheStats()
  }, [])

  return {
    formatTimeAgo,
    calculateHelpfulnessRate,
    getHelpfulnessColor,
    getHelpfulnessLabel,
    getCacheStats,
  }
}