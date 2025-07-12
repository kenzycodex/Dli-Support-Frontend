// services/help.service.ts (FIXED - Stable caching without constant reloading)
import { apiClient, ApiResponse } from '@/lib/api'

// Enhanced interfaces with stable caching
export interface HelpCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  faqs_count?: number
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: number
  category_id: number
  question: string
  answer: string
  slug: string
  tags: string[]
  sort_order: number
  is_published: boolean
  is_featured: boolean
  helpful_count: number
  not_helpful_count: number
  view_count: number
  created_by?: number
  updated_by?: number
  published_at?: string
  created_at: string
  updated_at: string
  category?: HelpCategory
  creator?: {
    id: number
    name: string
    email: string
  }
  helpfulness_rate?: number
  time_ago?: string
}

export interface FAQFeedback {
  id: number
  faq_id: number
  user_id: number
  is_helpful: boolean
  comment?: string
  ip_address?: string
  created_at: string
  updated_at: string
}

export interface FAQFilters {
  category?: string
  search?: string
  featured?: boolean
  sort_by?: 'featured' | 'helpful' | 'views' | 'newest'
  per_page?: number
  page?: number
  include_drafts?: boolean
  include_inactive?: boolean
}

export interface FAQsResponse {
  faqs: FAQ[]
  featured_faqs: FAQ[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface HelpStats {
  total_faqs: number
  total_categories: number
  most_helpful_faq?: Pick<FAQ, 'id' | 'question' | 'helpful_count'>
  most_viewed_faq?: Pick<FAQ, 'id' | 'question' | 'view_count'>
  recent_faqs: Pick<FAQ, 'id' | 'question' | 'published_at' | 'is_published' | 'view_count'>[]
  categories_with_counts: Pick<HelpCategory, 'id' | 'name' | 'slug' | 'color' | 'faqs_count'>[]
}

export interface ContentSuggestion {
  id?: number
  category_id: number
  question: string
  answer: string
  tags?: string[]
  status?: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  admin_feedback?: string
  submitted_at?: string
  counselor?: {
    id: number
    name: string
    email: string
  }
}

export interface ContentSuggestionItem {
  id: number
  category_id: number
  question: string
  answer: string
  slug: string
  tags: string[]
  is_published: boolean
  is_featured: boolean
  created_by: number
  created_at: string
  updated_at: string
  category?: HelpCategory
  creator?: {
    id: number
    name: string
    email: string
  }
}

export interface ContentSuggestionsResponse {
  suggestions: ContentSuggestionItem[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Stable cache implementation
class HelpCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes - longer for stability
  private readonly STATS_TTL = 15 * 60 * 1000 // 15 minutes for stats
  private readonly FAQ_TTL = 8 * 60 * 1000 // 8 minutes for FAQs

  set(key: string, data: any, ttl?: number): void {
    const timestamp = Date.now()
    const cacheEntry = {
      data,
      timestamp,
      ttl: ttl || this.DEFAULT_TTL
    }
    this.cache.set(key, cacheEntry)
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp
    const isStale = age > entry.ttl

    // Return data even if stale, but mark it as stale
    return {
      data: entry.data as T,
      isStale
    }
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern) || new RegExp(pattern).test(key)
      )
      keys.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 3) { // Remove entries older than 3x TTL
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      entries: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    }
  }
}

// Global cache instance
const helpCache = new HelpCache()

class HelpService {
  // Role validation helper
  private validateRole(requiredRoles: string[], userRole?: string): boolean {
    if (!userRole) return false
    return requiredRoles.includes(userRole)
  }

