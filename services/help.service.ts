// services/help.service.ts - FIXED: All TypeScript issues resolved

import { apiClient, type StandardizedApiResponse } from '@/lib/api';

// Core interfaces - aligned with backend
export interface HelpCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  faqs_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  slug: string;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
  created_by?: number;
  updated_by?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: HelpCategory;
  creator?: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
}

export interface FAQFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  sort_by?: 'featured' | 'helpful' | 'views' | 'newest';
  per_page?: number;
  page?: number;
  status?: 'all' | 'published' | 'unpublished' | 'suggested';
  category_id?: number;
  include_drafts?: boolean;
}

// Response interfaces
export interface FAQsResponse {
  faqs?: FAQ[];
  items?: FAQ[];
  featured_faqs?: FAQ[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    has_more_pages?: boolean;
  };
}

export interface HelpStats {
  total_faqs: number;
  total_categories: number;
  most_helpful_faq?: Pick<FAQ, 'id' | 'question' | 'helpful_count'>;
  most_viewed_faq?: Pick<FAQ, 'id' | 'question' | 'view_count'>;
  recent_faqs: Pick<FAQ, 'id' | 'question' | 'published_at'>[];
  categories_with_counts: Pick<HelpCategory, 'id' | 'name' | 'slug' | 'color' | 'faqs_count'>[];
}

export interface ContentSuggestion {
  id?: number;
  category_id: number;
  question: string;
  answer: string;
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  admin_feedback?: string;
  submitted_at?: string;
  counselor?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ContentSuggestionItem {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  slug: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  time_ago?: string;
  suggestion_type?: string;
  helpfulness_rate?: number;
  category?: HelpCategory;
  creator?: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
}

export interface ContentSuggestionsResponse {
  suggestions?: ContentSuggestionItem[];
  items?: ContentSuggestionItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    has_more_pages?: boolean;
  };
}

// Request options interface
interface RequestOptions {
  userRole?: string;
  forceRefresh?: boolean;
  include_inactive?: boolean;
}

/**
 * FIXED: Complete Help Service with all TypeScript issues resolved
 */
class HelpService {
  private readonly apiClient = apiClient;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Role validation helper
  private validateRole(requiredRoles: string[], userRole?: string): boolean {
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  }

  // Get current user role from auth data
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

  // Cache management
  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
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

  private setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // =============================================================================
  // BASIC OPERATIONS - FIXED with proper message property
  // =============================================================================

