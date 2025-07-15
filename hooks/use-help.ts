// hooks/use-help.ts (FIXED - Compatible with enhanced service and proper admin support)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { helpService, type FAQ, type HelpCategory, type FAQFilters, type ContentSuggestion } from '@/services/help.service'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Stable query keys - same as before
export const helpQueryKeys = {
  all: ['help'] as const,
  categories: (userRole?: string, includeInactive?: boolean) => [...helpQueryKeys.all, 'categories', userRole, includeInactive] as const,
  adminCategories: (userRole?: string) => [...helpQueryKeys.all, 'admin-categories', userRole] as const,
  faqs: (filters?: FAQFilters, userRole?: string) => [...helpQueryKeys.all, 'faqs', JSON.stringify(filters), userRole] as const,
  adminFaqs: (filters?: FAQFilters, userRole?: string) => [...helpQueryKeys.all, 'admin-faqs', JSON.stringify(filters), userRole] as const,
  faq: (id: number) => [...helpQueryKeys.all, 'faq', id] as const,
  stats: (userRole?: string) => [...helpQueryKeys.all, 'stats', userRole] as const,
  featured: (limit?: number) => [...helpQueryKeys.all, 'featured', limit] as const,
  popular: (limit?: number) => [...helpQueryKeys.all, 'popular', limit] as const,
}

// Enhanced hook for help categories with ultra-stable caching
export function useHelpCategories(options: {
  includeInactive?: boolean
  enabled?: boolean
  useAdminEndpoint?: boolean
} = {}) {
  const { user } = useAuth()
  const { includeInactive = false, enabled = true, useAdminEndpoint = false } = options

  // Use admin endpoint for admin users when specified
  const shouldUseAdminEndpoint = useAdminEndpoint && user?.role === 'admin'
  
  return useQuery({
    queryKey: shouldUseAdminEndpoint 
      ? helpQueryKeys.adminCategories(user?.role)
      : helpQueryKeys.categories(user?.role, includeInactive),
    queryFn: async () => {
      let response;
      
      if (shouldUseAdminEndpoint) {
        response = await helpService.getAdminCategories({
          include_inactive: true, // Admin always sees all
          userRole: user?.role,
          forceRefresh: false
        })
      } else {
        response = await helpService.getCategories({
          include_inactive: includeInactive,
          userRole: user?.role,
          forceRefresh: false
        })
      }
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help categories')
      }
      return response.data?.categories || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - even longer for ultra stability
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    meta: {
      errorMessage: 'Failed to load categories'
    }
  })
}

// FIXED: Enhanced FAQ hook with admin support and better error handling
export function useFAQs(filters: FAQFilters = {}, options: {
  enabled?: boolean
  useAdminEndpoint?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true, useAdminEndpoint = false } = options

  // Use admin endpoint for admin users when specified
  const shouldUseAdminEndpoint = useAdminEndpoint && user?.role === 'admin'

  return useQuery({
    queryKey: shouldUseAdminEndpoint 
      ? helpQueryKeys.adminFaqs(filters, user?.role)
      : helpQueryKeys.faqs(filters, user?.role),
    queryFn: async () => {
      let response;
      
      if (shouldUseAdminEndpoint) {
        // Use admin endpoint with enhanced filters
        response = await helpService.getAdminFAQs({
          ...filters,
          userRole: user?.role,
          forceRefresh: false
        })
      } else {
        // Use regular endpoint
        response = await helpService.getFAQs({
          ...filters,
          userRole: user?.role,
          forceRefresh: false
        })
      }
      
      if (!response.success) {
        console.error('❌ useFAQs: Service returned error:', response)
        throw new Error(response.message || 'Failed to fetch FAQs')
      }

      // CRITICAL: Ensure we return the expected FAQsResponse structure
      const data = response.data
      if (!data) {
        console.warn('⚠️ useFAQs: No data in successful response')
        return {
          faqs: [],
          featured_faqs: [],
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 0,
            total: 0
          }
        }
      }

      console.log('✅ useFAQs: Successfully processed FAQ data:', {
        faqsCount: data.faqs?.length || 0,
        featuredCount: data.featured_faqs?.length || 0,
        hasPagination: !!data.pagination
      })

      return data
    },
    staleTime: 12 * 60 * 1000, // 12 minutes - longer for stability
    gcTime: 25 * 60 * 1000, // 25 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    retry: (failureCount, error) => {
      // Retry logic for FAQ loading
      if (failureCount >= 3) return false
      if (error.message?.includes('403') || error.message?.includes('401')) return false
      return true
    },
    meta: {
      errorMessage: shouldUseAdminEndpoint ? 'Failed to load admin FAQs' : 'Failed to load FAQs'
    }
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
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    meta: {
      errorMessage: 'Failed to load FAQ details'
    }
  })
}