  // Enhanced cache key generation
  private getCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `help:${endpoint}:${paramString}`
  }

  // =============================================================================
  // BASIC OPERATIONS WITH STABLE CACHING
  // =============================================================================

  // Get help categories with stable caching
  async getCategories(options: { 
    include_inactive?: boolean 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<ApiResponse<{ categories: HelpCategory[] }>> {
    const { forceRefresh = false, userRole } = options
    const cacheKey = this.getCacheKey('categories', options)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ categories: HelpCategory[] }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'Categories retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const params = new URLSearchParams()
      if (options.include_inactive && this.validateRole(['admin'], userRole)) {
        params.append('include_inactive', 'true')
      }
      
      const endpoint = `/help/categories${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiClient.get<{ categories: HelpCategory[] }>(endpoint)

      // Cache successful response
      if (response.success && response.data) {
        helpCache.set(cacheKey, response.data, helpCache['DEFAULT_TTL'])
      }

      return response
    } catch (error: any) {
      // Return stale cache if available on error
      const cached = helpCache.get<{ categories: HelpCategory[] }>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'Categories retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get FAQs with stable caching
  async getFAQs(filters: FAQFilters & { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<ApiResponse<FAQsResponse>> {
    const { forceRefresh = false, userRole, ...apiFilters } = filters
    const cacheKey = this.getCacheKey('faqs', apiFilters)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'FAQs retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const params = new URLSearchParams()
      
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Role-based filtering
          if (key === 'include_drafts' && !this.validateRole(['admin'], userRole)) {
            return // Skip if not admin
          }
          params.append(key, value.toString())
        }
      })

      const endpoint = `/help/faqs${params.toString() ? `?${params.toString()}` : ''}`
      const response = await apiClient.get<FAQsResponse>(endpoint)

      // Cache successful response
      if (response.success && response.data) {
        helpCache.set(cacheKey, response.data, helpCache['FAQ_TTL'])
      }

      return response
    } catch (error: any) {
      // Return stale cache if available on error
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get single FAQ with caching
  async getFAQ(id: number, options: { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<ApiResponse<{ faq: FAQ; user_feedback?: FAQFeedback }>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('faq', { id })

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ faq: FAQ; user_feedback?: FAQFeedback }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'FAQ retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const response = await apiClient.get<{ faq: FAQ; user_feedback?: FAQFeedback }>(`/help/faqs/${id}`)

      // Cache successful response
      if (response.success && response.data) {
        helpCache.set(cacheKey, response.data, helpCache['FAQ_TTL'])
      }

      return response
    } catch (error: any) {
      // Return stale cache if available on error
      const cached = helpCache.get<{ faq: FAQ; user_feedback?: FAQFeedback }>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'FAQ retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get help statistics with stable caching
  async getStats(options: { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<ApiResponse<{ stats: HelpStats }>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('stats', {})

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ stats: HelpStats }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'Stats retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const response = await apiClient.get<{ stats: HelpStats }>('/help/stats')

      // Cache successful response with longer TTL
      if (response.success && response.data) {
        helpCache.set(cacheKey, response.data, helpCache['STATS_TTL'])
      }

      return response
    } catch (error: any) {
      // Return stale cache if available on error
      const cached = helpCache.get<{ stats: HelpStats }>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'Stats retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Provide feedback with selective cache invalidation
  async provideFeedback(
    faqId: number, 
    feedback: { is_helpful: boolean; comment?: string },
    options: { userRole?: string } = {}
  ): Promise<ApiResponse<{ feedback: FAQFeedback }>> {
    try {
      const response = await apiClient.post<{ feedback: FAQFeedback }>(`/help/faqs/${faqId}/feedback`, feedback)

      if (response.success) {
        // Only invalidate specific caches
        helpCache.invalidate(`faq.*${faqId}`)
        helpCache.invalidate('stats')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Suggest content with role validation
  async suggestContent(
    suggestion: ContentSuggestion,
    options: { userRole?: string } = {}
  ): Promise<ApiResponse<{ faq: FAQ }>> {
    const { userRole } = options

    // Validate role
    if (!this.validateRole(['counselor', 'admin'], userRole)) {
      return {
        success: false,
        message: 'Only counselors and administrators can suggest content.',
        status: 403
      }
    }

    try {
      const response = await apiClient.post<{ faq: FAQ }>('/help/suggest-content', suggestion)

      if (response.success) {
        // Invalidate relevant caches
        helpCache.invalidate('faqs')
        helpCache.invalidate('stats')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // =============================================================================
  // SPECIALIZED GETTERS WITH STABLE CACHING
  // =============================================================================

  // Get popular FAQs with stable caching
  async getPopularFAQs(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<FAQ[]>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('popular', { limit })

    if (!forceRefresh) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'Popular FAQs retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const response = await this.getFAQs({ 
        sort_by: 'helpful', 
        per_page: limit,
        forceRefresh: true // Get fresh data for processing
      })
      
      if (response.success && response.data) {
        const popularFAQs = response.data.faqs
        
        if (!forceRefresh) {
          helpCache.set(cacheKey, popularFAQs, helpCache['FAQ_TTL'])
        }

        return {
          success: true,
          message: response.message,
          data: popularFAQs
        }
      }
      
      return {
        success: false,
        message: response.message || 'Failed to fetch popular FAQs',
        errors: response.errors
      }
    } catch (error: any) {
      // Return stale cache if available
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'Popular FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get featured FAQs with stable caching
  async getFeaturedFAQs(limit: number = 3, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<ApiResponse<FAQ[]>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('featured', { limit })

    if (!forceRefresh) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          message: 'Featured FAQs retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const response = await this.getFAQs({ 
        featured: true, 
        per_page: limit,
        forceRefresh: true
      })
      
      if (response.success && response.data) {
        const featuredFAQs = response.data.featured_faqs.length > 0 
          ? response.data.featured_faqs 
          : response.data.faqs.filter(faq => faq.is_featured)
        
        if (!forceRefresh) {
          helpCache.set(cacheKey, featuredFAQs, helpCache['FAQ_TTL'])
        }

        return {
          success: true,
          message: response.message,
          data: featuredFAQs
        }
      }
      
      return {
        success: false,
        message: response.message || 'Failed to fetch featured FAQs',
        errors: response.errors
      }
    } catch (error: any) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached) {
        return {
          success: true,
          message: 'Featured FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // =============================================================================
  // ADMIN-ONLY METHODS WITH ROLE VALIDATION
  // =============================================================================

  // Create FAQ (Admin only)
  async createFAQ(faqData: Partial<FAQ>, userRole?: string): Promise<ApiResponse<{ faq: FAQ }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can create FAQs.',
        status: 403
      }
    }

    try {
      const response = await apiClient.post<{ faq: FAQ }>('/admin/help/faqs', faqData)

      if (response.success) {
        // Invalidate all FAQ-related caches
        helpCache.invalidate('faqs')
        helpCache.invalidate('categories')
        helpCache.invalidate('stats')
        helpCache.invalidate('featured')
        helpCache.invalidate('popular')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Update FAQ (Admin only)
  async updateFAQ(id: number, faqData: Partial<FAQ>, userRole?: string): Promise<ApiResponse<{ faq: FAQ }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can update FAQs.',
        status: 403
      }
    }

    try {
      const response = await apiClient.put<{ faq: FAQ }>(`/admin/help/faqs/${id}`, faqData)

      if (response.success) {
        // Invalidate specific FAQ and related caches
        helpCache.invalidate(`faq.*${id}`)
        helpCache.invalidate('faqs')
        helpCache.invalidate('stats')
        helpCache.invalidate('featured')
        helpCache.invalidate('popular')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Delete FAQ (Admin only)
  async deleteFAQ(id: number, userRole?: string): Promise<ApiResponse<{ message: string }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can delete FAQs.',
        status: 403
      }
    }

    try {
      const response = await apiClient.delete<{ message: string }>(`/admin/help/faqs/${id}`)

      if (response.success) {
        // Invalidate all related caches
        helpCache.invalidate(`faq.*${id}`)
        helpCache.invalidate('faqs')
        helpCache.invalidate('categories')
        helpCache.invalidate('stats')
        helpCache.invalidate('featured')
        helpCache.invalidate('popular')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Create Category (Admin only)
  async createCategory(categoryData: Partial<HelpCategory>, userRole?: string): Promise<ApiResponse<{ category: HelpCategory }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can create categories.',
        status: 403
      }
    }

    try {
      const response = await apiClient.post<{ category: HelpCategory }>('/admin/help/categories', categoryData)

      if (response.success) {
        helpCache.invalidate('categories')
        helpCache.invalidate('stats')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Update Category (Admin only)
  async updateCategory(id: number, categoryData: Partial<HelpCategory>, userRole?: string): Promise<ApiResponse<{ category: HelpCategory }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can update categories.',
        status: 403
      }
    }

    try {
      const response = await apiClient.put<{ category: HelpCategory }>(`/admin/help/categories/${id}`, categoryData)

      if (response.success) {
        helpCache.invalidate('categories')
        helpCache.invalidate('stats')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // Delete Category (Admin only)
  async deleteCategory(id: number, userRole?: string): Promise<ApiResponse<{ message: string }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        message: 'Only administrators can delete categories.',
        status: 403
      }
    }

    try {
      const response = await apiClient.delete<{ message: string }>(`/admin/help/categories/${id}`)

      if (response.success) {
        helpCache.invalidate('categories')
        helpCache.invalidate('stats')
      }

      return response
    } catch (error: any) {
      throw error
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  // Check if user can suggest content
  canSuggestContent(userRole: string): boolean {
    return this.validateRole(['counselor', 'admin'], userRole)
  }

  // Check if user can manage content
  canManageContent(userRole: string): boolean {
    return this.validateRole(['admin'], userRole)
  }

  // Calculate helpfulness rate
  calculateHelpfulnessRate(helpful: number, notHelpful: number): number {
    const total = helpful + notHelpful
    if (total === 0) return 0
    return Math.round((helpful / total) * 100)
  }

  // Format time ago string
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  // Clear cache manually
  clearCache(pattern?: string): void {
    helpCache.invalidate(pattern)
  }

  // Get cache statistics
  getCacheStats() {
    return helpCache.getStats()
  }

  // Force refresh all data
  async forceRefreshAll(userRole?: string): Promise<void> {
    try {
      await Promise.allSettled([
        this.getCategories({ userRole, forceRefresh: true }),
        this.getFAQs({ userRole, forceRefresh: true }),
        this.getStats({ userRole, forceRefresh: true })
      ])
    } catch (error) {
      console.warn('Failed to refresh some help data:', error)
    }
  }
}

// Create and export a singleton instance
export const helpService = new HelpService()

// Export cache for external access if needed
export { helpCache }