// services/resources.service.ts
import { apiClient, ApiResponse } from '@/lib/api';

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

export interface ResourceFeedback {
  id: number;
  resource_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceFilters {
  category?: string;
  type?: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet' | 'all';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  search?: string;
  featured?: boolean;
  sort_by?: 'featured' | 'rating' | 'downloads' | 'newest' | 'popular';
  per_page?: number;
  page?: number;
}

export interface ResourcesResponse {
  resources: Resource[];
  featured_resources: Resource[];
  type_counts: Record<string, number>;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BookmarksResponse {
  bookmarks: (Resource & { bookmarked_at: string })[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ResourceStats {
  total_resources: number;
  total_categories: number;
  most_popular_resource?: Pick<Resource, 'id' | 'title' | 'view_count' | 'type'>;
  highest_rated_resource?: Pick<Resource, 'id' | 'title' | 'rating' | 'type'>;
  most_downloaded_resource?: Pick<Resource, 'id' | 'title' | 'download_count' | 'type'>;
  resources_by_type: Record<string, number>;
  resources_by_difficulty: Record<string, number>;
  categories_with_counts: Pick<ResourceCategory, 'id' | 'name' | 'slug' | 'color'>[];
}

export interface ResourceOptions {
  types: Array<{ value: string; label: string; icon: string }>;
  difficulties: Array<{ value: string; label: string; color: string }>;
  categories: Pick<ResourceCategory, 'id' | 'name' | 'slug'>[];
}

class ResourcesService {
  // Type definitions for resource types
  static readonly RESOURCE_TYPES = {
    article: { label: 'Article', icon: 'BookOpen' },
    video: { label: 'Video', icon: 'Video' },
    audio: { label: 'Audio', icon: 'Headphones' },
    exercise: { label: 'Exercise', icon: 'Brain' },
    tool: { label: 'Tool', icon: 'Heart' },
    worksheet: { label: 'Worksheet', icon: 'Download' },
  } as const;

  static readonly DIFFICULTY_LEVELS = {
    beginner: { label: 'Beginner', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    advanced: { label: 'Advanced', color: 'bg-red-100 text-red-800' },
  } as const;

  // Get resource categories
  async getCategories(): Promise<ApiResponse<{ categories: ResourceCategory[] }>> {
    return apiClient.get<{ categories: ResourceCategory[] }>('/resources/categories');
  }

  // Get resources with filtering
  async getResources(filters: ResourceFilters = {}): Promise<ApiResponse<ResourcesResponse>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const endpoint = `/resources${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ResourcesResponse>(endpoint);
  }

  // Get single resource
  async getResource(id: number): Promise<
    ApiResponse<{
      resource: Resource;
      user_feedback?: ResourceFeedback;
      related_resources: Resource[];
    }>
  > {
    return apiClient.get<{
      resource: Resource;
      user_feedback?: ResourceFeedback;
      related_resources: Resource[];
    }>(`/resources/${id}`);
  }

  // Access resource (track usage and get URL)
  async accessResource(id: number): Promise<
    ApiResponse<{
      url: string;
      action: 'access' | 'download';
      resource: Pick<Resource, 'id' | 'title' | 'type'>;
    }>
  > {
    return apiClient.post<{
      url: string;
      action: 'access' | 'download';
      resource: Pick<Resource, 'id' | 'title' | 'type'>;
    }>(`/resources/${id}/access`);
  }

  // Provide feedback/rating on resource
  async provideFeedback(
    resourceId: number,
    feedback: { rating: number; comment?: string; is_recommended?: boolean }
  ): Promise<ApiResponse<{ feedback: ResourceFeedback }>> {
    return apiClient.post<{ feedback: ResourceFeedback }>(
      `/resources/${resourceId}/feedback`,
      feedback
    );
  }

  // Bookmark/unbookmark resource
  async toggleBookmark(resourceId: number): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return apiClient.post<{ bookmarked: boolean }>(`/resources/${resourceId}/bookmark`);
  }

  // Get user's bookmarks
  async getBookmarks(
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<BookmarksResponse>> {
    return apiClient.get<BookmarksResponse>(
      `/resources/user/bookmarks?page=${page}&per_page=${perPage}`
    );
  }

  // Get resource statistics
  async getStats(): Promise<ApiResponse<{ stats: ResourceStats }>> {
    return apiClient.get<{ stats: ResourceStats }>('/resources/stats');
  }

  // Get resource options for forms
  async getOptions(): Promise<ApiResponse<ResourceOptions>> {
    return apiClient.get<ResourceOptions>('/resources/options');
  }

  // Search resources (with debounced endpoint)
  async searchResources(
    query: string,
    filters: Omit<ResourceFilters, 'search'> = {}
  ): Promise<ApiResponse<ResourcesResponse>> {
    return this.getResources({ ...filters, search: query });
  }

  // Get featured resources - FIXED TYPE CASTING
  async getFeaturedResources(limit: number = 3): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      featured: true,
      per_page: limit,
    });

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.featured_resources, // Extract featured_resources array
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch featured resources',
      errors: response.errors,
    };
  }

  // Get resources by type
  async getResourcesByType(
    type: string,
    filters: Omit<ResourceFilters, 'type'> = {}
  ): Promise<ApiResponse<ResourcesResponse>> {
    return this.getResources({ ...filters, type: type as any });
  }

  // Get resources by category
  async getResourcesByCategory(
    categorySlug: string,
    filters: Omit<ResourceFilters, 'category'> = {}
  ): Promise<ApiResponse<ResourcesResponse>> {
    return this.getResources({ ...filters, category: categorySlug });
  }

  // Get resources by difficulty
  async getResourcesByDifficulty(
    difficulty: string,
    filters: Omit<ResourceFilters, 'difficulty'> = {}
  ): Promise<ApiResponse<ResourcesResponse>> {
    return this.getResources({ ...filters, difficulty: difficulty as any });
  }

  // Get top rated resources - FIXED TYPE CASTING
  async getTopRatedResources(limit: number = 5): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'rating',
      per_page: limit,
    });

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.resources, // Extract resources array
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch top rated resources',
      errors: response.errors,
    };
  }

  // Get most popular resources - FIXED TYPE CASTING
  async getPopularResources(limit: number = 5): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'popular',
      per_page: limit,
    });

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.resources, // Extract resources array
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch popular resources',
      errors: response.errors,
    };
  }

  // Get recent resources - FIXED TYPE CASTING
  async getRecentResources(limit: number = 5): Promise<ApiResponse<Resource[]>> {
    const response = await this.getResources({
      sort_by: 'newest',
      per_page: limit,
    });

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message,
        data: response.data.resources, // Extract resources array
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch recent resources',
      errors: response.errors,
    };
  }

  // Check if resource is bookmarked (helper for UI)
  isResourceBookmarked(resourceId: number, bookmarks: Resource[]): boolean {
    return bookmarks.some((bookmark) => bookmark.id === resourceId);
  }

  // Format duration string
  formatDuration(duration?: string): string {
    if (!duration) return 'Self-paced';
    return duration;
  }

  // Get type icon for resource
  getTypeIcon(type: string): string {
    return (
      ResourcesService.RESOURCE_TYPES[type as keyof typeof ResourcesService.RESOURCE_TYPES]?.icon ||
      'BookOpen'
    );
  }

  // Get type label for resource
  getTypeLabel(type: string): string {
    return (
      ResourcesService.RESOURCE_TYPES[type as keyof typeof ResourcesService.RESOURCE_TYPES]
        ?.label || type
    );
  }

  // Get difficulty color for resource
  getDifficultyColor(difficulty: string): string {
    return (
      ResourcesService.DIFFICULTY_LEVELS[
        difficulty as keyof typeof ResourcesService.DIFFICULTY_LEVELS
      ]?.color || 'bg-gray-100 text-gray-800'
    );
  }

  // Get difficulty label for resource
  getDifficultyLabel(difficulty: string): string {
    return (
      ResourcesService.DIFFICULTY_LEVELS[
        difficulty as keyof typeof ResourcesService.DIFFICULTY_LEVELS
      ]?.label || difficulty
    );
  }

  // Calculate rating percentage
  calculateRatingPercentage(rating: number): number {
    return Math.round((rating / 5) * 100);
  }

  // Format download/view count
  formatCount(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }

  // Validate resource URL
  isValidResourceUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get available resource types
  getAvailableTypes(): Array<{ value: string; label: string; icon: string }> {
    return Object.entries(ResourcesService.RESOURCE_TYPES).map(([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
    }));
  }

  // Get available difficulty levels
  getAvailableDifficulties(): Array<{ value: string; label: string; color: string }> {
    return Object.entries(ResourcesService.DIFFICULTY_LEVELS).map(([value, config]) => ({
      value,
      label: config.label,
      color: config.color,
    }));
  }
}

export const resourcesService = new ResourcesService();
