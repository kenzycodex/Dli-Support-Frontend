// hooks/use-help.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { helpService, type FAQ, type HelpCategory, type FAQFilters, type ContentSuggestion } from '@/services/help.service'
import { useCallback, useMemo, useState } from 'react' // ADDED useState import
import { toast } from 'sonner'

// Query keys for consistent caching
export const helpQueryKeys = {
  all: ['help'] as const,
  categories: () => [...helpQueryKeys.all, 'categories'] as const,
  faqs: (filters?: FAQFilters) => [...helpQueryKeys.all, 'faqs', filters] as const,
  faq: (id: number) => [...helpQueryKeys.all, 'faq', id] as const,
  stats: () => [...helpQueryKeys.all, 'stats'] as const,
  featured: () => [...helpQueryKeys.all, 'featured'] as const,
  popular: () => [...helpQueryKeys.all, 'popular'] as const,
  search: (query: string, filters?: Omit<FAQFilters, 'search'>) => 
    [...helpQueryKeys.all, 'search', query, filters] as const,
}

// Hook for help categories
export function useHelpCategories() {
  return useQuery({
    queryKey: helpQueryKeys.categories(),
    queryFn: async () => {
      const response = await helpService.getCategories()
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help categories')
      }
      return response.data?.categories || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for FAQs with filtering
export function useFAQs(filters: FAQFilters = {}) {
  return useQuery({
    queryKey: helpQueryKeys.faqs(filters),
    queryFn: async () => {
      const response = await helpService.getFAQs(filters)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQs')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for infinite scroll FAQs
export function useInfiniteFAQs(filters: FAQFilters = {}) {
  return useInfiniteQuery({
    queryKey: helpQueryKeys.faqs(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await helpService.getFAQs({ ...filters, page: pageParam })
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQs')
      }
      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined
      const { current_page, last_page } = lastPage.pagination
      return current_page < last_page ? current_page + 1 : undefined
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

// Hook for single FAQ
export function useFAQ(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: helpQueryKeys.faq(id),
    queryFn: async () => {
      const response = await helpService.getFAQ(id)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch FAQ')
      }
      return response.data
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook for help statistics
export function useHelpStats() {
  return useQuery({
    queryKey: helpQueryKeys.stats(),
    queryFn: async () => {
      const response = await helpService.getStats()
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch help statistics')
      }
      return response.data?.stats
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Hook for featured FAQs
export function useFeaturedFAQs(limit: number = 3) {
  return useQuery({
    queryKey: helpQueryKeys.featured(),
    queryFn: async () => {
      const response = await helpService.getFeaturedFAQs(limit)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured FAQs')
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook for popular FAQs
export function usePopularFAQs(limit: number = 5) {
  return useQuery({
    queryKey: helpQueryKeys.popular(),
    queryFn: async () => {
      const response = await helpService.getPopularFAQs(limit)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular FAQs')
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook for FAQ search with debouncing
export function useFAQSearch(query: string, filters: Omit<FAQFilters, 'search'> = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: helpQueryKeys.search(query, filters),
    queryFn: async () => {
      if (!query.trim()) return null
      const response = await helpService.searchFAQs(query, filters)
      if (!response.success) {
        throw new Error(response.message || 'Failed to search FAQs')
      }
      return response.data
    },
    enabled: enabled && query.length >= 2, // Only search for 2+ characters
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook for FAQ feedback mutation
export function useFAQFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ faqId, feedback }: { 
      faqId: number
      feedback: { is_helpful: boolean; comment?: string }
    }) => {
      const response = await helpService.provideFeedback(faqId, feedback)
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

      // Invalidate FAQ lists to refresh counts
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() })
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.popular() })
      
      toast.success('Thank you for your feedback!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback')
    }
  })
}

// Hook for content suggestion mutation (counselors only)
export function useContentSuggestion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion: ContentSuggestion) => {
      const response = await helpService.suggestContent(suggestion);
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit content suggestion');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() });

      toast.success(
        'Content suggestion submitted successfully! It will be reviewed by administrators.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit content suggestion');
    },
  });
}

// Combined hook for help dashboard data
export function useHelpDashboard() {
  const { user } = useAuth();

  const categoriesQuery = useHelpCategories();
  const featuredQuery = useFeaturedFAQs(3);
  const popularQuery = usePopularFAQs(5);
  const statsQuery = useHelpStats();

  const canSuggestContent = useMemo(() => {
    return user ? helpService.canSuggestContent(user.role) : false;
  }, [user]);

  return {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    stats: statsQuery.data,
    canSuggestContent,
    isLoading:
      categoriesQuery.isLoading ||
      featuredQuery.isLoading ||
      popularQuery.isLoading ||
      statsQuery.isLoading,
    error: categoriesQuery.error || featuredQuery.error || popularQuery.error || statsQuery.error,
    refetch: useCallback(() => {
      categoriesQuery.refetch();
      featuredQuery.refetch();
      popularQuery.refetch();
      statsQuery.refetch();
    }, [categoriesQuery, featuredQuery, popularQuery, statsQuery]),
  };
}

// Hook for FAQ filtering and sorting
export function useFAQFilters(initialFilters: FAQFilters = {}) {
  const [filters, setFilters] = useState<FAQFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof FAQFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filtering
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const resetPagination = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
    resetPagination,
    setFilters,
  };
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
      });
    }
  }, []);

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
      });
    }
  }, []);

  const trackFAQSearch = useCallback((query: string, resultsCount: number) => {
    // Track FAQ search event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'faq_search', {
        event_category: 'Help',
        event_label: query,
        value: resultsCount,
      });
    }
  }, []);

  const trackCategoryCick = useCallback((categorySlug: string, categoryName: string) => {
    // Track category click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'help_category_click', {
        event_category: 'Help',
        event_label: categoryName,
        value: categorySlug,
      });
    }
  }, []);

  return {
    trackFAQView,
    trackFAQFeedback,
    trackFAQSearch,
    trackCategoryCick,
  };
}

