// hooks/use-resources.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  resourcesService,
  type Resource,
  type ResourceCategory,
  type ResourceFilters,
} from '@/services/resources.service';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Query keys for consistent caching
export const resourcesQueryKeys = {
  all: ['resources'] as const,
  categories: () => [...resourcesQueryKeys.all, 'categories'] as const,
  resources: (filters?: ResourceFilters) =>
    [...resourcesQueryKeys.all, 'resources', filters] as const,
  resource: (id: number) => [...resourcesQueryKeys.all, 'resource', id] as const,
  bookmarks: (page?: number) => [...resourcesQueryKeys.all, 'bookmarks', page] as const,
  stats: () => [...resourcesQueryKeys.all, 'stats'] as const,
  options: () => [...resourcesQueryKeys.all, 'options'] as const,
  featured: () => [...resourcesQueryKeys.all, 'featured'] as const,
  popular: () => [...resourcesQueryKeys.all, 'popular'] as const,
  topRated: () => [...resourcesQueryKeys.all, 'top-rated'] as const,
  search: (query: string, filters?: Omit<ResourceFilters, 'search'>) =>
    [...resourcesQueryKeys.all, 'search', query, filters] as const,
};

// Hook for resource categories
export function useResourceCategories() {
  return useQuery({
    queryKey: resourcesQueryKeys.categories(),
    queryFn: async () => {
      const response = await resourcesService.getCategories();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource categories');
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for resources with filtering
export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: resourcesQueryKeys.resources(filters),
    queryFn: async () => {
      const response = await resourcesService.getResources(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resources');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for infinite scroll resources
export function useInfiniteResources(filters: ResourceFilters = {}) {
  return useInfiniteQuery({
    queryKey: resourcesQueryKeys.resources(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await resourcesService.getResources({ ...filters, page: pageParam });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resources');
      }
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      const { current_page, last_page } = lastPage.pagination;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook for single resource
export function useResource(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: resourcesQueryKeys.resource(id),
    queryFn: async () => {
      const response = await resourcesService.getResource(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource');
      }
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for user bookmarks
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  return useQuery({
    queryKey: resourcesQueryKeys.bookmarks(page),
    queryFn: async () => {
      const response = await resourcesService.getBookmarks(page, perPage);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookmarks');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook for resource statistics
export function useResourceStats() {
  return useQuery({
    queryKey: resourcesQueryKeys.stats(),
    queryFn: async () => {
      const response = await resourcesService.getStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource statistics');
      }
      return response.data?.stats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for resource options
export function useResourceOptions() {
  return useQuery({
    queryKey: resourcesQueryKeys.options(),
    queryFn: async () => {
      const response = await resourcesService.getOptions();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource options');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Hook for featured resources
export function useFeaturedResources(limit: number = 3) {
  return useQuery({
    queryKey: resourcesQueryKeys.featured(),
    queryFn: async () => {
      const response = await resourcesService.getFeaturedResources(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured resources');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for popular resources
export function usePopularResources(limit: number = 5) {
  return useQuery({
    queryKey: resourcesQueryKeys.popular(),
    queryFn: async () => {
      const response = await resourcesService.getPopularResources(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular resources');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for top rated resources
export function useTopRatedResources(limit: number = 5) {
  return useQuery({
    queryKey: resourcesQueryKeys.topRated(),
    queryFn: async () => {
      const response = await resourcesService.getTopRatedResources(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch top rated resources');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for resource search with debouncing
export function useResourceSearch(
  query: string,
  filters: Omit<ResourceFilters, 'search'> = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: resourcesQueryKeys.search(query, filters),
    queryFn: async () => {
      if (!query.trim()) return null;
      const response = await resourcesService.searchResources(query, filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to search resources');
      }
      return response.data;
    },
    enabled: enabled && query.length >= 2, // Only search for 2+ characters
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for accessing resources (tracking usage)
export function useResourceAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.accessResource(resourceId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to access resource');
      }
      return response.data;
    },
    onSuccess: (data, resourceId) => {
      // FIXED: Check if data exists before accessing properties
      if (data) {
        // Update resource view/download counts in cache
        queryClient.setQueryData(resourcesQueryKeys.resource(resourceId), (oldData: any) => {
          if (!oldData) return oldData;

          const updatedResource = { ...oldData.resource };
          if (data.action === 'download') {
            updatedResource.download_count = (updatedResource.download_count || 0) + 1;
          } else {
            updatedResource.view_count = (updatedResource.view_count || 0) + 1;
          }

          return {
            ...oldData,
            resource: updatedResource,
          };
        });

        // Invalidate resource lists to refresh counts
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.resources() });
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.popular() });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to access resource');
    },
  });
}

// Hook for resource feedback/rating
export function useResourceFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      feedback,
    }: {
      resourceId: number;
      feedback: { rating: number; comment?: string; is_recommended?: boolean };
    }) => {
      const response = await resourcesService.provideFeedback(resourceId, feedback);
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit feedback');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the resource in cache with new feedback
      queryClient.setQueryData(
        resourcesQueryKeys.resource(variables.resourceId),
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            user_feedback: data?.feedback,
          };
        }
      );

      // Invalidate resource lists to refresh ratings
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.resources() });
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.topRated() });

      toast.success('Thank you for your feedback!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });
}

// Hook for bookmarking resources
export function useResourceBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.toggleBookmark(resourceId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle bookmark');
      }
      return { resourceId, bookmarked: response.data?.bookmarked };
    },
    onSuccess: (data) => {
      // Invalidate bookmarks query to refresh the list
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.bookmarks() });

      const message = data.bookmarked ? 'Resource bookmarked!' : 'Bookmark removed';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bookmark');
    },
  });
}

// Combined hook for resources dashboard data
export function useResourcesDashboard() {
  const categoriesQuery = useResourceCategories();
  const featuredQuery = useFeaturedResources(3);
  const popularQuery = usePopularResources(5);
  const topRatedQuery = useTopRatedResources(5);
  const statsQuery = useResourceStats();

  return {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    topRated: topRatedQuery.data || [],
    stats: statsQuery.data,
    isLoading:
      categoriesQuery.isLoading ||
      featuredQuery.isLoading ||
      popularQuery.isLoading ||
      topRatedQuery.isLoading ||
      statsQuery.isLoading,
    error:
      categoriesQuery.error ||
      featuredQuery.error ||
      popularQuery.error ||
      topRatedQuery.error ||
      statsQuery.error,
    refetch: useCallback(() => {
      categoriesQuery.refetch();
      featuredQuery.refetch();
      popularQuery.refetch();
      topRatedQuery.refetch();
      statsQuery.refetch();
    }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery]),
  };
}

// Hook for resource filtering and sorting
export function useResourceFilters(initialFilters: ResourceFilters = {}) {
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof ResourceFilters, value: any) => {
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

// Hook for resource analytics tracking
export function useResourceAnalytics() {
  const trackResourceView = useCallback((resourceId: number, title: string, type: string) => {
    // Track resource view event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_view', {
        event_category: 'Resources',
        event_label: title,
        value: resourceId,
        custom_parameters: {
          resource_type: type,
        },
      });
    }
  }, []);

  const trackResourceAccess = useCallback(
    (resourceId: number, title: string, type: string, action: string) => {
      // Track resource access/download event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'resource_access', {
          event_category: 'Resources',
          event_label: title,
          value: resourceId,
          custom_parameters: {
            resource_type: type,
            action_type: action,
          },
        });
      }
    },
    []
  );

  const trackResourceRating = useCallback((resourceId: number, title: string, rating: number) => {
    // Track resource rating event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_rating', {
        event_category: 'Resources',
        event_label: title,
        value: resourceId,
        custom_parameters: {
          rating: rating,
        },
      });
    }
  }, []);

  const trackResourceBookmark = useCallback(
    (resourceId: number, title: string, bookmarked: boolean) => {
      // Track resource bookmark event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'resource_bookmark', {
          event_category: 'Resources',
          event_label: title,
          value: resourceId,
          custom_parameters: {
            bookmarked: bookmarked,
          },
        });
      }
    },
    []
  );

  const trackResourceSearch = useCallback((query: string, resultsCount: number) => {
    // Track resource search event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_search', {
        event_category: 'Resources',
        event_label: query,
        value: resultsCount,
      });
    }
  }, []);

  const trackResourceCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
    // Track resource category click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_category_click', {
        event_category: 'Resources',
        event_label: categoryName,
        value: categorySlug,
      });
    }
  }, []);

  return {
    trackResourceView,
    trackResourceAccess,
    trackResourceRating,
    trackResourceBookmark,
    trackResourceSearch,
    trackResourceCategoryClick,
  };
}

