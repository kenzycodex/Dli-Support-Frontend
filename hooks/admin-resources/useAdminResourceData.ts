// hooks/admin-resources/useAdminResourceData.ts - COMPLETE: Following help store pattern

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useResourcesStore, {
  useResourcesSelectors,
  useResourcesActions,
  useResourcesLoading,
  useResourcesErrors,
  useResourcesFilters,
  useResourcesStats,
  type ResourceItem,
} from '@/stores/resources-store';
import type { Resource, ResourceCategory } from '@/services/resources.service';
import { useAdminResourceActions } from './useAdminResourceActions';

// Simple admin stats interface
interface AdminResourceStats {
  total_resources: number;
  published_resources: number;
  draft_resources: number;
  featured_resources: number;
  categories_count: number;
  active_categories: number;
  total_views: number;
  total_downloads: number;
  average_rating: number;
}

// SIMPLIFIED: Main admin resource data hook
export function useAdminResourceData() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Simple role check
  const isAdmin = user?.role === 'admin';

  // Get store data - simple selectors
  const {
    resources,
    categories,
    bookmarks,
    publishedResources,
    draftResources,
    featuredResources,
    activeCategories,
  } = useResourcesSelectors();

  const actions = useResourcesActions();
  const loading = useResourcesLoading();
  const errors = useResourcesErrors();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useResourcesFilters();
  const { stats } = useResourcesStats();

  // SIMPLIFIED: Admin stats calculation
  const adminStats: AdminResourceStats = useMemo(
    () => ({
      total_resources: resources.length,
      published_resources: publishedResources.length,
      draft_resources: draftResources.length,
      featured_resources: featuredResources.length,
      categories_count: categories.length,
      active_categories: activeCategories.length,
      total_views: stats?.total_views || 0,
      total_downloads: stats?.total_downloads || 0,
      average_rating: stats?.average_rating || 0,
    }),
    [
      resources.length,
      publishedResources.length,
      draftResources.length,
      featuredResources.length,
      categories.length,
      activeCategories.length,
      stats?.total_views,
      stats?.total_downloads,
      stats?.average_rating,
    ]
  );

  // SIMPLIFIED: Loading states
  const isLoading = loading.resources || loading.categories || loading.stats;
  const hasError = !!(errors.resources || errors.categories || errors.stats);
  const errorMessage = errors.resources || errors.categories || errors.stats;

  // SIMPLIFIED: Enhanced actions hook
  const enhancedActions = useAdminResourceActions({
    actions: {
      createResource: actions.createResource,
      updateResource: actions.updateResource,
      deleteResource: actions.deleteResource,
      togglePublishResource: actions.togglePublishResource,
      toggleFeatureResource: actions.toggleFeatureResource,
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,
    },
  });

  // SIMPLIFIED: Initialization logic - like help store
  const initialize = useCallback(
    async (force = false) => {
      if (!isAdmin) {
        console.log('🎯 AdminResourceData: User is not admin, skipping initialization');
        return;
      }

      if (isInitialized && !force) {
        console.log('🎯 AdminResourceData: Already initialized, skipping');
        return;
      }

      try {
        console.log('🎯 AdminResourceData: Initializing resource data');

        // Run all fetches in parallel like help store
        await Promise.all([
          actions.fetchResources(),
          actions.fetchCategories(),
          actions.fetchStats()
        ]);

        setIsInitialized(true);
        console.log('✅ AdminResourceData: Initialization completed');
      } catch (error) {
        console.error('❌ AdminResourceData: Initialization failed:', error);
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
    console.log('🎯 AdminResourceData: Refreshing all data');
    await actions.refreshAll();
  }, [actions]);

  // SIMPLIFIED: Clear all errors
  const clearAllErrors = useCallback(() => {
    actions.clearError('resources');
    actions.clearError('categories');
    actions.clearError('stats');
    actions.clearError('create');
    actions.clearError('update');
    actions.clearError('delete');
    actions.clearError('access');
    actions.clearError('feedback');
    actions.clearError('bookmark');
  }, [actions]);

  // SIMPLIFIED: Get resource by ID
  const getResourceById = useCallback(
    (id: number): ResourceItem | null => {
      return resources.find((resource) => resource.id === id) || null;
    },
    [resources]
  );

  // SIMPLIFIED: Get category by ID
  const getCategoryById = useCallback(
    (id: number): ResourceCategory | null => {
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
      filterByType: (type: string) => {
        setFilters({ type: type as any }, true);
      },
      filterByDifficulty: (difficulty: string) => {
        setFilters({ difficulty: difficulty as any }, true);
      },
      filterByStatus: (status: 'all' | 'published' | 'draft' | 'featured') => {
        if (status === 'featured') {
          setFilters({ featured: true }, true);
        } else if (status === 'published') {
          setFilters({ include_drafts: false, featured: undefined }, true);
        } else if (status === 'draft') {
          setFilters({ include_drafts: true, featured: undefined }, true);
        } else {
          setFilters({ include_drafts: undefined, featured: undefined }, true);
        }
      },
      searchResources: (search: string) => {
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
    resources,
    categories,
    bookmarks,
    publishedResources,
    draftResources,
    featuredResources,
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
      fetchResources: actions.fetchResources,
      fetchCategories: actions.fetchCategories,
      fetchBookmarks: actions.fetchBookmarks,
      fetchStats: actions.fetchStats,
      refreshAll: actions.refreshAll,

      // Resource CRUD
      createResource: actions.createResource,
      updateResource: actions.updateResource,
      deleteResource: actions.deleteResource,
      togglePublishResource: actions.togglePublishResource,
      toggleFeatureResource: actions.toggleFeatureResource,

      // Category CRUD
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,

      // Resource interactions
      accessResource: actions.accessResource,
      provideFeedback: actions.provideFeedback,
      toggleBookmark: actions.toggleBookmark,

      // Filter management
      setFilters,
      clearFilters,

      // UI state
      setCurrentResource: actions.setCurrentResource,
      selectResource: actions.selectResource,
      deselectResource: actions.deselectResource,
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
      getResourceById,
      getCategoryById,
      initialize,
      refresh,
    },

    // Quick access to specific loading states
    loadingStates: {
      isFetching: loading.resources || loading.categories,
      isCreating: loading.create,
      isUpdating: loading.update,
      isDeleting: loading.delete,
      isAccessing: loading.access,
      isFeedback: loading.feedback,
      isBookmarking: loading.bookmark,
      isFetchingStats: loading.stats,
    },

    // Quick access to specific error states
    errorStates: {
      fetchError: errors.resources || errors.categories,
      createError: errors.create,
      updateError: errors.update,
      deleteError: errors.delete,
      accessError: errors.access,
      feedbackError: errors.feedback,
      bookmarkError: errors.bookmark,
      statsError: errors.stats,
    },
  };
}

// SIMPLIFIED: Additional utility hooks

export function useAdminResourceDataStatus() {
  const { isLoading, hasError, errorMessage, isInitialized } = useAdminResourceData();

  return {
    isLoading,
    hasError,
    errorMessage,
    isInitialized,
    isReady: isInitialized && !isLoading && !hasError,
  };
}

export function useAdminResourceQuickActions() {
  const { actions, enhancedActions } = useAdminResourceData();

  return {
    // Quick resource actions
    quickCreateResource: enhancedActions.handleCreateResource,
    quickUpdateResource: enhancedActions.handleUpdateResource,
    quickDeleteResource: enhancedActions.handleDeleteResource,
    quickTogglePublish: enhancedActions.handleTogglePublish,
    quickToggleFeature: enhancedActions.handleToggleFeature,

    // Quick category actions
    quickCreateCategory: enhancedActions.handleCreateCategory,
    quickUpdateCategory: enhancedActions.handleUpdateCategory,
    quickDeleteCategory: enhancedActions.handleDeleteCategory,

    // Bulk actions
    bulkPublish: enhancedActions.handleBulkPublish,
    bulkDelete: enhancedActions.handleBulkDelete,
    bulkFeature: enhancedActions.handleBulkFeature,

    // Refresh action
    refreshAll: actions.refreshAll,
  };
}

export function useAdminResourceSearch() {
  const { resources, filters, helpers } = useAdminResourceData();

  const searchResults = useMemo(() => {
    if (!filters.search) return resources;

    const searchTerm = filters.search.toLowerCase();
    return resources.filter(
      (resource) =>
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        resource.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        resource.author_name?.toLowerCase().includes(searchTerm)
    );
  }, [resources, filters.search]);

  return {
    searchTerm: filters.search || '',
    searchResults,
    hasSearchResults: searchResults.length > 0,
    setSearch: helpers.searchResources,
    clearSearch: () => helpers.searchResources(''),
  };
}

export function useAdminResourcePagination() {
  const { filters, actions } = useAdminResourceData();

  return {
    currentPage: filters.page || 1,
    perPage: filters.per_page || 15,
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

export function useAdminResourceAnalytics() {
  const { resources, categories, adminStats } = useAdminResourceData();

  const analytics = useMemo(() => {
    const typeDistribution = resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyDistribution = resources.reduce((acc, resource) => {
      acc[resource.difficulty] = (acc[resource.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = categories.map((category) => ({
      name: category.name,
      count: resources.filter((r) => r.category_id === category.id).length,
      color: category.color,
    }));

    const ratingDistribution = resources.reduce((acc, resource) => {
      const rating = Math.floor(resource.rating);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topPerformers = {
      mostViewed: [...resources]
        .filter((r) => r.view_count > 0)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5),
      mostDownloaded: [...resources]
        .filter((r) => r.download_count > 0)
        .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        .slice(0, 5),
      highestRated: [...resources]
        .filter((r) => r.rating > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5),
    };

    const monthlyTrends = {
      createdThisMonth: resources.filter((r) => {
        const createdDate = new Date(r.created_at);
        const now = new Date();
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        );
      }).length,
      publishedThisMonth: resources.filter((r) => {
        if (!r.published_at) return false;
        const publishedDate = new Date(r.published_at);
        const now = new Date();
        return (
          publishedDate.getMonth() === now.getMonth() &&
          publishedDate.getFullYear() === now.getFullYear()
        );
      }).length,
    };

    return {
      overview: adminStats,
      distributions: {
        byType: typeDistribution,
        byDifficulty: difficultyDistribution,
        byCategory: categoryDistribution,
        byRating: ratingDistribution,
      },
      topPerformers,
      monthlyTrends,
      engagement: {
        totalViews: adminStats.total_views,
        totalDownloads: adminStats.total_downloads,
        averageRating: adminStats.average_rating,
        engagementRate:
          resources.length > 0
            ? ((adminStats.total_views + adminStats.total_downloads) / resources.length).toFixed(1)
            : 0,
      },
    };
  }, [resources, categories, adminStats]);

  return analytics;
}

export function useAdminResourceFilters() {
  const { filters, helpers, categories } = useAdminResourceData();

  const availableTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'article', label: 'Articles' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'exercise', label: 'Exercises' },
    { value: 'tool', label: 'Tools' },
    { value: 'worksheet', label: 'Worksheets' },
  ];

  const availableDifficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const availableCategories = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name,
    })),
  ];

  const availableStatuses = [
    { value: 'all', label: 'All Resources' },
    { value: 'published', label: 'Published Only' },
    { value: 'draft', label: 'Drafts Only' },
    { value: 'featured', label: 'Featured Only' },
  ];

  const availableSortOptions = [
    { value: 'featured', label: 'Featured First' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'downloads', label: 'Most Downloaded' },
  ];

  return {
    filters,
    availableTypes,
    availableDifficulties,
    availableCategories,
    availableStatuses,
    availableSortOptions,
    ...helpers,
  };
}

export function useAdminResourceBulkActions() {
  const { resources, enhancedActions } = useAdminResourceData();
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);

  const selectResource = useCallback((id: number) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((resId) => resId !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedResourceIds(resources.map((r) => r.id));
  }, [resources]);

  const clearSelection = useCallback(() => {
    setSelectedResourceIds([]);
  }, []);

  const selectedResources = useMemo(() => {
    return resources.filter((r) => selectedResourceIds.includes(r.id));
  }, [resources, selectedResourceIds]);

  const bulkActions = {
    publish: useCallback(async () => {
      if (selectedResourceIds.length === 0) return false;
      const result = await enhancedActions.handleBulkPublish(selectedResourceIds);
      if (result) clearSelection();
      return result;
    }, [selectedResourceIds, enhancedActions, clearSelection]),

    delete: useCallback(async () => {
      if (selectedResourceIds.length === 0) return false;
      const result = await enhancedActions.handleBulkDelete(selectedResourceIds);
      if (result) clearSelection();
      return result;
    }, [selectedResourceIds, enhancedActions, clearSelection]),

    feature: useCallback(async () => {
      if (selectedResourceIds.length === 0) return false;
      const result = await enhancedActions.handleBulkFeature(selectedResourceIds);
      if (result) clearSelection();
      return result;
    }, [selectedResourceIds, enhancedActions, clearSelection]),
  };

  return {
    selectedResourceIds,
    selectedResources,
    selectedCount: selectedResourceIds.length,
    selectResource,
    selectAll,
    clearSelection,
    bulkActions,
    hasSelection: selectedResourceIds.length > 0,
    isAllSelected: selectedResourceIds.length === resources.length && resources.length > 0,
  };
}

