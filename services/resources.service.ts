// services/resources.service.ts - FIXED: Extended ResourceStats interface

import { apiClient, type StandardizedApiResponse } from '@/lib/api'

export interface ResourceCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  resources_count?: number
  created_at: string
  updated_at: string
}

export interface Resource {
  id: number
  category_id: number
  title: string
  description: string
  slug: string
  type: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet'
  subcategory?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  external_url: string
  download_url?: string
  thumbnail_url?: string
  tags: string[]
  author_name?: string
  author_bio?: string
  rating: number
  view_count: number
  download_count: number
  sort_order: number
  is_published: boolean
  is_featured: boolean
  is_bookmarked: boolean
  created_by?: number
  updated_by?: number
  published_at?: string
  created_at: string
  updated_at: string
  category?: ResourceCategory
  creator?: {
    id: number
    name: string
    email: string
  }
}

export interface ResourceFeedback {
  id: number
  resource_id: number
  user_id: number
  rating: number
  comment?: string
  is_recommended: boolean
  created_at: string
  updated_at: string
}

export interface ResourceFilters {
  category?: string
  type?: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet' | 'all'
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all'
  search?: string
  featured?: boolean
  sort_by?: 'featured' | 'rating' | 'downloads' | 'newest' | 'popular'
  per_page?: number
  page?: number
  include_drafts?: boolean
}

export interface ResourcesResponse {
  resources: Resource[]
  featured_resources?: Resource[]
  type_counts?: Record<string, number>
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number
    to?: number
    has_more_pages?: boolean
  }
}