  async getCategories(options: RequestOptions = {}): Promise<StandardizedApiResponse<{ categories: HelpCategory[] }>> {
    try {
      const { include_inactive = false, forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('categories', { include_inactive });
      
      if (!forceRefresh) {
        const cached = this.getFromCache<{ categories: HelpCategory[] }>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'Categories retrieved from cache',
          data: cached 
        };
      }

      const endpoint = include_inactive ? '/admin/help/categories' : '/help/categories';
      const response = await this.apiClient.get<{ categories: HelpCategory[] }>(endpoint);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch categories:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch categories. Please try again.',
      };
    }
  }

  // FIXED: Admin categories method with proper overload
  async getAdminCategories(options: RequestOptions = {}): Promise<StandardizedApiResponse<{ categories: HelpCategory[] }>> {
    return this.getCategories({ ...options, include_inactive: true });
  }

  async getFAQs(filters: FAQFilters = {}, options: RequestOptions = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('faqs', filters);
      
      if (!forceRefresh) {
        const cached = this.getFromCache<FAQsResponse>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'FAQs retrieved from cache',
          data: cached 
        };
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const endpoint = `/help/faqs${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.apiClient.get(endpoint);

      if (!response.success) return response;

      const data = response.data || {};
      const result: FAQsResponse = {
        faqs: data.faqs || data.items || [],
        featured_faqs: data.featured_faqs || [],
        pagination: data.pagination
      };

      this.setCache(cacheKey, result);

      return {
        success: true,
        status: response.status || 200,
        message: response.message || 'FAQs retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch FAQs:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch FAQs. Please try again.',
      };
    }
  }

  // FIXED: Admin FAQs method with proper message property
  async getAdminFAQs(filters: FAQFilters = {}, options: RequestOptions = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('admin-faqs', filters);
      
      if (!forceRefresh) {
        const cached = this.getFromCache<FAQsResponse>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'Admin FAQs retrieved from cache',
          data: cached 
        };
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const endpoint = `/admin/help/faqs${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.apiClient.get(endpoint);

      if (!response.success) return response;

      const data = response.data || {};
      const result: FAQsResponse = {
        faqs: data.items || data.faqs || [],
        pagination: data.pagination
      };

      this.setCache(cacheKey, result);

      return {
        success: true,
        status: response.status || 200,
        message: response.message || 'Admin FAQs retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch admin FAQs:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch admin FAQs. Please try again.',
      };
    }
  }

  async getFAQ(id: number, options: RequestOptions = {}): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('faq', { id });
      
      if (!forceRefresh) {
        const cached = this.getFromCache<{ faq: FAQ }>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'FAQ retrieved from cache',
          data: cached 
        };
      }

      const response = await this.apiClient.get<{ faq: FAQ }>(`/help/faqs/${id}`);

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch FAQ:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch FAQ. Please try again.',
      };
    }
  }

  async getStats(options: RequestOptions = {}): Promise<StandardizedApiResponse<{ stats: HelpStats }>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('stats');
      
      if (!forceRefresh) {
        const cached = this.getFromCache<{ stats: HelpStats }>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'Stats retrieved from cache',
          data: cached 
        };
      }

      const response = await this.apiClient.get<{ stats: HelpStats }>('/help/stats');

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch stats:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch stats. Please try again.',
      };
    }
  }

  // FIXED: Featured FAQs method with proper message property
  async getFeaturedFAQs(limit: number = 3, options: RequestOptions = {}): Promise<StandardizedApiResponse<FAQ[]>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('featured-faqs', { limit });
      
      if (!forceRefresh) {
        const cached = this.getFromCache<FAQ[]>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'Featured FAQs retrieved from cache',
          data: cached 
        };
      }

      const response = await this.getFAQs({ featured: true, per_page: limit }, options);
      
      if (response.success && response.data) {
        const featuredFAQs = response.data.featured_faqs || response.data.faqs?.slice(0, limit) || [];
        this.setCache(cacheKey, featuredFAQs);
        
        return {
          success: true,
          status: 200,
          message: 'Featured FAQs retrieved successfully',
          data: featuredFAQs
        };
      }

      return {
        success: false,
        status: 0,
        message: 'Failed to fetch featured FAQs'
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch featured FAQs:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch featured FAQs. Please try again.',
      };
    }
  }

  // FIXED: Popular FAQs method with proper message property
  async getPopularFAQs(limit: number = 5, options: RequestOptions = {}): Promise<StandardizedApiResponse<FAQ[]>> {
    try {
      const { forceRefresh = false } = options;
      const cacheKey = this.getCacheKey('popular-faqs', { limit });
      
      if (!forceRefresh) {
        const cached = this.getFromCache<FAQ[]>(cacheKey);
        if (cached) return { 
          success: true, 
          status: 200, 
          message: 'Popular FAQs retrieved from cache',
          data: cached 
        };
      }

      const response = await this.getFAQs({ sort_by: 'views', per_page: limit }, options);
      
      if (response.success && response.data) {
        const popularFAQs = response.data.faqs?.slice(0, limit) || [];
        this.setCache(cacheKey, popularFAQs);
        
        return {
          success: true,
          status: 200,
          message: 'Popular FAQs retrieved successfully',
          data: popularFAQs
        };
      }

      return {
        success: false,
        status: 0,
        message: 'Failed to fetch popular FAQs'
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch popular FAQs:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch popular FAQs. Please try again.',
      };
    }
  }

  // =============================================================================
  // ADMIN OPERATIONS - Already correctly implemented
  // =============================================================================

  async createFAQ(data: Partial<FAQ>, userRole?: string): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      const response = await this.apiClient.post<{ faq: FAQ }>('/admin/help/faqs', data);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to create FAQ:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to create FAQ. Please try again.',
      };
    }
  }

  async updateFAQ(id: number, data: Partial<FAQ>, userRole?: string): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      const response = await this.apiClient.put<{ faq: FAQ }>(`/admin/help/faqs/${id}`, data);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to update FAQ:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to update FAQ. Please try again.',
      };
    }
  }

  async deleteFAQ(id: number, userRole?: string): Promise<StandardizedApiResponse<any>> {
    try {
      const response = await this.apiClient.delete(`/admin/help/faqs/${id}`);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to delete FAQ:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to delete FAQ. Please try again.',
      };
    }
  }

  async createCategory(data: Partial<HelpCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    try {
      const response = await this.apiClient.post<{ category: HelpCategory }>('/admin/help/categories', data);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to create category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to create category. Please try again.',
      };
    }
  }

  async updateCategory(id: number, data: Partial<HelpCategory>, userRole?: string): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    try {
      const response = await this.apiClient.put<{ category: HelpCategory }>(`/admin/help/categories/${id}`, data);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to update category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to update category. Please try again.',
      };
    }
  }

  async deleteCategory(id: number, userRole?: string): Promise<StandardizedApiResponse<any>> {
    try {
      const response = await this.apiClient.delete(`/admin/help/categories/${id}`);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to delete category:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to delete category. Please try again.',
      };
    }
  }

  // =============================================================================
  // SUGGESTION MANAGEMENT - Already correctly implemented
  // =============================================================================

  async suggestContent(suggestion: ContentSuggestion, options: RequestOptions = {}): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    const { userRole } = options;

    if (!this.validateRole(['counselor', 'admin'], userRole || this.getCurrentUserRole())) {
      return {
        success: false,
        status: 403,
        message: 'Only counselors and administrators can suggest content.'
      };
    }

    try {
      const response = await this.apiClient.post<{ faq: FAQ }>('/help/suggest-content', suggestion);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to suggest content:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to suggest content. Please try again.',
      };
    }
  }

  async getContentSuggestions(filters: FAQFilters = {}): Promise<StandardizedApiResponse<ContentSuggestionsResponse>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const endpoint = `/admin/help/suggestions${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.apiClient.get(endpoint);

      if (!response.success) return response;

      const data = response.data || {};
      const result: ContentSuggestionsResponse = {
        suggestions: data.items || data.suggestions || [],
        pagination: data.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: data.items?.length || 0,
          total: data.items?.length || 0
        }
      };

      return {
        success: true,
        status: response.status || 200,
        message: response.message || 'Content suggestions retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch content suggestions:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch content suggestions. Please try again.',
      };
    }
  }

  async approveSuggestion(id: number): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      const response = await this.apiClient.post<{ faq: FAQ }>(`/admin/help/suggestions/${id}/approve`);
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to approve suggestion:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to approve suggestion. Please try again.',
      };
    }
  }

  async rejectSuggestion(id: number, feedback?: string, reason?: string): Promise<StandardizedApiResponse<any>> {
    try {
      const response = await this.apiClient.post(`/admin/help/suggestions/${id}/reject`, {
        feedback,
        reason
      });
      if (response.success) {
        this.clearCache();
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to reject suggestion:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to reject suggestion. Please try again.',
      };
    }
  }

  // =============================================================================
  // FEEDBACK - Already correctly implemented
  // =============================================================================

  async provideFeedback(faqId: number, feedback: { is_helpful: boolean; comment?: string }, options: RequestOptions = {}): Promise<StandardizedApiResponse<{ feedback: any; faq: FAQ }>> {
    try {
      const response = await this.apiClient.post(`/help/faqs/${faqId}/feedback`, feedback);
      if (response.success) {
        // Clear related caches
        this.cache.delete(this.getCacheKey('faq', { id: faqId }));
        this.cache.delete(this.getCacheKey('popular-faqs'));
      }
      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to provide feedback:', error);
      return {
        success: false,
        status: 0,
        message: 'Failed to submit feedback. Please try again.',
      };
    }
  }

  // =============================================================================
  // UTILITY METHODS - Already correctly implemented
  // =============================================================================

  canSuggestContent(userRole?: string): boolean {
    return this.validateRole(['counselor', 'admin'], userRole || this.getCurrentUserRole());
  }

  canManageContent(userRole?: string): boolean {
    return this.validateRole(['admin'], userRole || this.getCurrentUserRole());
  }

  calculateHelpfulnessRate(helpful: number, notHelpful: number): number {
    const total = helpful + notHelpful;
    if (total === 0) return 0;
    return Math.round((helpful / total) * 100);
  }

  formatTimeAgo(dateString: string): string {
    return this.getTimeAgo(dateString);
  }

  getTimeAgo(dateString: string): string {
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

  validateFAQData(data: Partial<FAQ>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.question?.trim()) {
      errors.push('Question is required');
    } else if (data.question.length < 10) {
      errors.push('Question must be at least 10 characters long');
    } else if (data.question.length > 500) {
      errors.push('Question cannot exceed 500 characters');
    }

    if (!data.answer?.trim()) {
      errors.push('Answer is required');
    } else if (data.answer.length < 20) {
      errors.push('Answer must be at least 20 characters long');
    } else if (data.answer.length > 5000) {
      errors.push('Answer cannot exceed 5000 characters');
    }

    if (!data.category_id) {
      errors.push('Category is required');
    }

    return { valid: errors.length === 0, errors };
  }

  validateCategoryData(data: Partial<HelpCategory>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Category name is required');
    } else if (data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long');
    } else if (data.name.length > 255) {
      errors.push('Category name cannot exceed 255 characters');
    }

    return { valid: errors.length === 0, errors };
  }

  getCacheStats(): { cacheSize: number; totalItems: number } {
    return {
      cacheSize: this.cache.size,
      totalItems: this.cache.size
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getDebugInfo(): {
    apiBaseUrl: string;
    hasAuthToken: boolean;
    userRole: string;
    permissions: {
      canSuggestContent: boolean;
      canManageContent: boolean;
    };
  } {
    const userRole = this.getCurrentUserRole();
    
    return {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
      hasAuthToken: !!localStorage.getItem('auth_token'),
      userRole,
      permissions: {
        canSuggestContent: this.canSuggestContent(userRole),
        canManageContent: this.canManageContent(userRole)
      }
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
export const helpService = new HelpService();
export default helpService;