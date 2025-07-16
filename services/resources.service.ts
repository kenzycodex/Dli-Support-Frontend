// services/resources.service.ts (FIXED - Enhanced response parsing like help service)

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

export interface ResourceStats {
  total_resources: number
  total_categories: number
  most_popular_resource?: Pick<Resource, 'id' | 'title' | 'view_count' | 'type'>
  highest_rated_resource?: Pick<Resource, 'id' | 'title' | 'rating' | 'type'>
  most_downloaded_resource?: Pick<Resource, 'id' | 'title' | 'download_count' | 'type'>
  resources_by_type: Record<string, number>
  resources_by_difficulty: Record<string, number>
  categories_with_counts: Pick<ResourceCategory, 'id' | 'name' | 'slug' | 'color'>[]
}

export interface ResourceOptions {
  types: Array<{ value: string; label: string; icon: string }>
  difficulties: Array<{ value: string; label: string; color: string }>
  categories: Pick<ResourceCategory, 'id' | 'name' | 'slug'>[]
}

class ResourcesService {
  // Smart cache for resources
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

  // CRITICAL FIX: Enhanced response parser that handles multiple backend formats (like help service)
  private parseBackendResponse(rawResponse: any): ResourcesResponse {
    console.log('🔍 ResourcesService: Parsing backend response:', rawResponse)

    // Safety check
    if (!rawResponse) {
      console.warn('⚠️ ResourcesService: No response data provided')
      return { resources: [] }
    }

    // STRATEGY 1: Check for direct ResourcesResponse structure
    if (rawResponse.resources && Array.isArray(rawResponse.resources)) {
      console.log('✅ ResourcesService: Found direct resources array format')
      return {
        resources: rawResponse.resources || [],
        featured_resources: rawResponse.featured_resources || rawResponse.resources?.filter((r: Resource) => r.is_featured) || [],
        type_counts: rawResponse.type_counts || {},
        pagination: rawResponse.pagination
      }
    }

    // STRATEGY 2: Check for Laravel paginated response with 'items' array
    if (rawResponse.items && Array.isArray(rawResponse.items)) {
      console.log('✅ ResourcesService: Found Laravel paginated items format')
      return {
        resources: rawResponse.items || [],
        featured_resources: rawResponse.items?.filter((r: Resource) => r.is_featured) || [],
        type_counts: rawResponse.type_counts || {},
        pagination: {
          current_page: rawResponse.current_page || 1,
          last_page: rawResponse.last_page || 1,
          per_page: rawResponse.per_page || rawResponse.items?.length || 0,
          total: rawResponse.total || rawResponse.items?.length || 0,
          from: rawResponse.from,
          to: rawResponse.to,
          has_more_pages: rawResponse.has_more_pages
        }
      }
    }

    // STRATEGY 3: Check for Laravel paginated response with 'data' array
    if (rawResponse.data && Array.isArray(rawResponse.data)) {
      console.log('✅ ResourcesService: Found Laravel paginated data format')
      return {
        resources: rawResponse.data || [],
        featured_resources: rawResponse.data?.filter((r: Resource) => r.is_featured) || [],
        type_counts: rawResponse.type_counts || {},
        pagination: {
          current_page: rawResponse.current_page || 1,
          last_page: rawResponse.last_page || 1,
          per_page: rawResponse.per_page || rawResponse.data?.length || 0,
          total: rawResponse.total || rawResponse.data?.length || 0,
          from: rawResponse.from,
          to: rawResponse.to,
          has_more_pages: rawResponse.has_more_pages
        }
      }
    }

    // STRATEGY 4: Check for nested data structure (data.resources)
    if (rawResponse.data && rawResponse.data.resources && Array.isArray(rawResponse.data.resources)) {
      console.log('✅ ResourcesService: Found nested data.resources format')
      return {
        resources: rawResponse.data.resources || [],
        featured_resources: rawResponse.data.featured_resources || rawResponse.data.resources?.filter((r: Resource) => r.is_featured) || [],
        type_counts: rawResponse.data.type_counts || {},
        pagination: rawResponse.data.pagination || rawResponse.pagination
      }
    }

    // STRATEGY 5: Check for nested data structure (data.items)
    if (rawResponse.data && rawResponse.data.items && Array.isArray(rawResponse.data.items)) {
      console.log('✅ ResourcesService: Found nested data.items format')
      return {
        resources: rawResponse.data.items || [],
        featured_resources: rawResponse.data.items?.filter((r: Resource) => r.is_featured) || [],
        type_counts: rawResponse.data.type_counts || {},
        pagination: {
          current_page: rawResponse.data.current_page || 1,
          last_page: rawResponse.data.last_page || 1,
          per_page: rawResponse.data.per_page || rawResponse.data.items?.length || 0,
          total: rawResponse.data.total || rawResponse.data.items?.length || 0,
          from: rawResponse.data.from,
          to: rawResponse.data.to,
          has_more_pages: rawResponse.data.has_more_pages
        }
      }
    }

    // STRATEGY 6: Direct array response
    if (Array.isArray(rawResponse)) {
      console.log('✅ ResourcesService: Found direct array format')
      return {
        resources: rawResponse || [],
        featured_resources: rawResponse?.filter((r: Resource) => r.is_featured) || [],
        type_counts: {},
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: rawResponse?.length || 0,
          total: rawResponse?.length || 0
        }
      }
    }

