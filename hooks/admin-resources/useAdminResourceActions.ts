// hooks/admin-resources/useAdminResourceActions.ts - COMPLETE: Following help store pattern

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { ResourceItem } from "@/stores/resources-store"
import type { ResourceCategory } from "@/services/resources.service"

// Simple form data interfaces
export interface ResourceFormData {
  title: string
  description: string
  category_id: string
  type: 'article' | 'video' | 'audio' | 'exercise' | 'tool' | 'worksheet'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  external_url: string
  download_url?: string
  thumbnail_url?: string
  duration?: string
  tags?: string[]
  author_name?: string
  author_bio?: string
  subcategory?: string
  is_published?: boolean
  is_featured?: boolean
  sort_order?: number
}

export interface CategoryFormData {
  name: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

interface UseAdminResourceActionsProps {
  actions: {
    createResource: (data: any) => Promise<any>
    updateResource: (id: number, data: any) => Promise<any>
    deleteResource: (id: number) => Promise<any>
    togglePublishResource: (id: number) => Promise<any>
    toggleFeatureResource: (id: number) => Promise<any>
    createCategory: (data: CategoryFormData) => Promise<any>
    updateCategory: (id: number, data: CategoryFormData) => Promise<any>
    deleteCategory: (id: number) => Promise<any>
  }
}

// SIMPLIFIED: Actions like help actions
export function useAdminResourceActions({ actions }: UseAdminResourceActionsProps) {
  // SIMPLIFIED: Create resource - no complex validation
  const handleCreateResource = useCallback(
    async (formData: ResourceFormData) => {
      // Basic validation
      if (!formData.title?.trim()) {
        toast.error('Title is required');
        return false;
      }

      if (!formData.description?.trim()) {
        toast.error('Description is required');
        return false;
      }

      if (!formData.category_id) {
        toast.error('Category is required');
        return false;
      }

      if (!formData.external_url?.trim()) {
        toast.error('External URL is required');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Creating resource with data:', formData);

        const result = await actions.createResource({
          ...formData,
          category_id: parseInt(formData.category_id),
          tags: formData.tags || [],
          is_published: formData.is_published || false,
          is_featured: formData.is_featured || false,
          sort_order: formData.sort_order || 0,
        });

        if (result) {
          console.log('✅ AdminResourceActions: Resource created successfully');
          return true;
        }

        return false;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Create resource failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Update resource
  const handleUpdateResource = useCallback(
    async (resource: ResourceItem, formData: ResourceFormData) => {
      if (!resource?.id) {
        toast.error('Invalid resource');
        return false;
      }

      if (!formData.title?.trim()) {
        toast.error('Title is required');
        return false;
      }

      if (!formData.description?.trim()) {
        toast.error('Description is required');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Updating resource:', resource.id, formData);

        await actions.updateResource(Number(resource.id), {
          ...formData,
          category_id: parseInt(formData.category_id),
          tags: formData.tags || [],
          is_published:
            formData.is_published !== undefined ? formData.is_published : resource.is_published,
          is_featured:
            formData.is_featured !== undefined ? formData.is_featured : resource.is_featured,
          sort_order: formData.sort_order !== undefined ? formData.sort_order : resource.sort_order,
        });

        console.log('✅ AdminResourceActions: Resource updated successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Update resource failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Delete resource
  const handleDeleteResource = useCallback(
    async (resource: ResourceItem) => {
      if (!resource?.id) {
        toast.error('Invalid resource');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Deleting resource:', resource.id);

        await actions.deleteResource(Number(resource.id));

        console.log('✅ AdminResourceActions: Resource deleted successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Delete resource failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Toggle publish
  const handleTogglePublish = useCallback(
    async (resource: ResourceItem) => {
      if (!resource?.id) {
        console.error('Invalid resource for toggle publish');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Toggling publish for resource:', resource.id);

        await actions.togglePublishResource(Number(resource.id));

        console.log('✅ AdminResourceActions: Publish toggled successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Toggle publish failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Toggle feature
  const handleToggleFeature = useCallback(
    async (resource: ResourceItem) => {
      if (!resource?.id) {
        console.error('Invalid resource for toggle feature');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Toggling feature for resource:', resource.id);

        await actions.toggleFeatureResource(Number(resource.id));

        console.log('✅ AdminResourceActions: Feature toggled successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Toggle feature failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Create category
  const handleCreateCategory = useCallback(
    async (formData: CategoryFormData) => {
      if (!formData.name?.trim()) {
        toast.error('Category name is required');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Creating category:', formData);

        const result = await actions.createCategory({
          ...formData,
          icon: formData.icon || 'BookOpen',
          color: formData.color || '#3B82F6',
          sort_order: formData.sort_order || 0,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
        });

        if (result) {
          console.log('✅ AdminResourceActions: Category created successfully');
          return true;
        }

        return false;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Create category failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Update category
  const handleUpdateCategory = useCallback(
    async (category: ResourceCategory, formData: CategoryFormData) => {
      if (!category?.id) {
        toast.error('Invalid category');
        return false;
      }

      if (!formData.name?.trim()) {
        toast.error('Category name is required');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Updating category:', category.id, formData);

        await actions.updateCategory(Number(category.id), {
          ...formData,
          icon: formData.icon || category.icon,
          color: formData.color || category.color,
          sort_order: formData.sort_order !== undefined ? formData.sort_order : category.sort_order,
          is_active: formData.is_active !== undefined ? formData.is_active : category.is_active,
        });

        console.log('✅ AdminResourceActions: Category updated successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Update category failed:', error);
        return false;
      }
    },
    [actions]
  );

  // SIMPLIFIED: Delete category
  const handleDeleteCategory = useCallback(
    async (category: ResourceCategory) => {
      if (!category?.id) {
        toast.error('Invalid category');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Deleting category:', category.id);

        await actions.deleteCategory(Number(category.id));

        console.log('✅ AdminResourceActions: Category deleted successfully');
        return true;
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Delete category failed:', error);
        return false;
      }
    },
    [actions]
  );

  // BULK OPERATIONS - Simple implementations
  const handleBulkPublish = useCallback(
    async (resourceIds: number[]) => {
      if (!resourceIds.length) {
        toast.error('No resources selected');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Bulk publishing resources:', resourceIds);

        let successCount = 0;
        for (const id of resourceIds) {
          try {
            await actions.togglePublishResource(id);
            successCount++;
          } catch (error) {
            console.error(`Failed to publish resource ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} resource(s) published successfully`);
          console.log('✅ AdminResourceActions: Bulk publish completed:', successCount);
          return true;
        } else {
          toast.error('Failed to publish any resources');
          return false;
        }
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Bulk publish failed:', error);
        toast.error('Bulk publish operation failed');
        return false;
      }
    },
    [actions]
  );

  const handleBulkDelete = useCallback(
    async (resourceIds: number[]) => {
      if (!resourceIds.length) {
        toast.error('No resources selected');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Bulk deleting resources:', resourceIds);

        let successCount = 0;
        for (const id of resourceIds) {
          try {
            await actions.deleteResource(id);
            successCount++;
          } catch (error) {
            console.error(`Failed to delete resource ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} resource(s) deleted successfully`);
          console.log('✅ AdminResourceActions: Bulk delete completed:', successCount);
          return true;
        } else {
          toast.error('Failed to delete any resources');
          return false;
        }
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Bulk delete failed:', error);
        toast.error('Bulk delete operation failed');
        return false;
      }
    },
    [actions]
  );

  const handleBulkFeature = useCallback(
    async (resourceIds: number[]) => {
      if (!resourceIds.length) {
        toast.error('No resources selected');
        return false;
      }

      try {
        console.log('🎯 AdminResourceActions: Bulk featuring resources:', resourceIds);

        let successCount = 0;
        for (const id of resourceIds) {
          try {
            await actions.toggleFeatureResource(id);
            successCount++;
          } catch (error) {
            console.error(`Failed to feature resource ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} resource(s) featured successfully`);
          console.log('✅ AdminResourceActions: Bulk feature completed:', successCount);
          return true;
        } else {
          toast.error('Failed to feature any resources');
          return false;
        }
      } catch (error: any) {
        console.error('❌ AdminResourceActions: Bulk feature failed:', error);
        toast.error('Bulk feature operation failed');
        return false;
      }
    },
    [actions]
  );

  // VALIDATION HELPERS - Simple
  const validateResourceData = useCallback(
    (data: ResourceFormData): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!data.title?.trim()) {
        errors.push('Title is required');
      } else if (data.title.length < 5) {
        errors.push('Title must be at least 5 characters long');
      } else if (data.title.length > 255) {
        errors.push('Title cannot exceed 255 characters');
      }

      if (!data.description?.trim()) {
        errors.push('Description is required');
      } else if (data.description.length < 20) {
        errors.push('Description must be at least 20 characters long');
      } else if (data.description.length > 2000) {
        errors.push('Description cannot exceed 2000 characters');
      }

      if (!data.category_id) {
        errors.push('Category is required');
      }

      if (!data.type) {
        errors.push('Resource type is required');
      }

      if (!data.difficulty) {
        errors.push('Difficulty level is required');
      }

      if (!data.external_url?.trim()) {
        errors.push('External URL is required');
      } else {
        try {
          new URL(data.external_url);
        } catch {
          errors.push('Please provide a valid external URL');
        }
      }

      if (data.download_url) {
        try {
          new URL(data.download_url);
        } catch {
          errors.push('Please provide a valid download URL');
        }
      }

      if (data.thumbnail_url) {
        try {
          new URL(data.thumbnail_url);
        } catch {
          errors.push('Please provide a valid thumbnail URL');
        }
      }

      if (data.tags && data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }

      if (data.author_name && data.author_name.length > 255) {
        errors.push('Author name cannot exceed 255 characters');
      }

      if (data.author_bio && data.author_bio.length > 1000) {
        errors.push('Author bio cannot exceed 1000 characters');
      }

      return { valid: errors.length === 0, errors };
    },
    []
  );

  const validateCategoryData = useCallback(
    (data: CategoryFormData): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!data.name?.trim()) {
        errors.push('Category name is required');
      } else if (data.name.length < 3) {
        errors.push('Category name must be at least 3 characters long');
      } else if (data.name.length > 255) {
        errors.push('Category name cannot exceed 255 characters');
      }

      if (data.description && data.description.length > 1000) {
        errors.push('Description cannot exceed 1000 characters');
      }

      if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
        errors.push('Color must be a valid hex color code (e.g., #FF0000)');
      }

      if (
        data.sort_order !== undefined &&
        (data.sort_order < 0 || !Number.isInteger(data.sort_order))
      ) {
        errors.push('Sort order must be a non-negative integer');
      }

      return { valid: errors.length === 0, errors };
    },
    []
  );

  // FORM HELPERS - Simple
  const prepareResourceData = useCallback((formData: ResourceFormData): any => {
    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category_id: parseInt(formData.category_id),
      type: formData.type,
      difficulty: formData.difficulty,
      external_url: formData.external_url.trim(),
      download_url: formData.download_url?.trim() || null,
      thumbnail_url: formData.thumbnail_url?.trim() || null,
      duration: formData.duration?.trim() || null,
      tags: formData.tags || [],
      author_name: formData.author_name?.trim() || null,
      author_bio: formData.author_bio?.trim() || null,
      subcategory: formData.subcategory?.trim() || null,
      is_published: formData.is_published || false,
      is_featured: formData.is_featured || false,
      sort_order: formData.sort_order || 0,
    };
  }, []);

  const prepareCategoryData = useCallback((formData: CategoryFormData): any => {
    return {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      icon: formData.icon || 'BookOpen',
      color: formData.color || '#3B82F6',
      sort_order: formData.sort_order || 0,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    };
  }, []);

  // STATUS HELPERS - Simple
  const getPublishStatus = useCallback((resource: ResourceItem): string => {
    return resource.is_published ? 'Published' : 'Draft';
  }, []);

  const getFeatureStatus = useCallback((resource: ResourceItem): string => {
    return resource.is_featured ? 'Featured' : 'Regular';
  }, []);

  const getCategoryStatus = useCallback((category: ResourceCategory): string => {
    return category.is_active ? 'Active' : 'Inactive';
  }, []);

  const getResourceTypeLabel = useCallback((type: string): string => {
    const types = {
      article: 'Article',
      video: 'Video',
      audio: 'Audio',
      exercise: 'Exercise',
      tool: 'Tool',
      worksheet: 'Worksheet',
    } as const;
    return types[type as keyof typeof types] || type;
  }, []);

  const getDifficultyLabel = useCallback((difficulty: string): string => {
    const difficulties = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    } as const;
    return difficulties[difficulty as keyof typeof difficulties] || difficulty;
  }, []);

  const getDifficultyColor = useCallback((difficulty: string): string => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    } as const;
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  // CONFIRMATION HELPERS - Simple
  const confirmDelete = useCallback(
    (itemName: string, itemType: 'Resource' | 'Category' = 'Resource'): boolean => {
      return window.confirm(
        `Are you sure you want to delete this ${itemType.toLowerCase()}?\n\n"${itemName}"\n\nThis action cannot be undone.`
      );
    },
    []
  );

  const confirmBulkDelete = useCallback(
    (count: number, itemType: 'Resource' | 'Category' = 'Resource'): boolean => {
      return window.confirm(
        `Are you sure you want to delete ${count} ${itemType.toLowerCase()}${
          count > 1 ? 's' : ''
        }?\n\nThis action cannot be undone.`
      );
    },
    []
  );

  const confirmPublishToggle = useCallback((resource: ResourceItem): boolean => {
    const action = resource.is_published ? 'unpublish' : 'publish';
    return window.confirm(
      `Are you sure you want to ${action} this resource?\n\n"${resource.title}"`
    );
  }, []);

  const confirmFeatureToggle = useCallback((resource: ResourceItem): boolean => {
    const action = resource.is_featured ? 'unfeature' : 'feature';
    return window.confirm(
      `Are you sure you want to ${action} this resource?\n\n"${resource.title}"`
    );
  }, []);

  // ERROR HANDLING - Simple
  const handleActionError = useCallback((error: any, action: string): void => {
    console.error(`❌ AdminResourceActions: ${action} failed:`, error);

    let userMessage = `Failed to ${action.toLowerCase()}`;

    if (error?.message) {
      if (error.message.includes('permission')) {
        userMessage = `You don't have permission to ${action.toLowerCase()}`;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = `Network error while trying to ${action.toLowerCase()}. Please check your connection.`;
      } else if (error.message.includes('validation')) {
        userMessage = `Validation failed. Please check your input and try again.`;
      } else {
        userMessage = error.message;
      }
    }

    toast.error(userMessage);
  }, []);

  // UTILITY FUNCTIONS - Simple
  const formatResourceForForm = useCallback((resource: ResourceItem): ResourceFormData => {
    return {
      title: resource.title,
      description: resource.description,
      category_id: resource.category_id.toString(),
      type: resource.type,
      difficulty: resource.difficulty,
      external_url: resource.external_url,
      download_url: resource.download_url || '',
      thumbnail_url: resource.thumbnail_url || '',
      duration: resource.duration || '',
      tags: resource.tags || [],
      author_name: resource.author_name || '',
      author_bio: resource.author_bio || '',
      subcategory: resource.subcategory || '',
      is_published: resource.is_published,
      is_featured: resource.is_featured,
      sort_order: resource.sort_order,
    };
  }, []);

  const formatCategoryForForm = useCallback((category: ResourceCategory): CategoryFormData => {
    return {
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
      is_active: category.is_active,
    };
  }, []);

  // ANALYTICS HELPERS - Simple
  const calculateSuccessRate = useCallback((total: number, successful: number): number => {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  }, []);

  const formatActionSummary = useCallback(
    (action: string, total: number, successful: number): string => {
      const rate = calculateSuccessRate(total, successful);
      return `${action}: ${successful}/${total} successful (${rate}%)`;
    },
    [calculateSuccessRate]
  );

  // PERFORMANCE HELPERS - Simple
  const debounceAction = useCallback((fn: Function, delay: number = 300) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  }, []);

  // Return all handlers and utilities
  return {
    // Main action handlers
    handleCreateResource,
    handleUpdateResource,
    handleDeleteResource,
    handleTogglePublish,
    handleToggleFeature,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,

    // Bulk operations
    handleBulkPublish,
    handleBulkDelete,
    handleBulkFeature,

    // Validation helpers
    validateResourceData,
    validateCategoryData,

    // Form helpers
    prepareResourceData,
    prepareCategoryData,
    formatResourceForForm,
    formatCategoryForForm,

    // Status helpers
    getPublishStatus,
    getFeatureStatus,
    getCategoryStatus,
    getResourceTypeLabel,
    getDifficultyLabel,
    getDifficultyColor,

    // Confirmation helpers
    confirmDelete,
    confirmBulkDelete,
    confirmPublishToggle,
    confirmFeatureToggle,

    // Error handling
    handleActionError,

    // Analytics helpers
    calculateSuccessRate,
    formatActionSummary,

    // Performance helpers
    debounceAction,
  };
}

// SIMPLE UTILITY HOOKS - No complex logic

export function useResourceFormValidation() {
  const validateResource = useCallback((data: ResourceFormData) => {
    const errors: Record<string, string> = {};

    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!data.description?.trim()) {
      errors.description = 'Description is required';
    } else if (data.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!data.category_id) {
      errors.category_id = 'Category is required';
    }

    if (!data.type) {
      errors.type = 'Resource type is required';
    }

    if (!data.difficulty) {
      errors.difficulty = 'Difficulty level is required';
    }

    if (!data.external_url?.trim()) {
      errors.external_url = 'External URL is required';
    } else {
      try {
        new URL(data.external_url);
      } catch {
        errors.external_url = 'Please provide a valid URL';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  const validateCategory = useCallback((data: CategoryFormData) => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Category name is required';
    } else if (data.name.length < 3) {
      errors.name = 'Category name must be at least 3 characters';
    }

    if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
      errors.color = 'Invalid color format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return {
    validateResource,
    validateCategory,
  };
}

export function useResourceActionStatus() {
  const getActionButtonText = useCallback((action: string, isLoading: boolean) => {
    if (isLoading) {
      return `${action}...`;
    }
    return action;
  }, []);

  const getActionButtonClass = useCallback(
    (variant: 'primary' | 'secondary' | 'danger' = 'primary', isLoading = false) => {
      const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200';
      const loadingClasses = isLoading ? 'opacity-50 cursor-not-allowed' : '';

      const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      };

      return `${baseClasses} ${variantClasses[variant]} ${loadingClasses}`.trim();
    },
    []
  );

  return {
    getActionButtonText,
    getActionButtonClass,
  };
}