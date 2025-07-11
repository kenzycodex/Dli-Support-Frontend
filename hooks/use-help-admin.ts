// hooks/use-help-admin.ts - Admin-specific hooks for help management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  helpService,
  type FAQ,
  type HelpCategory,
  type FAQFilters,
  type ContentSuggestion,
} from '@/services/help.service';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { helpQueryKeys } from '@/hooks/use-help';

// Admin FAQ Management Hooks
export function useAdminFAQs(filters: FAQFilters = {}) {
  return useQuery({
    queryKey: [...helpQueryKeys.faqs(filters), 'admin'],
    queryFn: async () => {
      const response = await helpService.getFAQs({ ...filters, include_drafts: true });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch admin FAQs');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for admin data
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminFAQCRUD() {
  const queryClient = useQueryClient();

  const createFAQ = useMutation({
    mutationFn: async (faqData: Partial<FAQ>) => {
      const response = await helpService.createFAQ(faqData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create FAQ');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all FAQ-related queries
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });

      toast.success('FAQ created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create FAQ');
    },
  });

  const updateFAQ = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FAQ> }) => {
      const response = await helpService.updateFAQ(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update FAQ');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific FAQ in cache
      queryClient.setQueryData(helpQueryKeys.faq(variables.id), (oldData: any) => ({
        ...oldData,
        faq: { ...oldData?.faq, ...data?.faq },
      }));

      // Invalidate related queries - FIXED: removed duplicate invalidateQueries call
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() });

      toast.success('FAQ updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update FAQ');
    },
  });

  const deleteFAQ = useMutation({
    mutationFn: async (id: number) => {
      const response = await helpService.deleteFAQ(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete FAQ');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: helpQueryKeys.faq(variables) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });

      toast.success('FAQ deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete FAQ');
    },
  });

  const bulkActionFAQs = useMutation({
    mutationFn: async ({ faqIds, action }: { faqIds: number[]; action: string }) => {
      const response = await helpService.bulkActionFAQs(faqIds, action);
      if (!response.success) {
        throw new Error(response.message || 'Failed to perform bulk action');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all FAQ queries since multiple items changed
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.stats() });

      toast.success(`Bulk action "${variables.action}" completed successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to perform bulk action');
    },
  });

  return {
    createFAQ,
    updateFAQ,
    deleteFAQ,
    bulkActionFAQs,
  };
}

// Admin Category Management Hooks
export function useAdminCategories() {
  return useQuery({
    queryKey: [...helpQueryKeys.categories(), 'admin'],
    queryFn: async () => {
      const response = await helpService.getCategories({ include_inactive: true });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch admin categories');
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for categories
    gcTime: 15 * 60 * 1000,
  });
}

export function useAdminCategoryCRUD() {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (categoryData: Partial<HelpCategory>) => {
      const response = await helpService.createCategory(categoryData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });
      toast.success('Category created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HelpCategory> }) => {
      const response = await helpService.updateCategory(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      toast.success('Category updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const response = await helpService.deleteCategory(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const reorderCategories = useMutation({
    mutationFn: async (categoryOrders: Array<{ id: number; sort_order: number }>) => {
      const response = await helpService.reorderCategories(categoryOrders);
      if (!response.success) {
        throw new Error(response.message || 'Failed to reorder categories');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.categories() });
      toast.success('Categories reordered successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder categories');
    },
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
}

// Admin Analytics Hooks
export function useAdminHelpAnalytics(timeRange: string = '30d') {
  return useQuery({
    queryKey: ['admin-help-analytics', timeRange],
    queryFn: async () => {
      const response = await helpService.getHelpAnalytics({ timeRange });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for analytics
    gcTime: 15 * 60 * 1000,
  });
}

// Content Suggestions Management
export function useAdminContentSuggestions() {
  return useQuery({
    queryKey: ['admin-content-suggestions'],
    queryFn: async () => {
      const response = await helpService.getContentSuggestions();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch content suggestions');
      }
      return response.data?.suggestions || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export function useAdminSuggestionActions() {
  const queryClient = useQueryClient();

  const approveSuggestion = useMutation({
    mutationFn: async (suggestionId: number) => {
      const response = await helpService.approveSuggestion(suggestionId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve suggestion');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-suggestions'] });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      toast.success('Suggestion approved and published!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve suggestion');
    },
  });

  const rejectSuggestion = useMutation({
    mutationFn: async ({ suggestionId, feedback }: { suggestionId: number; feedback?: string }) => {
      const response = await helpService.rejectSuggestion(suggestionId, feedback);
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject suggestion');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-suggestions'] });
      toast.success('Suggestion rejected with feedback sent to counselor');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject suggestion');
    },
  });

  const requestRevision = useMutation({
    mutationFn: async ({ suggestionId, feedback }: { suggestionId: number; feedback: string }) => {
      const response = await helpService.requestSuggestionRevision(suggestionId, feedback);
      if (!response.success) {
        throw new Error(response.message || 'Failed to request revision');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-suggestions'] });
      toast.success('Revision requested with feedback sent to counselor');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request revision');
    },
  });

  return {
    approveSuggestion,
    rejectSuggestion,
    requestRevision,
  };
}

// Enhanced help dashboard hook with better caching
export function useEnhancedHelpDashboard() {
  const { user } = useAuth();

  // Use individual queries with proper stale times
  const categoriesQuery = useQuery({
    queryKey: helpQueryKeys.categories(),
    queryFn: async () => {
      const response = await helpService.getCategories();
      if (!response.success) throw new Error(response.message);
      return response.data?.categories || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for categories
    gcTime: 30 * 60 * 1000,
  });

  const featuredQuery = useQuery({
    queryKey: helpQueryKeys.featured(),
    queryFn: async () => {
      const response = await helpService.getFeaturedFAQs(3);
      if (!response.success) throw new Error(response.message);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for featured
    gcTime: 15 * 60 * 1000,
  });

  const popularQuery = useQuery({
    queryKey: helpQueryKeys.popular(),
    queryFn: async () => {
      const response = await helpService.getPopularFAQs(5);
      if (!response.success) throw new Error(response.message);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for popular
    gcTime: 15 * 60 * 1000,
  });

  const statsQuery = useQuery({
    queryKey: helpQueryKeys.stats(),
    queryFn: async () => {
      const response = await helpService.getStats();
      if (!response.success) throw new Error(response.message);
      return response.data?.stats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for stats
    gcTime: 30 * 60 * 1000,
  });

  const canSuggestContent = useCallback(() => {
    return user ? helpService.canSuggestContent(user.role) : false;
  }, [user]);

  return {
    categories: categoriesQuery.data || [],
    featured: featuredQuery.data || [],
    popular: popularQuery.data || [],
    stats: statsQuery.data,
    canSuggestContent: canSuggestContent(),
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

// Real-time notifications for admin
export function useAdminHelpNotifications() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['admin-help-notifications'],
    queryFn: async () => {
      const response = await helpService.getAdminNotifications();
      if (!response.success) throw new Error(response.message);
      return response.data?.notifications || [];
    },
    staleTime: 30 * 1000, // 30 seconds for notifications
    gcTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
  });
}

// Enhanced FAQ feedback with optimistic updates
export function useEnhancedFAQFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      faqId,
      feedback,
    }: {
      faqId: number;
      feedback: { is_helpful: boolean; comment?: string };
    }) => {
      const response = await helpService.provideFeedback(faqId, feedback);
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit feedback');
      }
      return response.data;
    },
    onMutate: async ({ faqId, feedback }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: helpQueryKeys.faq(faqId) });

      // Snapshot previous value
      const previousFAQ = queryClient.getQueryData(helpQueryKeys.faq(faqId));

      // Optimistically update
      queryClient.setQueryData(helpQueryKeys.faq(faqId), (old: any) => {
        if (!old) return old;

        const updatedFAQ = { ...old.faq };
        if (feedback.is_helpful) {
          updatedFAQ.helpful_count = (updatedFAQ.helpful_count || 0) + 1;
        } else {
          updatedFAQ.not_helpful_count = (updatedFAQ.not_helpful_count || 0) + 1;
        }

        return {
          ...old,
          faq: updatedFAQ,
        };
      });

      return { previousFAQ };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFAQ) {
        queryClient.setQueryData(helpQueryKeys.faq(variables.faqId), context.previousFAQ);
      }
      toast.error('Failed to submit feedback');
    },
    onSuccess: (data, variables) => {
      // Update with actual server data
      queryClient.setQueryData(helpQueryKeys.faq(variables.faqId), (old: any) => ({
        ...old,
        user_feedback: data?.feedback,
      }));

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.faqs() });
      queryClient.invalidateQueries({ queryKey: helpQueryKeys.popular() });

      toast.success('Thank you for your feedback!');
    },
  });
}

// Counselor-specific hooks
export function useCounselorSuggestions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['counselor-suggestions', user?.id],
    queryFn: async () => {
      const response = await helpService.getCounselorSuggestions();
      if (!response.success) throw new Error(response.message);
      return response.data?.suggestions || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!user && ['counselor', 'admin'].includes(user.role),
  });
}

export function useCounselorInsights() {
  return useQuery({
    queryKey: ['counselor-insights'],
    queryFn: async () => {
      const response = await helpService.getCounselorInsights();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for insights
    gcTime: 30 * 60 * 1000,
  });
}

// Performance monitoring hook
export function useHelpSystemHealth() {
  return useQuery({
    queryKey: ['help-system-health'],
    queryFn: async () => {
      const response = await helpService.getSystemHealth();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });
}

// Enhanced hooks for new service methods
export function useAdvancedFAQSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: {
      query: string;
      filters?: any;
      include_suggestions?: boolean;
      limit?: number;
    }) => {
      const response = await helpService.advancedSearch(options);
      if (!response.success) {
        throw new Error(response.message || 'Advanced search failed');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Cache search results
      queryClient.setQueryData(['advanced-search', variables.query, variables.filters], data);
    },
  });
}

export function useContentValidation() {
  return useMutation({
    mutationFn: async (faqData: Partial<FAQ>) => {
      const response = await helpService.validateFAQContent(faqData);
      if (!response.success) {
        throw new Error(response.message || 'Content validation failed');
      }
      return response.data;
    },
  });
}

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: async (question: string) => {
      const response = await helpService.checkDuplicateContent(question);
      if (!response.success) {
        throw new Error(response.message || 'Duplicate check failed');
      }
      return response.data;
    },
  });
}

export function useCacheManagement() {
  const queryClient = useQueryClient();

  const clearCache = useMutation({
    mutationFn: async () => {
      const response = await helpService.clearHelpCache();
      if (!response.success) {
        throw new Error(response.message || 'Failed to clear cache');
      }
      return response.data;
    },
    onSuccess: () => {
      // Clear React Query cache as well
      queryClient.clear();
      toast.success('Help cache cleared successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear cache');
    },
  });

  const warmCache = useMutation({
    mutationFn: async () => {
      const response = await helpService.warmCache();
      if (!response.success) {
        throw new Error(response.message || 'Failed to warm cache');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Help cache warmed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to warm cache');
    },
  });

  const getCacheStats = useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const response = await helpService.getCacheStats();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  return {
    clearCache,
    warmCache,
    cacheStats: getCacheStats.data,
    isCacheStatsLoading: getCacheStats.isLoading,
  };
}

// Export enhanced versions of existing hooks
export * from '@/hooks/use-help';