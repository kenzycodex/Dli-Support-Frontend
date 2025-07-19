// stores/resources-store.ts - FIXED: Stable like help store

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { resourcesService, type Resource, type ResourceCategory, type ResourceFilters, type ResourcesResponse } from '@/services/resources.service'
import { toast } from 'sonner'

// Simple interfaces
export interface ResourceItem extends Resource {
  slug: string
}

export interface ResourceBookmark extends ResourceItem {
  bookmarked_at: string
}

export interface AdminResourceStats {
  total_resources: number
  published_resources: number
  draft_resources: number
  featured_resources: number
  categories_count: number
  active_categories: number
  total_views: number
  total_downloads: number
  average_rating: number
}

// FIXED: Enhanced pagination interface
interface PaginationState {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
  has_more_pages?: boolean;
}

// UPDATED: Default pagination with all required fields
const defaultPagination: PaginationState = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
  from: 0,
  to: 0,
  has_more_pages: false
};

// SIMPLIFIED: Store state - exactly like help store
interface ResourceState {
  // Core data
  resources: ResourceItem[]
  categories: ResourceCategory[]
  bookmarks: ResourceBookmark[]
  currentResource: ResourceItem | null
  filters: ResourceFilters
  
  // Simple loading states
  loading: {
    resources: boolean
    categories: boolean
    bookmarks: boolean
    create: boolean
    update: boolean
    delete: boolean
    access: boolean
    feedback: boolean
    bookmark: boolean
    stats: boolean
  }
  
  // Simple error states
  errors: {
    resources: string | null
    categories: string | null
    bookmarks: string | null
    create: string | null
    update: string | null
    delete: string | null
    access: string | null
    feedback: string | null
    bookmark: string | null
    stats: string | null
  }
  
  // FIXED: Enhanced pagination
  pagination: PaginationState
  
  // Simple cache
  lastFetch: {
    resources: number
    categories: number
    bookmarks: number
    stats: number
  }
  
  // Simple UI state
  selectedResources: Set<number>
  stats: AdminResourceStats | null
  
  // Actions
  actions: {
    // Data fetching - EXACTLY like help store
    fetchResources: (params?: Partial<ResourceFilters>) => Promise<void>
    fetchCategories: (includeInactive?: boolean) => Promise<void>
    fetchBookmarks: (page?: number, perPage?: number) => Promise<void>
    fetchStats: () => Promise<void>
    refreshAll: () => Promise<void>
    
    // Resource CRUD - EXACTLY like help store
    createResource: (data: Partial<Resource>) => Promise<ResourceItem | null>
    updateResource: (id: number, data: Partial<Resource>) => Promise<void>
    deleteResource: (id: number) => Promise<void>
    togglePublishResource: (id: number) => Promise<void>
    toggleFeatureResource: (id: number) => Promise<void>
    
    // Category CRUD
    createCategory: (data: Partial<ResourceCategory>) => Promise<ResourceCategory | null>
    updateCategory: (id: number, data: Partial<ResourceCategory>) => Promise<void>
    deleteCategory: (id: number) => Promise<void>
    
    // Resource interactions
    accessResource: (id: number) => Promise<{ url: string; action: string } | null>
    provideFeedback: (id: number, feedback: { rating: number; comment?: string; is_recommended?: boolean }) => Promise<void>
    toggleBookmark: (id: number) => Promise<void>
    
    // Filter management
    setFilters: (filters: Partial<ResourceFilters>, autoFetch?: boolean) => void
    clearFilters: (autoFetch?: boolean) => void
    
    // UI state
    setCurrentResource: (resource: ResourceItem | null) => void
    selectResource: (id: number) => void
    deselectResource: (id: number) => void
    clearSelection: () => void
    
    // Error handling
    clearError: (type: keyof ResourceState['errors']) => void
    setError: (type: keyof ResourceState['errors'], message: string) => void
    
    // Cache management
    invalidateCache: () => void
    clearCache: () => void
  }
}

// UPDATED: Default values with better pagination
const defaultFilters: ResourceFilters = {
  page: 1,
  per_page: 25, // Increased from 15 to 25
  sort_by: 'featured',
  type: 'all',
  difficulty: 'all'
}

// Helper functions
const generateResourceSlug = (resource: Resource): string => {
  const sanitized = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  return `${resource.id}-${sanitized}`
}