export interface BookmarksResponse {
  bookmarks: (Resource & { bookmarked_at: string })[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// FIXED: Extended ResourceStats interface to include all properties used by the store
export interface ResourceStats {
  total_resources: number
  total_categories: number
  // ADDED: Properties required by the store
  total_views: number
  total_downloads: number
  average_rating: number
  // Original properties
  most_popular_resource?: Pick<Resource, 'id' | 'title' | 'view_count' | 'type'> | null
  highest_rated_resource?: Pick<Resource, 'id' | 'title' | 'rating' | 'type'> | null
  most_downloaded_resource?: Pick<Resource, 'id' | 'title' | 'download_count' | 'type'> | null
  resources_by_type: Record<string, number>
  resources_by_difficulty: Record<string, number>
  categories_with_counts: Pick<ResourceCategory, 'id' | 'name' | 'slug' | 'color'>[]
}

export interface ResourceOptions {
  types: Array<{ value: string; label: string; icon: string }>
  difficulties: Array<{ value: string; label: string; color: string }>
  categories: Pick<ResourceCategory, 'id' | 'name' | 'slug'>[]
}

// Request options interface
interface RequestOptions {
  userRole?: string
  forceRefresh?: boolean
  include_inactive?: boolean
}

/**
 * UPDATED: Resource Service with extended stats support
 */
class ResourcesService {
  private readonly apiClient = apiClient
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 15 * 60 * 1000 // 15 minutes
  private readonly STATS_TTL = 30 * 60 * 1000 // 30 minutes for stats
  private readonly CATEGORIES_TTL = 20 * 60 * 1000 // 20 minutes for categories

  // Type definitions for resource types
  static readonly RESOURCE_TYPES = {
    article: { label: 'Article', icon: 'FileText' },
    video: { label: 'Video', icon: 'Video' },
    audio: { label: 'Audio', icon: 'Headphones' },
    exercise: { label: 'Exercise', icon: 'Brain' },
    tool: { label: 'Tool', icon: 'Heart' },
    worksheet: { label: 'Worksheet', icon: 'Download' },
  } as const

  static readonly DIFFICULTY_LEVELS = {
    beginner: { label: 'Beginner', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    advanced: { label: 'Advanced', color: 'bg-red-100 text-red-800' },
  } as const

  // Smart caching methods
  private getCacheKey(endpoint: string, params?: any): string {
    const baseKey = endpoint.replace(/^\//, '')
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            acc[key] = params[key]
          }
          return acc
        }, {} as any)
      
      return `${baseKey}_${JSON.stringify(sortedParams)}`
    }
    return baseKey
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  public clearCache(): void {
    this.cache.clear()
  }

  public getCacheStats(): { cacheSize: number; totalMemory: number; hitRate: number } {
    const totalMemory = Array.from(this.cache.values()).reduce((total, entry) => {
      return total + JSON.stringify(entry.data).length
    }, 0)

    return {
      cacheSize: this.cache.size,
      totalMemory,
      hitRate: 0, // Would need to track hits/misses for real calculation
    }
  }

  // Enhanced response parser aligned with backend
  // CRITICAL FIX: Simplified response parser
  private parseBackendResponse(rawResponse: any): ResourcesResponse {
    console.log('🔍 ResourcesService: Raw response:', rawResponse);

    // Safety check
    if (!rawResponse) {
      console.warn('⚠️ ResourcesService: No response data provided');
      return { resources: [] };
    }

    // STRATEGY 1: Direct response structure (what backend actually returns)
    if (rawResponse.resources && Array.isArray(rawResponse.resources)) {
      console.log('✅ ResourcesService: Found direct resources format');
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

    // STRATEGY 2: Array response fallback
    if (Array.isArray(rawResponse)) {
      console.log('✅ ResourcesService: Found array format');
      return {
        resources: rawResponse,
        featured_resources: rawResponse.filter((r: Resource) => r.is_featured) || [],
        type_counts: {},
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: rawResponse.length,
          total: rawResponse.length,
        },
      };
    }

    // FALLBACK: Return empty
    console.warn('⚠️ ResourcesService: Unknown response format, returning empty');
    return { resources: [] };
  }

  // =============================================================================
  // BASIC OPERATIONS
  // =============================================================================

  async getCategories(options: RequestOptions = {}): Promise<StandardizedApiResponse<{ categories: ResourceCategory[] }>> {
    try {
      const { include_inactive = false, forceRefresh = false } = options
      const cacheKey = this.getCacheKey('categories', { include_inactive })
      
      if (!forceRefresh) {
        const cached = this.getCache(cacheKey)
        if (cached) return { 
          success: true, 
          status: 200,
          message: 'Categories retrieved from cache',
          data: cached 
        }
      }

      const endpoint = '/resources/categories'
      const response = await this.apiClient.get<{ categories: ResourceCategory[] }>(endpoint)

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, this.CATEGORIES_TTL)
      }

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch categories:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resource categories. Please try again.',
      }
    }
  }

  async getResources(filters: ResourceFilters & RequestOptions = {}): Promise<StandardizedApiResponse<ResourcesResponse>> {
    try {
      const { userRole, forceRefresh = false, ...apiFilters } = filters
      const cacheKey = this.getCacheKey('/resources', { ...apiFilters, userRole })

      if (!forceRefresh) {
        const cached = this.getCache(cacheKey)
        if (cached) return { 
          success: true, 
          status: 200,
          message: 'Resources retrieved from cache',
          data: cached 
        }
      }

      const params = new URLSearchParams()
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString())
        }
      })

      const endpoint = `/resources${params.toString() ? `?${params.toString()}` : ''}`
      console.log('📡 ResourcesService: Making request to:', endpoint)
      
      const response = await this.apiClient.get<any>(endpoint)
      console.log('📡 ResourcesService: Raw response:', response)

      if (!response.success) {
        console.error('❌ ResourcesService: Request failed:', response)
        return response
      }

      // Use enhanced response parser
      const parsedData = this.parseBackendResponse(response.data)
      console.log('✅ ResourcesService: Parsed data:', parsedData)

      // Cache the processed response
      if (!forceRefresh && parsedData.resources.length > 0) {
        this.setCache(cacheKey, parsedData, this.DEFAULT_TTL)
      }

      return {
        success: true,
        status: 200,
        message: response.message || 'Resources retrieved successfully',
        data: parsedData
      }

    } catch (error: any) {
      console.error('❌ ResourcesService: Service Error:', error)
      
      // Return stale cache if available on error
      const cacheKey = this.getCacheKey('/resources', filters)
      const cached = this.getCache(cacheKey)
      if (cached) {
        console.log('📋 ResourcesService: Returning cached data due to error')
        return {
          success: true,
          status: 200,
          message: 'Resources retrieved from cache',
          data: cached
        }
      }
      throw error
    }
  }

  // UPDATED: getStats method with extended ResourceStats support
  async getStats(options: RequestOptions = {}): Promise<StandardizedApiResponse<ResourceStats>> {
    try {
      const { userRole, forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('/resources/stats', { userRole });

      if (!forceRefresh) {
        const cached = this.getCache(cacheKey);
        if (cached)
          return {
            success: true,
            status: 200,
            message: 'Stats retrieved from cache',
            data: cached,
          };
      }

      console.log('📊 ResourcesService: Fetching stats from /resources/stats');
      const response = await this.apiClient.get<ResourceStats>('/resources/stats');

      if (response.success && response.data) {
        // CRITICAL FIX: Backend now returns stats directly, not nested
        const stats: ResourceStats = response.data;

        console.log('✅ ResourcesService: Stats received:', stats);

        // Ensure all required properties exist with safe defaults
        const completeStats: ResourceStats = {
          total_resources: stats.total_resources || 0,
          total_categories: stats.total_categories || 0,
          total_views: stats.total_views || 0,
          total_downloads: stats.total_downloads || 0,
          average_rating: stats.average_rating || 0,
          most_popular_resource: stats.most_popular_resource || null,
          highest_rated_resource: stats.highest_rated_resource || null,
          most_downloaded_resource: stats.most_downloaded_resource || null,
          resources_by_type: stats.resources_by_type || {},
          resources_by_difficulty: stats.resources_by_difficulty || {},
          categories_with_counts: stats.categories_with_counts || [],
        };

        this.setCache(cacheKey, completeStats, this.STATS_TTL || 30 * 60 * 1000);

        return {
          success: true,
          status: 200,
          message: response.message || 'Stats retrieved successfully',
          data: completeStats,
        };
      }

      return {
        success: false,
        status: response.status || 0,
        message: response.message || 'Failed to fetch resource statistics. Please try again.',
      };
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch stats:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resource statistics. Please try again.',
      };
    }
  }

  async getResource(id: number, options: RequestOptions = {}): Promise<StandardizedApiResponse<{
    resource: Resource
    user_feedback?: ResourceFeedback
    related_resources: Resource[]
  }>> {
    try {
      const { userRole, forceRefresh = false } = options
      const cacheKey = this.getCacheKey(`/resources/${id}`, { userRole })

      if (!forceRefresh) {
        const cached = this.getCache(cacheKey)
        if (cached) return { 
          success: true, 
          status: 200,
          message: 'Resource retrieved from cache',
          data: cached 
        }
      }

      const response = await this.apiClient.get<{
        resource: Resource
        user_feedback?: ResourceFeedback
        related_resources: Resource[]
      }>(`/resources/${id}`)

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, this.DEFAULT_TTL)
      }

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch resource:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resource. Please try again.',
      }
    }
  }

  async accessResource(id: number, options: RequestOptions = {}): Promise<StandardizedApiResponse<{
    url: string
    action: 'access' | 'download'
    resource: Pick<Resource, 'id' | 'title' | 'type'>
  }>> {
    try {
      const response = await this.apiClient.post<{
        url: string
        action: 'access' | 'download'
        resource: Pick<Resource, 'id' | 'title' | 'type'>
      }>(`/resources/${id}/access`)

      // Clear resource cache to update view/download counts
      this.cache.delete(this.getCacheKey(`/resources/${id}`))
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to access resource:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to access resource. Please try again.',
      }
    }
  }

  async provideFeedback(
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean },
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<{ feedback: ResourceFeedback; resource?: Resource }>> {
    try {
      const response = await this.apiClient.post<{ feedback: ResourceFeedback; resource?: Resource }>(
        `/resources/${resourceId}/feedback`,
        feedback
      )

      // Clear related caches
      this.cache.delete(this.getCacheKey(`/resources/${resourceId}`))
      this.cache.delete(this.getCacheKey('/resources/stats'))

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to provide feedback:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to submit feedback. Please try again.',
      }
    }
  }

  async toggleBookmark(resourceId: number, options: RequestOptions = {}): Promise<StandardizedApiResponse<{ bookmarked: boolean; resource_id: number }>> {
    try {
      const response = await this.apiClient.post<{ bookmarked: boolean; resource_id: number }>(`/resources/${resourceId}/bookmark`)

      // Clear bookmarks cache
      Array.from(this.cache.keys())
        .filter(key => key.includes('bookmarks'))
        .forEach(key => this.cache.delete(key))

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to toggle bookmark:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to toggle bookmark. Please try again.',
      }
    }
  }

  async getBookmarks(
    page: number = 1,
    perPage: number = 20,
    options: RequestOptions = {}
  ): Promise<StandardizedApiResponse<BookmarksResponse>> {
    try {
      const { userRole, forceRefresh = false } = options
      const cacheKey = this.getCacheKey('/resources/user/bookmarks', { page, per_page: perPage, userRole })

      if (!forceRefresh) {
        const cached = this.getCache(cacheKey)
        if (cached) return { 
          success: true, 
          status: 200,
          message: 'Bookmarks retrieved from cache',
          data: cached 
        }
      }

      const response = await this.apiClient.get<BookmarksResponse>(
        `/resources/user/bookmarks?page=${page}&per_page=${perPage}`
      )

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, this.DEFAULT_TTL)
      }

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch bookmarks:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch bookmarks. Please try again.',
      }
    }
  }

  async getOptions(): Promise<StandardizedApiResponse<ResourceOptions>> {
    const cacheKey = this.getCacheKey('/resources/options')
    const cached = this.getCache(cacheKey)
    if (cached) return { 
      success: true, 
      status: 200,
      message: 'Options retrieved from cache',
      data: cached 
    }

    try {
      const response = await this.apiClient.get<ResourceOptions>('/resources/options')

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, this.STATS_TTL) // Long cache for options
      }

      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to fetch options:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch resource options. Please try again.',
      }
    }
  }

  async searchResources(
    query: string,
    filters: Omit<ResourceFilters, 'search'> & RequestOptions = {}
  ): Promise<StandardizedApiResponse<ResourcesResponse>> {
    const { userRole, forceRefresh = false, ...searchFilters } = filters
    return this.getResources({ ...searchFilters, search: query, userRole, forceRefresh })
  }

  // Enhanced methods for featured, popular, and top-rated resources
  async getFeaturedResources(limit: number = 3, options: RequestOptions = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      featured: true,
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      const featuredResources = response.data.featured_resources || 
                               response.data.resources?.filter(r => r.is_featured) || 
                               []

      return {
        success: true,
        status: 200,
        message: response.message || 'Featured resources retrieved successfully',
        data: featuredResources.slice(0, limit),
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch featured resources',
    }
  }

  async getPopularResources(limit: number = 5, options: RequestOptions = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'popular',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      return {
        success: true,
        status: 200,
        message: response.message || 'Popular resources retrieved successfully',
        data: response.data.resources?.slice(0, limit) || [],
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch popular resources',
    }
  }

  async getTopRatedResources(limit: number = 5, options: RequestOptions = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'rating',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      return {
        success: true,
        status: 200,
        message: response.message || 'Top rated resources retrieved successfully',
        data: response.data.resources?.slice(0, limit) || [],
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch top rated resources',
    }
  }

  // =============================================================================
  // ADMIN OPERATIONS
  // =============================================================================

  async createResource(resourceData: Partial<Resource>, userRole?: string): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await this.apiClient.post<{ resource: Resource }>('/admin/resources', resourceData)
      
      if (response.success) {
        // Clear relevant caches
        this.clearCache()
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to create resource:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to create resource. Please try again.',
      }
    }
  }

  async updateResource(id: number, resourceData: Partial<Resource>, userRole?: string): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await this.apiClient.put<{ resource: Resource }>(`/admin/resources/${id}`, resourceData)
      
      if (response.success) {
        // Clear relevant caches
        this.cache.delete(this.getCacheKey(`/resources/${id}`))
        Array.from(this.cache.keys())
          .filter(key => key.includes('resources'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to update resource:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update resource. Please try again.',
      }
    }
  }

  async deleteResource(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await this.apiClient.delete(`/admin/resources/${id}`)
      
      if (response.success) {
        // Clear relevant caches
        this.clearCache()
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to delete resource:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to delete resource. Please try again.',
      }
    }
  }

  async createCategory(categoryData: Partial<ResourceCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await this.apiClient.post<{ category: ResourceCategory }>('/admin/resources/categories', categoryData)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to create category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to create category. Please try again.',
      }
    }
  }

  async updateCategory(id: number, categoryData: Partial<ResourceCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await this.apiClient.put<{ category: ResourceCategory }>(`/admin/resources/categories/${id}`, categoryData)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to update category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update category. Please try again.',
      }
    }
  }

  async deleteCategory(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await this.apiClient.delete(`/admin/resources/categories/${id}`)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error: any) {
      console.error('❌ ResourcesService: Failed to delete category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to delete category. Please try again.',
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  formatDuration(duration?: string): string {
    if (!duration) return 'Self-paced'
    return duration
  }

  formatRating(rating: any): number {
    const numRating = Number(rating)
    if (isNaN(numRating)) return 0
    return Math.max(0, Math.min(5, numRating))
  }

  formatRatingDisplay(rating: any): string {
    return this.formatRating(rating).toFixed(1)
  }

  getTypeIcon(type: string): string {
    return (
      ResourcesService.RESOURCE_TYPES[type as keyof typeof ResourcesService.RESOURCE_TYPES]?.icon ||
      'BookOpen'
    )
  }

  getTypeLabel(type: string): string {
    return (
      ResourcesService.RESOURCE_TYPES[type as keyof typeof ResourcesService.RESOURCE_TYPES]
        ?.label || type
    )
  }

  getDifficultyColor(difficulty: string): string {
    return (
      ResourcesService.DIFFICULTY_LEVELS[
        difficulty as keyof typeof ResourcesService.DIFFICULTY_LEVELS
      ]?.color || 'bg-gray-100 text-gray-800'
    )
  }

  getDifficultyLabel(difficulty: string): string {
    return (
      ResourcesService.DIFFICULTY_LEVELS[
        difficulty as keyof typeof ResourcesService.DIFFICULTY_LEVELS
      ]?.label || difficulty
    )
  }

  calculateRatingPercentage(rating: number): number {
    return Math.round((rating / 5) * 100)
  }

  formatCount(count: number | undefined | null): string {
    const safeCount = Number(count) || 0
    if (safeCount < 1000) return safeCount.toString()
    if (safeCount < 1000000) return `${(safeCount / 1000).toFixed(1)}K`
    return `${(safeCount / 1000000).toFixed(1)}M`
  }

  isValidResourceUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  getAvailableTypes(): Array<{ value: string; label: string; icon: string }> {
    return Object.entries(ResourcesService.RESOURCE_TYPES).map(([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
    }))
  }

  getAvailableDifficulties(): Array<{ value: string; label: string; color: string }> {
    return Object.entries(ResourcesService.DIFFICULTY_LEVELS).map(([value, config]) => ({
      value,
      label: config.label,
      color: config.color,
    }))
  }

  // Role-based permission checks
  canManageResources(userRole: string): boolean {
    return userRole === 'admin'
  }

  canSuggestContent(userRole: string): boolean {
    return ['counselor', 'admin'].includes(userRole)
  }

  canAccessAllResources(userRole: string): boolean {
    return ['counselor', 'advisor', 'admin'].includes(userRole)
  }

  // Debug and health check methods
  getDebugInfo(): {
    apiBaseUrl: string;
    hasAuthToken: boolean;
    userRole: string;
    permissions: {
      canSuggestContent: boolean;
      canManageResources: boolean;
      canAccessAllResources: boolean;
    };
    cacheStats: {
      cacheSize: number;
      totalMemory: number;
    };
  } {
    const userRole = this.getCurrentUserRole();
    
    return {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
      hasAuthToken: !!this.getAuthToken(),
      userRole,
      permissions: {
        canSuggestContent: this.canSuggestContent(userRole),
        canManageResources: this.canManageResources(userRole),
        canAccessAllResources: this.canAccessAllResources(userRole)
      },
      cacheStats: {
        cacheSize: this.cache.size,
        totalMemory: Array.from(this.cache.values()).reduce((total, entry) => {
          return total + JSON.stringify(entry.data).length
        }, 0)
      }
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  // Validation methods aligned with backend requirements
  validateResourceData(data: Partial<Resource>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title?.trim()) {
      errors.push('Title is required')
    } else if (data.title.length < 5) {
      errors.push('Title must be at least 5 characters long')
    } else if (data.title.length > 255) {
      errors.push('Title cannot exceed 255 characters')
    }

    if (!data.description?.trim()) {
      errors.push('Description is required')
    } else if (data.description.length < 20) {
      errors.push('Description must be at least 20 characters long')
    } else if (data.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters')
    }

    if (!data.category_id) {
      errors.push('Category is required')
    }

    if (!data.type) {
      errors.push('Resource type is required')
    } else if (!['article', 'video', 'audio', 'exercise', 'tool', 'worksheet'].includes(data.type)) {
      errors.push('Invalid resource type')
    }

    if (!data.difficulty) {
      errors.push('Difficulty level is required')
    } else if (!['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
      errors.push('Invalid difficulty level')
    }

    if (!data.external_url?.trim()) {
      errors.push('External URL is required')
    } else if (!this.isValidResourceUrl(data.external_url)) {
      errors.push('Please provide a valid external URL')
    }

    if (data.download_url && !this.isValidResourceUrl(data.download_url)) {
      errors.push('Please provide a valid download URL')
    }

    if (data.thumbnail_url && !this.isValidResourceUrl(data.thumbnail_url)) {
      errors.push('Please provide a valid thumbnail URL')
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed')
    }

    if (data.tags && data.tags.some(tag => tag.length > 50)) {
      errors.push('Each tag cannot exceed 50 characters')
    }

    if (data.author_name && data.author_name.length > 255) {
      errors.push('Author name cannot exceed 255 characters')
    }

    if (data.author_bio && data.author_bio.length > 1000) {
      errors.push('Author bio cannot exceed 1000 characters')
    }

    if (data.duration && data.duration.length > 50) {
      errors.push('Duration cannot exceed 50 characters')
    }

    if (data.sort_order !== undefined && (data.sort_order < 0 || !Number.isInteger(data.sort_order))) {
      errors.push('Sort order must be a non-negative integer')
    }

    return { valid: errors.length === 0, errors }
  }

  validateCategoryData(data: Partial<ResourceCategory>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push('Category name is required')
    } else if (data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long')
    } else if (data.name.length > 255) {
      errors.push('Category name cannot exceed 255 characters')
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters')
    }

    if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)')
    }

    if (data.icon && data.icon.length > 100) {
      errors.push('Icon name cannot exceed 100 characters')
    }

    if (data.sort_order !== undefined && (data.sort_order < 0 || !Number.isInteger(data.sort_order))) {
      errors.push('Sort order must be a non-negative integer')
    }

    return { valid: errors.length === 0, errors }
  }

  // PRIVATE: Helper methods
  private getCurrentUserRole(): string {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.role || 'student';
      }
    } catch (error) {
      console.error('Failed to get user role:', error);
    }
    return 'student';
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Time formatting utility
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
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Failed to calculate time ago:', error);
      return 'Unknown time';
    }
  }
}

// Export singleton instance
export const resourcesService = new ResourcesService();
export default resourcesService;