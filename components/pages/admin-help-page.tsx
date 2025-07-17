// components/pages/admin-help-page.tsx - OPTIMIZED VERSION
"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Target,
  Zap,
  MessageSquare,
  Settings,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

// Custom hooks
import { useAdminHelpData } from "@/hooks/admin-help/useAdminHelpData"

// Components
import { AdminHelpHeader } from "@/components/admin-help/AdminHelpHeader"
import { FAQManagementTab } from "@/components/admin-help/tabs/FAQManagementTab"
import { CategoryManagementTab } from "@/components/admin-help/tabs/CategoryManagementTab"
import { SuggestionsTab } from "@/components/admin-help/tabs/SuggestionsTab"
import { AnalyticsTab } from "@/components/admin-help/tabs/AnalyticsTab"
import { CreateFAQDialog } from "@/components/admin-help/dialogs/CreateFAQDialog"
import { EditFAQDialog } from "@/components/admin-help/dialogs/EditFAQDialog"
import { CreateCategoryDialog } from "@/components/admin-help/dialogs/CreateCategoryDialog"
import { EditCategoryDialog } from "@/components/admin-help/dialogs/EditCategoryDialog"

// Error Boundary
import { ErrorBoundary } from "@/components/common/error-boundary"

// Types
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory } from "@/services/help.service"
import { AdminHelpPageProps, DialogStates, FAQFormData, CategoryFormData, TabType } from "@/types/admin-help"

