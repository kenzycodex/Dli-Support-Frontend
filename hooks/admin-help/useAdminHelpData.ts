// hooks/admin-help/useAdminHelpData.ts - OPTIMIZED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from "@/contexts/AuthContext"
import useHelpStore, {
  useHelpSelectors,
  useHelpActions,
  useHelpLoading,
  useHelpErrors,
  useHelpFilters,
  useHelpStats,
  useSuggestionManagement,
  useHelpStoreInitialization,
  type HelpFAQ,
  type HelpSuggestion
} from "@/stores/help-store"
import type { FAQ, HelpCategory } from "@/services/help.service"
import { AdminStats } from "@/types/admin-help"
import { useAdminHelpActions } from "./useAdminHelpActions"

export function useAdminHelpData() {
  const { user } = useAuth()
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])
  
  // STABLE selectors - no re-renders on every call
  const storeData = useHelpSelectors()
  const actions = useHelpActions()
  const loading = useHelpLoading()
  const errors = useHelpErrors()
  const filterData = useHelpFilters()
  const { realTimeStats } = useHelpStats()
  const suggestionData = useSuggestionManagement()
  const initData = useHelpStoreInitialization()

  // MEMOIZED derived data to prevent recalculation
  const suggestedFAQs = useMemo(() => 
    storeData.faqs.filter(faq => 
      !faq.is_published && 
      faq.created_by && 
      faq.created_by !== user?.id
    ), [storeData.faqs, user?.id]
  )

  // STABLE admin stats calculation
  const adminStats: AdminStats = useMemo(() => ({
    total_faqs: storeData.faqs.length,
    published_faqs: storeData.publishedFAQs.length,
    draft_faqs: storeData.draftFAQs.length,
    featured_faqs: storeData.featuredFAQs.length,
    categories_count: storeData.categories.length,
    active_categories: storeData.activeCategories.length,
    suggested_faqs: suggestedFAQs.length
  }), [storeData, suggestedFAQs.length])

  // STABLE loading and error states
  const isLoading = useMemo(() => 
    loading.faqs || loading.categories || loading.stats, 
    [loading.faqs, loading.categories, loading.stats]
  )
  
  const hasError = useMemo(() => 
    errors.faqs || errors.categories || errors.stats, 
    [errors.faqs, errors.categories, errors.stats]
  )

  // OPTIMIZED initialization - only run when needed
  useEffect(() => {
    if (!isAdmin || !initData.needsInitialization) return
    
    let timeoutId: NodeJS.Timeout
    
    const initializeStore = async () => {
      try {
        console.log('🎯 AdminHelpData: Initializing store (optimized)')
        await initData.initialize(false) // Don't force refresh
      } catch (error) {
        console.error('Failed to initialize help store:', error)
      }
    }
    
    // Debounced initialization to prevent rapid calls
    timeoutId = setTimeout(initializeStore, 100)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAdmin, initData.needsInitialization]) // Stable dependencies

  // STABLE enhanced actions - memoized to prevent recreation
  const enhancedActions = useAdminHelpActions({
    actions: {
      createFAQ: actions.createFAQ,
      updateFAQ: actions.updateFAQ,
      deleteFAQ: actions.deleteFAQ,
      togglePublishFAQ: actions.togglePublishFAQ,
      toggleFeatureFAQ: actions.toggleFeatureFAQ,
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,
      approveSuggestion: actions.approveSuggestion,
      rejectSuggestion: actions.rejectSuggestion
    }
  })

  // STABLE return object - use useMemo to prevent recreation
  return useMemo(() => ({
    user,
    isAdmin,
    faqs: storeData.faqs,
    categories: storeData.categories,
    suggestions: storeData.suggestions,
    suggestedFAQs,
    adminStats,
    loading,
    errors,
    isLoading,
    hasError,
    filters: filterData.filters,
    setFilters: filterData.setFilters,
    clearFilters: filterData.clearFilters,
    hasActiveFilters: filterData.hasActiveFilters,
    isInitialized: initData.isInitialized,
    needsInitialization: initData.needsInitialization,
    isApproving: suggestionData.isApproving,
    isRejecting: suggestionData.isRejecting,
    
    // STABLE actions object
    actions: {
      fetchFAQs: actions.fetchFAQs,
      fetchCategories: actions.fetchCategories,
      fetchStats: actions.fetchStats,
      refreshAll: actions.refreshAll,
      createFAQ: actions.createFAQ,
      updateFAQ: actions.updateFAQ,
      deleteFAQ: actions.deleteFAQ,
      togglePublishFAQ: actions.togglePublishFAQ,
      toggleFeatureFAQ: actions.toggleFeatureFAQ,
      createCategory: actions.createCategory,
      updateCategory: actions.updateCategory,
      deleteCategory: actions.deleteCategory,
      approveSuggestion: actions.approveSuggestion,
      rejectSuggestion: actions.rejectSuggestion,
      invalidateCache: actions.invalidateCache,
      initialize: initData.initialize
    },
    
    // STABLE enhanced actions
    enhancedActions
  }), [
    user,
    isAdmin,
    storeData,
    suggestedFAQs,
    adminStats,
    loading,
    errors,
    isLoading,
    hasError,
    filterData,
    initData,
    suggestionData,
    actions,
    enhancedActions
  ])
}