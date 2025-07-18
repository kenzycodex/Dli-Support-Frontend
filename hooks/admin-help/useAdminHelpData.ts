// hooks/admin-help/useAdminHelpData.ts - CORRECTED: Simplified like ticket hooks

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useHelpStore, {
  useHelpSelectors,
  useHelpActions,
  useHelpLoading,
  useHelpErrors,
  useHelpFilters,
  useHelpStats,
  type HelpFAQ,
  type HelpSuggestion,
} from '@/stores/help-store';
import type { FAQ, HelpCategory } from '@/services/help.service';
import { useAdminHelpActions } from './useAdminHelpActions';

// Simple admin stats interface
interface AdminStats {
  total_faqs: number;
  published_faqs: number;
  draft_faqs: number;
  featured_faqs: number;
  categories_count: number;
  active_categories: number;
  suggested_faqs: number;
}

// SIMPLIFIED: Main admin help data hook
export function useAdminHelpData() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Simple role check
  const isAdmin = user?.role === 'admin';

  // Get store data - simple selectors
  const {
    faqs,
    categories,
    suggestions,
    publishedFAQs,
    draftFAQs,
    featuredFAQs,
    activeCategories,
  } = useHelpSelectors();

  const actions = useHelpActions();
  const loading = useHelpLoading();
  const errors = useHelpErrors();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useHelpFilters();
  const { stats } = useHelpStats();

  // SIMPLIFIED: Derived data - no complex calculations
  const suggestedFAQs = useMemo(
    () => faqs.filter((faq) => !faq.is_published && faq.created_by && faq.created_by !== user?.id),
    [faqs, user?.id]
  );

  // SIMPLIFIED: Admin stats calculation
  const adminStats: AdminStats = useMemo(
    () => ({
      total_faqs: faqs.length,
      published_faqs: publishedFAQs.length,
      draft_faqs: draftFAQs.length,
      featured_faqs: featuredFAQs.length,
      categories_count: categories.length,
      active_categories: activeCategories.length,
      suggested_faqs: suggestedFAQs.length,
    }),
    [
      faqs.length,
      publishedFAQs.length,
      draftFAQs.length,
      featuredFAQs.length,
      categories.length,
      activeCategories.length,
      suggestedFAQs.length,
    ]
  );

  // SIMPLIFIED: Loading states
  const isLoading = loading.faqs || loading.categories || loading.stats;
  const hasError = !!(errors.faqs || errors.categories || errors.stats);
  const errorMessage = errors.faqs || errors.categories || errors.stats;

  // SIMPLIFIED: Enhanced actions hook
  const enhancedActions = useAdminHelpActions({
    actions: {
      createFAQ: actions.createFAQ,
      updateFAQ: actions.updateFAQ,
      deleteFAQ: actions.deleteFAQ,
      togglePublishFAQ: actions.togglePublishFAQ,
      toggleFeatureFAQ: actions.toggleFeatureFAQ,
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,
      approveSuggestion: actions.approveSuggestion,
      rejectSuggestion: actions.rejectSuggestion,
    },
  });

  // SIMPLIFIED: Initialization logic - like ticket store
  const initialize = useCallback(
    async (force = false) => {
      if (!isAdmin) {
        console.log('🎯 AdminHelpData: User is not admin, skipping initialization');
        return;
      }

      if (isInitialized && !force) {
        console.log('🎯 AdminHelpData: Already initialized, skipping');
        return;
      }

      try {
        console.log('🎯 AdminHelpData: Initializing help data');

        // Run all fetches in parallel like ticket store
        await Promise.all([actions.fetchFAQs(), actions.fetchCategories(), actions.fetchStats()]);

        setIsInitialized(true);
        console.log('✅ AdminHelpData: Initialization completed');
      } catch (error) {
        console.error('❌ AdminHelpData: Initialization failed:', error);
        setIsInitialized(false);
      }
    },
    [isAdmin, isInitialized, actions]
  );

  // SIMPLIFIED: Auto-initialize on mount
  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;

    const initializeData = async () => {
      if (mounted && !isInitialized) {
        await initialize();
      }
    };

    // Small delay to prevent rapid initialization calls
    const timeoutId = setTimeout(initializeData, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isAdmin, isInitialized, initialize]);

  // SIMPLIFIED: Refresh function
  const refresh = useCallback(async () => {
    console.log('🎯 AdminHelpData: Refreshing all data');
    await actions.refreshAll();
  }, [actions]);

  // SIMPLIFIED: Clear all errors
  const clearAllErrors = useCallback(() => {
    actions.clearError('faqs');
    actions.clearError('categories');
    actions.clearError('stats');
    actions.clearError('create');
    actions.clearError('update');
    actions.clearError('delete');
    actions.clearError('approve');
    actions.clearError('reject');
  }, [actions]);

  // SIMPLIFIED: Get FAQ by ID
  const getFAQById = useCallback(
    (id: number): HelpFAQ | null => {
      return faqs.find((faq) => faq.id === id) || null;
    },
    [faqs]
  );

  // SIMPLIFIED: Get category by ID
  const getCategoryById = useCallback(
    (id: number): HelpCategory | null => {
      return categories.find((category) => category.id === id) || null;
    },
    [categories]
  );

  // SIMPLIFIED: Filter helpers
  const filterHelpers = useMemo(
    () => ({
      filterByCategory: (categoryId: string) => {
        setFilters({ category: categoryId }, true);
      },
      filterByStatus: (status: 'all' | 'published' | 'unpublished' | 'featured') => {
        if (status === 'featured') {
          setFilters({ status: undefined, featured: true }, true);
        } else {
          setFilters({ status, featured: undefined }, true);
        }
      },
      searchFAQs: (search: string) => {
        setFilters({ search }, true);
      },
      resetFilters: () => {
        clearFilters(true);
      },
    }),
    [setFilters, clearFilters]
  );

  // SIMPLIFIED: Return object - no over-engineering
  return {
    // User data
    user,
    isAdmin,

    // Store data - direct access
    faqs,
    categories,
    suggestions,
    suggestedFAQs,
    publishedFAQs,
    draftFAQs,
    featuredFAQs,
    activeCategories,

    // Stats
    adminStats,
    stats,

    // State
    loading,
    errors,
    isLoading,
    hasError,
    errorMessage,
    isInitialized,

    // Filters
    filters,
    hasActiveFilters,

    // Core actions - direct from store
    actions: {
      // Data fetching
      fetchFAQs: actions.fetchFAQs,
      fetchCategories: actions.fetchCategories,
      fetchStats: actions.fetchStats,
      refreshAll: actions.refreshAll,

      // FAQ CRUD
      createFAQ: actions.createFAQ,
      updateFAQ: actions.updateFAQ,
      deleteFAQ: actions.deleteFAQ,
      togglePublishFAQ: actions.togglePublishFAQ,
      toggleFeatureFAQ: actions.toggleFeatureFAQ,

      // Category CRUD
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,

      // Suggestion management
      approveSuggestion: actions.approveSuggestion,
      rejectSuggestion: actions.rejectSuggestion,

      // Filter management
      setFilters,
      clearFilters,

      // UI state
      setCurrentFAQ: actions.setCurrentFAQ,
      selectFAQ: actions.selectFAQ,
      deselectFAQ: actions.deselectFAQ,
      clearSelection: actions.clearSelection,

      // Error handling
      clearError: actions.clearError,
      clearAllErrors,

      // Cache management
      invalidateCache: actions.invalidateCache,
      clearCache: actions.clearCache,
    },

    // Enhanced actions from hook
    enhancedActions,

    // Helper functions
    helpers: {
      ...filterHelpers,
      getFAQById,
      getCategoryById,
      initialize,
      refresh,
    },

    // Quick access to specific loading states
    loadingStates: {
      isFetching: loading.faqs || loading.categories,
      isCreating: loading.create,
      isUpdating: loading.update,
      isDeleting: loading.delete,
      isApproving: loading.approve,
      isRejecting: loading.reject,
      isFetchingStats: loading.stats,
    },

    // Quick access to specific error states
    errorStates: {
      fetchError: errors.faqs || errors.categories,
      createError: errors.create,
      updateError: errors.update,
      deleteError: errors.delete,
      approveError: errors.approve,
      rejectError: errors.reject,
      statsError: errors.stats,
    },
  };
}

