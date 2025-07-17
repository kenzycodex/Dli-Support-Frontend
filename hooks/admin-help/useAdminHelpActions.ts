// hooks/admin-help/useAdminHelpActions.ts
import { useCallback } from 'react'
import { toast } from 'sonner'
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory } from "@/services/help.service"
import { FAQFormData, CategoryFormData } from "@/types/admin-help"

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
    rejectSuggestion: (id: number) => Promise<any>
  }
}

export function useAdminHelpActions({ actions }: UseAdminHelpActionsProps) {
  
  const handleCreateFAQ = useCallback(async (formData: FAQFormData) => {
    if (!formData.question.trim() || !formData.answer.trim() || !formData.category_id) {
      toast.error('Please fill in all required fields')
      return false
    }

    try {
      const result = await actions.createFAQ({
        ...formData,
        category_id: parseInt(formData.category_id)
      })
      
      if (result) {
        toast.success('FAQ created successfully')
        return true
      }
      return false
    } catch (error) {
      console.error('Create FAQ failed:', error)
      toast.error('Failed to create FAQ')
      return false
    }
  }, [actions])

  const handleUpdateFAQ = useCallback(async (faq: HelpFAQ, formData: FAQFormData) => {
    if (!faq || !formData.question.trim() || !formData.answer.trim()) {
      toast.error('Please fill in all required fields')
      return false
    }

    try {
      await actions.updateFAQ(Number(faq.id), {
        ...formData,
        category_id: parseInt(formData.category_id)
      })
      
      toast.success('FAQ updated successfully')
      return true
    } catch (error) {
      console.error('Update FAQ failed:', error)
      toast.error('Failed to update FAQ')
      return false
    }
  }, [actions])

  const handleDeleteFAQ = useCallback(async (faq: HelpFAQ) => {
    if (!faq) return false

    try {
      await actions.deleteFAQ(Number(faq.id))
      toast.success('FAQ deleted successfully')
      return true
    } catch (error) {
      console.error('Delete FAQ failed:', error)
      toast.error('Failed to delete FAQ')
      return false
    }
  }, [actions])

  const handleTogglePublish = useCallback(async (faq: HelpFAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for toggle publish')
      return false
    }

    try {
      await actions.togglePublishFAQ(Number(faq.id))
      toast.success(`FAQ ${faq.is_published ? 'unpublished' : 'published'} successfully`)
      return true
    } catch (error) {
      console.error('Toggle publish failed:', error)
      toast.error('Failed to update FAQ status')
      return false
    }
  }, [actions])

  const handleToggleFeature = useCallback(async (faq: HelpFAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for toggle feature')
      return false
    }

    try {
      await actions.toggleFeatureFAQ(Number(faq.id))
      toast.success(`FAQ ${faq.is_featured ? 'unfeatured' : 'featured'} successfully`)
      return true
    } catch (error) {
      console.error('Toggle feature failed:', error)
      toast.error('Failed to update FAQ feature status')
      return false
    }
  }, [actions])

  const handleCreateCategory = useCallback(async (formData: CategoryFormData) => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name')
      return false
    }

    try {
      const result = await actions.createCategory(formData)
      
      if (result) {
        toast.success('Category created successfully')
        return true
      }
      return false
    } catch (error) {
      console.error('Create category failed:', error)
      toast.error('Failed to create category')
      return false
    }
  }, [actions])

  const handleUpdateCategory = useCallback(async (category: HelpCategory, formData: CategoryFormData) => {
    if (!category || !formData.name.trim()) {
      toast.error('Please enter a category name')
      return false
    }

    try {
      await actions.updateCategory(Number(category.id), formData)
      toast.success('Category updated successfully')
      return true
    } catch (error) {
      console.error('Update category failed:', error)
      toast.error('Failed to update category')
      return false
    }
  }, [actions])

  const handleDeleteCategory = useCallback(async (category: HelpCategory) => {
    if (!category) return false

    try {
      await actions.deleteCategory(Number(category.id))
      toast.success('Category deleted successfully')
      return true
    } catch (error) {
      console.error('Delete category failed:', error)
      toast.error('Failed to delete category')
      return false
    }
  }, [actions])

  const handleApproveSuggestion = useCallback(async (faq: HelpFAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for approval')
      return false
    }

    try {
      await actions.approveSuggestion(Number(faq.id))
      toast.success('Suggestion approved successfully')
      return true
    } catch (error) {
      console.error('Approve suggestion failed:', error)
      toast.error('Failed to approve suggestion')
      return false
    }
  }, [actions])

  const handleRejectSuggestion = useCallback(async (faq: HelpFAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for rejection')
      return false
    }

    try {
      await actions.rejectSuggestion(Number(faq.id))
      toast.success('Suggestion rejected successfully')
      return true
    } catch (error) {
      console.error('Reject suggestion failed:', error)
      toast.error('Failed to reject suggestion')
      return false
    }
  }, [actions])

  return {
    handleCreateFAQ,
    handleUpdateFAQ,
    handleDeleteFAQ,
    handleTogglePublish,
    handleToggleFeature,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleApproveSuggestion,
    handleRejectSuggestion
  }
}