// Hook for recent resource searches (local storage)
export function useRecentResourceSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('recent_resource_searches');
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
        localStorage.setItem('recent_resource_searches', JSON.stringify(newSearches));
      } catch (error) {
        console.error('Failed to save recent resource searches:', error);
      }

      return newSearches;
    });
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((search) => search !== query);

      try {
        localStorage.setItem('recent_resource_searches', JSON.stringify(newSearches));
      } catch (error) {
        console.error('Failed to update recent resource searches:', error);
      }

      return newSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recent_resource_searches');
    } catch (error) {
      console.error('Failed to clear recent resource searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

// Utility hook for resource formatting
export function useResourceUtils() {
  const getTypeIcon = useCallback((type: string) => {
    return resourcesService.getTypeIcon(type);
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    return resourcesService.getTypeLabel(type);
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    return resourcesService.getDifficultyColor(difficulty);
  }, []);

  const getDifficultyLabel = useCallback((difficulty: string) => {
    return resourcesService.getDifficultyLabel(difficulty);
  }, []);

  const formatDuration = useCallback((duration?: string) => {
    return resourcesService.formatDuration(duration);
  }, []);

  const formatCount = useCallback((count: number) => {
    return resourcesService.formatCount(count);
  }, []);

  const calculateRatingPercentage = useCallback((rating: number) => {
    return resourcesService.calculateRatingPercentage(rating);
  }, []);

  const isValidResourceUrl = useCallback((url: string) => {
    return resourcesService.isValidResourceUrl(url);
  }, []);

  return {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    getDifficultyLabel,
    formatDuration,
    formatCount,
    calculateRatingPercentage,
    isValidResourceUrl,
  };
}
