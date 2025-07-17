// hooks/admin-help/useAdminHelpActions.ts - CORRECTED: Simplified like ticket actions

import { useCallback } from 'react'
import { toast } from 'sonner'
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory } from "@/services/help.service"

// Simple form data interfaces
export interface FAQFormData {
  question: string
  answer: string
  category_id: string
  tags?: string[]
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

interface UseAdminHelpActionsProps {
  actions: {
    createFAQ: (data: any) => Promise<any>
    updateFAQ: (id: number, data: any) => Promise<any>
    deleteFAQ: (id: number) => Promise<any>
    togglePublishFAQ: (id: number) => Promise<any>
    toggleFeatureFAQ: (id: number) => Promise<any>
    createCategory: (data: CategoryFormData) => Promise<any>
    updateCategory: (id: number, data: CategoryFormData) => Promise<any>
    deleteCategory: (id: number) => Promise<any>
    approveSuggestion: (id: number) => Promise<any>
    rejectSuggestion: (id: number, feedback?: string) => Promise<any>
  }
}

// CORRECTED: Simplified actions like ticket actions
export function useAdminHelpActions({ actions }: UseAdminHelpActionsProps) {
  
  // SIMPLIFIED: Create FAQ - no complex validation
  const handleCreateFAQ = useCallback(async (formData: FAQFormData) => {
    // Basic validation
    if (!formData.question?.trim()) {
      toast.error('Question is required')
      return false
    }

    if (!formData.answer?.trim()) {
      toast.error('Answer is required')
      return false
    }

    if (!formData.category_id) {
      toast.error('Category is required')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Creating FAQ with data:', formData)
      
      const result = await actions.createFAQ({
        ...formData,
        category_id: parseInt(formData.category_id),
        tags: formData.tags || [],
        is_published: formData.is_published || false,
        is_featured: formData.is_featured || false,
        sort_order: formData.sort_order || 0
      })
      
      if (result) {
        console.log('✅ AdminHelpActions: FAQ created successfully')
        // Note: Toast already shown in store action
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Create FAQ failed:', error)
      // Error toast already shown in store action
      return false
    }
  }, [actions])

  // SIMPLIFIED: Update FAQ
  const handleUpdateFAQ = useCallback(async (faq: HelpFAQ, formData: FAQFormData) => {
    if (!faq?.id) {
      toast.error('Invalid FAQ')
      return false
    }

    if (!formData.question?.trim()) {
      toast.error('Question is required')
      return false
    }

    if (!formData.answer?.trim()) {
      toast.error('Answer is required')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Updating FAQ:', faq.id, formData)
      
      await actions.updateFAQ(Number(faq.id), {
        ...formData,
        category_id: parseInt(formData.category_id),
        tags: formData.tags || [],
        is_published: formData.is_published !== undefined ? formData.is_published : faq.is_published,
        is_featured: formData.is_featured !== undefined ? formData.is_featured : faq.is_featured,
        sort_order: formData.sort_order !== undefined ? formData.sort_order : faq.sort_order
      })
      
      console.log('✅ AdminHelpActions: FAQ updated successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Update FAQ failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Delete FAQ
  const handleDeleteFAQ = useCallback(async (faq: HelpFAQ) => {
    if (!faq?.id) {
      toast.error('Invalid FAQ')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Deleting FAQ:', faq.id)
      
      await actions.deleteFAQ(Number(faq.id))
      
      console.log('✅ AdminHelpActions: FAQ deleted successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Delete FAQ failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Toggle publish
  const handleTogglePublish = useCallback(async (faq: HelpFAQ) => {
    if (!faq?.id) {
      console.error('Invalid FAQ for toggle publish')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Toggling publish for FAQ:', faq.id)
      
      await actions.togglePublishFAQ(Number(faq.id))
      
      console.log('✅ AdminHelpActions: Publish toggled successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Toggle publish failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Toggle feature
  const handleToggleFeature = useCallback(async (faq: HelpFAQ) => {
    if (!faq?.id) {
      console.error('Invalid FAQ for toggle feature')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Toggling feature for FAQ:', faq.id)
      
      await actions.toggleFeatureFAQ(Number(faq.id))
      
      console.log('✅ AdminHelpActions: Feature toggled successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Toggle feature failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Create category
  const handleCreateCategory = useCallback(async (formData: CategoryFormData) => {
    if (!formData.name?.trim()) {
      toast.error('Category name is required')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Creating category:', formData)
      
      const result = await actions.createCategory({
        ...formData,
        icon: formData.icon || 'HelpCircle',
        color: formData.color || '#3B82F6',
        sort_order: formData.sort_order || 0,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      })
      
      if (result) {
        console.log('✅ AdminHelpActions: Category created successfully')
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Create category failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Update category
  const handleUpdateCategory = useCallback(async (category: HelpCategory, formData: CategoryFormData) => {
    if (!category?.id) {
      toast.error('Invalid category')
      return false
    }

    if (!formData.name?.trim()) {
      toast.error('Category name is required')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Updating category:', category.id, formData)
      
      await actions.updateCategory(Number(category.id), {
        ...formData,
        icon: formData.icon || category.icon,
        color: formData.color || category.color,
        sort_order: formData.sort_order !== undefined ? formData.sort_order : category.sort_order,
        is_active: formData.is_active !== undefined ? formData.is_active : category.is_active
      })
      
      console.log('✅ AdminHelpActions: Category updated successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Update category failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Delete category
  const handleDeleteCategory = useCallback(async (category: HelpCategory) => {
    if (!category?.id) {
      toast.error('Invalid category')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Deleting category:', category.id)
      
      await actions.deleteCategory(Number(category.id))
      
      console.log('✅ AdminHelpActions: Category deleted successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Delete category failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Approve suggestion
  const handleApproveSuggestion = useCallback(async (faq: HelpFAQ) => {
    if (!faq?.id) {
      console.error('Invalid FAQ for approval')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Approving suggestion:', faq.id)
      
      await actions.approveSuggestion(Number(faq.id))
      
      console.log('✅ AdminHelpActions: Suggestion approved successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Approve suggestion failed:', error)
      return false
    }
  }, [actions])

  // SIMPLIFIED: Reject suggestion
  const handleRejectSuggestion = useCallback(async (faq: HelpFAQ, feedback?: string) => {
    if (!faq?.id) {
      console.error('Invalid FAQ for rejection')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Rejecting suggestion:', faq.id, feedback ? 'with feedback' : 'without feedback')
      
      await actions.rejectSuggestion(Number(faq.id), feedback)
      
      console.log('✅ AdminHelpActions: Suggestion rejected successfully')
      return true
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Reject suggestion failed:', error)
      return false
    }
  }, [actions])

  // BULK OPERATIONS - Simple implementations
  const handleBulkPublish = useCallback(async (faqIds: number[]) => {
    if (!faqIds.length) {
      toast.error('No FAQs selected')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Bulk publishing FAQs:', faqIds)
      
      let successCount = 0
      for (const id of faqIds) {
        try {
          await actions.togglePublishFAQ(id)
          successCount++
        } catch (error) {
          console.error(`Failed to publish FAQ ${id}:`, error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} FAQ(s) published successfully`)
        console.log('✅ AdminHelpActions: Bulk publish completed:', successCount)
        return true
      } else {
        toast.error('Failed to publish any FAQs')
        return false
      }
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Bulk publish failed:', error)
      toast.error('Bulk publish operation failed')
      return false
    }
  }, [actions])

  const handleBulkDelete = useCallback(async (faqIds: number[]) => {
    if (!faqIds.length) {
      toast.error('No FAQs selected')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Bulk deleting FAQs:', faqIds)
      
      let successCount = 0
      for (const id of faqIds) {
        try {
          await actions.deleteFAQ(id)
          successCount++
        } catch (error) {
          console.error(`Failed to delete FAQ ${id}:`, error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} FAQ(s) deleted successfully`)
        console.log('✅ AdminHelpActions: Bulk delete completed:', successCount)
        return true
      } else {
        toast.error('Failed to delete any FAQs')
        return false
      }
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Bulk delete failed:', error)
      toast.error('Bulk delete operation failed')
      return false
    }
  }, [actions])

  // VALIDATION HELPERS - Simple
  const validateFAQData = useCallback((data: FAQFormData): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!data.question?.trim()) {
      errors.push('Question is required')
    } else if (data.question.length < 10) {
      errors.push('Question must be at least 10 characters long')
    } else if (data.question.length > 500) {
      errors.push('Question cannot exceed 500 characters')
    }

    if (!data.answer?.trim()) {
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

    return { valid: errors.length === 0, errors }
  }, [])

  const validateCategoryData = useCallback((data: CategoryFormData): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!data.name?.trim()) {
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
  }, [])

  // FORM HELPERS - Simple
  const prepareFormData = useCallback((formData: FAQFormData): any => {
    return {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category_id: parseInt(formData.category_id),
      tags: formData.tags || [],
      is_published: formData.is_published || false,
      is_featured: formData.is_featured || false,
      sort_order: formData.sort_order || 0
    }
  }, [])

  const prepareCategoryData = useCallback((formData: CategoryFormData): any => {
    return {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      icon: formData.icon || 'HelpCircle',
      color: formData.color || '#3B82F6',
      sort_order: formData.sort_order || 0,
      is_active: formData.is_active !== undefined ? formData.is_active : true
    }
  }, [])

  // STATUS HELPERS - Simple
  const getPublishStatus = useCallback((faq: HelpFAQ): string => {
    return faq.is_published ? 'Published' : 'Draft'
  }, [])

  const getFeatureStatus = useCallback((faq: HelpFAQ): string => {
    return faq.is_featured ? 'Featured' : 'Regular'
  }, [])

  const getCategoryStatus = useCallback((category: HelpCategory): string => {
    return category.is_active ? 'Active' : 'Inactive'
  }, [])

  // CONFIRMATION HELPERS - Simple
  const confirmDelete = useCallback((itemName: string, itemType: 'FAQ' | 'Category' = 'FAQ'): boolean => {
    return window.confirm(
      `Are you sure you want to delete this ${itemType.toLowerCase()}?\n\n"${itemName}"\n\nThis action cannot be undone.`
    )
  }, [])

  const confirmBulkDelete = useCallback((count: number, itemType: 'FAQ' | 'Category' = 'FAQ'): boolean => {
    return window.confirm(
      `Are you sure you want to delete ${count} ${itemType.toLowerCase()}${count > 1 ? 's' : ''}?\n\nThis action cannot be undone.`
    )
  }, [])

  const confirmPublishToggle = useCallback((faq: HelpFAQ): boolean => {
    const action = faq.is_published ? 'unpublish' : 'publish'
    return window.confirm(
      `Are you sure you want to ${action} this FAQ?\n\n"${faq.question}"`
    )
  }, [])

  // ERROR HANDLING - Simple
  const handleActionError = useCallback((error: any, action: string): void => {
    console.error(`❌ AdminHelpActions: ${action} failed:`, error)
    
    let userMessage = `Failed to ${action.toLowerCase()}`
    
    if (error?.message) {
      if (error.message.includes('permission')) {
        userMessage = `You don't have permission to ${action.toLowerCase()}`
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = `Network error while trying to ${action.toLowerCase()}. Please check your connection.`
      } else if (error.message.includes('validation')) {
        userMessage = `Validation failed. Please check your input and try again.`
      } else {
        userMessage = error.message
      }
    }
    
    toast.error(userMessage)
  }, [])

  // UTILITY FUNCTIONS - Simple
  const formatFAQForForm = useCallback((faq: HelpFAQ): FAQFormData => {
    return {
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id.toString(),
      tags: faq.tags || [],
      is_published: faq.is_published,
      is_featured: faq.is_featured,
      sort_order: faq.sort_order
    }
  }, [])

  const formatCategoryForForm = useCallback((category: HelpCategory): CategoryFormData => {
    return {
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
      is_active: category.is_active
    }
  }, [])

  // SUGGESTION HELPERS - Simple
  const handleBulkApproveSuggestions = useCallback(async (faqIds: number[]) => {
    if (!faqIds.length) {
      toast.error('No suggestions selected')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Bulk approving suggestions:', faqIds)
      
      let successCount = 0
      for (const id of faqIds) {
        try {
          await actions.approveSuggestion(id)
          successCount++
        } catch (error) {
          console.error(`Failed to approve suggestion ${id}:`, error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} suggestion(s) approved successfully`)
        console.log('✅ AdminHelpActions: Bulk approve completed:', successCount)
        return true
      } else {
        toast.error('Failed to approve any suggestions')
        return false
      }
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Bulk approve failed:', error)
      toast.error('Bulk approve operation failed')
      return false
    }
  }, [actions])

  const handleBulkRejectSuggestions = useCallback(async (faqIds: number[], feedback?: string) => {
    if (!faqIds.length) {
      toast.error('No suggestions selected')
      return false
    }

    try {
      console.log('🎯 AdminHelpActions: Bulk rejecting suggestions:', faqIds)
      
      let successCount = 0
      for (const id of faqIds) {
        try {
          await actions.rejectSuggestion(id, feedback)
          successCount++
        } catch (error) {
          console.error(`Failed to reject suggestion ${id}:`, error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} suggestion(s) rejected successfully`)
        console.log('✅ AdminHelpActions: Bulk reject completed:', successCount)
        return true
      } else {
        toast.error('Failed to reject any suggestions')
        return false
      }
    } catch (error: any) {
      console.error('❌ AdminHelpActions: Bulk reject failed:', error)
      toast.error('Bulk reject operation failed')
      return false
    }
  }, [actions])

  // ANALYTICS HELPERS - Simple
  const calculateSuccessRate = useCallback((total: number, successful: number): number => {
    if (total === 0) return 0
    return Math.round((successful / total) * 100)
  }, [])

  const formatActionSummary = useCallback((action: string, total: number, successful: number): string => {
    const rate = calculateSuccessRate(total, successful)
    return `${action}: ${successful}/${total} successful (${rate}%)`
  }, [calculateSuccessRate])

  // PERFORMANCE HELPERS - Simple
  const debounceAction = useCallback((fn: Function, delay: number = 300) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(null, args), delay)
    }
  }, [])

  // Return all handlers and utilities
  return {
    // Main action handlers
    handleCreateFAQ,
    handleUpdateFAQ,
    handleDeleteFAQ,
    handleTogglePublish,
    handleToggleFeature,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleApproveSuggestion,
    handleRejectSuggestion,
    
    // Bulk operations
    handleBulkPublish,
    handleBulkDelete,
    handleBulkApproveSuggestions,
    handleBulkRejectSuggestions,
    
    // Validation helpers
    validateFAQData,
    validateCategoryData,
    
    // Form helpers
    prepareFormData,
    prepareCategoryData,
    formatFAQForForm,
    formatCategoryForForm,
    
    // Status helpers
    getPublishStatus,
    getFeatureStatus,
    getCategoryStatus,
    
    // Confirmation helpers
    confirmDelete,
    confirmBulkDelete,
    confirmPublishToggle,
    
    // Error handling
    handleActionError,
    
    // Analytics helpers
    calculateSuccessRate,
    formatActionSummary,
    
    // Performance helpers
    debounceAction
  }
}

// SIMPLE UTILITY HOOKS - No complex logic

export function useHelpFormValidation() {
  const validateFAQ = useCallback((data: FAQFormData) => {
    const errors: Record<string, string> = {}

    if (!data.question?.trim()) {
      errors.question = 'Question is required'
    } else if (data.question.length < 10) {
      errors.question = 'Question must be at least 10 characters'
    }

    if (!data.answer?.trim()) {
      errors.answer = 'Answer is required'
    } else if (data.answer.length < 20) {
      errors.answer = 'Answer must be at least 20 characters'
    }

    if (!data.category_id) {
      errors.category_id = 'Category is required'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [])

  const validateCategory = useCallback((data: CategoryFormData) => {
    const errors: Record<string, string> = {}

    if (!data.name?.trim()) {
      errors.name = 'Category name is required'
    } else if (data.name.length < 3) {
      errors.name = 'Category name must be at least 3 characters'
    }

    if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
      errors.color = 'Invalid color format'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [])

  return {
    validateFAQ,
    validateCategory
  }
}

export function useHelpActionStatus() {
  const getActionButtonText = useCallback((action: string, isLoading: boolean) => {
    if (isLoading) {
      return `${action}...`
    }
    return action
  }, [])

  const getActionButtonClass = useCallback((variant: 'primary' | 'secondary' | 'danger' = 'primary', isLoading = false) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200'
    const loadingClasses = isLoading ? 'opacity-50 cursor-not-allowed' : ''
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      danger: 'bg-red-600 text-white hover:bg-red-700'
    }
    
    return `${baseClasses} ${variantClasses[variant]} ${loadingClasses}`.trim()
  }, [])

  return {
    getActionButtonText,
    getActionButtonClass
  }
}