// Ultra-stable help statistics
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
    staleTime: 20 * 60 * 1000, // 20 minutes - very long for stats
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    meta: {
      errorMessage: 'Failed to load help statistics'
    }
  })
}

// Ultra-stable featured FAQs
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
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    meta: {
      errorMessage: 'Failed to load featured FAQs'
    }
  })
}

// Ultra-stable popular FAQs
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
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
    meta: {
      errorMessage: 'Failed to load popular FAQs'
    }
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

      // Selectively invalidate only necessary queries
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.popular() })
      
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
      // Only invalidate stats, not all FAQs
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

// FIXED: DASHBOARD HOOK - Enhanced with admin support
export function useHelpDashboard(options: {
  enabled?: boolean
  useAdminEndpoints?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true, useAdminEndpoints = false } = options

  // Use admin endpoints if user is admin and option is enabled
  const shouldUseAdminEndpoints = useAdminEndpoints && user?.role === 'admin'

  const categoriesQuery = useHelpCategories({ 
    enabled,
    useAdminEndpoint: shouldUseAdminEndpoints,
    includeInactive: shouldUseAdminEndpoints 
  })
  
  const featuredQuery = useFeaturedFAQs(3, { enabled })
  const popularQuery = usePopularFAQs(5, { enabled })
  const statsQuery = useHelpStats({ enabled })

  const canSuggestContent = useMemo(() => {
    return user ? helpService.canSuggestContent(user.role) : false
  }, [user])

  const canManageContent = useMemo(() => {
    return user ? helpService.canManageContent(user.role) : false
  }, [user])

  // Only show loading for initial load
  const isLoading = (categoriesQuery.isLoading && !categoriesQuery.data) || 
                   (featuredQuery.isLoading && !featuredQuery.data) || 
                   (popularQuery.isLoading && !popularQuery.data) || 
                   (statsQuery.isLoading && !statsQuery.data)

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

  // Force refresh with cache clearing - only when explicitly requested
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
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data),
    isAdmin: user?.role === 'admin',
    usingAdminEndpoints: shouldUseAdminEndpoints,
  }
}

