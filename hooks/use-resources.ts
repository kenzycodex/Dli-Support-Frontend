// hooks/use-resources.ts (OPTIMIZED - Ultra-stable caching like help hooks)
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
  options: () => [...resourcesQueryKeys.all, 'options'] as const,
  featured: (limit?: number) => [...resourcesQueryKeys.all, 'featured', limit] as const,
  popular: (limit?: number) => [...resourcesQueryKeys.all, 'popular', limit] as const,
  topRated: (limit?: number) => [...resourcesQueryKeys.all, 'top-rated', limit] as const,
  search: (query: string, filters?: Omit<ResourceFilters, 'search'>) =>
    [...resourcesQueryKeys.all, 'search', query, JSON.stringify(filters)] as const,
};

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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource categories');
      }
      return response.data?.categories || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - ultra stable
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
}

// Ultra-stable resources hook with smart cache management
export function useResources(filters: ResourceFilters = {}, options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.resources(filters, user?.role),
    queryFn: async () => {
      const response = await resourcesService.getResources({
        ...filters,
        userRole: user?.role,
        forceRefresh: false
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resources');
      }
      return response.data;
    },
    staleTime: 12 * 60 * 1000, // 12 minutes - longer for stability
    gcTime: 25 * 60 * 1000, // 25 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
}

// Enhanced hook for infinite scroll resources with stable caching
export function useInfiniteResources(filters: ResourceFilters = {}) {
  const { user } = useAuth()

  return useInfiniteQuery({
    queryKey: resourcesQueryKeys.resources(filters, user?.role),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await resourcesService.getResources({ 
        ...filters, 
        page: pageParam,
        userRole: user?.role,
        forceRefresh: false
      });
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
    staleTime: 10 * 60 * 1000, // 10 minutes for paginated data
    gcTime: 20 * 60 * 1000, // 20 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource');
      }
      return response.data;
    },
    enabled: enabled && !!id && !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Ultra-stable hook for user bookmarks
export function useResourceBookmarks(page: number = 1, perPage: number = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: resourcesQueryKeys.bookmarks(page, user?.role),
    queryFn: async () => {
      const response = await resourcesService.getBookmarks(page, perPage, {
        userRole: user?.role,
        forceRefresh: false
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bookmarks');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - bookmarks can change
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch resource statistics');
      }
      return response.data?.stats;
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - very long for stats
    gcTime: 40 * 60 * 1000, // 40 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Ultra-stable hook for resource options
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
    staleTime: 30 * 60 * 1000, // 30 minutes - options rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Ultra-stable hook for featured resources
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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured resources');
      }
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Ultra-stable hook for popular resources
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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch popular resources');
      }
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Ultra-stable hook for top rated resources
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
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch top rated resources');
      }
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Enhanced hook for resource search with debouncing and smart caching
export function useResourceSearch(
  query: string,
  filters: Omit<ResourceFilters, 'search'> = {},
  options: {
    enabled?: boolean
  } = {}
) {
  const { user } = useAuth()
  const { enabled = true } = options

  return useQuery({
    queryKey: resourcesQueryKeys.search(query, filters),
    queryFn: async () => {
      if (!query.trim()) return null;
      const response = await resourcesService.searchResources(query, {
        ...filters,
        userRole: user?.role,
        forceRefresh: false
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to search resources');
      }
      return response.data;
    },
    enabled: enabled && query.length >= 2 && !!user, // Only search for 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });
}

// Enhanced hook for accessing resources (tracking usage)
export function useResourceAccess() {
  const { user } = useAuth()
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.accessResource(resourceId, {
        userRole: user?.role
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to access resource');
      }
      return response.data;
    },
    onSuccess: (data, resourceId) => {
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

        // Selectively invalidate only necessary queries
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.popular() });
        queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.stats() });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to access resource');
    },
  });
}

// Enhanced hook for resource feedback/rating
export function useResourceFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      feedback,
    }: {
      resourceId: number;
      feedback: { rating: number; comment?: string; is_recommended?: boolean };
    }) => {
      const response = await resourcesService.provideFeedback(resourceId, feedback, {
        userRole: user?.role
      });
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

      // Selectively invalidate only necessary queries
      queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.topRated() });

      toast.success('Thank you for your feedback!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });
}

