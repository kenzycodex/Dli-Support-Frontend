// services/resources.service.ts - FIXED: Stable fetching like help service

import { apiClient, type StandardizedApiResponse } from '@/lib/api';

// Keep your existing interfaces unchanged...
export interface ResourceCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  resources_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: number;
  category_id: number;
  title: string;
  description: string;
  slug: string;
  type: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet';
  subcategory?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  external_url: string;
  download_url?: string;
  thumbnail_url?: string;
  tags: string[];
  author_name?: string;
  author_bio?: string;
  rating: number;
  view_count: number;
  download_count: number;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  is_bookmarked: boolean;
  created_by?: number;
  updated_by?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: ResourceCategory;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

// UPDATED: Enhanced ResourceFilters interface
export interface ResourceFilters {
  category?: string;
  type?: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet' | 'all';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  search?: string;
  featured?: boolean;
  sort_by?: 'featured' | 'rating' | 'downloads' | 'newest' | 'popular';
  per_page?: number;
  page?: number;
  include_drafts?: boolean;
  // UPDATED: Enhanced pagination options
  limit?: number; // Alternative to per_page for some APIs
  offset?: number; // Alternative pagination method
  cursor?: string; // For cursor-based pagination
}

// UPDATED: Enhanced ResourcesResponse with better pagination
export interface ResourcesResponse {
  resources: Resource[];
  featured_resources?: Resource[];
  type_counts?: Record<string, number>;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    has_more_pages?: boolean;
    // UPDATED: Additional pagination metadata
    next_page_url?: string;
    prev_page_url?: string;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  // UPDATED: Additional response metadata
  meta?: {
    total_resources: number;
    filtered_count: number;
    cache_hit?: boolean;
    query_time?: number;
  };
}
export interface ResourceStats {
  total_resources: number;
  total_categories: number;
  total_views: number;
  total_downloads: number;
  average_rating: number;
  most_popular_resource?: Pick<Resource, 'id' | 'title' | 'view_count' | 'type'> | null;
  highest_rated_resource?: Pick<Resource, 'id' | 'title' | 'rating' | 'type'> | null;
  most_downloaded_resource?: Pick<Resource, 'id' | 'title' | 'download_count' | 'type'> | null;
  resources_by_type: Record<string, number>;
  resources_by_difficulty: Record<string, number>;
  categories_with_counts: Pick<ResourceCategory, 'id' | 'name' | 'slug' | 'color'>[];
}

interface RequestOptions {
  userRole?: string;
  forceRefresh?: boolean;
  include_inactive?: boolean;
}

/**
 * FIXED: Simplified Resource Service - Following Help Service Pattern
 */
class ResourcesService {
  private readonly apiClient = apiClient;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes like help service

  // UPDATED: Enhanced cache key generation
  private getCacheKey(endpoint: string, params?: any): string {
    // Include pagination params in cache key for proper cache separation
    const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${endpoint}_${sortedParams}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // FIXED: Simple response parser - EXACTLY like help service
  private parseResourcesResponse(rawResponse: any): ResourcesResponse {
    console.log('🔍 ResourcesService: Parsing response:', rawResponse);

    if (!rawResponse) {
      console.warn('⚠️ ResourcesService: No response data');
      return { resources: [] };
    }

    // EXACTLY like help service - check for direct resources array
    if (rawResponse.resources && Array.isArray(rawResponse.resources)) {
      return {
        resources: rawResponse.resources,
        featured_resources: rawResponse.featured_resources || [],
        type_counts: rawResponse.type_counts || {},
        pagination: rawResponse.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: rawResponse.resources.length,
          total: rawResponse.resources.length,
        },
      };
    }

    // Fallback if it's just an array
    if (Array.isArray(rawResponse)) {
      return {
        resources: rawResponse,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: rawResponse.length,
          total: rawResponse.length,
        },
      };
    }