// FIXED: Admin-specific dashboard hook
export function useAdminHelpDashboard(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  // Only enable for admin users
  const isAdmin = user?.role === 'admin'
  const shouldEnable = enabled && isAdmin

  const adminCategoriesQuery = useHelpCategories({ 
    enabled: shouldEnable,
    useAdminEndpoint: true,
    includeInactive: true 
  })

  const adminFaqsQuery = useFAQs({}, { 
    enabled: shouldEnable,
    useAdminEndpoint: true 
  })
  
  const statsQuery = useHelpStats({ enabled: shouldEnable })

  // Calculate admin-specific stats
  const adminStats = useMemo(() => {
    if (!adminFaqsQuery.data?.faqs) return null

    const faqs = adminFaqsQuery.data.faqs
    return {
      total_faqs: faqs.length,
      published_faqs: faqs.filter(faq => faq.is_published).length,
      draft_faqs: faqs.filter(faq => !faq.is_published).length,
      featured_faqs: faqs.filter(faq => faq.is_featured).length,
      categories_count: adminCategoriesQuery.data?.length || 0,
      active_categories: adminCategoriesQuery.data?.filter(cat => cat.is_active).length || 0,
    }
  }, [adminFaqsQuery.data, adminCategoriesQuery.data])

  const isLoading = (adminCategoriesQuery.isLoading && !adminCategoriesQuery.data) || 
                   (adminFaqsQuery.isLoading && !adminFaqsQuery.data) || 
                   (statsQuery.isLoading && !statsQuery.data)

  const error = adminCategoriesQuery.error || 
                adminFaqsQuery.error || 
                statsQuery.error

  const refetch = useCallback(() => {
    if (!isAdmin) return
    adminCategoriesQuery.refetch()
    adminFaqsQuery.refetch()
    statsQuery.refetch()
  }, [adminCategoriesQuery, adminFaqsQuery, statsQuery, isAdmin])

  const forceRefresh = useCallback(async () => {
    if (!isAdmin) return
    
    // Clear cache first
    helpService.clearCache()
    
    await Promise.all([
      adminCategoriesQuery.refetch(),
      adminFaqsQuery.refetch(),
      statsQuery.refetch()
    ])
  }, [adminCategoriesQuery, adminFaqsQuery, statsQuery, isAdmin])

  return {
    categories: adminCategoriesQuery.data || [],
    faqs: adminFaqsQuery.data || { faqs: [], featured_faqs: [], pagination: { current_page: 1, last_page: 1, per_page: 0, total: 0 } },
    stats: statsQuery.data,
    adminStats,
    isLoading,
    error,
    refetch,
    forceRefresh,
    hasData: !!(adminCategoriesQuery.data || adminFaqsQuery.data),
    isAuthorized: isAdmin,
  }
}

// OPTIMIZED FAQ filtering with stable state management
export function useFAQFilters(initialFilters: FAQFilters = {}) {
  const [filters, setFilters] = useState<FAQFilters>(initialFilters)

  const updateFilter = useCallback((key: keyof FAQFilters, value: any) => {
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

// Hook for recent FAQ searches with optimized persistence
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

// FIXED: Admin-specific hooks for content management with proper error handling
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
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.adminCategories() })
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
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.adminCategories() })
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
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.adminCategories() })
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
    isAdmin: user?.role === 'admin',
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

  const validateFAQData = useCallback((data: Partial<FAQ>) => {
    return helpService.validateFAQData(data)
  }, [])

  const validateCategoryData = useCallback((data: Partial<HelpCategory>) => {
    return helpService.validateCategoryData(data)
  }, [])

  const getDebugInfo = useCallback(() => {
    return helpService.getDebugInfo()
  }, [])

  return {
    formatTimeAgo,
    calculateHelpfulnessRate,
    getHelpfulnessColor,
    getHelpfulnessLabel,
    getCacheStats,
    validateFAQData,
    validateCategoryData,
    getDebugInfo,
  }
}

// FIXED: Hook for handling FAQ filters with admin support
export function useAdminFAQFilters(initialFilters: FAQFilters = {}) {
  const [filters, setFilters] = useState<FAQFilters>({
    include_drafts: true, // Admin should see drafts by default
    ...initialFilters
  })

  const updateFilter = useCallback((key: keyof FAQFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key !== 'page' ? 1 : value, // Reset page when filtering
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      include_drafts: true, // Keep admin-specific defaults
      ...initialFilters
    })
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
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (key === 'include_drafts') return false // Don't count this as an active filter for admins
      return value !== undefined && value !== null && value !== '' && value !== 'all'
    }),
  }
}

// Performance monitoring hook
export function useHelpPerformance() {
  const [metrics, setMetrics] = useState({
    cacheHitRate: 0,
    averageLoadTime: 0,
    lastUpdate: new Date()
  })

  const updateMetrics = useCallback(() => {
    const stats = helpService.getCacheStats()
    const debugInfo = helpService.getDebugInfo()
    
    setMetrics({
      cacheHitRate: stats.cacheSize > 0 ? 85 : 0, // Simulated hit rate
      averageLoadTime: 250, // Simulated load time
      lastUpdate: new Date()
    })
  }, [])

  const clearCache = useCallback(() => {
    helpService.clearCache()
    updateMetrics()
    toast.success('Help cache cleared successfully')
  }, [updateMetrics])

  return {
    metrics,
    updateMetrics,
    clearCache,
    debugInfo: helpService.getDebugInfo(),
  }
}