// Enhanced hook for bookmarking resources
export function useResourceBookmark() {
  const { user } = useAuth()
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await resourcesService.toggleBookmark(resourceId, {
        userRole: user?.role
      });
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

// OPTIMIZED DASHBOARD HOOK - NO CONSTANT RELOADING
export function useResourcesDashboard(options: {
  enabled?: boolean
} = {}) {
  const { user } = useAuth()
  const { enabled = true } = options

  const categoriesQuery = useResourceCategories({ enabled });
  const featuredQuery = useFeaturedResources(3, { enabled });
  const popularQuery = usePopularResources(5, { enabled });
  const topRatedQuery = useTopRatedResources(5, { enabled });
  const statsQuery = useResourceStats({ enabled });

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
    categoriesQuery.refetch();
    featuredQuery.refetch();
    popularQuery.refetch();
    topRatedQuery.refetch();
    statsQuery.refetch();
  }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery]);

  // Force refresh with cache clearing - only when explicitly requested
  const forceRefresh = useCallback(async () => {
    // Clear cache first
    resourcesService.clearCache?.();
    
    // Then refetch all data
    await Promise.all([
      categoriesQuery.refetch(),
      featuredQuery.refetch(),
      popularQuery.refetch(),
      topRatedQuery.refetch(),
      statsQuery.refetch()
    ]);
  }, [categoriesQuery, featuredQuery, popularQuery, topRatedQuery, statsQuery]);

  return {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    topRated: topRatedQuery.data || [],
    stats: statsQuery.data,
    isLoading,
    error,
    refetch,
    forceRefresh,
    hasData: !!(categoriesQuery.data || featuredQuery.data || popularQuery.data || topRatedQuery.data),
  };
}

// OPTIMIZED resource filtering with stable state management
export function useResourceFilters(initialFilters: ResourceFilters = {}) {
  const [filters, setFilters] = useState<ResourceFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof ResourceFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when filtering, except when updating page itself
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
    hasActiveFilters: Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    ),
  };
}

// Hook for resource analytics tracking
export function useResourceAnalytics() {
  const trackResourceView = useCallback((resourceId: number, title: string, type: string) => {
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
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resource_search', {
        event_category: 'Resources',
        event_label: query,
        value: resultsCount,
      });
    }
  }, []);

  const trackResourceCategoryClick = useCallback((categorySlug: string, categoryName: string) => {
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

// Hook for recent resource searches with optimized persistence (local storage)
export function useRecentResourceSearches() {
  const { user } = useAuth()
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return [];
    try {
      const stored = localStorage.getItem(`recent_resource_searches_${user.id}`);
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

      if (user?.id) {
        try {
          localStorage.setItem(`recent_resource_searches_${user.id}`, JSON.stringify(newSearches));
        } catch (error) {
          console.error('Failed to save recent resource searches:', error);
        }
      }

      return newSearches;
    });
  }, [user?.id]);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const newSearches = prev.filter((search) => search !== query);

      if (user?.id) {
        try {
          localStorage.setItem(`recent_resource_searches_${user.id}`, JSON.stringify(newSearches));
        } catch (error) {
          console.error('Failed to update recent resource searches:', error);
        }
      }

      return newSearches;
    });
  }, [user?.id]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (user?.id) {
      try {
        localStorage.removeItem(`recent_resource_searches_${user.id}`);
      } catch (error) {
        console.error('Failed to clear recent resource searches:', error);
      }
    }
  }, [user?.id]);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