// SIMPLIFIED: Additional utility hooks

export function useAdminHelpDataStatus() {
  const { isLoading, hasError, errorMessage, isInitialized } = useAdminHelpData();

  return {
    isLoading,
    hasError,
    errorMessage,
    isInitialized,
    isReady: isInitialized && !isLoading && !hasError,
  };
}

export function useAdminHelpQuickActions() {
  const { actions, enhancedActions } = useAdminHelpData();

  return {
    // Quick FAQ actions
    quickCreateFAQ: enhancedActions.handleCreateFAQ,
    quickUpdateFAQ: enhancedActions.handleUpdateFAQ,
    quickDeleteFAQ: enhancedActions.handleDeleteFAQ,
    quickTogglePublish: enhancedActions.handleTogglePublish,
    quickToggleFeature: enhancedActions.handleToggleFeature,

    // Quick category actions
    quickCreateCategory: enhancedActions.handleCreateCategory,
    quickUpdateCategory: enhancedActions.handleUpdateCategory,
    quickDeleteCategory: enhancedActions.handleDeleteCategory,

    // Quick suggestion actions
    quickApproveSuggestion: enhancedActions.handleApproveSuggestion,
    quickRejectSuggestion: enhancedActions.handleRejectSuggestion,

    // Bulk actions
    bulkPublish: enhancedActions.handleBulkPublish,
    bulkDelete: enhancedActions.handleBulkDelete,
    bulkApproveSuggestions: enhancedActions.handleBulkApproveSuggestions,
    bulkRejectSuggestions: enhancedActions.handleBulkRejectSuggestions,

    // Refresh action
    refreshAll: actions.refreshAll,
  };
}

