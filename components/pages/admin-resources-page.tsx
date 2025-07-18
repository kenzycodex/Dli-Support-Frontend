// components/pages/admin-resources-page.tsx - FIXED: Following Help Center pattern, no freezing issues
"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  FileText,
  Activity,
  EyeOff,
  StarOff,
  X,
  Globe,
  Lock
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// FIXED: Import the store-based hooks following help pattern
import { useAdminResourceData } from "@/hooks/admin-resources/useAdminResourceData"
import { useAdminResourceActions } from "@/hooks/admin-resources/useAdminResourceActions"

// Types
import type { ResourceItem } from "@/stores/resources-store"
import type { ResourceCategory } from "@/services/resources.service"

// FIXED: Proper type definitions following help pattern
type ResourceType = 'article' | 'audio' | 'video' | 'exercise' | 'tool' | 'worksheet'
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
type TabType = 'resources' | 'categories' | 'analytics' | 'imports'

// Filter options interface
interface FilterOptions {
  search?: string
  status?: 'all' | 'published' | 'unpublished' | 'featured'
  category?: string
  type?: string
  difficulty?: string
  sort_by?: string
  page?: number
  per_page?: number
}

// Form data interfaces
interface ResourceFormData {
  category_id: string
  title: string
  description: string
  type: ResourceType
  subcategory: string
  difficulty: DifficultyLevel
  duration: string
  external_url: string
  download_url: string
  thumbnail_url: string
  tags: string[]
  author_name: string
  author_bio: string
  sort_order: number
  is_published: boolean
  is_featured: boolean
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  sort_order: number
}

// Dialog states interface
interface DialogStates {
  showCreateResourceDialog: boolean
  showEditResourceDialog: boolean
  showDeleteResourceDialog: boolean
  showCreateCategoryDialog: boolean
  showEditCategoryDialog: boolean
  showDeleteCategoryDialog: boolean
}

interface AdminResourcesPageProps {
  onNavigate?: (page: string, params?: any) => void
}

// FIXED: Admin Header Component following help pattern
function AdminResourcesHeader({
  adminStats,
  isLoading,
  isInitialized,
  onBackToResources,
  onRefreshAll
}: {
  adminStats: any
  isLoading: boolean
  isInitialized: boolean
  onBackToResources: () => void
  onRefreshAll: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Resource Management</h1>
            <p className="text-blue-100 text-sm sm:text-lg">Manage resources, categories, and analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToResources}
            className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Public
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : adminStats.total_resources}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Total Resources</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : adminStats.categories_count}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Categories</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : adminStats.draft_resources}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Unpublished</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">{isInitialized ? '✓' : '...'}</div>
          <div className="text-xs sm:text-sm text-blue-100">Store Status</div>
        </div>
      </div>
    </div>
  )
}

