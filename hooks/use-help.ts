// hooks/use-help.ts (FIXED - Stable loading without constant reloading)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { helpService, type FAQ, type HelpCategory, type FAQFilters, type ContentSuggestion } from '@/services/help.service'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Stable query keys
export const helpQueryKeys = {
  all: ['help'] as const,
  categories: (userRole?: string) => [...helpQueryKeys.all, 'categories', userRole] as const,
  faqs: (filters?: FAQFilters, userRole?: string) => [...helpQueryKeys.all, 'faqs', JSON.stringify(filters), userRole] as const,
  faq: (id: number) => [...helpQueryKeys.all, 'faq', id] as const,
  stats: (userRole?: string) => [...helpQueryKeys.all, 'stats', userRole] as const,
  featured: (limit?: number) => [...helpQueryKeys.all, 'featured', limit] as const,
  popular: (limit?: number) => [...helpQueryKeys.all, 'popular', limit] as const,
}

// Enhanced hook for help categories with stable caching
export function useHelpCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.categories(user?.role),
    queryFn: async () => {
      const response = await helpService.getCategories({
        include_inactive: includeInactive,
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help categories')
      }
      return response.data?.categories || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - much longer for stability
    gcTime: 20 * 60 * 1000, // 20 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Disable automatic reconnect refetch
    refetchInterval: false, // Disable interval refetch
  })
}

// Enhanced hook for FAQs with stable caching
export function useFAQs(filters: FAQFilters = {}, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.faqs(filters, user?.role),
    queryFn: async () => {
      const response = await helpService.getFAQs({
        ...filters,
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQs')
      }
      return response.data
    },
    staleTime: 8 * 60 * 1000, // 8 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}

// Enhanced hook for single FAQ
export function useFAQ(id: number, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.faq(id),
    queryFn: async () => {
      const response = await helpService.getFAQ(id, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQ')
      }
      return response.data
    },
    enabled: enabled && !!id && !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}

// Enhanced hook for help statistics
export function useHelpStats(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.stats(user?.role),
    queryFn: async () => {
      const response = await helpService.getStats({
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help statistics')
      }
      return response.data?.stats
    },
    staleTime: 15 * 60 * 1000, // 15 minutes for stats
    gcTime: 25 * 60 * 1000, // 25 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}

// Enhanced hook for featured FAQs
export function useFeaturedFAQs(limit: number = 3, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.featured(limit),
    queryFn: async () => {
      const response = await helpService.getFeaturedFAQs(limit, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured FAQs')
      }
      return response.data || []
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}

// Enhanced hook for popular FAQs
export function usePopularFAQs(limit: number = 5, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: helpQueryKeys.popular(limit),
    queryFn: async () => {
      const response = await helpService.getPopularFAQs(limit, {
        userRole: user?.role,
        forceRefresh: false
      })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular FAQs')
      }
      return response.data || []
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}

// Enhanced hook for FAQ feedback
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
      
      toast.success('Thank you for your feedback!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback')
    }
  })
}

// Enhanced hook for content suggestion
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

      toast.success(
        'Content suggestion submitted successfully! It will be reviewed by administrators.'
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit content suggestion')
    },
  })
}

// Combined hook for help dashboard data with stable loading
export function useHelpDashboard(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  const categoriesQuery = useHelpCategories({ enabled })
  const featuredQuery = useFeaturedFAQs(3, { enabled })
  const popularQuery = usePopularFAQs(5, { enabled })
  const statsQuery = useHelpStats({ enabled })

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
    categoriesQuery.refetch()
    featuredQuery.refetch()
    popularQuery.refetch()
    statsQuery.refetch()
  }, [categoriesQuery, featuredQuery, popularQuery, statsQuery])

  // Force refresh with cache clearing
  const forceRefresh = useCallback(async () => {
    // Clear cache first
    helpService.clearCache()
    
    // Then refetch all data
    await Promise.all([
      categoriesQuery.refetch(),
      featuredQuery.refetch(),
      popularQuery.refetch(),
      statsQuery.refetch()
    ])
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
    forceRefresh,
    // No stale indicators for normal help page
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data),
  }
}

// Hook for FAQ filtering with stable state
export function useFAQFilters(initialFilters: FAQFilters = {}) {
  const [filters, setFilters] = useState<FAQFilters>(initialFilters)

  const updateFilter = useCallback((key: keyof FAQFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filtering
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

// Hook for FAQ analytics tracking
export function useFAQAnalytics() {
  const trackFAQView = useCallback((faqId: number, question: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_view', {
        event_category: 'Help',
        event_label: question,
        value: faqId,
      })
    }
  }, [])

  const trackFAQFeedback = useCallback((faqId: number, isHelpful: boolean, question: string) => {
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
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_search', {
        event_category: 'Help',
        event_label: query,
        value: resultsCount,
      })
    }
  }, [])

  const trackCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
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

// Hook for managing FAQ bookmarks with persistence
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

  const toggleBookmark = useCallback((faqId: number) => {
    setBookmarkedFAQs((prev) => {
      const newBookmarks = prev.includes(faqId)
        ? prev.filter((id) => id !== faqId)
        : [...prev, faqId]

      if (user?.id) {
        try {
          localStorage.setItem(`faq_bookmarks_${user.id}`, JSON.stringify(newBookmarks))
        } catch (error) {
          console.error('Failed to save FAQ bookmarks:', error)
        }
      }

      return newBookmarks
    })
  }, [user?.id])

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

// Hook for recent FAQ searches
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

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((search) => search.toLowerCase() !== query.toLowerCase())
      const newSearches = [query, ...filtered].slice(0, 10)

      if (user?.id) {
        try {
          localStorage.setItem(`recent_faq_searches_${user.id}`, JSON.stringify(newSearches))
        } catch (error) {
          console.error('Failed to save recent FAQ searches:', error)
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
          localStorage.setItem(`recent_faq_searches_${user.id}`, JSON.stringify(newSearches))
        } catch (error) {
          console.error('Failed to update recent FAQ searches:', error)
        }
      }

      return newSearches
    })
  }, [user?.id])

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
      toast.success('FAQ deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete FAQ')
    }
  })

  // Create Category mutation
  const createCategory = useMutation({
    mutationFn: async (categoryData: Partial<HelpCategory>) => {
      const response = await helpService.createCategory(categoryData, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to create category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() })
      toast.success('Category created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    }
  })

  // Update Category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HelpCategory> }) => {
      const response = await helpService.updateCategory(id, data, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to update category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() })
      toast.success('Category updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category')
    }
  })

  // Delete Category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const response = await helpService.deleteCategory(id, user?.role)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete category')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() })
      toast.success('Category deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    }
  })

  return {
    createFAQ,
    updateFAQ,
    deleteFAQ,
    createCategory,
    updateCategory,
    deleteCategory,
    canManage: helpService.canManageContent(user?.role || ''),
  }
}

// Utility hook for FAQ formatting
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