export function useAdminHelpSearch() {
  const { faqs, suggestions, filters, helpers } = useAdminHelpData();

  const searchResults = useMemo(() => {
    if (!filters.search) return faqs;

    const searchTerm = filters.search.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm) ||
        faq.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }, [faqs, filters.search]);

  const suggestionSearchResults = useMemo(() => {
    if (!filters.search) return suggestions;

    const searchTerm = filters.search.toLowerCase();
    return suggestions.filter(
      (suggestion) =>
        suggestion.question.toLowerCase().includes(searchTerm) ||
        suggestion.answer.toLowerCase().includes(searchTerm)
    );
  }, [suggestions, filters.search]);

  return {
    searchTerm: filters.search || '',
    searchResults,
    suggestionSearchResults,
    hasSearchResults: searchResults.length > 0,
    setSearch: helpers.searchFAQs,
    clearSearch: () => helpers.searchFAQs(''),
  };
}

export function useAdminHelpPagination() {
  const { filters, actions } = useAdminHelpData();

  return {
    currentPage: filters.page || 1,
    perPage: filters.per_page || 20,
    goToPage: (page: number) => actions.setFilters({ page }, true),
    nextPage: () => {
      const currentPage = filters.page || 1;
      actions.setFilters({ page: currentPage + 1 }, true);
    },
    prevPage: () => {
      const currentPage = filters.page || 1;
      if (currentPage > 1) {
        actions.setFilters({ page: currentPage - 1 }, true);
      }
    },
    setPerPage: (perPage: number) => actions.setFilters({ per_page: perPage, page: 1 }, true),
  };
}

// Export the main hook as default
export default useAdminHelpData;