    // FALLBACK: Log unknown format and return empty
    console.warn('⚠️ ResourcesService: Unknown response format, returning empty array:', {
      type: typeof rawResponse,
      keys: Object.keys(rawResponse),
      hasData: 'data' in rawResponse,
      hasResources: 'resources' in rawResponse,
      hasItems: 'items' in rawResponse,
      sample: JSON.stringify(rawResponse).substring(0, 200)
    })

    return { resources: [] }
  }

  // FIXED: Enhanced API methods with proper StandardizedApiResponse handling
  async getCategories(options: {
    include_inactive?: boolean
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<{ categories: ResourceCategory[] }>> {
    const { include_inactive = false, userRole, forceRefresh = false } = options
    const cacheKey = this.getCacheKey('/resources/categories', { include_inactive, userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
        status: 200,
        message: 'Categories retrieved from cache',
        data: cached 
      }
    }

    try {
      const queryParams = new URLSearchParams()
      if (include_inactive) {
        queryParams.append('include_inactive', 'true')
      }
      
      const endpoint = `/resources/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get<{ categories: ResourceCategory[] }>(endpoint)

      if (response.success) {
        this.setCache(cacheKey, response.data, this.CATEGORIES_TTL)
      }

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to fetch resource categories'
      }
    }
  }

  // CRITICAL FIX: Enhanced getResources with proper response parsing
  async getResources(filters: ResourceFilters & {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<ResourcesResponse>> {
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

    try {
      const params = new URLSearchParams()
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const endpoint = `/resources${params.toString() ? `?${params.toString()}` : ''}`
      console.log('📡 ResourcesService: Making request to:', endpoint)
      
      const response = await apiClient.get<any>(endpoint)
      console.log('📡 ResourcesService: Raw response:', response)

      if (!response.success) {
        console.error('❌ ResourcesService: Request failed:', response)
        return response
      }

      // CRITICAL FIX: Use enhanced response parser
      const parsedData = this.parseBackendResponse(response.data)
      console.log('✅ ResourcesService: Parsed data:', parsedData)

      // Create the final ResourcesResponse with safe defaults
      const resourcesResponse: ResourcesResponse = {
        resources: parsedData.resources || [],
        featured_resources: parsedData.featured_resources || [],
        type_counts: parsedData.type_counts || {},
        pagination: parsedData.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: parsedData.resources?.length || 0,
          total: parsedData.resources?.length || 0
        }
      }

      console.log('✅ ResourcesService: Final response:', resourcesResponse)

      // Cache the processed response
      if (!forceRefresh && resourcesResponse.resources.length > 0) {
        this.setCache(cacheKey, resourcesResponse, this.DEFAULT_TTL)
      }

      return {
        success: true,
        status: 200,
        message: response.message || 'Resources retrieved successfully',
        data: resourcesResponse
      }

    } catch (error: any) {
      console.error('❌ ResourcesService: Service Error:', error)
      
      // Return stale cache if available on error
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

  async getResource(id: number, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<{
    resource: Resource
    user_feedback?: ResourceFeedback
    related_resources: Resource[]
  }>> {
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

    try {
      const response = await apiClient.get<{
        resource: Resource
        user_feedback?: ResourceFeedback
        related_resources: Resource[]
      }>(`/resources/${id}`)

      if (response.success) {
        this.setCache(cacheKey, response.data, this.DEFAULT_TTL)
      }

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to fetch resource'
      }
    }
  }

  async accessResource(id: number, options: {
    userRole?: string
  } = {}): Promise<StandardizedApiResponse<{
    url: string
    action: 'access' | 'download'
    resource: Pick<Resource, 'id' | 'title' | 'type'>
  }>> {
    try {
      const response = await apiClient.post<{
        url: string
        action: 'access' | 'download'
        resource: Pick<Resource, 'id' | 'title' | 'type'>
      }>(`/resources/${id}/access`)

      // Clear resource cache to update view/download counts
      this.cache.delete(this.getCacheKey(`/resources/${id}`))
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to access resource'
      }
    }
  }

  async provideFeedback(
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean },
    options: {
      userRole?: string
    } = {}
  ): Promise<StandardizedApiResponse<{ feedback: ResourceFeedback }>> {
    try {
      const response = await apiClient.post<{ feedback: ResourceFeedback }>(
        `/resources/${resourceId}/feedback`,
        feedback
      )

      // Clear related caches
      this.cache.delete(this.getCacheKey(`/resources/${resourceId}`))
      this.cache.delete(this.getCacheKey('/resources/stats'))

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to submit feedback'
      }
    }
  }

  async toggleBookmark(resourceId: number, options: {
    userRole?: string
  } = {}): Promise<StandardizedApiResponse<{ bookmarked: boolean }>> {
    try {
      const response = await apiClient.post<{ bookmarked: boolean }>(`/resources/${resourceId}/bookmark`)

      // Clear bookmarks cache
      Array.from(this.cache.keys())
        .filter(key => key.includes('bookmarks'))
        .forEach(key => this.cache.delete(key))

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to toggle bookmark'
      }
    }
  }

  async getBookmarks(
    page: number = 1,
    perPage: number = 20,
    options: {
      userRole?: string
      forceRefresh?: boolean
    } = {}
  ): Promise<StandardizedApiResponse<BookmarksResponse>> {
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

    try {
      const response = await apiClient.get<BookmarksResponse>(
        `/resources/user/bookmarks?page=${page}&per_page=${perPage}`
      )

      if (response.success) {
        this.setCache(cacheKey, response.data, this.DEFAULT_TTL)
      }

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to fetch bookmarks'
      }
    }
  }

  async getStats(options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<{ stats: ResourceStats }>> {
    const { userRole, forceRefresh = false } = options
    const cacheKey = this.getCacheKey('/resources/stats', { userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
        status: 200,
        message: 'Stats retrieved from cache',
        data: cached 
      }
    }

    try {
      const response = await apiClient.get<{ stats: ResourceStats }>('/resources/stats')

      if (response.success) {
        this.setCache(cacheKey, response.data, this.STATS_TTL)
      }

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to fetch resource statistics'
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
      const response = await apiClient.get<ResourceOptions>('/resources/options')

      if (response.success) {
        this.setCache(cacheKey, response.data, this.STATS_TTL) // Long cache for options
      }

      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to fetch resource options'
      }
    }
  }

  async searchResources(
    query: string,
    filters: Omit<ResourceFilters, 'search'> & {
      userRole?: string
      forceRefresh?: boolean
    } = {}
  ): Promise<StandardizedApiResponse<ResourcesResponse>> {
    const { userRole, forceRefresh = false, ...searchFilters } = filters
    return this.getResources({ ...searchFilters, search: query, userRole, forceRefresh })
  }

  // Enhanced methods for featured, popular, and top-rated resources with safe processing
  async getFeaturedResources(limit: number = 3, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      featured: true,
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      // SAFE ACCESS: Use optional chaining and default to empty array
      const featuredResources = response.data.featured_resources || 
                               response.data.resources?.filter(r => r.is_featured) || 
                               []

      return {
        success: true,
        status: 200,
        message: response.message || 'Featured resources retrieved successfully',
        data: featuredResources,
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch featured resources',
    }
  }

  async getPopularResources(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'popular',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      // SAFE ACCESS: Use optional chaining and default to empty array
      return {
        success: true,
        status: 200,
        message: response.message || 'Popular resources retrieved successfully',
        data: response.data.resources || [],
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch popular resources',
    }
  }

  async getTopRatedResources(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'rating',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      // SAFE ACCESS: Use optional chaining and default to empty array
      return {
        success: true,
        status: 200,
        message: response.message || 'Top rated resources retrieved successfully',
        data: response.data.resources || [],
      }
    }

    return {
      success: false,
      status: response.status || 500,
      message: response.message || 'Failed to fetch top rated resources',
    }
  }

  // Admin methods (would need separate API endpoints)
  async createResource(resourceData: Partial<Resource>, userRole?: string): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await apiClient.post<{ resource: Resource }>('/admin/resources', resourceData)
      
      if (response.success) {
        // Clear relevant caches
        this.clearCache()
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to create resource'
      }
    }
  }

  async updateResource(id: number, resourceData: Partial<Resource>, userRole?: string): Promise<StandardizedApiResponse<{ resource: Resource }>> {
    try {
      const response = await apiClient.put<{ resource: Resource }>(`/admin/resources/${id}`, resourceData)
      
      if (response.success) {
        // Clear relevant caches
        this.cache.delete(this.getCacheKey(`/resources/${id}`))
        Array.from(this.cache.keys())
          .filter(key => key.includes('resources'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to update resource'
      }
    }
  }

  async deleteResource(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/admin/resources/${id}`)
      
      if (response.success) {
        // Clear relevant caches
        this.clearCache()
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to delete resource'
      }
    }
  }

  async createCategory(categoryData: Partial<ResourceCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await apiClient.post<{ category: ResourceCategory }>('/admin/resources/categories', categoryData)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to create category'
      }
    }
  }

  async updateCategory(id: number, categoryData: Partial<ResourceCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: ResourceCategory }>> {
    try {
      const response = await apiClient.put<{ category: ResourceCategory }>(`/admin/resources/categories/${id}`, categoryData)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to update category'
      }
    }
  }

  async deleteCategory(id: number, userRole?: string): Promise<StandardizedApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/admin/resources/categories/${id}`)
      
      if (response.success) {
        // Clear categories cache
        Array.from(this.cache.keys())
          .filter(key => key.includes('categories'))
          .forEach(key => this.cache.delete(key))
      }
      
      return response
    } catch (error) {
      return {
        success: false,
        status: 500,
        message: 'Failed to delete category'
      }
    }
  }

  // Utility methods - All SAFE with proper defaults
  formatDuration(duration?: string): string {
    if (!duration) return 'Self-paced'
    return duration
  }

  // Safe rating formatter
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
}

export const resourcesService = new ResourcesService()