// FIXED: Simple store - EXACTLY like help store pattern
// UPDATED: Store with better pagination handling
export const useResourcesStore = create<ResourceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      resources: [],
      categories: [],
      bookmarks: [],
      currentResource: null,
      filters: { ...defaultFilters },

      loading: {
        resources: false,
        categories: false,
        bookmarks: false,
        create: false,
        update: false,
        delete: false,
        access: false,
        feedback: false,
        bookmark: false,
        stats: false,
      },

      errors: {
        resources: null,
        categories: null,
        bookmarks: null,
        create: null,
        update: null,
        delete: null,
        access: null,
        feedback: null,
        bookmark: null,
        stats: null,
      },

      pagination: { ...defaultPagination },

      lastFetch: {
        resources: 0,
        categories: 0,
        bookmarks: 0,
        stats: 0,
      },

      selectedResources: new Set<number>(),
      stats: null,

      actions: {
        // UPDATED: Better fetch resources with enhanced pagination
        fetchResources: async (params?: Partial<ResourceFilters>) => {
          const state = get();
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters;

          // Allow bypassing cache when explicitly paginating or filtering
          const shouldBypassCache = params && (params.page || params.per_page);
          
          // Prevent rapid calls only for same filters
          if (!shouldBypassCache && Date.now() - state.lastFetch.resources < 1000) {
            console.log('🎯 ResourceStore: Skipping resource fetch (too recent)');
            return;
          }

          set((state) => ({
            loading: { ...state.loading, resources: true },
            errors: { ...state.errors, resources: null },
            filters: mergedFilters,
          }));

          try {
            console.log('🎯 ResourceStore: Fetching resources with filters:', mergedFilters);

            const response = await resourcesService.getResources(mergedFilters);

            if (response.success && response.data) {
              const rawResources = response.data.resources || [];

              // Process resources
              const processedResources: ResourceItem[] = rawResources.map((resource: Resource) => ({
                ...resource,
                slug: generateResourceSlug(resource),
              }));

              // FIXED: Enhanced pagination handling with all required fields
              const serverPagination = response.data.pagination;
              const paginationData: PaginationState = {
                current_page: serverPagination?.current_page || mergedFilters.page || 1,
                last_page: serverPagination?.last_page || Math.ceil(processedResources.length / (mergedFilters.per_page || 25)),
                per_page: serverPagination?.per_page || mergedFilters.per_page || 25,
                total: serverPagination?.total || processedResources.length,
                from: serverPagination?.from || (processedResources.length > 0 ? 1 : 0),
                to: serverPagination?.to || processedResources.length,
                has_more_pages: serverPagination?.has_more_pages || ((mergedFilters.page || 1) < Math.ceil(processedResources.length / (mergedFilters.per_page || 25)))
              };

              console.log('✅ ResourceStore: Resources processed:', {
                total: processedResources.length,
                featured: processedResources.filter((r) => r.is_featured).length,
                pagination: paginationData
              });

              set(() => ({
                resources: processedResources,
                pagination: paginationData,
                lastFetch: { ...get().lastFetch, resources: Date.now() },
                loading: { ...get().loading, resources: false },
              }));
            } else {
              throw new Error(response.message || 'Failed to fetch resources');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to fetch resources:', error);
            set((state) => ({
              loading: { ...state.loading, resources: false },
              errors: { ...state.errors, resources: error.message || 'Failed to fetch resources' },
            }));
          }
        },

        // FIXED: Fetch categories - EXACTLY like help store
        fetchCategories: async (includeInactive = false) => {
          const state = get();

          if (Date.now() - state.lastFetch.categories < 1000) {
            return;
          }

          set((state) => ({
            loading: { ...state.loading, categories: true },
            errors: { ...state.errors, categories: null },
          }));

          try {
            const response = await resourcesService.getCategories({
              include_inactive: includeInactive,
            });

            if (response.success && response.data) {
              set((state) => ({
                categories: response.data!.categories || [],
                lastFetch: { ...state.lastFetch, categories: Date.now() },
                loading: { ...state.loading, categories: false },
              }));
            } else {
              throw new Error(response.message || 'Failed to fetch categories');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, categories: false },
              errors: { ...state.errors, categories: error.message },
            }));
          }
        },

        // FIXED: Fetch bookmarks - EXACTLY like help store
        fetchBookmarks: async (page = 1, perPage = 20) => {
          const state = get();

          if (Date.now() - state.lastFetch.bookmarks < 1000) {
            return;
          }

          set((state) => ({
            loading: { ...state.loading, bookmarks: true },
            errors: { ...state.errors, bookmarks: null },
          }));

          try {
            const response = await resourcesService.getBookmarks(page, perPage);

            if (response.success && response.data) {
              set((state) => ({
                bookmarks: response.data!.bookmarks || [],
                lastFetch: { ...state.lastFetch, bookmarks: Date.now() },
                loading: { ...state.loading, bookmarks: false },
              }));
            } else {
              throw new Error(response.message || 'Failed to fetch bookmarks');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, bookmarks: false },
              errors: { ...state.errors, bookmarks: error.message },
            }));
          }
        },

        // FIXED: Fetch stats - EXACTLY like help store
        fetchStats: async () => {
          const state = get();

          if (Date.now() - state.lastFetch.stats < 5000) {
            return;
          }

          set((state) => ({
            loading: { ...state.loading, stats: true },
            errors: { ...state.errors, stats: null },
          }));

          try {
            const response = await resourcesService.getStats();

            if (response.success && response.data) {
              const serviceStats = response.data;

              // Calculate real-time stats from current data
              const currentState = get();
              const adminStats: AdminResourceStats = {
                total_resources: serviceStats.total_resources || currentState.resources.length,
                published_resources: currentState.resources.filter((r) => r.is_published).length,
                draft_resources: currentState.resources.filter((r) => !r.is_published).length,
                featured_resources: currentState.resources.filter((r) => r.is_featured).length,
                categories_count: serviceStats.total_categories || currentState.categories.length,
                active_categories: currentState.categories.filter((c) => c.is_active).length,
                total_views: serviceStats.total_views || 0,
                total_downloads: serviceStats.total_downloads || 0,
                average_rating: serviceStats.average_rating || 0,
              };

              set((state) => ({
                stats: adminStats,
                lastFetch: { ...state.lastFetch, stats: Date.now() },
                loading: { ...state.loading, stats: false },
              }));
            } else {
              throw new Error(response.message || 'Failed to fetch stats');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, stats: false },
              errors: { ...state.errors, stats: error.message || 'Failed to fetch stats' },
            }));
          }
        },

        // Refresh all - EXACTLY like help store
        refreshAll: async () => {
          set(() => ({
            lastFetch: { resources: 0, categories: 0, bookmarks: 0, stats: 0 },
          }));

          const actions = get().actions;
          await Promise.all([
            actions.fetchResources(),
            actions.fetchCategories(),
            actions.fetchStats(),
          ]);
        },

        // FIXED: Create resource - EXACTLY like help store createFAQ
        createResource: async (data: Partial<Resource>) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }));

          try {
            console.log('🎯 ResourceStore: Creating resource:', data);

            const response = await resourcesService.createResource(data);

            if (response.success && response.data?.resource) {
              const newResource: ResourceItem = {
                ...response.data.resource,
                slug: generateResourceSlug(response.data.resource),
              };

              // IMMEDIATE state update - EXACTLY like help store
              set((state) => ({
                resources: [newResource, ...state.resources],
                currentResource: newResource,
                loading: { ...state.loading, create: false },
              }));

              console.log('✅ ResourceStore: Resource created successfully');
              toast.success('Resource created successfully!');
              return newResource;
            } else {
              throw new Error(response.message || 'Failed to create resource');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to create resource:', error);
            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message || 'Failed to create resource' },
            }));
            toast.error(error.message || 'Failed to create resource');
            return null;
          }
        },

        // FIXED: Update resource - EXACTLY like help store updateFAQ
        updateResource: async (id: number, data: Partial<Resource>) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }));

          try {
            console.log('🎯 ResourceStore: Updating resource:', id, data);

            const response = await resourcesService.updateResource(id, data);

            if (response.success && response.data?.resource) {
              const updatedResource: ResourceItem = {
                ...response.data.resource,
                slug: generateResourceSlug(response.data.resource),
              };

              // IMMEDIATE state update - EXACTLY like help store
              set((state) => ({
                resources: state.resources.map((r) => (r.id === id ? updatedResource : r)),
                currentResource:
                  state.currentResource?.id === id ? updatedResource : state.currentResource,
                loading: { ...state.loading, update: false },
              }));

              console.log('✅ ResourceStore: Resource updated successfully');
              toast.success('Resource updated successfully!');
            } else {
              throw new Error(response.message || 'Failed to update resource');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to update resource:', error);
            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message || 'Failed to update resource' },
            }));
            toast.error(error.message || 'Failed to update resource');
            throw error;
          }
        },

        // FIXED: Delete resource - EXACTLY like help store deleteFAQ
        deleteResource: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }));

          try {
            console.log('🎯 ResourceStore: Deleting resource:', id);

            const response = await resourcesService.deleteResource(id);

            if (response.success) {
              // IMMEDIATE state cleanup - EXACTLY like help store
              set((state) => {
                const newSelectedResources = new Set(state.selectedResources);
                newSelectedResources.delete(id);

                return {
                  resources: state.resources.filter((r) => r.id !== id),
                  bookmarks: state.bookmarks.filter((b) => b.id !== id),
                  currentResource: state.currentResource?.id === id ? null : state.currentResource,
                  selectedResources: newSelectedResources,
                  loading: { ...state.loading, delete: false },
                };
              });

              console.log('✅ ResourceStore: Resource deleted successfully');
              toast.success('Resource deleted successfully!');
            } else {
              throw new Error(response.message || 'Failed to delete resource');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to delete resource:', error);
            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message || 'Failed to delete resource' },
            }));
            toast.error(error.message || 'Failed to delete resource');
          }
        },

        // FIXED: Toggle publish - EXACTLY like help store
        togglePublishResource: async (id: number) => {
          try {
            const state = get();
            const resource = state.resources.find((r) => r.id === id);
            if (!resource) {
              throw new Error(`Resource with ID ${id} not found`);
            }

            console.log(
              '🎯 ResourceStore: Toggling publish for resource:',
              id,
              'current state:',
              resource.is_published
            );

            await get().actions.updateResource(id, {
              is_published: !resource.is_published,
              published_at: !resource.is_published
                ? new Date().toISOString()
                : resource.published_at,
            });

            console.log('✅ ResourceStore: Publish toggled successfully');
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to toggle publish:', error);
            throw error;
          }
        },

        // FIXED: Toggle feature - EXACTLY like help store
        toggleFeatureResource: async (id: number) => {
          try {
            const state = get();
            const resource = state.resources.find((r) => r.id === id);
            if (!resource) {
              throw new Error(`Resource with ID ${id} not found`);
            }

            console.log(
              '🎯 ResourceStore: Toggling feature for resource:',
              id,
              'current state:',
              resource.is_featured
            );

            await get().actions.updateResource(id, {
              is_featured: !resource.is_featured,
            });

            console.log('✅ ResourceStore: Feature toggled successfully');
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to toggle feature:', error);
            throw error;
          }
        },

        // Category operations - EXACTLY like help store
        createCategory: async (data: Partial<ResourceCategory>) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }));

          try {
            const response = await resourcesService.createCategory(data);

            if (response.success && response.data?.category) {
              const newCategory = response.data.category;

              set((state) => ({
                categories: [newCategory, ...state.categories],
                loading: { ...state.loading, create: false },
              }));

              toast.success('Category created successfully!');
              return newCategory;
            } else {
              throw new Error(response.message || 'Failed to create category');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message },
            }));
            toast.error(error.message || 'Failed to create category');
            return null;
          }
        },

        updateCategory: async (id: number, data: Partial<ResourceCategory>) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }));

          try {
            const response = await resourcesService.updateCategory(id, data);

            if (response.success && response.data?.category) {
              const updatedCategory = response.data.category;

              set((state) => ({
                categories: state.categories.map((c) => (c.id === id ? updatedCategory : c)),
                loading: { ...state.loading, update: false },
              }));

              toast.success('Category updated successfully!');
            } else {
              throw new Error(response.message || 'Failed to update category');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message },
            }));
            toast.error(error.message || 'Failed to update category');
          }
        },

        deleteCategory: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }));

          try {
            const response = await resourcesService.deleteCategory(id);

            if (response.success) {
              set((state) => ({
                categories: state.categories.filter((c) => c.id !== id),
                loading: { ...state.loading, delete: false },
              }));

              toast.success('Category deleted successfully!');
            } else {
              throw new Error(response.message || 'Failed to delete category');
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message },
            }));
            toast.error(error.message || 'Failed to delete category');
          }
        },

        // Resource interactions - simplified
        accessResource: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, access: true },
            errors: { ...state.errors, access: null },
          }));

          try {
            console.log('🎯 ResourceStore: Accessing resource:', id);

            const response = await resourcesService.accessResource(id);

            if (response.success && response.data) {
              // Update view/download counts in state
              set((state) => ({
                resources: state.resources.map((r) => {
                  if (r.id === id) {
                    return {
                      ...r,
                      view_count:
                        response.data!.action === 'access' ? (r.view_count || 0) + 1 : r.view_count,
                      download_count:
                        response.data!.action === 'download'
                          ? (r.download_count || 0) + 1
                          : r.download_count,
                    };
                  }
                  return r;
                }),
                loading: { ...state.loading, access: false },
              }));

              console.log('✅ ResourceStore: Resource accessed successfully');
              return { url: response.data.url, action: response.data.action };
            } else {
              throw new Error(response.message || 'Failed to access resource');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to access resource:', error);
            set((state) => ({
              loading: { ...state.loading, access: false },
              errors: { ...state.errors, access: error.message || 'Failed to access resource' },
            }));
            toast.error(error.message || 'Failed to access resource');
            return null;
          }
        },

        provideFeedback: async (
          id: number,
          feedback: { rating: number; comment?: string; is_recommended?: boolean }
        ) => {
          set((state) => ({
            loading: { ...state.loading, feedback: true },
            errors: { ...state.errors, feedback: null },
          }));

          try {
            console.log('🎯 ResourceStore: Providing feedback for resource:', id);

            const response = await resourcesService.provideFeedback(id, feedback);

            if (response.success && response.data) {
              set((state) => ({
                resources: state.resources.map((r) =>
                  r.id === id ? { ...r, rating: response.data!.resource?.rating || r.rating } : r
                ),
                loading: { ...state.loading, feedback: false },
              }));

              console.log('✅ ResourceStore: Feedback provided successfully');
              toast.success('Thank you for your feedback!');
            } else {
              throw new Error(response.message || 'Failed to provide feedback');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to provide feedback:', error);
            set((state) => ({
              loading: { ...state.loading, feedback: false },
              errors: { ...state.errors, feedback: error.message || 'Failed to provide feedback' },
            }));
            toast.error(error.message || 'Failed to provide feedback');
          }
        },

        toggleBookmark: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, bookmark: true },
            errors: { ...state.errors, bookmark: null },
          }));

          try {
            console.log('🎯 ResourceStore: Toggling bookmark for resource:', id);

            const response = await resourcesService.toggleBookmark(id);

            if (response.success && response.data) {
              const isBookmarked = response.data.bookmarked;

              set((state) => ({
                resources: state.resources.map((r) =>
                  r.id === id ? { ...r, is_bookmarked: isBookmarked } : r
                ),
                bookmarks: isBookmarked
                  ? [
                      ...state.bookmarks,
                      state.resources.find((r) => r.id === id) as ResourceBookmark,
                    ]
                  : state.bookmarks.filter((b) => b.id !== id),
                loading: { ...state.loading, bookmark: false },
              }));

              console.log('✅ ResourceStore: Bookmark toggled successfully');
              const message = isBookmarked ? 'Resource bookmarked!' : 'Bookmark removed';
              toast.success(message);
            } else {
              throw new Error(response.message || 'Failed to toggle bookmark');
            }
          } catch (error: any) {
            console.error('❌ ResourceStore: Failed to toggle bookmark:', error);
            set((state) => ({
              loading: { ...state.loading, bookmark: false },
              errors: { ...state.errors, bookmark: error.message || 'Failed to toggle bookmark' },
            }));
            toast.error(error.message || 'Failed to toggle bookmark');
          }
        },

        // Filter management - simple
        // UPDATED: Better filter management with pagination support
        setFilters: (newFilters: Partial<ResourceFilters>, autoFetch = false) => {
          const state = get();
          
          // Reset to page 1 when changing non-pagination filters
          const shouldResetPage = Object.keys(newFilters).some(key => 
            key !== 'page' && key !== 'per_page' && newFilters[key as keyof ResourceFilters] !== state.filters[key as keyof ResourceFilters]
          );

          const updatedFilters = { 
            ...state.filters, 
            ...newFilters,
            page: shouldResetPage ? 1 : (newFilters.page || state.filters.page)
          };

          set(() => ({
            filters: updatedFilters,
          }));

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchResources();
            }, 100);
          }
        },

        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters },
            pagination: { ...defaultPagination }
          }));

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchResources();
            }, 100);
          }
        },

        // UI state management - simple
        setCurrentResource: (resource: ResourceItem | null) => {
          set(() => ({ currentResource: resource }));
        },

        selectResource: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedResources);
            newSet.add(id);
            return { selectedResources: newSet };
          });
        },

        deselectResource: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedResources);
            newSet.delete(id);
            return { selectedResources: newSet };
          });
        },

        clearSelection: () => {
          set(() => ({ selectedResources: new Set<number>() }));
        },

        // Error handling - simple
        clearError: (type: keyof ResourceState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [type]: null },
          }));
        },

        setError: (type: keyof ResourceState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message },
          }));
        },

        // Cache management - simple
        invalidateCache: () => {
          set(() => ({
            lastFetch: { resources: 0, categories: 0, bookmarks: 0, stats: 0 },
          }));
        },

        clearCache: () => {
          set(() => ({
            resources: [],
            categories: [],
            bookmarks: [],
            currentResource: null,
            selectedResources: new Set(),
            stats: null,
            lastFetch: { resources: 0, categories: 0, bookmarks: 0, stats: 0 },
          }));
        },
      },
    }),
    { name: 'resources-store' }
  )
);