    console.warn('⚠️ ResourcesService: Unknown response format');
    return { resources: [] };
  }

  // =============================================================================
  // BASIC OPERATIONS - EXACTLY like help service
  // =============================================================================

  async getCategories(
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<{ categories: ResourceCategory[] }>> {
    try {
      const { include_inactive = false, forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('categories', { include_inactive });

      if (!forceRefresh) {
        const cached = this.getFromCache<{ categories: ResourceCategory[] }>(cacheKey);
        if (cached)
          return {
            success: true,
            status: 200,
            message: 'Categories retrieved from cache',
            data: cached,
          };
      }

      const endpoint = '/resources/categories';
      const response = await this.apiClient.get<{ categories: ResourceCategory[] }>(endpoint);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch categories:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resource categories. Please try again.',
      };
    }
  }

  // FIXED: Simplified getResources - EXACTLY like help service getFAQs
  // UPDATED: Enhanced getResources with better pagination support
  async getResources(
    filters: ResourceFilters = {},
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<ResourcesResponse>> {
    try {
      const { forceRefresh = false } = options;
      
      // UPDATED: More intelligent caching for pagination
      // Don't cache individual pages, but cache the full dataset when appropriate
      const shouldCache = !filters.page || filters.page === 1;
      const cacheKey = shouldCache ? this.getCacheKey('resources', { ...filters, page: undefined }) : null;

      if (!forceRefresh && cacheKey) {
        const cached = this.getFromCache<ResourcesResponse>(cacheKey);
        if (cached) {
          // UPDATED: Handle pagination from cached data
          const paginatedResult = this.paginateCachedData(cached, filters);
          return {
            success: true,
            status: 200,
            message: 'Resources retrieved from cache',
            data: paginatedResult,
          };
        }
      }

      // UPDATED: Build enhanced params
      const params = this.buildRequestParams(filters);
      const endpoint = `/resources${params ? `?${params}` : ''}`;
      
      console.log('📡 ResourcesService: Fetching with enhanced pagination:', {
        endpoint,
        filters,
        cacheEnabled: !!cacheKey
      });

      const response = await this.apiClient.get(endpoint);

      if (!response.success) return response;

      // UPDATED: Enhanced response processing
      const data = response.data || {};
      const result: ResourcesResponse = this.processResourcesResponse(data, filters);

      // UPDATED: Smart caching strategy
      if (cacheKey && shouldCache) {
        this.setCache(cacheKey, result);
      }

      return {
        success: true,
        status: response.status || 200,
        message: response.message || 'Resources retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch resources:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resources. Please try again.',
      };
    }
  }

  // UPDATED: Enhanced request params builder
  private buildRequestParams(filters: ResourceFilters): string {
    const params = new URLSearchParams();
    
    // UPDATED: Handle all filter types with proper encoding
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        // Special handling for arrays (like tags)
        if (Array.isArray(value)) {
          value.forEach(item => params.append(`${key}[]`, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // UPDATED: Ensure proper pagination defaults
    if (!params.has('per_page')) {
      params.set('per_page', '25'); // Default to 25 instead of 15
    }
    
    if (!params.has('page')) {
      params.set('page', '1');
    }

    return params.toString();
  }

  // UPDATED: Enhanced response processor
  private processResourcesResponse(data: any, filters: ResourceFilters): ResourcesResponse {
    const resources = data.resources || [];
    
    // UPDATED: Enhanced pagination processing
    let pagination = data.pagination;
    
    if (!pagination && resources.length > 0) {
      // UPDATED: Generate pagination metadata if not provided by server
      const perPage = filters.per_page || 25;
      const currentPage = filters.page || 1;
      const total = data.total || resources.length;
      
      pagination = {
        current_page: currentPage,
        last_page: Math.ceil(total / perPage),
        per_page: perPage,
        total: total,
        from: total > 0 ? ((currentPage - 1) * perPage) + 1 : 0,
        to: Math.min(currentPage * perPage, total),
        has_more_pages: currentPage < Math.ceil(total / perPage),
      };
    }

    return {
      resources,
      featured_resources: data.featured_resources || [],
      type_counts: data.type_counts || {},
      pagination,
      meta: {
        total_resources: data.total || resources.length,
        filtered_count: resources.length,
        cache_hit: false,
        query_time: data.query_time,
      },
    };
  }

  // UPDATED: Client-side pagination for cached data
  private paginateCachedData(cachedData: ResourcesResponse, filters: ResourceFilters): ResourcesResponse {
    const { page = 1, per_page = 25 } = filters;
    const allResources = cachedData.resources || [];
    
    // UPDATED: Apply client-side filtering to cached data
    let filteredResources = this.applyClientSideFilters(allResources, filters);
    
    // UPDATED: Apply pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedResources = filteredResources.slice(startIndex, endIndex);
    
    // UPDATED: Generate pagination metadata
    const total = filteredResources.length;
    const lastPage = Math.ceil(total / per_page);
    
    return {
      ...cachedData,
      resources: paginatedResources,
      pagination: {
        current_page: page,
        last_page: lastPage,
        per_page: per_page,
        total: total,
        from: total > 0 ? startIndex + 1 : 0,
        to: Math.min(endIndex, total),
        has_more_pages: page < lastPage,
      },
      meta: {
        ...cachedData.meta,
        total_resources: cachedData.resources?.length || 0,
        filtered_count: total,
        cache_hit: true,
      },
    };
  }

  // UPDATED: Client-side filtering for cached data
  private applyClientSideFilters(resources: Resource[], filters: ResourceFilters): Resource[] {
    let filtered = [...resources];

    // UPDATED: Apply all filter types
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        resource.author_name?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(resource => resource.category?.slug === filters.category);
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(resource => resource.type === filters.type);
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      filtered = filtered.filter(resource => resource.difficulty === filters.difficulty);
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(resource => resource.is_featured === filters.featured);
    }

    if (!filters.include_drafts) {
      filtered = filtered.filter(resource => resource.is_published);
    }

    // UPDATED: Apply sorting
    const sortBy = filters.sort_by || 'featured';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'downloads':
          return (b.download_count || 0) - (a.download_count || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }

  // UPDATED: Enhanced cache management for pagination
  public clearPaginationCache(): void {
    // Clear only pagination-related cache entries
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes('resources') && key.includes('page')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ ResourcesService: Cleared ${keysToDelete.length} pagination cache entries`);
  }

  // UPDATED: Prefetch next page for better UX
  public async prefetchNextPage(currentFilters: ResourceFilters): Promise<void> {
    const nextPageFilters = {
      ...currentFilters,
      page: (currentFilters.page || 1) + 1,
    };

    try {
      console.log('🔮 ResourcesService: Prefetching next page:', nextPageFilters.page);
      await this.getResources(nextPageFilters);
    } catch (error) {
      console.log('⚠️ ResourcesService: Prefetch failed (non-critical):', error);
    }
  }

  // UPDATED: Get pagination info without fetching data
  public getPaginationInfo(filters: ResourceFilters): {
    current_page: number;
    per_page: number;
    estimated_total?: number;
  } {
    return {
      current_page: filters.page || 1,
      per_page: filters.per_page || 25,
      estimated_total: undefined, // Would need to be determined from cache or previous requests
    };
  }

  // UPDATED: Validate pagination parameters
  public validatePaginationParams(filters: ResourceFilters): {
    valid: boolean;
    errors: string[];
    corrected: ResourceFilters;
  } {
    const errors: string[] = [];
    const corrected = { ...filters };

    // Validate page
    if (corrected.page !== undefined) {
      if (corrected.page < 1) {
        errors.push('Page must be 1 or greater');
        corrected.page = 1;
      }
      if (!Number.isInteger(corrected.page)) {
        errors.push('Page must be an integer');
        corrected.page = Math.floor(corrected.page);
      }
    }

    // Validate per_page
    if (corrected.per_page !== undefined) {
      if (corrected.per_page < 1) {
        errors.push('Per page must be 1 or greater');
        corrected.per_page = 25;
      }
      if (corrected.per_page > 100) {
        errors.push('Per page cannot exceed 100');
        corrected.per_page = 100;
      }
      if (!Number.isInteger(corrected.per_page)) {
        errors.push('Per page must be an integer');
        corrected.per_page = Math.floor(corrected.per_page);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      corrected,
    };
  }

  // FIXED: Simplified getStats - EXACTLY like help service
  async getStats(options: RequestOptions = {}): Promise<StandardizedApiResponse<ResourceStats>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('stats');

      if (!forceRefresh) {
        const cached = this.getFromCache<ResourceStats>(cacheKey);
        if (cached)
          return {
            success: true,
            status: 200,
            message: 'Stats retrieved from cache',
            data: cached,
          };
      }

      const response = await this.apiClient.get<ResourceStats>('/resources/stats');

      if (response.success && response.data) {
        // SIMPLIFIED: Use response data directly
        const stats: ResourceStats = {
          total_resources: response.data.total_resources || 0,
          total_categories: response.data.total_categories || 0,
          total_views: response.data.total_views || 0,
          total_downloads: response.data.total_downloads || 0,
          average_rating: response.data.average_rating || 0,
          most_popular_resource: response.data.most_popular_resource || null,
          highest_rated_resource: response.data.highest_rated_resource || null,
          most_downloaded_resource: response.data.most_downloaded_resource || null,
          resources_by_type: response.data.resources_by_type || {},
          resources_by_difficulty: response.data.resources_by_difficulty || {},
          categories_with_counts: response.data.categories_with_counts || [],
        };

        this.setCache(cacheKey, stats);

        return {
          success: true,
          status: 200,
          message: response.message || 'Stats retrieved successfully',
          data: stats,
        };
      }

      return {
        success: false,
        status: response.status || 0,
        message: response.message || 'Failed to fetch stats',
      };
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch stats:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch stats. Please try again.',
      };
    }
  }

  // FIXED: Add back missing methods that were accidentally removed
  async getBookmarks(
    page: number = 1,
    perPage: number = 20,
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<{ bookmarks: any[]; pagination: any }>> {
    try {
      const { userRole, forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('/resources/user/bookmarks', {
        page,
        per_page: perPage,
        userRole,
      });

      if (!forceRefresh) {
        const cached = this.getFromCache<{ bookmarks: any[]; pagination: any }>(cacheKey);
        if (cached)
          return {
            success: true,
            status: 200,
            message: 'Bookmarks retrieved from cache',
            data: cached,
          };
      }

      const response = await this.apiClient.get(
        `/resources/user/bookmarks?page=${page}&per_page=${perPage}`
      );

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch bookmarks:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch bookmarks. Please try again.',
      };
    }
  }

  async createCategory(
    categoryData: Partial<ResourceCategory>,
    userRole?: string
  ): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await this.apiClient.post<{ category: ResourceCategory }>(
        '/admin/resources/categories',
        categoryData
      );

      if (response.success) {
        this.clearCache();
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to create category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to create category. Please try again.',
      };
    }
  }

  async updateCategory(
    id: number,
    categoryData: Partial<ResourceCategory>,
    userRole?: string
  ): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await this.apiClient.put<{ category: ResourceCategory }>(
        `/admin/resources/categories/${id}`,
        categoryData
      );

      if (response.success) {
        this.clearCache();
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to update category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to update category. Please try again.',
      };
    }
  }

  async deleteCategory(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await this.apiClient.delete(`/admin/resources/categories/${id}`);

      if (response.success) {
        this.clearCache();
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to delete category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to delete category. Please try again.',
      };
    }
  }

  async accessResource(
    id: number,
    options: RequestOptions = {}
  ): Promise<
    StandardizedApiResponse<{
      url: string;
      action: 'access' | 'download';
      resource: Pick<Resource, 'id' | 'title' | 'type'>;
    }>
  > {
    try {
      const response = await this.apiClient.post<{
        url: string;
        action: 'access' | 'download';
        resource: Pick<Resource, 'id' | 'title' | 'type'>;
      }>(`/resources/${id}/access`);

      // Clear resource cache to update view/download counts
      this.cache.delete(this.getCacheKey(`/resources/${id}`));

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to access resource:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to access resource. Please try again.',
      };
    }
  }

  async provideFeedback(
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean },
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<{ feedback: any; resource?: Resource }>> {
    try {
      const response = await this.apiClient.post(`/resources/${resourceId}/feedback`, feedback);

      // Clear related caches
      this.cache.delete(this.getCacheKey(`/resources/${resourceId}`));
      this.cache.delete(this.getCacheKey('stats'));

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to provide feedback:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to submit feedback. Please try again.',
      };
    }
  }

  async toggleBookmark(
    resourceId: number,
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<{ bookmarked: boolean; resource_id: number }>> {
    try {
      const response = await this.apiClient.post(`/resources/${resourceId}/bookmark`);

      // Clear bookmarks cache
      Array.from(this.cache.keys())
        .filter((key) => key.includes('bookmarks'))
        .forEach((key) => this.cache.delete(key));

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to toggle bookmark:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to toggle bookmark. Please try again.',
      };
    }
  }

  // SIMPLIFIED: Admin operations - exactly like help service
  async createResource(
    resourceData: Partial<Resource>,
    userRole?: string
  ): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await this.apiClient.post<{ resource: Resource }>(
        '/admin/resources',
        resourceData
      );

      if (response.success) {
        this.clearCache(); // Clear all cache like help service
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to create resource:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to create resource. Please try again.',
      };
    }
  }

  async updateResource(
    id: number,
    resourceData: Partial<Resource>,
    userRole?: string
  ): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await this.apiClient.put<{ resource: Resource }>(
        `/admin/resources/${id}`,
        resourceData
      );

      if (response.success) {
        this.clearCache(); // Clear all cache like help service
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to update resource:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to update resource. Please try again.',
      };
    }
  }

  async deleteResource(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await this.apiClient.delete(`/admin/resources/${id}`);

      if (response.success) {
        this.clearCache(); // Clear all cache like help service
      }

      return response;
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to delete resource:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to delete resource. Please try again.',
      };
    }
  }

  // Keep all utility methods unchanged...
  getTypeIcon(type: string): string {
    const types = {
      article: 'FileText',
      video: 'Video',
      audio: 'Headphones',
      exercise: 'Brain',
      tool: 'Heart',
      worksheet: 'Download',
    } as const;
    return types[type as keyof typeof types] || 'BookOpen';
  }

  getTypeLabel(type: string): string {
    const types = {
      article: 'Article',
      video: 'Video',
      audio: 'Audio',
      exercise: 'Exercise',
      tool: 'Tool',
      worksheet: 'Worksheet',
    } as const;
    return types[type as keyof typeof types] || type;
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    } as const;
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  getDifficultyLabel(difficulty: string): string {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    } as const;
    return labels[difficulty as keyof typeof labels] || difficulty;
  }

  formatRating(rating: any): number {
    const numRating = Number(rating);
    if (isNaN(numRating)) return 0;
    return Math.max(0, Math.min(5, numRating));
  }

  formatRatingDisplay(rating: any): string {
    return this.formatRating(rating).toFixed(1);
  }

  formatCount(count: number | undefined | null): string {
    const safeCount = Number(count) || 0;
    if (safeCount < 1000) return safeCount.toString();
    if (safeCount < 1000000) return `${(safeCount / 1000).toFixed(1)}K`;
    return `${(safeCount / 1000000).toFixed(1)}M`;
  }

  formatDuration(duration?: string): string {
    if (!duration) return 'Self-paced';
    return duration;
  }

  formatTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  }

  // Permission helpers
  canManageResources(userRole?: string): boolean {
    return userRole === 'admin';
  }

  canSuggestContent(userRole?: string): boolean {
    return ['counselor', 'admin'].includes(userRole || '');
  }

  // Validation helpers
  validateResourceData(data: Partial<Resource>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title?.trim() || data.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!data.description?.trim() || data.description.length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    if (!data.category_id) {
      errors.push('Category is required');
    }

    if (!data.external_url?.trim()) {
      errors.push('External URL is required');
    }

    if (!data.type) {
      errors.push('Resource type is required');
    }

    if (!data.difficulty) {
      errors.push('Difficulty level is required');
    }

    return { valid: errors.length === 0, errors };
  }

  validateCategoryData(data: Partial<ResourceCategory>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim() || data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long');
    }

    return { valid: errors.length === 0, errors };
  }

  isValidResourceUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getCacheStats(): { cacheSize: number; totalItems: number } {
    return {
      cacheSize: this.cache.size,
      totalItems: this.cache.size,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const resourcesService = new ResourcesService();
export default resourcesService;