export function useAdminResourceFormHelpers() {
  const { categories, enhancedActions } = useAdminResourceData();

  const resourceTypes = [
    { value: 'article', label: 'Article', icon: 'FileText' },
    { value: 'video', label: 'Video', icon: 'Video' },
    { value: 'audio', label: 'Audio', icon: 'Headphones' },
    { value: 'exercise', label: 'Exercise', icon: 'Brain' },
    { value: 'tool', label: 'Tool', icon: 'Heart' },
    { value: 'worksheet', label: 'Worksheet', icon: 'Download' },
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', color: 'green' },
    { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
    { value: 'advanced', label: 'Advanced', color: 'red' },
  ];

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
    color: cat.color,
  }));

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }, []);

  const validateURL = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);

  return {
    resourceTypes,
    difficultyLevels,
    categoryOptions,
    generateSlug,
    validateURL,
    formatDuration,
    validation: {
      validateResource: enhancedActions.validateResourceData,
      validateCategory: enhancedActions.validateCategoryData,
    },
    formatting: {
      formatResourceForForm: enhancedActions.formatResourceForForm,
      formatCategoryForForm: enhancedActions.formatCategoryForForm,
    },
  };
}

export function useAdminResourceExport() {
  const { resources, categories, adminStats } = useAdminResourceData();

  const exportData = useCallback(
    (format: 'csv' | 'json' = 'csv', selectedIds?: number[]) => {
      const resourcesToExport = selectedIds
        ? resources.filter((r) => selectedIds.includes(r.id))
        : resources;

      const exportItems = resourcesToExport.map((resource) => {
        const category = categories.find((c) => c.id === resource.category_id);

        return {
          id: resource.id,
          title: resource.title,
          description: resource.description,
          category: category?.name || 'Unknown',
          type: resource.type,
          difficulty: resource.difficulty,
          external_url: resource.external_url,
          download_url: resource.download_url || '',
          author_name: resource.author_name || '',
          rating: resource.rating,
          view_count: resource.view_count,
          download_count: resource.download_count,
          is_published: resource.is_published ? 'Yes' : 'No',
          is_featured: resource.is_featured ? 'Yes' : 'No',
          created_at: new Date(resource.created_at).toLocaleDateString(),
          published_at: resource.published_at
            ? new Date(resource.published_at).toLocaleDateString()
            : '',
          tags: resource.tags?.join(', ') || '',
        };
      });

      const filename = `resources_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = Object.keys(exportItems[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportItems.map((item) =>
            headers.map((header) => `"${item[header as keyof typeof item]}"`).join(',')
          ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            total_count: exportItems.length,
            summary: adminStats,
            resources: exportItems,
          },
          null,
          2
        );

        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      return {
        success: true,
        count: exportItems.length,
        filename: `${filename}.${format}`,
      };
    },
    [resources, categories, adminStats]
  );

  return {
    exportData,
    canExport: resources.length > 0,
  };
}

// Export the main hook as default
export default useAdminResourceData;