// Hook for managing resource bookmarks with persistence (local storage)
export function useResourceBookmarkManager() {
  const { user } = useAuth()
  const [localBookmarks, setLocalBookmarks] = useState<number[]>(() => {
    if (typeof window === 'undefined' || !user?.id) return [];
    try {
      const stored = localStorage.getItem(`resource_bookmarks_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleLocalBookmark = useCallback((resourceId: number) => {
    setLocalBookmarks((prev) => {
      const newBookmarks = prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId];

      if (user?.id) {
        try {
          localStorage.setItem(`resource_bookmarks_${user.id}`, JSON.stringify(newBookmarks));
        } catch (error) {
          console.error('Failed to save resource bookmarks:', error);
        }
      }

      return newBookmarks;
    });
  }, [user?.id]);

  const isLocallyBookmarked = useCallback(
    (resourceId: number) => {
      return localBookmarks.includes(resourceId);
    },
    [localBookmarks]
  );

  const clearLocalBookmarks = useCallback(() => {
    setLocalBookmarks([]);
    if (user?.id) {
      try {
        localStorage.removeItem(`resource_bookmarks_${user.id}`);
      } catch (error) {
        console.error('Failed to clear resource bookmarks:', error);
      }
    }
  }, [user?.id]);

  return {
    localBookmarks,
    toggleLocalBookmark,
    isLocallyBookmarked,
    clearLocalBookmarks,
  };
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
    canManage: resourcesService.canManageResources?.(user?.role || '') || user?.role === 'admin',
  }
}

// Utility hook for resource formatting and utils
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

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Safe rating formatters
  const formatRating = useCallback((rating: any): number => {
    return Math.max(0, Math.min(5, Number(rating) || 0));
  }, []);

  const formatRatingDisplay = useCallback((rating: any): string => {
    return formatRating(rating).toFixed(1);
  }, [formatRating]);

  const getCacheStats = useCallback(() => {
    return resourcesService.getCacheStats?.() || {
      cacheSize: 0,
      totalMemory: 0,
      hitRate: 0
    };
  }, []);

  const getAvailableTypes = useCallback(() => {
    return resourcesService.getAvailableTypes();
  }, []);

  const getAvailableDifficulties = useCallback(() => {
    return resourcesService.getAvailableDifficulties();
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
    formatTimeAgo,
    formatRating,
    formatRatingDisplay,
    getCacheStats,
    getAvailableTypes,
    getAvailableDifficulties,
  };
}

// Hook for role-based permissions
export function useResourcePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user) return {
      canView: false,
      canAccess: false,
      canBookmark: false,
      canRate: false,
      canSuggest: false,
      canManage: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canPublish: false,
      canFeature: false,
      canExport: false,
      canViewAnalytics: false,
    };

    const isStudent = user.role === 'student';
    const isCounselor = user.role === 'counselor';
    const isAdvisor = user.role === 'advisor';
    const isAdmin = user.role === 'admin';
    const isStaff = isCounselor || isAdvisor || isAdmin;

    return {
      canView: true, // All authenticated users can view published resources
      canAccess: true, // All authenticated users can access published resources
      canBookmark: true, // All authenticated users can bookmark resources
      canRate: true, // All authenticated users can rate resources
      canSuggest: isStaff, // Only staff can suggest new resources
      canManage: isAdmin, // Only admins can manage resources
      canCreate: isAdmin, // Only admins can create resources
      canEdit: isAdmin, // Only admins can edit resources
      canDelete: isAdmin, // Only admins can delete resources
      canPublish: isAdmin, // Only admins can publish/unpublish resources
      canFeature: isAdmin, // Only admins can feature resources
      canExport: isAdmin, // Only admins can export resource data
      canViewAnalytics: isStaff, // Staff can view basic analytics, admins get full analytics
      canBulkActions: isAdmin, // Only admins can perform bulk actions
      canManageCategories: isAdmin, // Only admins can manage categories
      role: user.role,
      specializations: isCounselor ? ['mental-health', 'crisis', 'wellness'] : 
                      isAdvisor ? ['academic', 'career', 'general'] : 
                      isAdmin ? ['all'] : [],
    };
  }, [user]);

  return permissions;
}

// Hook for resource caching and performance optimization
export function useResourceCache() {
  const queryClient = useQueryClient();

  const prefetchResource = useCallback(async (id: number) => {
    await queryClient.prefetchQuery({
      queryKey: resourcesQueryKeys.resource(id),
      queryFn: async () => {
        const response = await resourcesService.getResource(id);
        if (!response.success) {
          throw new Error(response.message || 'Failed to prefetch resource');
        }
        return response.data;
      },
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  }, [queryClient]);

  const prefetchResources = useCallback(async (filters: ResourceFilters = {}) => {
    await queryClient.prefetchQuery({
      queryKey: resourcesQueryKeys.resources(filters),
      queryFn: async () => {
        const response = await resourcesService.getResources(filters);
        if (!response.success) {
          throw new Error(response.message || 'Failed to prefetch resources');
        }
        return response.data;
      },
      staleTime: 12 * 60 * 1000, // 12 minutes
    });
  }, [queryClient]);

  const invalidateAllResources = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: resourcesQueryKeys.all });
  }, [queryClient]);

  const clearResourceCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: resourcesQueryKeys.all });
    resourcesService.clearCache?.();
  }, [queryClient]);

  const getCacheInfo = useCallback(() => {
    const queries = queryClient.getQueriesData({ queryKey: resourcesQueryKeys.all });
    return {
      totalQueries: queries.length,
      cacheSize: queries.reduce((size, [, data]) => {
        return size + (data ? JSON.stringify(data).length : 0);
      }, 0),
      lastUpdated: queries.length > 0 ? new Date().toISOString() : null,
    };
  }, [queryClient]);

  return {
    prefetchResource,
    prefetchResources,
    invalidateAllResources,
    clearResourceCache,
    getCacheInfo,
  };
}