// Export selectors and hooks exactly like help store
// UPDATED: Enhanced selectors with pagination info
export const useResourcesSelectors = () => {
  const resources = useResourcesStore((state) => state.resources);
  const categories = useResourcesStore((state) => state.categories);
  const bookmarks = useResourcesStore((state) => state.bookmarks);
  const stats = useResourcesStore((state) => state.stats);
  const selectedResources = useResourcesStore((state) => state.selectedResources);
  const pagination = useResourcesStore((state) => state.pagination);

  return {
    resources,
    categories,
    bookmarks,
    stats,
    pagination, // Add pagination to selectors
    selectedResourcesArray: Array.from(selectedResources)
      .map((id) => resources.find((r) => r.id === id))
      .filter(Boolean) as ResourceItem[],

    // Simple computed data
    publishedResources: resources.filter((r) => r.is_published),
    draftResources: resources.filter((r) => !r.is_published),
    featuredResources: resources.filter((r) => r.is_featured),
    activeCategories: categories.filter((c) => c.is_active),

    // Safe stats access with pagination context
    totalResources: pagination.total || stats?.total_resources || resources.length,
    currentPageResources: resources.length,
    publishedCount: stats?.published_resources || resources.filter((r) => r.is_published).length,
    draftCount: stats?.draft_resources || resources.filter((r) => !r.is_published).length,
    featuredCount: stats?.featured_resources || resources.filter((r) => r.is_featured).length,
    bookmarkCount: bookmarks.length,

    // Pagination helpers
    hasNextPage: pagination.current_page < pagination.last_page,
    hasPrevPage: pagination.current_page > 1,
    isFirstPage: pagination.current_page === 1,
    isLastPage: pagination.current_page === pagination.last_page,
    pageInfo: `${pagination.from || 0}-${pagination.to || 0} of ${pagination.total}`,
  };
};

