// services/help.service.ts
import { apiClient, ApiResponse } from '@/lib/api'

// Extend existing interfaces
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

export interface HelpAnalytics {
	overview: {
		total_views: number
		total_searches: number
		avg_session_duration: string
		bounce_rate: number
		satisfaction_rate: number
		trends: {
			views: number
			searches: number
			satisfaction: number
		}
	}
	top_faqs: Array<{
		id: number
		question: string
		views: number
		helpful_rate: number
		category: string
	}>
	search_analytics: {
		top_searches: Array<{
			query: string
			count: number
			results: number
		}>
		failed_searches: Array<{
			query: string
			count: number
			results: number
		}>
	}
	user_behavior: {
		device_breakdown: Record<string, number>
		time_distribution: Record<string, number>
		category_preferences: Array<{
			category: string
			percentage: number
		}>
	}
	performance_metrics: {
		avg_response_time: number
		uptime_percentage: number
		error_rate: number
		cache_hit_rate: number
	}
}

export interface AdminNotification {
  id: number
  type: 'suggestion' | 'feedback' | 'system'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  created_at: string
  action_url?: string
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    database: boolean
    cache: boolean
    search: boolean
    storage: boolean
  }
  metrics: {
    response_time: number
    error_rate: number
    uptime: number
  }
  last_check: string
}

export interface CounselorInsights {
  common_questions: Array<{
    question: string
    frequency: number
    trend: 'up' | 'down' | 'stable'
  }>
  gap_analysis: Array<{
    topic: string
    suggested_by: number
    priority: 'high' | 'medium' | 'low'
  }>
  seasonal_trends: Array<{
    period: string
    top_topics: string[]
  }>
  recommendations: Array<{
    type: string
    title: string
    description: string
    priority: string
    action: string
  }>
}

class HelpService {
  // =============================================================================
  // BASIC CRUD OPERATIONS
  // =============================================================================

  // Get help categories
  async getCategories(options: { include_inactive?: boolean } = {}): Promise<ApiResponse<{ categories: HelpCategory[] }>> {
    const params = new URLSearchParams()
    if (options.include_inactive) {
      params.append('include_inactive', 'true')
    }
    
    const endpoint = `/help/categories${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient.get<{ categories: HelpCategory[] }>(endpoint)
  }

  // Get FAQs with filtering
  async getFAQs(filters: FAQFilters = {}): Promise<ApiResponse<FAQsResponse>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const endpoint = `/help/faqs${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient.get<FAQsResponse>(endpoint)
  }

  // Get single FAQ
  async getFAQ(id: number): Promise<ApiResponse<{ faq: FAQ; user_feedback?: FAQFeedback }>> {
    return apiClient.get<{ faq: FAQ; user_feedback?: FAQFeedback }>(`/help/faqs/${id}`)
  }

  // Provide feedback on FAQ
  async provideFeedback(
    faqId: number, 
    feedback: { is_helpful: boolean; comment?: string }
  ): Promise<ApiResponse<{ feedback: FAQFeedback }>> {
    return apiClient.post<{ feedback: FAQFeedback }>(`/help/faqs/${faqId}/feedback`, feedback)
  }

  // Suggest content (for counselors)
  async suggestContent(suggestion: ContentSuggestion): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.post<{ faq: FAQ }>('/help/suggest-content', suggestion)
  }

  // Get help statistics
  async getStats(): Promise<ApiResponse<{ stats: HelpStats }>> {
    return apiClient.get<{ stats: HelpStats }>('/help/stats')
  }

  // Search FAQs (with debounced endpoint)
  async searchFAQs(query: string, filters: Omit<FAQFilters, 'search'> = {}): Promise<ApiResponse<FAQsResponse>> {
    return this.getFAQs({ ...filters, search: query })
  }

  // =============================================================================
  // SPECIALIZED GETTERS
  // =============================================================================

