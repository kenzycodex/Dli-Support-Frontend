// services/help.service.ts - FINAL FIX: Correct response parsing and TypeScript compatibility

import { apiClient, type StandardizedApiResponse } from '@/lib/api'

// Enhanced interfaces aligned with your backend workflow
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
  featured_faqs?: FAQ[]
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

// Stable cache implementation aligned with your backend caching
class HelpCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes
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
      if (now - entry.timestamp > entry.ttl * 3) {
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

  // CRITICAL FIX: Enhanced response parser that handles multiple backend formats
  private parseBackendResponse(rawResponse: any): { faqs: FAQ[]; featured_faqs?: FAQ[]; pagination?: any } {
    console.log('🔍 HelpService: Parsing backend response:', rawResponse)

    // Safety check
    if (!rawResponse) {
      console.warn('⚠️ HelpService: No response data provided')
      return { faqs: [] }
    }

    // STRATEGY 1: Check for direct FAQsResponse structure
    if (rawResponse.faqs && Array.isArray(rawResponse.faqs)) {
      console.log('✅ HelpService: Found direct faqs array format')
      return {
        faqs: rawResponse.faqs,
        featured_faqs: rawResponse.featured_faqs || rawResponse.faqs.filter((faq: FAQ) => faq.is_featured),
        pagination: rawResponse.pagination
      }
    }

    // STRATEGY 2: Check for Laravel paginated response with 'items' array
    if (rawResponse.items && Array.isArray(rawResponse.items)) {
      console.log('✅ HelpService: Found Laravel paginated items format')
      return {
        faqs: rawResponse.items,
        featured_faqs: rawResponse.items.filter((faq: FAQ) => faq.is_featured),
        pagination: {
          current_page: rawResponse.current_page || 1,
          last_page: rawResponse.last_page || 1,
          per_page: rawResponse.per_page || rawResponse.items.length,
          total: rawResponse.total || rawResponse.items.length,
          from: rawResponse.from,
          to: rawResponse.to,
          has_more_pages: rawResponse.has_more_pages
        }
      }
    }

    // STRATEGY 3: Check for Laravel paginated response with 'data' array
    if (rawResponse.data && Array.isArray(rawResponse.data)) {
      console.log('✅ HelpService: Found Laravel paginated data format')
      return {
        faqs: rawResponse.data,
        featured_faqs: rawResponse.data.filter((faq: FAQ) => faq.is_featured),
        pagination: {
          current_page: rawResponse.current_page || 1,
          last_page: rawResponse.last_page || 1,
          per_page: rawResponse.per_page || rawResponse.data.length,
          total: rawResponse.total || rawResponse.data.length,
          from: rawResponse.from,
          to: rawResponse.to,
          has_more_pages: rawResponse.has_more_pages
        }
      }
    }

    // STRATEGY 4: Check for nested data structure (data.faqs)
    if (rawResponse.data && rawResponse.data.faqs && Array.isArray(rawResponse.data.faqs)) {
      console.log('✅ HelpService: Found nested data.faqs format')
      return {
        faqs: rawResponse.data.faqs,
        featured_faqs: rawResponse.data.featured_faqs || rawResponse.data.faqs.filter((faq: FAQ) => faq.is_featured),
        pagination: rawResponse.data.pagination || rawResponse.pagination
      }
    }

    // STRATEGY 5: Check for nested data structure (data.items)
    if (rawResponse.data && rawResponse.data.items && Array.isArray(rawResponse.data.items)) {
      console.log('✅ HelpService: Found nested data.items format')
      return {
        faqs: rawResponse.data.items,
        featured_faqs: rawResponse.data.items.filter((faq: FAQ) => faq.is_featured),
        pagination: {
          current_page: rawResponse.data.current_page || 1,
          last_page: rawResponse.data.last_page || 1,
          per_page: rawResponse.data.per_page || rawResponse.data.items.length,
          total: rawResponse.data.total || rawResponse.data.items.length,
          from: rawResponse.data.from,
          to: rawResponse.data.to,
          has_more_pages: rawResponse.data.has_more_pages
        }
      }
    }

    // STRATEGY 6: Direct array response
    if (Array.isArray(rawResponse)) {
      console.log('✅ HelpService: Found direct array format')
      return {
        faqs: rawResponse,
        featured_faqs: rawResponse.filter((faq: FAQ) => faq.is_featured),
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: rawResponse.length,
          total: rawResponse.length
        }
      }
    }

    // FALLBACK: Log unknown format and return empty
    console.warn('⚠️ HelpService: Unknown response format, returning empty array:', {
      type: typeof rawResponse,
      keys: Object.keys(rawResponse),
      hasData: 'data' in rawResponse,
      hasFaqs: 'faqs' in rawResponse,
      hasItems: 'items' in rawResponse,
      sample: JSON.stringify(rawResponse).substring(0, 200)
    })

    return { faqs: [] }
  }

  // =============================================================================
  // BASIC OPERATIONS - Aligned with your backend controllers
  // =============================================================================

  // Get help categories - aligned with HelpController@getCategories
  async getCategories(options: { 
    include_inactive?: boolean 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<{ categories: HelpCategory[] }>> {
    const { forceRefresh = false, userRole } = options
    const cacheKey = this.getCacheKey('categories', options)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ categories: HelpCategory[] }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
          status: 200,
          message: 'Categories retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // CRITICAL FIX: Get FAQs with enhanced response parsing
  async getFAQs(filters: FAQFilters & { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    const { forceRefresh = false, userRole, ...apiFilters } = filters
    const cacheKey = this.getCacheKey('faqs', apiFilters)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
      console.log('📡 HelpService: Making FAQ request to:', endpoint)
      
      const response = await apiClient.get<any>(endpoint)
      console.log('📡 HelpService: Raw FAQ response:', response)

      if (!response.success) {
        console.error('❌ HelpService: FAQ request failed:', response)
        return response
      }

      // CRITICAL FIX: Use enhanced response parser
      const parsedData = this.parseBackendResponse(response.data)
      console.log('✅ HelpService: Parsed FAQ data:', parsedData)

      // Create the final FAQsResponse
      const faqsResponse: FAQsResponse = {
        faqs: parsedData.faqs || [],
        featured_faqs: parsedData.featured_faqs || [],
        pagination: parsedData.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: parsedData.faqs?.length || 0,
          total: parsedData.faqs?.length || 0
        }
      }

      console.log('✅ HelpService: Final FAQ Response:', faqsResponse)

      // Cache the processed response
      if (!forceRefresh && faqsResponse.faqs.length > 0) {
        helpCache.set(cacheKey, faqsResponse, helpCache['FAQ_TTL'])
      }

      return {
        success: true,
        status: 200,
        message: response.message || 'FAQs retrieved successfully',
        data: faqsResponse
      }

    } catch (error: any) {
      console.error('❌ HelpService: FAQ Service Error:', error)
      
      // Return stale cache if available on error
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached) {
        console.log('📋 HelpService: Returning cached FAQ data due to error')
        return {
          success: true,
          status: 200,
          message: 'FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get single FAQ - aligned with HelpController@showFAQ
  async getFAQ(id: number, options: { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<{ faq: FAQ; user_feedback?: FAQFeedback }>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('faq', { id })

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ faq: FAQ; user_feedback?: FAQFeedback }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
          status: 200,
          message: 'FAQ retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get help statistics - aligned with HelpController@getStats
  async getStats(options: { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<{ stats: HelpStats }>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('stats', {})

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ stats: HelpStats }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
          status: 200,
          message: 'Stats retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Provide feedback - aligned with HelpController@provideFeedback
  async provideFeedback(
    faqId: number, 
    feedback: { is_helpful: boolean; comment?: string },
    options: { userRole?: string } = {}
  ): Promise<StandardizedApiResponse<{ feedback: FAQFeedback }>> {
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

  // Suggest content - aligned with HelpController@suggestContent
  async suggestContent(
    suggestion: ContentSuggestion,
    options: { userRole?: string } = {}
  ): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    const { userRole } = options

    // Validate role
    if (!this.validateRole(['counselor', 'admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only counselors and administrators can suggest content.'
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
  // SPECIALIZED GETTERS - FIXED: Better response handling
  // =============================================================================

  // Get popular FAQs - FIXED: Better response handling
  async getPopularFAQs(limit: number = 5, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<FAQ[]>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('popular', { limit })

    if (!forceRefresh) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
      
      if (response.success && response.data && response.data.faqs) {
        const popularFAQs = response.data.faqs
        
        if (!forceRefresh) {
          helpCache.set(cacheKey, popularFAQs, helpCache['FAQ_TTL'])
        }

        return {
          success: true,
          status: 200,
          message: response.message,
          data: popularFAQs
        }
      }
      
      return {
        success: false,
        status: response.status || 500,
        message: response.message || 'Failed to fetch popular FAQs',
        errors: response.errors
      }
    } catch (error: any) {
      // Return stale cache if available
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached) {
        return {
          success: true,
          status: 200,
          message: 'Popular FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get featured FAQs - FIXED: Better response handling
  async getFeaturedFAQs(limit: number = 3, options: {
    userRole?: string
    forceRefresh?: boolean
  } = {}): Promise<StandardizedApiResponse<FAQ[]>> {
    const { forceRefresh = false } = options
    const cacheKey = this.getCacheKey('featured', { limit })

    if (!forceRefresh) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
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
        let featuredFAQs: FAQ[] = []
        
        // Try to get from featured_faqs first, then filter from main faqs
        if (response.data.featured_faqs && response.data.featured_faqs.length > 0) {
          featuredFAQs = response.data.featured_faqs
        } else if (response.data.faqs) {
          featuredFAQs = response.data.faqs.filter((faq: FAQ) => faq.is_featured)
        }
        
        if (!forceRefresh) {
          helpCache.set(cacheKey, featuredFAQs, helpCache['FAQ_TTL'])
        }

        return {
          success: true,
          status: 200,
          message: response.message,
          data: featuredFAQs
        }
      }
      
      return {
        success: false,
        status: response.status || 500,
        message: response.message || 'Failed to fetch featured FAQs',
        errors: response.errors
      }
    } catch (error: any) {
      const cached = helpCache.get<FAQ[]>(cacheKey)
      if (cached) {
        return {
          success: true,
          status: 200,
          message: 'Featured FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // =============================================================================
  // ADMIN-ONLY METHODS - Aligned with AdminHelpController
  // =============================================================================

  // Create FAQ (Admin only) - aligned with AdminHelpController@storeFAQ
  async createFAQ(faqData: Partial<FAQ>, userRole?: string): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can create FAQs.'
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

  // Update FAQ (Admin only) - aligned with AdminHelpController@updateFAQ
  async updateFAQ(id: number, faqData: Partial<FAQ>, userRole?: string): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can update FAQs.'
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

  // Delete FAQ (Admin only) - aligned with AdminHelpController@destroyFAQ
  async deleteFAQ(id: number, userRole?: string): Promise<StandardizedApiResponse<{ message: string }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can delete FAQs.'
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

  // Create Category (Admin only) - aligned with AdminHelpController@storeCategory
  async createCategory(categoryData: Partial<HelpCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can create categories.'
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

  // Update Category (Admin only) - aligned with AdminHelpController@updateCategory
  async updateCategory(id: number, categoryData: Partial<HelpCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can update categories.'
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

  // Delete Category (Admin only) - continued from previous artifact
  async deleteCategory(id: number, userRole?: string): Promise<StandardizedApiResponse<{ message: string }>> {
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can delete categories.'
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

  // ADMIN METHODS: Get admin FAQs with enhanced parsing
  async getAdminFAQs(filters: FAQFilters & { 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    const { forceRefresh = false, userRole, ...apiFilters } = filters
    
    // Ensure admin role
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can access admin FAQ management.'
      }
    }

    const cacheKey = this.getCacheKey('admin_faqs', apiFilters)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
          message: 'Admin FAQs retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const params = new URLSearchParams()
      
      // Add include_drafts for admin by default
      params.append('include_drafts', 'true')
      
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const endpoint = `/admin/help/faqs${params.toString() ? `?${params.toString()}` : ''}`
      console.log('📡 HelpService: Making Admin FAQ request to:', endpoint)
      
      const response = await apiClient.get<any>(endpoint)
      console.log('📡 HelpService: Raw Admin FAQ response:', response)

      if (!response.success) {
        console.error('❌ HelpService: Admin FAQ request failed:', response)
        return response
      }

      // Use the same enhanced response parser
      const parsedData = this.parseBackendResponse(response.data)
      console.log('✅ HelpService: Parsed Admin FAQ data:', parsedData)

      const faqsResponse: FAQsResponse = {
        faqs: parsedData.faqs || [],
        featured_faqs: parsedData.featured_faqs || [],
        pagination: parsedData.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: parsedData.faqs?.length || 0,
          total: parsedData.faqs?.length || 0
        }
      }

      // Cache the processed response
      if (!forceRefresh && faqsResponse.faqs.length > 0) {
        helpCache.set(cacheKey, faqsResponse, helpCache['FAQ_TTL'])
      }

      return {
        success: true,
        status: 200,
        message: response.message || 'Admin FAQs retrieved successfully',
        data: faqsResponse
      }

    } catch (error: any) {
      console.error('❌ HelpService: Admin FAQ Service Error:', error)
      
      // Return stale cache if available on error
      const cached = helpCache.get<FAQsResponse>(cacheKey)
      if (cached) {
        console.log('📋 HelpService: Returning cached Admin FAQ data due to error')
        return {
          success: true,
          status: 200,
          message: 'Admin FAQs retrieved from cache',
          data: cached.data
        }
      }
      throw error
    }
  }

  // Get admin categories with enhanced parsing
  async getAdminCategories(options: { 
    include_inactive?: boolean 
    userRole?: string
    forceRefresh?: boolean 
  } = {}): Promise<StandardizedApiResponse<{ categories: HelpCategory[] }>> {
    const { forceRefresh = false, userRole } = options
    
    // Ensure admin role
    if (!this.validateRole(['admin'], userRole)) {
      return {
        success: false,
        status: 403,
        message: 'Only administrators can access admin category management.'
      }
    }

    const cacheKey = this.getCacheKey('admin_categories', options)

    // Try cache first unless force refresh
    if (!forceRefresh) {
      const cached = helpCache.get<{ categories: HelpCategory[] }>(cacheKey)
      if (cached && !cached.isStale) {
        return {
          success: true,
          status: 200,
          message: 'Admin categories retrieved successfully',
          data: cached.data
        }
      }
    }

    try {
      const params = new URLSearchParams()
      params.append('include_inactive', 'true') // Admin should see all categories
      
      const endpoint = `/admin/help/categories${params.toString() ? `?${params.toString()}` : ''}`
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
          status: 200,
          message: 'Admin categories retrieved from cache',
          data: cached.data
        }
      }
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

  // Enhanced validation for FAQ data
  validateFAQData(data: Partial<FAQ>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.question || !data.question.trim()) {
      errors.push('Question is required')
    } else if (data.question.length < 10) {
      errors.push('Question must be at least 10 characters long')
    } else if (data.question.length > 500) {
      errors.push('Question cannot exceed 500 characters')
    }

    if (!data.answer || !data.answer.trim()) {
      errors.push('Answer is required')
    } else if (data.answer.length < 20) {
      errors.push('Answer must be at least 20 characters long')
    } else if (data.answer.length > 5000) {
      errors.push('Answer cannot exceed 5000 characters')
    }

    if (!data.category_id) {
      errors.push('Category is required')
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed')
    }

    if (data.tags) {
      for (const tag of data.tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          errors.push('Each tag must be a string with maximum 50 characters')
          break
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // Enhanced validation for category data
  validateCategoryData(data: Partial<HelpCategory>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || !data.name.trim()) {
      errors.push('Category name is required')
    } else if (data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long')
    } else if (data.name.length > 100) {
      errors.push('Category name cannot exceed 100 characters')
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters')
    }

    if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)')
    }

    if (data.sort_order !== undefined && (data.sort_order < 0 || !Number.isInteger(data.sort_order))) {
      errors.push('Sort order must be a non-negative integer')
    }

    return { valid: errors.length === 0, errors }
  }

  // Check response health and structure
  validateResponseStructure(response: any): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!response) {
      issues.push('Response is null or undefined')
      return { valid: false, issues }
    }

    if (typeof response !== 'object') {
      issues.push('Response is not an object')
      return { valid: false, issues }
    }

    // Check for common Laravel response patterns
    const hasItems = response.items && Array.isArray(response.items)
    const hasData = response.data && Array.isArray(response.data)
    const hasFaqs = response.faqs && Array.isArray(response.faqs)
    const isDirectArray = Array.isArray(response)

    if (!hasItems && !hasData && !hasFaqs && !isDirectArray) {
      issues.push('Response does not contain expected array data (items, data, faqs, or direct array)')
    }

    // Check pagination structure if present
    if (response.current_page !== undefined) {
      if (typeof response.current_page !== 'number') {
        issues.push('current_page should be a number')
      }
      if (typeof response.total !== 'number') {
        issues.push('total should be a number when current_page is present')
      }
    }

    return { valid: issues.length === 0, issues }
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

  // Health check for service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  // Debug information
  getDebugInfo(): {
    cacheStats: any
    apiBaseUrl: string
    hasAuthToken: boolean
    supportedResponseFormats: string[]
  } {
    return {
      cacheStats: this.getCacheStats(),
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
      hasAuthToken: !!localStorage?.getItem('auth_token'),
      supportedResponseFormats: [
        'direct faqs array',
        'Laravel paginated items',
        'Laravel paginated data',
        'nested data.faqs',
        'nested data.items',
        'direct array response'
      ]
    }
  }

  // Test response parsing with sample data
  testResponseParsing(sampleResponse: any): { parsed: any; issues: string[] } {
    try {
      const validation = this.validateResponseStructure(sampleResponse)
      const parsed = this.parseBackendResponse(sampleResponse)
      
      return {
        parsed,
        issues: validation.issues
      }
    } catch (error: any) {
      return {
        parsed: { faqs: [] },
        issues: [`Parse error: ${error.message}`]
      }
    }
  }

  // Get current user role from auth context
  private getCurrentUserRole(): string {
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          return user.role || 'student'
        }
      }
    } catch (error) {
      console.error('Failed to get user role:', error)
    }
    return 'student'
  }

  // Generate cache key with user context
  private getCacheKeyWithUser(endpoint: string, params?: any): string {
    const userRole = this.getCurrentUserRole()
    const userId = this.getCurrentUserId()
    const baseKey = this.getCacheKey(endpoint, params)
    return `${baseKey}:${userRole}:${userId}`
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          return user.id?.toString() || null
        }
      }
    } catch (error) {
      console.error('Failed to get user ID:', error)
    }
    return null
  }

  // Performance monitoring
  private async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      console.log(`⚡ HelpService: ${operation} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`❌ HelpService: ${operation} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  // Batch operations for efficiency
  async batchGetFAQs(requests: Array<{ filters: FAQFilters; userRole?: string }>): Promise<StandardizedApiResponse<FAQsResponse>[]> {
    const results = await Promise.allSettled(
      requests.map(({ filters, userRole }) => this.getFAQs({ ...filters, userRole }))
    )

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          success: false,
          status: 500,
          message: 'Batch request failed',
          errors: { 
            batch: { 
              messages: ['Request failed in batch operation'], 
              first: 'Request failed in batch operation' 
            } 
          }
        }
      }
    })
  }

  // Smart prefetch for common operations
  async prefetchCommonData(userRole?: string): Promise<void> {
    try {
      // Prefetch in parallel without blocking
      Promise.allSettled([
        this.getCategories({ userRole }),
        this.getFeaturedFAQs(3, { userRole }),
        this.getPopularFAQs(5, { userRole }),
        this.getStats({ userRole })
      ])
    } catch (error) {
      console.warn('Prefetch failed:', error)
      // Don't throw - prefetch failures shouldn't break the app
    }
  }
}

// Create and export a singleton instance
export const helpService = new HelpService()

// Export cache for external access if needed
export { helpCache }

// Export additional utilities
export const helpUtils = {
  validateFAQData: (data: Partial<FAQ>) => helpService.validateFAQData(data),
  validateCategoryData: (data: Partial<HelpCategory>) => helpService.validateCategoryData(data),
  calculateHelpfulnessRate: (helpful: number, notHelpful: number) => helpService.calculateHelpfulnessRate(helpful, notHelpful),
  formatTimeAgo: (dateString: string) => helpService.formatTimeAgo(dateString),
  canSuggestContent: (userRole: string) => helpService.canSuggestContent(userRole),
  canManageContent: (userRole: string) => helpService.canManageContent(userRole),
  getDebugInfo: () => helpService.getDebugInfo(),
  healthCheck: () => helpService.healthCheck(),
  testResponseParsing: (sampleResponse: any) => helpService.testResponseParsing(sampleResponse)
}