// services/help.service.ts - CORRECTED: Simplified like ticket service

import { apiClient, type StandardizedApiResponse } from '@/lib/api';

// Core interfaces - simplified
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
  };
}

export interface FAQFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  sort_by?: 'featured' | 'helpful' | 'views' | 'newest';
  per_page?: number;
  page?: number;
  status?: 'all' | 'published' | 'unpublished' | 'featured';
  include_drafts?: boolean;
}

export interface FAQsResponse {
  faqs: FAQ[];
  featured_faqs?: FAQ[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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

// SIMPLIFIED: No complex cache or parsing strategies
class HelpService {
  private readonly apiClient = apiClient;

  // =============================================================================
  // BASIC OPERATIONS - Like ticket service
  // =============================================================================

  async getCategories(
    includeInactive = false
  ): Promise<StandardizedApiResponse<{ categories: HelpCategory[] }>> {
    try {
      console.log('🎯 HelpService: Fetching categories');
      const endpoint = includeInactive ? '/admin/help/categories' : '/help/categories';
      const response = await this.apiClient.get<{ categories: HelpCategory[] }>(endpoint);

      if (response.success) {
        console.log('✅ HelpService: Categories fetched successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch categories:', error);
      throw error;
    }
  }

  async getFAQs(filters: FAQFilters = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    try {
      console.log('🎯 HelpService: Fetching FAQs with filters:', filters);

      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const endpoint = `/help/faqs${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.apiClient.get(endpoint);

      if (!response.success) {
        return response;
      }

      // SIMPLIFIED: Direct response handling - no complex parsing
      const data = response.data || {};
      let faqs: FAQ[] = [];
      let pagination = undefined;

      // Simple parsing strategies
      if (data.faqs && Array.isArray(data.faqs)) {
        faqs = data.faqs;
        pagination = data.pagination;
      } else if (data.items && Array.isArray(data.items)) {
        faqs = data.items;
        pagination = {
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || data.items.length,
          total: data.total || data.items.length,
        };
      } else if (Array.isArray(data)) {
        faqs = data;
      }

      const result: FAQsResponse = {
        faqs,
        featured_faqs: faqs.filter((faq) => faq.is_featured),
        pagination,
      };

      console.log('✅ HelpService: FAQs fetched successfully:', faqs.length);

      return {
        success: true,
        status: 200,
        message: response.message || 'FAQs retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch FAQs:', error);
      throw error;
    }
  }

  async getAdminFAQs(filters: FAQFilters = {}): Promise<StandardizedApiResponse<FAQsResponse>> {
    try {
      console.log('🎯 HelpService: Fetching admin FAQs with filters:', filters);

      const params = new URLSearchParams();
      params.append('include_drafts', 'true'); // Admin sees all

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const endpoint = `/admin/help/faqs${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.apiClient.get(endpoint);

      if (!response.success) {
        return response;
      }

      // SIMPLIFIED: Same parsing as regular FAQs
      const data = response.data || {};
      let faqs: FAQ[] = [];
      let pagination = undefined;

      if (data.faqs && Array.isArray(data.faqs)) {
        faqs = data.faqs;
        pagination = data.pagination;
      } else if (data.items && Array.isArray(data.items)) {
        faqs = data.items;
        pagination = {
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || data.items.length,
          total: data.total || data.items.length,
        };
      } else if (Array.isArray(data)) {
        faqs = data;
      }

      const result: FAQsResponse = {
        faqs,
        featured_faqs: faqs.filter((faq) => faq.is_featured),
        pagination,
      };

      console.log('✅ HelpService: Admin FAQs fetched successfully:', faqs.length);

      return {
        success: true,
        status: 200,
        message: response.message || 'Admin FAQs retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch admin FAQs:', error);
      throw error;
    }
  }

  async getFAQ(id: number): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      console.log('🎯 HelpService: Fetching FAQ:', id);
      const response = await this.apiClient.get<{ faq: FAQ }>(`/help/faqs/${id}`);

      if (response.success) {
        console.log('✅ HelpService: FAQ fetched successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch FAQ:', error);
      throw error;
    }
  }

  async getStats(): Promise<StandardizedApiResponse<{ stats: HelpStats }>> {
    try {
      console.log('🎯 HelpService: Fetching stats');
      const response = await this.apiClient.get<{ stats: HelpStats }>('/help/stats');

      if (response.success) {
        console.log('✅ HelpService: Stats fetched successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to fetch stats:', error);
      throw error;
    }
  }

  // =============================================================================
  // ADMIN OPERATIONS - Simplified like ticket service
  // =============================================================================

  async createFAQ(data: Partial<FAQ>): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      console.log('🎯 HelpService: Creating FAQ:', data);
      const response = await this.apiClient.post<{ faq: FAQ }>('/admin/help/faqs', data);

      if (response.success) {
        console.log('✅ HelpService: FAQ created successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to create FAQ:', error);
      throw error;
    }
  }

  async updateFAQ(id: number, data: Partial<FAQ>): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      console.log('🎯 HelpService: Updating FAQ:', id, data);
      const response = await this.apiClient.put<{ faq: FAQ }>(`/admin/help/faqs/${id}`, data);

      if (response.success) {
        console.log('✅ HelpService: FAQ updated successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to update FAQ:', error);
      throw error;
    }
  }

  async deleteFAQ(id: number): Promise<StandardizedApiResponse<{ message: string }>> {
    try {
      console.log('🎯 HelpService: Deleting FAQ:', id);
      const response = await this.apiClient.delete<{ message: string }>(`/admin/help/faqs/${id}`);

      if (response.success) {
        console.log('✅ HelpService: FAQ deleted successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to delete FAQ:', error);
      throw error;
    }
  }

  async createCategory(
    data: Partial<HelpCategory>
  ): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    try {
      console.log('🎯 HelpService: Creating category:', data);
      const response = await this.apiClient.post<{ category: HelpCategory }>(
        '/admin/help/categories',
        data
      );

      if (response.success) {
        console.log('✅ HelpService: Category created successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to create category:', error);
      throw error;
    }
  }

  async updateCategory(
    id: number,
    data: Partial<HelpCategory>
  ): Promise<StandardizedApiResponse<{ category: HelpCategory }>> {
    try {
      console.log('🎯 HelpService: Updating category:', id, data);
      const response = await this.apiClient.put<{ category: HelpCategory }>(
        `/admin/help/categories/${id}`,
        data
      );

      if (response.success) {
        console.log('✅ HelpService: Category updated successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to update category:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<StandardizedApiResponse<{ message: string }>> {
    try {
      console.log('🎯 HelpService: Deleting category:', id);
      const response = await this.apiClient.delete<{ message: string }>(
        `/admin/help/categories/${id}`
      );

      if (response.success) {
        console.log('✅ HelpService: Category deleted successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to delete category:', error);
      throw error;
    }
  }

  // =============================================================================
  // SUGGESTION MANAGEMENT - Simplified
  // =============================================================================

  async approveSuggestion(id: number): Promise<StandardizedApiResponse<{ faq: FAQ }>> {
    try {
      console.log('🎯 HelpService: Approving suggestion:', id);
      const response = await this.apiClient.post<{ faq: FAQ }>(
        `/admin/help/suggestions/${id}/approve`
      );

      if (response.success) {
        console.log('✅ HelpService: Suggestion approved successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to approve suggestion:', error);
      throw error;
    }
  }

  async rejectSuggestion(
    id: number,
    feedback?: string
  ): Promise<StandardizedApiResponse<{ message: string }>> {
    try {
      console.log('🎯 HelpService: Rejecting suggestion:', id);
      const response = await this.apiClient.post<{ message: string }>(
        `/admin/help/suggestions/${id}/reject`,
        {
          feedback,
        }
      );

      if (response.success) {
        console.log('✅ HelpService: Suggestion rejected successfully');
      }

      return response;
    } catch (error: any) {
      console.error('❌ HelpService: Failed to reject suggestion:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILITY METHODS - Simplified
  // =============================================================================

  validateFAQData(data: Partial<FAQ>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.question?.trim()) {
      errors.push('Question is required');
    } else if (data.question.length < 10) {
      errors.push('Question must be at least 10 characters long');
    }

    if (!data.answer?.trim()) {
      errors.push('Answer is required');
    } else if (data.answer.length < 20) {
      errors.push('Answer must be at least 20 characters long');
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
    }

    return { valid: errors.length === 0, errors };
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