// FIXED: Individual Action Dialog Component
function IndividualActionDialog({
  isOpen,
  resource,
  category,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: {
  isOpen: boolean
  resource?: ResourceItem | null
  category?: ResourceCategory | null
  action: 'edit' | 'delete'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}) {
  const item = resource || category
  const itemType = resource ? 'Resource' : 'Category'
  const isDelete = action === 'delete'

  if (!item) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete ? `Delete ${itemType}` : `Edit ${itemType}`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {isDelete 
                  ? `Are you sure you want to delete this ${itemType.toLowerCase()}? This action cannot be undone.`
                  : `Are you sure you want to edit this ${itemType.toLowerCase()}?`
                }
              </p>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="font-medium">
                  {resource ? resource.title : category?.name}
                </p>
                {resource && (
                  <p className="text-sm text-gray-600 mt-1">
                    {resource.description.substring(0, 100)}...
                  </p>
                )}
              </div>
              {isDelete && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ This will permanently delete the {itemType.toLowerCase()} and all associated data.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isProcessing}
            className={isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isDelete ? 'Deleting...' : 'Opening...'}
              </>
            ) : (
              <>
                {isDelete ? (
                  <><Trash2 className="h-4 w-4 mr-2" />Delete {itemType}</>
                ) : (
                  <><Edit className="h-4 w-4 mr-2" />Edit {itemType}</>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminResourcesPage({ onNavigate }: AdminResourcesPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<TabType>("resources")
  
  // FIXED: Use the store-based admin hooks following help pattern
  const {
    resources,
    categories,
    adminStats,
    loading,
    errors,
    isLoading,
    hasError,
    isInitialized,
    actions,
    enhancedActions,
    helpers,
  } = useAdminResourceData()

  // Local filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    category: 'all',
    type: 'all',
    difficulty: 'all',
    sort_by: 'newest',
    page: 1,
    per_page: 20,
  })

  // Dialog states
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    showCreateResourceDialog: false,
    showEditResourceDialog: false,
    showDeleteResourceDialog: false,
    showCreateCategoryDialog: false,
    showEditCategoryDialog: false,
    showDeleteCategoryDialog: false,
  })

  // Selected items for editing/deleting
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)

  // Individual action dialog state
  const [individualActionDialog, setIndividualActionDialog] = useState<{
    isOpen: boolean
    resource?: ResourceItem | null
    category?: ResourceCategory | null
    action: 'edit' | 'delete'
    isProcessing: boolean
  }>({
    isOpen: false,
    resource: null,
    category: null,
    action: 'edit',
    isProcessing: false
  })

  // Form states
  const [resourceForm, setResourceForm] = useState<ResourceFormData>({
    category_id: "",
    title: "",
    description: "",
    type: "article",
    subcategory: "",
    difficulty: "beginner",
    duration: "",
    external_url: "",
    download_url: "",
    thumbnail_url: "",
    tags: [],
    author_name: "",
    author_bio: "",
    sort_order: 0,
    is_published: false,
    is_featured: false
  })

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: "",
    description: "",
    icon: "BookOpen",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0
  })

  // Permission check
  const isAdmin = user?.role === 'admin'

  // Permission check effect
  useEffect(() => {
    if (!user) return

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      onNavigate?.('resources')
    }
  }, [user, isAdmin, onNavigate])

  // Navigation handler
  const handleBackToResources = useCallback(() => {
    onNavigate?.('resources')
  }, [onNavigate])

  // FIXED: Manual refresh handler - only when user clicks (following help pattern)
  const handleRefreshAll = useCallback(async () => {
    try {
      console.log('🔄 AdminResourcesPage: Manual refresh triggered by user')
      await helpers.refresh()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      toast.error('Failed to refresh data')
    }
  }, [helpers])

  // Dialog handlers
  const openDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: true }))
  }, [])

  const closeDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: false }))
  }, [])

  const closeAllDialogs = useCallback(() => {
    setDialogStates({
      showCreateResourceDialog: false,
      showEditResourceDialog: false,
      showDeleteResourceDialog: false,
      showCreateCategoryDialog: false,
      showEditCategoryDialog: false,
      showDeleteCategoryDialog: false,
    })
    setSelectedResource(null)
    setSelectedCategory(null)
  }, [])

  // Form reset handlers
  const resetResourceForm = useCallback(() => {
    setResourceForm({
      category_id: "",
      title: "",
      description: "",
      type: "article",
      subcategory: "",
      difficulty: "beginner",
      duration: "",
      external_url: "",
      download_url: "",
      thumbnail_url: "",
      tags: [],
      author_name: "",
      author_bio: "",
      sort_order: 0,
      is_published: false,
      is_featured: false
    })
  }, [])

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({
      name: "",
      description: "",
      icon: "BookOpen",
      color: "#3B82F6",
      is_active: true,
      sort_order: 0
    })
  }, [])

  // FIXED: Individual action handlers following help pattern
  const handleIndividualEditResource = useCallback((resource: ResourceItem) => {
    setIndividualActionDialog({
      isOpen: true,
      resource,
      category: null,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  const handleIndividualDeleteResource = useCallback((resource: ResourceItem) => {
    setIndividualActionDialog({
      isOpen: true,
      resource,
      category: null,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  const handleIndividualEditCategory = useCallback((category: ResourceCategory) => {
    setIndividualActionDialog({
      isOpen: true,
      resource: null,
      category,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  const handleIndividualDeleteCategory = useCallback((category: ResourceCategory) => {
    setIndividualActionDialog({
      isOpen: true,
      resource: null,
      category,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  // FIXED: Execute individual action following help pattern
  const executeIndividualAction = useCallback(async () => {
    const { resource, category, action } = individualActionDialog
    
    setIndividualActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      if (resource && action === 'edit') {
        // Set up edit dialog
        setSelectedResource(resource)
        setResourceForm({
          category_id: resource.category_id.toString(),
          title: resource.title,
          description: resource.description,
          type: resource.type,
          subcategory: resource.subcategory || "",
          difficulty: resource.difficulty,
          duration: resource.duration || "",
          external_url: resource.external_url,
          download_url: resource.download_url || "",
          thumbnail_url: resource.thumbnail_url || "",
          tags: resource.tags || [],
          author_name: resource.author_name || "",
          author_bio: resource.author_bio || "",
          sort_order: resource.sort_order,
          is_published: resource.is_published,
          is_featured: resource.is_featured
        })
        openDialog('showEditResourceDialog')
      } else if (resource && action === 'delete') {
        await enhancedActions.handleDeleteResource(resource)
      } else if (category && action === 'edit') {
        // Set up edit dialog
        setSelectedCategory(category)
        setCategoryForm({
          name: category.name,
          description: category.description || "",
          icon: category.icon,
          color: category.color,
          is_active: category.is_active,
          sort_order: category.sort_order
        })
        openDialog('showEditCategoryDialog')
      } else if (category && action === 'delete') {
        await enhancedActions.handleDeleteCategory(category)
      }

      setIndividualActionDialog({
        isOpen: false,
        resource: null,
        category: null,
        action: 'edit',
        isProcessing: false
      })
    } catch (error: any) {
      console.error(`Failed to ${action}:`, error)
      setIndividualActionDialog(prev => ({ ...prev, isProcessing: false }))
    }
  }, [individualActionDialog, enhancedActions, openDialog])

  // FIXED: Resource operations WITHOUT auto-refresh (following help pattern)
  const handleCreateResource = useCallback(async () => {
    try {
      console.log('📝 AdminResourcesPage: Creating resource')
      const success = await enhancedActions.handleCreateResource(resourceForm)
      if (success) {
        closeDialog('showCreateResourceDialog')
        resetResourceForm()
        toast.success('Resource created successfully!')
        // NO AUTO-REFRESH - let the store handle immediate updates
      }
    } catch (error) {
      console.error('❌ Create resource failed:', error)
    }
  }, [resourceForm, enhancedActions, closeDialog, resetResourceForm])

  const handleUpdateResource = useCallback(async () => {
    if (!selectedResource) return

    try {
      console.log('📝 AdminResourcesPage: Updating resource:', selectedResource.id)
      const success = await enhancedActions.handleUpdateResource(selectedResource, resourceForm)
      if (success) {
        closeDialog('showEditResourceDialog')
        setSelectedResource(null)
        toast.success('Resource updated successfully!')
        // NO AUTO-REFRESH - let the store handle immediate updates
      }
    } catch (error) {
      console.error('❌ Update resource failed:', error)
    }
  }, [selectedResource, resourceForm, enhancedActions, closeDialog])

  // FIXED: Quick actions WITHOUT auto-refresh (following help pattern)
  const handleQuickPublish = useCallback(async (resource: ResourceItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      console.log('📄 AdminResourcesPage: Toggling publish for resource:', resource.id)
      await enhancedActions.handleTogglePublish(resource)
      const status = resource.is_published ? 'unpublished' : 'published'
      toast.success(`Resource ${status} successfully!`)
      // NO AUTO-REFRESH - store handles immediate updates
    } catch (error) {
      console.error('❌ Toggle publish failed:', error)
    }
  }, [enhancedActions])

  const handleQuickFeature = useCallback(async (resource: ResourceItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      console.log('⭐ AdminResourcesPage: Toggling feature for resource:', resource.id)
      await enhancedActions.handleToggleFeature(resource)
      const status = resource.is_featured ? 'unfeatured' : 'featured'
      toast.success(`Resource ${status} successfully!`)
      // NO AUTO-REFRESH - store handles immediate updates
    } catch (error) {
      console.error('❌ Toggle feature failed:', error)
    }
  }, [enhancedActions])

  // FIXED: Category operations WITHOUT auto-refresh (following help pattern)
  const handleCreateCategory = useCallback(async () => {
    try {
      console.log('📂 AdminResourcesPage: Creating category')
      const success = await enhancedActions.handleCreateCategory(categoryForm)
      if (success) {
        closeDialog('showCreateCategoryDialog')
        resetCategoryForm()
        toast.success('Category created successfully!')
        // NO AUTO-REFRESH
      }
    } catch (error) {
      console.error('❌ Create category failed:', error)
    }
  }, [categoryForm, enhancedActions, closeDialog, resetCategoryForm])

  const handleUpdateCategory = useCallback(async () => {
    if (!selectedCategory) return

    try {
      console.log('📂 AdminResourcesPage: Updating category:', selectedCategory.id)
      const success = await enhancedActions.handleUpdateCategory(selectedCategory, categoryForm)
      if (success) {
        closeDialog('showEditCategoryDialog')
        setSelectedCategory(null)
        toast.success('Category updated successfully!')
        // NO AUTO-REFRESH
      }
    } catch (error) {
      console.error('❌ Update category failed:', error)
    }
  }, [selectedCategory, categoryForm, enhancedActions, closeDialog])

  // Filter handlers
  const handleSearchChange = useCallback((value: string) => {
    console.log('🔍 AdminResourcesPage: Search changed:', value)
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    console.log('🔧 AdminResourcesPage: Filter changed:', key, value)
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    console.log('🧹 AdminResourcesPage: Clearing filters')
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      type: 'all',
      difficulty: 'all',
      sort_by: 'newest',
      page: 1,
      per_page: 20,
    })
  }, [])

  // Handle tag input for resources
  const handleAddTag = useCallback((tag: string) => {
    if (tag.trim() && !resourceForm.tags.includes(tag.trim())) {
      setResourceForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }, [resourceForm.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setResourceForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Check for active filters
  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.type && filters.type !== 'all') ||
    (filters.difficulty && filters.difficulty !== 'all')
  )

  // FIXED: Get icon component safely
  const getIconComponent = useCallback((type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      article: FileText,
      video: Video,
      audio: Headphones,
      exercise: Brain,
      tool: Heart,
      worksheet: Download
    }
    return iconMap[type] || BookOpen
  }, [])

  // FIXED: Filter resources with safe array handling
  const filteredResources = useMemo(() => {
    if (!resources || !Array.isArray(resources)) return []

    return resources.filter(resource => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          resource.title.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower) ||
          resource.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'published':
            if (!resource.is_published) return false
            break
          case 'unpublished':
            if (resource.is_published) return false
            break
          case 'featured':
            if (!resource.is_featured) return false
            break
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && resource.category_id !== category.id) return false
      }

      // Type filter
      if (filters.type && filters.type !== 'all') {
        if (resource.type !== filters.type) return false
      }

      // Difficulty filter
      if (filters.difficulty && filters.difficulty !== 'all') {
        if (resource.difficulty !== filters.difficulty) return false
      }
      
      return true
    })
  }, [resources, filters, categories])

  // Early returns
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600">Please wait while we verify your access.</p>
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
            <Button onClick={handleBackToResources}>Back to Resources</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // FIXED: Better loading state for initial load only
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Admin Panel</h3>
            <p className="text-gray-600">Fetching your dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <AdminResourcesHeader
          adminStats={adminStats}
          isLoading={isLoading}
          isInitialized={isInitialized}
          onBackToResources={handleBackToResources}
          onRefreshAll={handleRefreshAll}
        />

        {/* Error Display */}
        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    {errors.resources || errors.categories || errors.stats || 'An error occurred'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Status */}
        {isInitialized && !isLoading && !hasError && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Resource system ready - {adminStats.total_resources} resources, {adminStats.categories_count} categories
                  {adminStats.draft_resources > 0 && `, ${adminStats.draft_resources} unpublished`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TabType)}>
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="resources">
              <Target className="h-4 w-4 mr-2" />
              Resources ({adminStats.total_resources})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Settings className="h-4 w-4 mr-2" />
              Categories ({adminStats.categories_count})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="imports">
              <Upload className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
          </TabsList>

          {/* Resources Management Tab - FIXED VERSION following help pattern */}
          <TabsContent value="resources">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span>Resource Management</span>
                    </CardTitle>
                    <CardDescription>Manage resources with individual actions</CardDescription>
                  </div>
                  <Button onClick={() => openDialog('showCreateResourceDialog')} disabled={loading.create}>
                    {loading.create ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Resource
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search resources by title, description, or tags..."
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="unpublished">Unpublished</SelectItem>
                        <SelectItem value="featured">Featured</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* FIXED: Resources List following help pattern */}
                {loading.resources && !resources.length ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : errors.resources ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load resources</h3>
                    <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                    <Button onClick={handleRefreshAll}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : filteredResources.length > 0 ? (
                  <div className="space-y-4">
                    {/* Results Summary */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">
                        Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {filteredResources.length} total results
                      </div>
                    </div>

                    {/* Resource Cards following help pattern */}
                    {filteredResources.map((resource) => {
                      const IconComponent = getIconComponent(resource.type)
                      
                      return (
                        <Card 
                          key={resource.id} 
                          className="transition-all duration-200 hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              {/* Resource Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-2">
                                    {/* Title */}
                                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                                      {resource.title}
                                    </h3>
                                    
                                    {/* Description Preview */}
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {resource.description.substring(0, 150)}...
                                    </p>
                                    
                                    {/* Metadata */}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Target className="h-3 w-3" />
                                        <span>ID: {resource.id}</span>
                                      </div>
                                      {resource.category && (
                                        <div className="flex items-center space-x-1">
                                          <div 
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: resource.category.color }}
                                          />
                                          <span>{resource.category.name}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                                      </div>
                                      {resource.author_name && (
                                        <div className="flex items-center space-x-1">
                                          <Users className="h-3 w-3" />
                                          <span>{resource.author_name}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Tags */}
                                    {resource.tags && resource.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {resource.tags.slice(0, 3).map((tag, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {resource.tags.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{resource.tags.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Status & Actions */}
                                  <div className="flex items-center space-x-2 ml-4">
                                    {/* Status Badges */}
                                    <div className="flex flex-col items-end space-y-1">
                                      <div className="flex items-center space-x-1">
                                        {resource.is_published ? (
                                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                            <Globe className="h-3 w-3 mr-1" />
                                            Published
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Draft
                                          </Badge>
                                        )}
                                        {resource.is_featured && (
                                          <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                            <Star className="h-3 w-3 mr-1" />
                                            Featured
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Stats */}
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                          <Eye className="h-3 w-3" />
                                          <span>{resource.view_count || 0}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <Download className="h-3 w-3" />
                                          <span>{resource.download_count || 0}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <Star className="h-3 w-3" />
                                          <span>{(Number(resource.rating) || 0).toFixed(1)}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* FIXED: Safe Action Buttons following help pattern */}
                                    <div className="flex items-center space-x-1">
                                      {/* Quick Publish Toggle */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleQuickPublish(resource, e)}
                                        className={resource.is_published ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                                        disabled={loading.update}
                                        title={resource.is_published ? 'Unpublish Resource' : 'Publish Resource'}
                                      >
                                        {resource.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                      </Button>

                                      {/* Quick Feature Toggle */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleQuickFeature(resource, e)}
                                        className={resource.is_featured ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-gray-600'}
                                        disabled={loading.update}
                                        title={resource.is_featured ? 'Unfeature Resource' : 'Feature Resource'}
                                      >
                                        {resource.is_featured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                                      </Button>
                                      
                                      {/* Edit Button */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleIndividualEditResource(resource)
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="Edit Resource"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>

                                      {/* Delete Button */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handleIndividualDeleteResource(resource)
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                        title="Delete Resource"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">No Resources Found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {hasActiveFilters 
                            ? 'No resources match your current filters. Try adjusting your search criteria.'
                            : 'Get started by creating your first resource.'
                          }
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <Button variant="outline" onClick={handleClearFilters}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                      ) : (
                        <Button onClick={() => openDialog('showCreateResourceDialog')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Resource
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab following help pattern */}
          <TabsContent value="categories">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-green-600" />
                      <span>Category Management</span>
                    </CardTitle>
                    <CardDescription>Organize your resources with categories</CardDescription>
                  </div>
                  <Button onClick={() => openDialog('showCreateCategoryDialog')} disabled={loading.create}>
                    {loading.create ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                {loading.categories && !categories.length ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categories.map((category) => (
                      <Card key={category.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: category.color + '20' }}
                                >
                                  <div 
                                    className="w-6 h-6 rounded"
                                    style={{ backgroundColor: category.color }}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-medium text-lg">{category.name}</h3>
                                  <p className="text-sm text-gray-500">{category.resources_count || 0} resources</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant={category.is_active ? "default" : "secondary"}>
                                  {category.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  {/* Edit Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleIndividualEditCategory(category)
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Edit Category"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>

                                  {/* Delete Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleIndividualDeleteCategory(category)
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {category.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Sort: {category.sort_order}</span>
                              <span>Updated {new Date(category.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">Create your first category to organize resources</p>
                    <Button onClick={() => openDialog('showCreateCategoryDialog')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {/* Analytics content would go here - simplified for now */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Analytics Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{adminStats?.total_resources || 0}</div>
                          <div className="text-sm text-gray-600">Total Resources</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {adminStats?.published_resources || 0}
                          </div>
                          <div className="text-sm text-gray-600">Published</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {adminStats?.featured_resources || 0}
                          </div>
                          <div className="text-sm text-gray-600">Featured</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {adminStats?.draft_resources || 0}
                          </div>
                          <div className="text-sm text-gray-600">Drafts</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="imports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-6 w-6 text-blue-600" />
                    <span>Export Data</span>
                  </CardTitle>
                  <CardDescription>Export resources and categories for backup or analysis</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export All Resources</h4>
                      <p className="text-sm text-gray-600">Download complete resource database</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export Categories</h4>
                      <p className="text-sm text-gray-600">Download category structure and settings</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export Analytics</h4>
                      <p className="text-sm text-gray-600">Download usage statistics and metrics</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-6 w-6 text-green-600" />
                    <span>Import Data</span>
                  </CardTitle>
                  <CardDescription>Import resources and categories from external sources</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Import Resources</h4>
                      <p className="text-sm text-gray-600">Bulk import from CSV or JSON files</p>
                    </div>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Import Categories</h4>
                      <p className="text-sm text-gray-600">Import category structures</p>
                    </div>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Import Guidelines</h4>
                        <p className="text-sm text-yellow-700">
                          Ensure your files follow the required format. Large imports may take time to process.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* FIXED: All Dialogs with proper form handling - following help pattern */}
      
      {/* Create Resource Dialog */}
      <Dialog open={dialogStates.showCreateResourceDialog} onOpenChange={(open) => !open && closeDialog('showCreateResourceDialog')}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Resource</DialogTitle>
            <DialogDescription>
              Add a new educational resource to help users learn and grow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={resourceForm.category_id} 
                  onValueChange={(value) => setResourceForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.filter(cat => cat.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Resource Type *</Label>
                <Select 
                  value={resourceForm.type} 
                  onValueChange={(value: ResourceType) => setResourceForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the resource title..."
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this resource covers..."
                className="min-h-[100px] resize-none"
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select 
                  value={resourceForm.difficulty} 
                  onValueChange={(value: DifficultyLevel) => setResourceForm(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={resourceForm.duration}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 15 minutes, 2 hours"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_url">Resource URL *</Label>
              <Input
                id="external_url"
                type="url"
                value={resourceForm.external_url}
                onChange={(e) => setResourceForm(prev => ({ ...prev, external_url: e.target.value }))}
                placeholder="https://example.com/resource"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="download_url">Download URL (Optional)</Label>
              <Input
                id="download_url"
                type="url"
                value={resourceForm.download_url}
                onChange={(e) => setResourceForm(prev => ({ ...prev, download_url: e.target.value }))}
                placeholder="https://example.com/download"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={resourceForm.author_name}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Resource creator/author"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={resourceForm.sort_order}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {resourceForm.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter to add)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const target = e.target as HTMLInputElement
                    handleAddTag(target.value)
                    target.value = ''
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={resourceForm.is_published}
                  onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Publish immediately</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={resourceForm.is_featured}
                  onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="is_featured">Feature this resource</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('showCreateResourceDialog')}>
              Cancel
            </Button>
            <Button onClick={handleCreateResource} disabled={loading.create}>
              {loading.create ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={dialogStates.showEditResourceDialog} onOpenChange={(open) => !open && closeDialog('showEditResourceDialog')}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource information and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select 
                  value={resourceForm.category_id} 
                  onValueChange={(value) => setResourceForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.filter(cat => cat.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Resource Type *</Label>
                <Select 
                  value={resourceForm.type} 
                  onValueChange={(value: ResourceType) => setResourceForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the resource title..."
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this resource covers..."
                className="min-h-[100px] resize-none"
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty Level *</Label>
                <Select 
                  value={resourceForm.difficulty} 
                  onValueChange={(value: DifficultyLevel) => setResourceForm(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={resourceForm.duration}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 15 minutes, 2 hours"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-external_url">Resource URL *</Label>
              <Input
                id="edit-external_url"
                type="url"
                value={resourceForm.external_url}
                onChange={(e) => setResourceForm(prev => ({ ...prev, external_url: e.target.value }))}
                placeholder="https://example.com/resource"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-download_url">Download URL (Optional)</Label>
              <Input
                id="edit-download_url"
                type="url"
                value={resourceForm.download_url}
                onChange={(e) => setResourceForm(prev => ({ ...prev, download_url: e.target.value }))}
                placeholder="https://example.com/download"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-author_name">Author Name</Label>
                <Input
                  id="edit-author_name"
                  value={resourceForm.author_name}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Resource creator/author"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={resourceForm.sort_order}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {resourceForm.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800" 
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter to add)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const target = e.target as HTMLInputElement
                    handleAddTag(target.value)
                    target.value = ''
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_published"
                  checked={resourceForm.is_published}
                  onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="edit-is_published">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_featured"
                  checked={resourceForm.is_featured}
                  onCheckedChange={(checked) => setResourceForm(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="edit-is_featured">Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('showEditResourceDialog')}>
              Cancel
            </Button>
            <Button onClick={handleUpdateResource} disabled={loading.update}>
              {loading.update ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={dialogStates.showCreateCategoryDialog} onOpenChange={(open) => !open && closeDialog('showCreateCategoryDialog')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your resources.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <Input
                  id="category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-sort">Sort Order</Label>
                <Input
                  id="category-sort"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="category-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('showCreateCategoryDialog')}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={loading.create}>
              {loading.create ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={dialogStates.showEditCategoryDialog} onOpenChange={(open) => !open && closeDialog('showEditCategoryDialog')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Name *</Label>
              <Input
                id="edit-category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-color">Color</Label>
                <Input
                  id="edit-category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-sort">Sort Order</Label>
                <Input
                  id="edit-category-sort"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-category-active"
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-category-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog('showEditCategoryDialog')}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={loading.update}>
              {loading.update ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIXED: Individual Action Confirmation Dialog following help pattern */}
      <IndividualActionDialog
        isOpen={individualActionDialog.isOpen}
        resource={individualActionDialog.resource}
        category={individualActionDialog.category}
        action={individualActionDialog.action}
        isProcessing={individualActionDialog.isProcessing}
        onConfirm={executeIndividualAction}
        onCancel={() => setIndividualActionDialog({ 
          isOpen: false, 
          resource: null, 
          category: null, 
          action: 'edit', 
          isProcessing: false 
        })}
      />
    </div>
  )
}