// OPTIMIZED: Error fallback component
function AdminHelpErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Failed to Load Help Admin</h3>
          <p className="text-gray-600">
            {error.message.includes('network') || error.message.includes('fetch')
              ? 'Network connection problem. Please check your internet connection.'
              : 'There was an error loading the admin interface. Please try again.'}
          </p>
          <button
            onClick={retry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// OPTIMIZED: Main component with performance improvements
function AdminHelpPageContent({ onNavigate }: AdminHelpPageProps) {
  const { user } = useAuth()
  
  // STABLE tab state
  const [selectedTab, setSelectedTab] = useState<TabType>("faqs")
  
  // OPTIMIZED: Get all data from hook - memoized to prevent re-renders
  const helpData = useAdminHelpData()
  
  // STABLE dialog states - using useRef to prevent re-renders
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    showCreateFAQDialog: false,
    showEditFAQDialog: false,
    showDeleteFAQDialog: false,
    showCreateCategoryDialog: false,
    showEditCategoryDialog: false,
    showDeleteCategoryDialog: false
  })

  // STABLE form states
  const [selectedFAQ, setSelectedFAQ] = useState<HelpFAQ | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null)

  // OPTIMIZED: Form states with stable defaults
  const [faqForm, setFAQForm] = useState<FAQFormData>(() => ({
    category_id: "",
    question: "",
    answer: "",
    tags: [],
    is_published: false,
    is_featured: false,
    sort_order: 0
  }))

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(() => ({
    name: "",
    description: "",
    icon: "HelpCircle",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0
  }))

  // OPTIMIZED: Stable permission check with early return
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role])
  
  // OPTIMIZED: Check admin permissions only once
  useEffect(() => {
    if (!user) return
    
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      if (onNavigate) {
        onNavigate('help')
      }
    }
  }, [user, isAdmin, onNavigate])

  // STABLE navigation handlers - memoized
  const handleBackToHelp = useCallback(() => {
    if (onNavigate) {
      onNavigate('help')
    }
  }, [onNavigate])

  // OPTIMIZED: Refresh handler with debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleRefreshAll = useCallback(async () => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    try {
      console.log('🔄 AdminHelpPage: Smart refresh triggered')
      await helpData.actions.refreshAll()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Failed to refresh some data')
    }
  }, [helpData.actions])

  // STABLE dialog handlers - memoized
  const openDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: true }))
  }, [])

  const closeDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: false }))
  }, [])

  // OPTIMIZED: Form reset handlers - stable functions
  const resetFAQForm = useCallback(() => {
    setFAQForm({
      category_id: "",
      question: "",
      answer: "",
      tags: [],
      is_published: false,
      is_featured: false,
      sort_order: 0
    })
  }, [])

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({
      name: "",
      description: "",
      icon: "HelpCircle",
      color: "#3B82F6",
      is_active: true,
      sort_order: 0
    })
  }, [])

  // OPTIMIZED: FAQ operations with better error handling
  const handleCreateFAQ = useCallback(async () => {
    try {
      const success = await helpData.enhancedActions.handleCreateFAQ(faqForm)
      if (success) {
        closeDialog('showCreateFAQDialog')
        resetFAQForm()
      }
    } catch (error) {
      console.error('Create FAQ failed:', error)
    }
  }, [faqForm, helpData.enhancedActions, closeDialog, resetFAQForm])

  const handleEditFAQ = useCallback((faq: HelpFAQ) => {
    if (!faq) {
      console.error('No FAQ provided for editing')
      return
    }

    setSelectedFAQ(faq)
    setFAQForm({
      category_id: faq.category_id?.toString() || "",
      question: faq.question || "",
      answer: faq.answer || "",
      tags: Array.isArray(faq.tags) ? faq.tags : [],
      is_published: Boolean(faq.is_published),
      is_featured: Boolean(faq.is_featured),
      sort_order: faq.sort_order || 0
    })
    openDialog('showEditFAQDialog')
  }, [openDialog])

  const handleUpdateFAQ = useCallback(async () => {
    if (!selectedFAQ) return
    
    try {
      const success = await helpData.enhancedActions.handleUpdateFAQ(selectedFAQ, faqForm)
      if (success) {
        closeDialog('showEditFAQDialog')
        setSelectedFAQ(null)
      }
    } catch (error) {
      console.error('Update FAQ failed:', error)
    }
  }, [selectedFAQ, faqForm, helpData.enhancedActions, closeDialog])

  const handleDeleteFAQ = useCallback(async () => {
    if (!selectedFAQ) return

    try {
      const success = await helpData.enhancedActions.handleDeleteFAQ(selectedFAQ)
      if (success) {
        closeDialog('showDeleteFAQDialog')
        setSelectedFAQ(null)
      }
    } catch (error) {
      console.error('Delete FAQ failed:', error)
    }
  }, [selectedFAQ, helpData.enhancedActions, closeDialog])

  // OPTIMIZED: Quick action handlers - stable and memoized
  const handleTogglePublish = useCallback(async (faq: HelpFAQ) => {
    try {
      await helpData.enhancedActions.handleTogglePublish(faq)
    } catch (error) {
      console.error('Toggle publish failed:', error)
    }
  }, [helpData.enhancedActions])

  const handleToggleFeature = useCallback(async (faq: HelpFAQ) => {
    try {
      await helpData.enhancedActions.handleToggleFeature(faq)
    } catch (error) {
      console.error('Toggle feature failed:', error)
    }
  }, [helpData.enhancedActions])

  // OPTIMIZED: Category operations - stable handlers
  const handleCreateCategory = useCallback(async () => {
    try {
      const success = await helpData.enhancedActions.handleCreateCategory(categoryForm)
      if (success) {
        closeDialog('showCreateCategoryDialog')
        resetCategoryForm()
      }
    } catch (error) {
      console.error('Create category failed:', error)
    }
  }, [categoryForm, helpData.enhancedActions, closeDialog, resetCategoryForm])

  const handleEditCategory = useCallback((category: HelpCategory) => {
    if (!category) {
      console.error('No category provided for editing')
      return
    }

    setSelectedCategory(category)
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "HelpCircle",
      color: category.color || "#3B82F6",
      is_active: Boolean(category.is_active),
      sort_order: category.sort_order || 0
    })
    openDialog('showEditCategoryDialog')
  }, [openDialog])

  const handleUpdateCategory = useCallback(async () => {
    if (!selectedCategory) return
    
    try {
      const success = await helpData.enhancedActions.handleUpdateCategory(selectedCategory, categoryForm)
      if (success) {
        closeDialog('showEditCategoryDialog')
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Update category failed:', error)
    }
  }, [selectedCategory, categoryForm, helpData.enhancedActions, closeDialog])

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return

    try {
      const success = await helpData.enhancedActions.handleDeleteCategory(selectedCategory)
      if (success) {
        closeDialog('showDeleteCategoryDialog')
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Delete category failed:', error)
    }
  }, [selectedCategory, helpData.enhancedActions, closeDialog])

  // OPTIMIZED: Suggestion management - stable handlers
  const handleApproveSuggestion = useCallback(async (faq: HelpFAQ) => {
    try {
      await helpData.enhancedActions.handleApproveSuggestion(faq)
    } catch (error) {
      console.error('Approve suggestion failed:', error)
    }
  }, [helpData.enhancedActions])

  const handleRejectSuggestion = useCallback(async (faq: HelpFAQ) => {
    try {
      await helpData.enhancedActions.handleRejectSuggestion(faq)
    } catch (error) {
      console.error('Reject suggestion failed:', error)
    }
  }, [helpData.enhancedActions])

  // OPTIMIZED: Tag handlers - stable and efficient
  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !faqForm.tags.includes(trimmedTag) && faqForm.tags.length < 10) {
      setFAQForm(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }))
    }
  }, [faqForm.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFAQForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // OPTIMIZED: Filter handlers with debouncing
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    // Clear previous timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current)
    }
    
    // Debounce filter changes
    filterTimeoutRef.current = setTimeout(() => {
      helpData.setFilters({ search: value }, true)
    }, 300)
  }, [helpData.setFilters])

  const handleFilterChange = useCallback((key: string, value: string) => {
    helpData.setFilters({ [key]: value === 'all' ? undefined : value }, true)
  }, [helpData.setFilters])

  const handleClearFilters = useCallback(() => {
    helpData.clearFilters(true)
  }, [helpData.clearFilters])

  // OPTIMIZED: Early returns for better performance
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <Button onClick={handleBackToHelp}>Back to Help Center</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // OPTIMIZED: Main render with error boundary
  return (
    <ErrorBoundary
      fallback={AdminHelpErrorFallback}
      onError={(error) => {
        console.error('AdminHelpPage Error:', error)
        // Clear problematic cache on critical errors
        if (error.message.includes('cache') || error.message.includes('fetch')) {
          helpData.actions.invalidateCache()
        }
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
          {/* Header */}
          <AdminHelpHeader
            adminStats={helpData.adminStats}
            isLoading={helpData.isLoading}
            isInitialized={helpData.isInitialized}
            onBackToHelp={handleBackToHelp}
            onRefreshAll={handleRefreshAll}
          />

          {/* Error display */}
          {helpData.hasError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    {helpData.errors.faqs || helpData.errors.categories || helpData.errors.stats || 'An error occurred while loading data'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAll}
                    className="ml-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TabType)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-white rounded-xl shadow-sm">
              <TabsTrigger value="faqs" className="rounded-lg font-medium">
                <Target className="h-4 w-4 mr-2" />
                FAQ Management
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-lg font-medium">
                <Settings className="h-4 w-4 mr-2" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="rounded-lg font-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Suggestions
                {helpData.adminStats.suggested_faqs > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                    {helpData.adminStats.suggested_faqs}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg font-medium">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* FAQ Management Tab */}
            <TabsContent value="faqs" className="space-y-6">
              <FAQManagementTab
                faqs={helpData.faqs}
                categories={helpData.categories}
                filters={helpData.filters}
                hasActiveFilters={helpData.hasActiveFilters}
                loading={helpData.loading}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onCreateFAQ={() => openDialog('showCreateFAQDialog')}
                onEditFAQ={handleEditFAQ}
                onDeleteFAQ={(faq) => {
                  setSelectedFAQ(faq)
                  openDialog('showDeleteFAQDialog')
                }}
                onTogglePublish={handleTogglePublish}
                onToggleFeature={handleToggleFeature}
                setFilters={helpData.setFilters}
              />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <CategoryManagementTab
                categories={helpData.categories}
                loading={helpData.loading}
                onCreateCategory={() => openDialog('showCreateCategoryDialog')}
                onEditCategory={handleEditCategory}
                onDeleteCategory={(category) => {
                  setSelectedCategory(category)
                  openDialog('showDeleteCategoryDialog')
                }}
              />
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-6">
              <SuggestionsTab
                suggestedFAQs={helpData.suggestedFAQs}
                adminStats={helpData.adminStats}
                loading={helpData.loading}
                isApproving={helpData.isApproving}
                isRejecting={helpData.isRejecting}
                onEditFAQ={handleEditFAQ}
                onApproveSuggestion={handleApproveSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsTab
                faqs={helpData.faqs}
                categories={helpData.categories}
                adminStats={helpData.adminStats}
              />
            </TabsContent>
          </Tabs>

          {/* Store Performance Info */}
          <Card className="border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <div className="text-sm">
                    <span className="font-medium">Store Performance:</span>
                    <span className="text-gray-600 ml-2">
                      {helpData.isInitialized ? 'Initialized' : 'Loading'}, {helpData.faqs.length} FAQs, {helpData.categories.length} categories
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    helpData.actions.invalidateCache()
                    handleRefreshAll()
                  }}
                  disabled={helpData.isLoading}
                >
                  {helpData.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Store
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Dialogs with optimized props */}
        
        {/* Create FAQ Dialog */}
        <CreateFAQDialog
          open={dialogStates.showCreateFAQDialog}
          onOpenChange={(open) => !open && closeDialog('showCreateFAQDialog')}
          categories={helpData.categories}
          formData={faqForm}
          setFormData={setFAQForm}
          isLoading={helpData.loading.create}
          onSubmit={handleCreateFAQ}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* Edit FAQ Dialog */}
        <EditFAQDialog
          open={dialogStates.showEditFAQDialog}
          onOpenChange={(open) => !open && closeDialog('showEditFAQDialog')}
          categories={helpData.categories}
          formData={faqForm}
          setFormData={setFAQForm}
          isLoading={helpData.loading.update}
          onSubmit={handleUpdateFAQ}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* Delete FAQ Confirmation Dialog */}
        <AlertDialog open={dialogStates.showDeleteFAQDialog} onOpenChange={(open) => !open && closeDialog('showDeleteFAQDialog')}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this FAQ? This action cannot be undone.
                <br />
                <br />
                <strong>Question:</strong> {selectedFAQ?.question}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFAQ}
                className="bg-red-600 hover:bg-red-700"
                disabled={helpData.loading.delete}
              >
                {helpData.loading.delete ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete FAQ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Category Dialog */}
        <CreateCategoryDialog
          open={dialogStates.showCreateCategoryDialog}
          onOpenChange={(open) => !open && closeDialog('showCreateCategoryDialog')}
          formData={categoryForm}
          setFormData={setCategoryForm}
          isLoading={helpData.loading.create}
          onSubmit={handleCreateCategory}
        />

        {/* Edit Category Dialog */}
        <EditCategoryDialog
          open={dialogStates.showEditCategoryDialog}
          onOpenChange={(open) => !open && closeDialog('showEditCategoryDialog')}
          formData={categoryForm}
          setFormData={setCategoryForm}
          isLoading={helpData.loading.update}
          onSubmit={handleUpdateCategory}
        />

        {/* Delete Category Confirmation Dialog */}
        <AlertDialog open={dialogStates.showDeleteCategoryDialog} onOpenChange={(open) => !open && closeDialog('showDeleteCategoryDialog')}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? This action cannot be undone.
                <br />
                <br />
                <strong>Category:</strong> {selectedCategory?.name}
                <br />
                <strong>FAQs in this category:</strong> {selectedCategory?.faqs_count || 0}
                {(selectedCategory?.faqs_count || 0) > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                    <strong>Warning:</strong> This category contains FAQs. Please move them to another category first.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                className="bg-red-600 hover:bg-red-700"
                disabled={helpData.loading.delete || (selectedCategory?.faqs_count || 0) > 0}
              >
                {helpData.loading.delete ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Category
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}

// OPTIMIZED: Export with error boundary wrapper
export function AdminHelpPage(props: AdminHelpPageProps) {
  return <AdminHelpPageContent {...props} />
}