export const useResourcesActions = () => {
  return useResourcesStore((state) => state.actions);
};

export const useResourcesLoading = () => {
  return useResourcesStore((state) => state.loading);
};

export const useResourcesErrors = () => {
  return useResourcesStore((state) => state.errors);
};

// FIXED: Add missing exports that were removed
export const useResourcesFilters = () => {
  const filters = useResourcesStore((state) => state.filters);
  const { setFilters, clearFilters } = useResourcesStore((state) => state.actions);

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (['page', 'per_page'].includes(key)) return false;
      return value !== undefined && value !== null && value !== '' && value !== 'all';
    }),
  };
};

export const useResourcesStats = () => {
  const stats = useResourcesStore((state) => state.stats);
  const resources = useResourcesStore((state) => state.resources);
  const categories = useResourcesStore((state) => state.categories);
  const bookmarks = useResourcesStore((state) => state.bookmarks);

  return {
    stats: stats || {
      total_resources: resources.length,
      published_resources: resources.filter((r) => r.is_published).length,
      draft_resources: resources.filter((r) => !r.is_published).length,
      featured_resources: resources.filter((r) => r.is_featured).length,
      categories_count: categories.length,
      active_categories: categories.filter((c) => c.is_active).length,
      total_views: 0,
      total_downloads: 0,
      average_rating: 0,
    },
  };
};

export default useResourcesStore;