// Hook for managing FAQ favorites/bookmarks (local storage)
export function useFAQBookmarks() {
  const [bookmarkedFAQs, setBookmarkedFAQs] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('faq_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = useCallback((faqId: number) => {
    setBookmarkedFAQs((prev) => {
      const newBookmarks = prev.includes(faqId)
        ? prev.filter((id) => id !== faqId)
        : [...prev, faqId];

      try {
        localStorage.setItem('faq_bookmarks', JSON.stringify(newBookmarks));
      } catch (error) {
        console.error('Failed to save FAQ bookmarks:', error);
      }

      return newBookmarks;
    });
  }, []);

  const isBookmarked = useCallback(
    (faqId: number) => {
      return bookmarkedFAQs.includes(faqId);
    },
    [bookmarkedFAQs]
  );

  const clearBookmarks = useCallback(() => {
    setBookmarkedFAQs([]);
    try {
      localStorage.removeItem('faq_bookmarks');
    } catch (error) {
      console.error('Failed to clear FAQ bookmarks:', error);
    }
  }, []);

  return {
    bookmarkedFAQs,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
}

// Hook for recent FAQ searches (local storage)
export function useRecentFAQSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('recent_faq_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((search) => search.toLowerCase() !== query.toLowerCase());
      const newSearches = [query, ...filtered].slice(0, 10); // Keep only 10 recent searches

      try {
        localStorage.setItem('recent_faq_searches', JSON.stringify(newSearches));
      } catch (error) {
        console.error('Failed to save recent FAQ searches:', error);
      }

      return newSearches;
    });
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((search) => search !== query);

      try {
        localStorage.setItem('recent_faq_searches', JSON.stringify(newSearches));
      } catch (error) {
        console.error('Failed to update recent FAQ searches:', error);
      }

      return newSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recent_faq_searches');
    } catch (error) {
      console.error('Failed to clear recent FAQ searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

// Utility hook for FAQ formatting
export function useFAQUtils() {
  const formatTimeAgo = useCallback((dateString: string) => {
    return helpService.formatTimeAgo(dateString);
  }, []);

  const calculateHelpfulnessRate = useCallback((helpful: number, notHelpful: number) => {
    return helpService.calculateHelpfulnessRate(helpful, notHelpful);
  }, []);

  const getHelpfulnessColor = useCallback((rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const getHelpfulnessLabel = useCallback((rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 80) return 'Very Helpful';
    if (rate >= 60) return 'Helpful';
    if (rate >= 40) return 'Somewhat Helpful';
    return 'Needs Improvement';
  }, []);

  return {
    formatTimeAgo,
    calculateHelpfulnessRate,
    getHelpfulnessColor,
    getHelpfulnessLabel,
  };
}