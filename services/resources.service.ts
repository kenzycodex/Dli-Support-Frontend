// services/resources.service.ts (FIXED - All TypeScript errors resolved)
import { apiClient, ApiResponse } from '@/lib/api'

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
  featured_resources: Resource[]
  type_counts: Record<string, number>
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
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

  // FIXED: Enhanced API methods with proper ApiResponse handling
  async getCategories(options: {
    include_inactive?: boolean
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<{ categories: ResourceCategory[] }>> {
    const { include_inactive = false, userRole, forceRefresh = false } = options
    const cacheKey = this.getCacheKey('/resources/categories', { include_inactive, userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
        message: 'Categories retrieved from cache',
        data: cached 
      }
    }

    try {
      // FIXED: Proper API call without invalid params property
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
        message: 'Failed to fetch resource categories',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getResources(filters: ResourceFilters & {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<ResourcesResponse>> {
    const { userRole, forceRefresh = false, ...apiFilters } = filters
    const cacheKey = this.getCacheKey('/resources', { ...apiFilters, userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
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
      const response = await apiClient.get<ResourcesResponse>(endpoint)

      if (response.success) {
        this.setCache(cacheKey, response.data, this.DEFAULT_TTL)
      }

      return response
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch resources',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getResource(id: number, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<{
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
        message: 'Failed to fetch resource',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async accessResource(id: number, options: {
    userRole?: string
  } = {}): Promise<ApiResponse<{
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
        message: 'Failed to access resource',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async provideFeedback(
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean },
    options: {
      userRole?: string
    } = {}
  ): Promise<ApiResponse<{ feedback: ResourceFeedback }>> {
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
        message: 'Failed to submit feedback',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async toggleBookmark(resourceId: number, options: {
    userRole?: string
  } = {}): Promise<ApiResponse<{ bookmarked: boolean }>> {
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
        message: 'Failed to toggle bookmark',
        errors: [error instanceof Error ? error.message : 'Unknown error']
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
  ): Promise<ApiResponse<BookmarksResponse>> {
    const { userRole, forceRefresh = false } = options
    const cacheKey = this.getCacheKey('/resources/user/bookmarks', { page, per_page: perPage, userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
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
        message: 'Failed to fetch bookmarks',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getStats(options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<{ stats: ResourceStats }>> {
    const { userRole, forceRefresh = false } = options
    const cacheKey = this.getCacheKey('/resources/stats', { userRole })

    if (!forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) return { 
        success: true, 
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
        message: 'Failed to fetch resource statistics',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async getOptions(): Promise<ApiResponse<ResourceOptions>> {
    const cacheKey = this.getCacheKey('/resources/options')
    const cached = this.getCache(cacheKey)
    if (cached) return { 
      success: true, 
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
        message: 'Failed to fetch resource options',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async searchResources(
    query: string,
    filters: Omit<ResourceFilters, 'search'> & {
      userRole?: string
      forceRefresh?: boolean
    } = {}
  ): Promise<ApiResponse<ResourcesResponse>> {
    const { userRole, forceRefresh = false, ...searchFilters } = filters
    return this.getResources({ ...searchFilters, search: query, userRole, forceRefresh })
  }

  // Enhanced methods for featured, popular, and top-rated resources
  async getFeaturedResources(limit: number = 3, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      featured: true,
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || 'Featured resources retrieved successfully',
        data: response.data.featured_resources || response.data.resources || [],
      }
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch featured resources',
      errors: response.errors,
    }
  }

  async getPopularResources(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'popular',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || 'Popular resources retrieved successfully',
        data: response.data.resources || [],
      }
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch popular resources',
      errors: response.errors,
    }
  }

  async getTopRatedResources(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'rating',
      per_page: limit,
      ...options
    })

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || 'Top rated resources retrieved successfully',
        data: response.data.resources || [],
      }
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch top rated resources',
      errors: response.errors,
    }
  }

  // Admin methods (would need separate API endpoints)
  async createResource(resourceData: Partial<Resource>, userRole?: string): Promise<ApiResponse<{ resource: Resource }>> {
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
        message: 'Failed to create resource',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async updateResource(id: number, resourceData: Partial<Resource>, userRole?: string): Promise<ApiResponse<{ resource: Resource }>> {
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
        message: 'Failed to update resource',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async deleteResource(id: number, userRole?: string): Promise<ApiResponse<void>> {
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
        message: 'Failed to delete resource',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async createCategory(categoryData: Partial<ResourceCategory>, userRole?: string): Promise<ApiResponse<{ category: ResourceCategory }>> {
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
        message: 'Failed to create category',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async updateCategory(id: number, categoryData: Partial<ResourceCategory>, userRole?: string): Promise<ApiResponse<{ category: ResourceCategory }>> {
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
        message: 'Failed to update category',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async deleteCategory(id: number, userRole?: string): Promise<ApiResponse<void>> {
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
        message: 'Failed to delete category',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Utility methods
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