  // Get popular FAQs
  async getPopularFAQs(limit: number = 5): Promise<ApiResponse<FAQ[]>> {
    const response = await this.getFAQs({ 
      sort_by: 'helpful', 
      per_page: limit 
    })
    
    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.faqs
      }
    }
    
    return {
      success: false,
      message: response.message || 'Failed to fetch popular FAQs',
      errors: response.errors
    }
  }

  // Get featured FAQs
  async getFeaturedFAQs(limit: number = 3): Promise<ApiResponse<FAQ[]>> {
    const response = await this.getFAQs({ 
      featured: true, 
      per_page: limit 
    })
    
    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.featured_faqs
      }
    }
    
    return {
      success: false,
      message: response.message || 'Failed to fetch featured FAQs',
      errors: response.errors
    }
  }

  // Get FAQs by category
  async getFAQsByCategory(categorySlug: string, filters: Omit<FAQFilters, 'category'> = {}): Promise<ApiResponse<FAQsResponse>> {
    return this.getFAQs({ ...filters, category: categorySlug })
  }

  // Get recent FAQs
  async getRecentFAQs(limit: number = 5): Promise<ApiResponse<FAQ[]>> {
    const response = await this.getFAQs({ 
      sort_by: 'newest', 
      per_page: limit 
    })
    
    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.faqs
      }
    }
    
    return {
      success: false,
      message: response.message || 'Failed to fetch recent FAQs',
      errors: response.errors
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  // Check if user can suggest content
  canSuggestContent(userRole: string): boolean {
    return ['counselor', 'admin'].includes(userRole)
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
  // ADMIN-ONLY METHODS
  // =============================================================================

  // Create FAQ (Admin)
  async createFAQ(faqData: Partial<FAQ>): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.post<{ faq: FAQ }>('/admin/help/faqs', faqData)
  }

  // Update FAQ (Admin)
  async updateFAQ(id: number, faqData: Partial<FAQ>): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.put<{ faq: FAQ }>(`/admin/help/faqs/${id}`, faqData)
  }

  // Delete FAQ (Admin)
  async deleteFAQ(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/help/faqs/${id}`)
  }

  // Bulk actions on FAQs (Admin)
  async bulkActionFAQs(faqIds: number[], action: string): Promise<ApiResponse<{ message: string; affected_count: number }>> {
    return apiClient.post<{ message: string; affected_count: number }>('/admin/help/faqs/bulk-action', {
      faq_ids: faqIds,
      action
    })
  }

  // Create Category (Admin)
  async createCategory(categoryData: Partial<HelpCategory>): Promise<ApiResponse<{ category: HelpCategory }>> {
    return apiClient.post<{ category: HelpCategory }>('/admin/help/categories', categoryData)
  }

  // Update Category (Admin)
  async updateCategory(id: number, categoryData: Partial<HelpCategory>): Promise<ApiResponse<{ category: HelpCategory }>> {
    return apiClient.put<{ category: HelpCategory }>(`/admin/help/categories/${id}`, categoryData)
  }

  // Delete Category (Admin)
  async deleteCategory(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/help/categories/${id}`)
  }

  // Reorder Categories (Admin)
  async reorderCategories(categoryOrders: Array<{ id: number; sort_order: number }>): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/admin/help/categories/reorder', {
      category_orders: categoryOrders
    })
  }

  // Get Help Analytics (Admin)
  async getHelpAnalytics(options: { timeRange?: string } = {}): Promise<ApiResponse<HelpAnalytics>> {
    const params = new URLSearchParams()
    if (options.timeRange) {
      params.append('time_range', options.timeRange)
    }
    
    const endpoint = `/admin/help/analytics${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient.get<HelpAnalytics>(endpoint)
  }

  // Get Content Suggestions (Admin)
  async getContentSuggestions(): Promise<ApiResponse<{ suggestions: ContentSuggestion[] }>> {
    return apiClient.get<{ suggestions: ContentSuggestion[] }>('/admin/help/content-suggestions')
  }

  // Approve Content Suggestion (Admin)
  async approveSuggestion(suggestionId: number): Promise<ApiResponse<{ faq: FAQ; message: string }>> {
    return apiClient.post<{ faq: FAQ; message: string }>(`/admin/help/content-suggestions/${suggestionId}/approve`)
  }

  // Reject Content Suggestion (Admin)
  async rejectSuggestion(suggestionId: number, feedback?: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/admin/help/content-suggestions/${suggestionId}/reject`, {
      feedback
    })
  }

  // Request Revision for Content Suggestion (Admin)
  async requestSuggestionRevision(suggestionId: number, feedback: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/admin/help/content-suggestions/${suggestionId}/request-revision`, {
      feedback
    })
  }

  // Get Admin Notifications
  async getAdminNotifications(): Promise<ApiResponse<{ notifications: AdminNotification[] }>> {
    return apiClient.get<{ notifications: AdminNotification[] }>('/admin/help/notifications')
  }

  // Get System Health
  async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
    return apiClient.get<SystemHealth>('/admin/help/system-health')
  }

  // Export Help Data (Admin)
  async exportHelpData(format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/admin/help/export?format=${format}`)
  }

  // =============================================================================
  // COUNSELOR-SPECIFIC METHODS
  // =============================================================================

  // Get Counselor's Own Suggestions
  async getCounselorSuggestions(): Promise<ApiResponse<{ suggestions: ContentSuggestion[] }>> {
    return apiClient.get<{ suggestions: ContentSuggestion[] }>('/counselor/help/my-suggestions')
  }

  // Update Counselor's Suggestion
  async updateCounselorSuggestion(suggestionId: number, suggestionData: Partial<ContentSuggestion>): Promise<ApiResponse<{ suggestion: ContentSuggestion }>> {
    return apiClient.put<{ suggestion: ContentSuggestion }>(`/counselor/help/my-suggestions/${suggestionId}`, suggestionData)
  }

  // Get Counselor Insights
  async getCounselorInsights(): Promise<ApiResponse<CounselorInsights>> {
    return apiClient.get<CounselorInsights>('/counselor/help/insights')
  }

  // =============================================================================
  // ENHANCED SEARCH AND FILTERING
  // =============================================================================

  // Advanced Search with Suggestions
  async advancedSearch(options: {
    query: string
    filters?: FAQFilters
    include_suggestions?: boolean
    limit?: number
  }): Promise<ApiResponse<{
    faqs: FAQ[]
    suggestions: string[]
    total: number
    search_time: number
  }>> {
    return apiClient.post<{
      faqs: FAQ[]
      suggestions: string[]
      total: number
      search_time: number
    }>('/help/search/advanced', options)
  }

  // Get Search Suggestions
  async getSearchSuggestions(query: string): Promise<ApiResponse<{ suggestions: string[] }>> {
    const params = new URLSearchParams()
    params.append('query', query)
    
    return apiClient.get<{ suggestions: string[] }>(`/help/search/suggestions?${params.toString()}`)
  }

  // Track Search Analytics
  async trackSearch(query: string, resultsCount: number): Promise<ApiResponse<{ tracked: boolean }>> {
    return apiClient.post<{ tracked: boolean }>('/help/search/track', {
      query,
      results_count: resultsCount
    })
  }

  // =============================================================================
  // USER INTERACTION TRACKING
  // =============================================================================

  // Track FAQ View
  async trackFAQView(faqId: number): Promise<ApiResponse<{ tracked: boolean }>> {
    return apiClient.post<{ tracked: boolean }>(`/help/faqs/${faqId}/track-view`)
  }

  // Track Category Click
  async trackCategoryClick(categorySlug: string): Promise<ApiResponse<{ tracked: boolean }>> {
    return apiClient.post<{ tracked: boolean }>('/help/categories/track-click', {
      category_slug: categorySlug
    })
  }

  // =============================================================================
  // CACHING AND PERFORMANCE
  // =============================================================================

  // Clear Help Cache (Admin)
  async clearHelpCache(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/admin/help/cache/clear')
  }

  // Warm Cache (Admin)
  async warmCache(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/admin/help/cache/warm')
  }

  // Get Cache Stats (Admin)
  async getCacheStats(): Promise<ApiResponse<{
    hit_rate: number
    miss_rate: number
    size: number
    entries: number
  }>> {
    return apiClient.get<{
      hit_rate: number
      miss_rate: number
      size: number
      entries: number
    }>('/admin/help/cache/stats')
  }

  // =============================================================================
  // CONTENT MANAGEMENT UTILITIES
  // =============================================================================

  // Duplicate FAQ (Admin)
  async duplicateFAQ(faqId: number, newTitle?: string): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.post<{ faq: FAQ }>(`/admin/help/faqs/${faqId}/duplicate`, {
      new_title: newTitle
    })
  }

  // Move FAQ to Category (Admin)
  async moveFAQToCategory(faqId: number, categoryId: number): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.patch<{ faq: FAQ }>(`/admin/help/faqs/${faqId}/move`, {
      category_id: categoryId
    })
  }

  // Merge FAQs (Admin)
  async mergeFAQs(primaryFaqId: number, secondaryFaqIds: number[]): Promise<ApiResponse<{ faq: FAQ; message: string }>> {
    return apiClient.post<{ faq: FAQ; message: string }>(`/admin/help/faqs/${primaryFaqId}/merge`, {
      secondary_faq_ids: secondaryFaqIds
    })
  }

  // Get FAQ History (Admin)
  async getFAQHistory(faqId: number): Promise<ApiResponse<{ history: any[] }>> {
    return apiClient.get<{ history: any[] }>(`/admin/help/faqs/${faqId}/history`)
  }

  // Restore FAQ Version (Admin)
  async restoreFAQVersion(faqId: number, versionId: number): Promise<ApiResponse<{ faq: FAQ }>> {
    return apiClient.post<{ faq: FAQ }>(`/admin/help/faqs/${faqId}/restore/${versionId}`)
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  // Bulk Import FAQs (Admin)
  async bulkImportFAQs(file: File, options: {
    category_id?: number
    auto_publish?: boolean
    overwrite_existing?: boolean
  }): Promise<ApiResponse<{ 
    imported: number
    failed: number
    errors: string[]
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))
    
    return apiClient.post<{
      imported: number
      failed: number
      errors: string[]
    }>('/admin/help/faqs/bulk-import', formData)
  }

  // Bulk Export FAQs (Admin)
  async bulkExportFAQs(options: {
    category_ids?: number[]
    format?: 'csv' | 'json' | 'xlsx'
    include_drafts?: boolean
  }): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (options.category_ids) {
      params.append('category_ids', options.category_ids.join(','))
    }
    if (options.format) {
      params.append('format', options.format)
    }
    if (options.include_drafts) {
      params.append('include_drafts', 'true')
    }
    
    return apiClient.downloadFile(`/admin/help/faqs/bulk-export?${params.toString()}`)
  }

  // =============================================================================
  // CONTENT VALIDATION
  // =============================================================================

  // Validate FAQ Content (Admin)
  async validateFAQContent(faqData: Partial<FAQ>): Promise<ApiResponse<{
    valid: boolean
    errors: string[]
    suggestions: string[]
  }>> {
    return apiClient.post<{
      valid: boolean
      errors: string[]
      suggestions: string[]
    }>('/admin/help/faqs/validate', faqData)
  }

  // Check for Duplicate Content (Admin)
  async checkDuplicateContent(question: string): Promise<ApiResponse<{
    has_duplicates: boolean
    similar_faqs: FAQ[]
    similarity_score: number
  }>> {
    return apiClient.post<{
      has_duplicates: boolean
      similar_faqs: FAQ[]
      similarity_score: number
    }>('/admin/help/faqs/check-duplicates', { question })
  }

  // Generate FAQ Suggestions (AI-powered)
  async generateFAQSuggestions(topic: string): Promise<ApiResponse<{
    suggestions: Array<{
      question: string
      answer: string
      confidence: number
    }>
  }>> {
    return apiClient.post<{
      suggestions: Array<{
        question: string
        answer: string
        confidence: number
      }>
    }>('/admin/help/faqs/ai-suggestions', { topic })
  }

  // Get Live User Activity
  async getLiveActivity(): Promise<ApiResponse<{
    active_users: number
    current_searches: string[]
    popular_faqs_now: FAQ[]
  }>> {
    return apiClient.get<{
      active_users: number
      current_searches: string[]
      popular_faqs_now: FAQ[]
    }>('/admin/help/live-activity')
  }

  // =============================================================================
  // INTEGRATION HELPERS
  // =============================================================================

  // Sync with External Knowledge Base
  async syncExternalKB(kbUrl: string, apiKey: string): Promise<ApiResponse<{
    synced: number
    failed: number
    message: string
  }>> {
    return apiClient.post<{
      synced: number
      failed: number
      message: string
    }>('/admin/help/sync-external', {
      kb_url: kbUrl,
      api_key: apiKey
    })
  }

  // Generate Sitemap for SEO
  async generateSitemap(): Promise<ApiResponse<{ sitemap_url: string }>> {
    return apiClient.post<{ sitemap_url: string }>('/admin/help/generate-sitemap')
  }

  // =============================================================================
  // MOBILE APP SPECIFIC
  // =============================================================================

  // Get Offline Content Package
  async getOfflineContent(): Promise<ApiResponse<{
    version: string
    content: {
      faqs: FAQ[]
      categories: HelpCategory[]
    }
    last_updated: string
  }>> {
    return apiClient.get<{
      version: string
      content: {
        faqs: FAQ[]
        categories: HelpCategory[]
      }
      last_updated: string
    }>('/help/offline-package')
  }

  // Check for Content Updates
  async checkContentUpdates(currentVersion: string): Promise<ApiResponse<{
    has_updates: boolean
    new_version?: string
    update_size?: number
  }>> {
    return apiClient.get<{
      has_updates: boolean
      new_version?: string
      update_size?: number
    }>(`/help/check-updates?version=${currentVersion}`)
  }

  // =============================================================================
  // ACCESSIBILITY FEATURES
  // =============================================================================

  // Get FAQ in Different Formats
  async getFAQFormat(faqId: number, format: 'audio' | 'simplified' | 'translation'): Promise<ApiResponse<{
    content: string
    format: string
    metadata: any
  }>> {
    return apiClient.get<{
      content: string
      format: string
      metadata: any
    }>(`/help/faqs/${faqId}/format/${format}`)
  }

  // Report Accessibility Issue
  async reportAccessibilityIssue(faqId: number, issue: {
    type: string
    description: string
    user_agent: string
  }): Promise<ApiResponse<{ reported: boolean }>> {
    return apiClient.post<{ reported: boolean }>(`/help/faqs/${faqId}/accessibility-issue`, issue)
  }
}

// Create and export a singleton instance
export const helpService = new HelpService()