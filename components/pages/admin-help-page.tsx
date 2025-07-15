// components/pages/admin-help-page.tsx - FIXED: No more freezing and proper suggestions

"use client"

import { useState, useCallback, useEffect } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  MoreHorizontal,
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
  MessageSquare,
  FileText,
  Activity,
  User,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { 
  useHelpCategories,
  useAdminFAQManagement,
  useHelpStats,
  useFAQUtils,
  useAdminFAQFilters,
  useFAQs
} from "@/hooks/use-help"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { FAQ, HelpCategory } from "@/services/help.service"
import { useQueryClient } from '@tanstack/react-query'

interface AdminHelpPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function AdminHelpPage({ onNavigate }: AdminHelpPageProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState("faqs")
  
  // Dialog states
  const [showCreateFAQDialog, setShowCreateFAQDialog] = useState(false)
  const [showEditFAQDialog, setShowEditFAQDialog] = useState(false)
  const [showDeleteFAQDialog, setShowDeleteFAQDialog] = useState(false)
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null)

  // Form states
  const [faqForm, setFAQForm] = useState({
    category_id: "",
    question: "",
    answer: "",
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    sort_order: 0
  })

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "HelpCircle",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0
  })

  // FIXED: Use admin-specific filter hook and search state
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useAdminFAQFilters()
  const [searchTerm, setSearchTerm] = useState('')

  // FIXED: Admin management hooks with proper cache invalidation
  const { 
    createFAQ, 
    updateFAQ, 
    deleteFAQ, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    canManage,
    isAdmin
  } = useAdminFAQManagement()
  
  const { getCacheStats } = useFAQUtils()

  // FIXED: Get categories using admin endpoint
  const {
    data: allCategories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
    error: categoriesError
  } = useHelpCategories({ 
    includeInactive: true,
    useAdminEndpoint: true,
    enabled: isAdmin
  })

  // FIXED: Get FAQs using admin endpoint with search and filters
  const {
    data: faqsQueryData,
    isLoading: faqsLoading,
    error: faqsError,
    refetch: refetchFAQs
  } = useFAQs({
    ...filters,
    search: searchTerm,
    include_drafts: true, // Admin sees all
  }, {
    enabled: isAdmin,
    useAdminEndpoint: true
  })

  // FIXED: Get help stats
  const {
    data: helpStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useHelpStats({ enabled: isAdmin })

  // FIXED: Extract FAQs safely from response data
  const safeFAQs = faqsQueryData?.faqs || []
  const safeCategories = allCategories || []

  // FIXED: Calculate admin stats from FAQ data
  const adminStats = {
    total_faqs: safeFAQs.length,
    published_faqs: safeFAQs.filter(faq => faq.is_published).length,
    draft_faqs: safeFAQs.filter(faq => !faq.is_published).length,
    featured_faqs: safeFAQs.filter(faq => faq.is_featured).length,
    categories_count: safeCategories.length,
    active_categories: safeCategories.filter(cat => cat.is_active).length,
    suggested_faqs: safeFAQs.filter(faq => !faq.is_published && faq.created_by).length
  }

  // FIXED: Filter suggestions properly
  const suggestedFAQs = safeFAQs.filter(faq => 
    !faq.is_published && 
    faq.created_by && 
    faq.created_by !== user?.id // Exclude self-created
  )

  // Check admin permissions with better error handling
  useEffect(() => {
    if (!user) return
    
    if (user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      if (onNavigate) {
        onNavigate('help')
      }
    }
  }, [user, onNavigate])

  // FIXED: Handle refresh all data with proper cache invalidation
  const handleRefreshAll = useCallback(async () => {
    try {
      // FIXED: Invalidate all related queries first
      queryClient.invalidateQueries({ queryKey: ['help'] })
      
      await Promise.allSettled([
        refetchCategories(),
        refetchFAQs(),
        refetchStats()
      ])
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Failed to refresh some data')
    }
  }, [queryClient, refetchCategories, refetchFAQs, refetchStats])

  // FIXED: Enhanced CRUD operations with proper cache invalidation
  const invalidateAllQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['help'] })
    queryClient.refetchQueries({ queryKey: ['help'] })
  }, [queryClient])

  // FAQ CRUD Operations with proper error handling and cache invalidation
  const handleCreateFAQ = useCallback(async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim() || !faqForm.category_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createFAQ.mutateAsync({
        ...faqForm,
        category_id: parseInt(faqForm.category_id)
      })
      
      // FIXED: Close dialog and reset form immediately
      setShowCreateFAQDialog(false)
      setFAQForm({
        category_id: "",
        question: "",
        answer: "",
        tags: [],
        is_published: false,
        is_featured: false,
        sort_order: 0
      })
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('FAQ created successfully!')
    } catch (error) {
      console.error('Create FAQ failed:', error)
    }
  }, [faqForm, createFAQ, invalidateAllQueries])

  // FIXED: Handle edit FAQ with proper typing and error handling
  const handleEditFAQ = useCallback((faq: FAQ) => {
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
    setShowEditFAQDialog(true)
  }, [])

  const handleUpdateFAQ = useCallback(async () => {
    if (!selectedFAQ || !faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await updateFAQ.mutateAsync({
        id: selectedFAQ.id,
        data: {
          ...faqForm,
          category_id: parseInt(faqForm.category_id)
        }
      })
      
      // FIXED: Close dialog and reset form immediately
      setShowEditFAQDialog(false)
      setSelectedFAQ(null)
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('FAQ updated successfully!')
    } catch (error) {
      console.error('Update FAQ failed:', error)
    }
  }, [selectedFAQ, faqForm, updateFAQ, invalidateAllQueries])

  const handleDeleteFAQ = useCallback(async () => {
    if (!selectedFAQ) return

    try {
      await deleteFAQ.mutateAsync(selectedFAQ.id)
      
      // FIXED: Close dialog and reset state immediately
      setShowDeleteFAQDialog(false)
      setSelectedFAQ(null)
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('FAQ deleted successfully!')
    } catch (error) {
      console.error('Delete FAQ failed:', error)
    }
  }, [selectedFAQ, deleteFAQ, invalidateAllQueries])

  // Category CRUD Operations with proper error handling and cache invalidation
  const handleCreateCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      await createCategory.mutateAsync(categoryForm)
      
      // FIXED: Close dialog and reset form immediately
      setShowCreateCategoryDialog(false)
      setCategoryForm({
        name: "",
        description: "",
        icon: "HelpCircle",
        color: "#3B82F6",
        is_active: true,
        sort_order: 0
      })
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('Category created successfully!')
    } catch (error) {
      console.error('Create category failed:', error)
    }
  }, [categoryForm, createCategory, invalidateAllQueries])

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
    setShowEditCategoryDialog(true)
  }, [])

  const handleUpdateCategory = useCallback(async () => {
    if (!selectedCategory || !categoryForm.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        data: categoryForm
      })
      
      // FIXED: Close dialog and reset state immediately
      setShowEditCategoryDialog(false)
      setSelectedCategory(null)
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('Category updated successfully!')
    } catch (error) {
      console.error('Update category failed:', error)
    }
  }, [selectedCategory, categoryForm, updateCategory, invalidateAllQueries])

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return

    try {
      await deleteCategory.mutateAsync(selectedCategory.id)
      
      // FIXED: Close dialog and reset state immediately
      setShowDeleteCategoryDialog(false)
      setSelectedCategory(null)
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('Category deleted successfully!')
    } catch (error) {
      console.error('Delete category failed:', error)
    }
  }, [selectedCategory, deleteCategory, invalidateAllQueries])

  // FIXED: Quick actions with proper cache invalidation
  const handleTogglePublish = useCallback(async (faq: FAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for toggle publish')
      return
    }

    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { is_published: !faq.is_published }
      })
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success(`FAQ ${faq.is_published ? 'unpublished' : 'published'} successfully`)
    } catch (error) {
      console.error('Toggle publish failed:', error)
    }
  }, [updateFAQ, invalidateAllQueries])

  const handleToggleFeature = useCallback(async (faq: FAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for toggle feature')
      return
    }

    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { is_featured: !faq.is_featured }
      })
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success(`FAQ ${faq.is_featured ? 'unfeatured' : 'featured'} successfully`)
    } catch (error) {
      console.error('Toggle feature failed:', error)
    }
  }, [updateFAQ, invalidateAllQueries])

  // FIXED: Suggestion approval with proper cache invalidation
  const handleApproveSuggestion = useCallback(async (faq: FAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for approval')
      return
    }

    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { 
          is_published: true,
          published_at: new Date().toISOString()
        }
      })
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('FAQ suggestion approved and published!')
    } catch (error) {
      console.error('Approve suggestion failed:', error)
    }
  }, [updateFAQ, invalidateAllQueries])

  const handleRejectSuggestion = useCallback(async (faq: FAQ) => {
    if (!faq || !faq.id) {
      console.error('Invalid FAQ for rejection')
      return
    }

    try {
      await deleteFAQ.mutateAsync(faq.id)
      
      // FIXED: Invalidate all queries to refresh data
      invalidateAllQueries()
      
      toast.success('FAQ suggestion rejected and removed')
    } catch (error) {
      console.error('Reject suggestion failed:', error)
    }
  }, [deleteFAQ, invalidateAllQueries])

  // FIXED: Handle tag input with proper validation
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

  // Navigation back to public help
  const handleBackToHelp = useCallback(() => {
    if (onNavigate) {
      onNavigate('help')
    }
  }, [onNavigate])

  // FIXED: Search and filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    updateFilter(key as any, value)
  }, [updateFilter])

  const handleClearFilters = useCallback(() => {
    clearFilters()
    setSearchTerm('')
  }, [clearFilters])

  const cacheStats = getCacheStats()

  // FIXED: Better authorization check with loading state
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

  if (!isAdmin || !canManage || user?.role !== 'admin') {
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

  const isLoading = faqsLoading || categoriesLoading || statsLoading
  const hasError = faqsError || categoriesError || statsError

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Help Center Management</h1>
                <p className="text-blue-100 text-lg">Manage FAQs, categories, and content suggestions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBackToHelp}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* FIXED: Quick Stats with safe data access */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.total_faqs}
              </div>
              <div className="text-sm text-blue-100">Total FAQs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : safeCategories.length}
              </div>
              <div className="text-sm text-blue-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.draft_faqs}
              </div>
              <div className="text-sm text-blue-100">Unpublished</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.suggested_faqs}
              </div>
              <div className="text-sm text-blue-100">Suggestions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
              <div className="text-sm text-blue-100">Cache Entries</div>
            </div>
          </div>
        </div>

        {/* FIXED: Error display */}
        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">
                  {faqsError?.message || categoriesError?.message || statsError?.message || 'An error occurred while loading data'}
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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
              {adminStats.suggested_faqs > 0 && (
                <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                  {adminStats.suggested_faqs}
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>FAQ Management</CardTitle>
                    <CardDescription>Create, edit, and manage help articles</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateFAQDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create FAQ
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Search and Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search FAQs..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {safeCategories.map((category: HelpCategory) => (
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

                  <Select 
                    value={filters.sort_by || 'newest'} 
                    onValueChange={(value) => handleFilterChange('sort_by', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="helpful">Most Helpful</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* FAQ Table */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : safeFAQs.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Question</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Stats</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeFAQs.map((faq: FAQ) => (
                          <TableRow key={faq.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium line-clamp-1">{faq.question}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {faq.answer?.substring(0, 100)}...
                                </div>
                                {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {faq.tags.slice(0, 2).map((tag: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {faq.tags.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{faq.tags.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: faq.category?.color || '#gray' }}
                                />
                                <span className="text-sm">{faq.category?.name || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={faq.is_published ? "default" : "secondary"}
                                    className={cn(
                                      faq.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {faq.is_published ? "Published" : "Draft"}
                                  </Badge>
                                  {faq.is_featured && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                  {/* FIXED: Show suggestion indicator */}
                                  {!faq.is_published && faq.created_by && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Suggested
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span>
                                    {Math.round((faq.helpful_count / Math.max(faq.helpful_count + faq.not_helpful_count, 1)) * 100) || 0}% helpful
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(faq.updated_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleEditFAQ(faq)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePublish(faq)}>
                                    {faq.is_published ? (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Unpublish
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Publish
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleFeature(faq)}>
                                    {faq.is_featured ? (
                                      <>
                                        <Star className="h-4 w-4 mr-2" />
                                        Unfeature
                                      </>
                                    ) : (
                                      <>
                                        <Star className="h-4 w-4 mr-2" />
                                        Feature
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedFAQ(faq)
                                      setShowDeleteFAQDialog(true)
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters || searchTerm 
                        ? 'Try adjusting your search or filters' 
                        : 'Get started by creating your first FAQ'
                      }
                    </p>
                    <div className="flex justify-center space-x-2">
                      {(hasActiveFilters || searchTerm) && (
                        <Button variant="outline" onClick={handleClearFilters}>
                          Clear Filters
                        </Button>
                      )}
                      <Button onClick={() => setShowCreateFAQDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create FAQ
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Category Management</CardTitle>
                    <CardDescription>Organize your help content with categories</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateCategoryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : safeCategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safeCategories.map((category: HelpCategory) => (
                      <Card key={category.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
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
                                  <p className="text-sm text-gray-500">{category.faqs_count || 0} FAQs</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant={category.is_active ? "default" : "secondary"}>
                                  {category.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedCategory(category)
                                        setShowDeleteCategoryDialog(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                    <p className="text-gray-600 mb-4">Create your first category to organize FAQs</p>
                    <Button onClick={() => setShowCreateCategoryDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FIXED: Content Suggestions Tab - Now properly displays suggested FAQs */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Suggestions</CardTitle>
                    <CardDescription>Review and manage content suggestions from counselors</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {adminStats.suggested_faqs} Pending
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : suggestedFAQs.length > 0 ? (
                  <div className="space-y-6">
                    {suggestedFAQs.map((faq: FAQ) => (
                      <Card key={faq.id} className="border border-blue-200 bg-blue-50/30">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Suggestion Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <MessageSquare className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">Content Suggestion</h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>Suggested by: {faq.creator?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: faq.category?.color || '#gray' }}
                                      />
                                      <span>{faq.category?.name || 'Unknown Category'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditFAQ(faq)}
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApproveSuggestion(faq)}
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={updateFAQ.isPending}
                                >
                                  {updateFAQ.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectSuggestion(faq)}
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  disabled={deleteFAQ.isPending}
                                >
                                  {deleteFAQ.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </div>
                            
                            {/* Question and Answer Preview */}
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Question:</Label>
                                <p className="text-gray-900 font-medium">{faq.question}</p>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Answer:</Label>
                                <div className="text-gray-700 prose prose-sm max-w-none">
                                  {faq.answer.length > 300 ? (
                                    <>
                                      <p>{faq.answer.substring(0, 300)}...</p>
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="p-0 h-auto text-blue-600"
                                        onClick={() => handleEditFAQ(faq)}
                                      >
                                        Read full answer
                                      </Button>
                                    </>
                                  ) : (
                                    <p>{faq.answer}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Tags */}
                              {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-700">Tags:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {faq.tags.map((tag: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs bg-white">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Suggestion Stats */}
                            <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                              <div className="text-sm text-gray-500">
                                Suggestion ID: #{faq.id}
                              </div>
                              <div className="text-sm text-gray-500">
                                Created: {new Date(faq.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Suggestions</h3>
                    <p className="text-gray-600 mb-4">
                      Content suggestions from counselors will appear here for review and approval.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 max-w-md mx-auto">
                      <p>• Counselors can suggest new FAQ content</p>
                      <p>• You can approve, reject, or edit suggestions</p>
                      <p>• Approved suggestions become published FAQs</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{adminStats.total_faqs}</div>
                      <div className="text-sm text-gray-600">Total FAQs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{adminStats.published_faqs}</div>
                      <div className="text-sm text-gray-600">Published</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{adminStats.featured_faqs}</div>
                      <div className="text-sm text-gray-600">Featured</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{adminStats.suggested_faqs}</div>
                      <div className="text-sm text-gray-600">Suggestions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>FAQ Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {safeFAQs.slice(0, 5).map((faq: FAQ) => (
                      <div key={faq.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-1">{faq.question}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {Math.round((faq.helpful_count / Math.max(faq.helpful_count + faq.not_helpful_count, 1)) * 100) || 0}%
                          </div>
                          <div className="text-xs text-gray-500">helpful</div>
                        </div>
                      </div>
                    ))}
                    {safeFAQs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <div>No FAQ data available</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    <span>Category Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {safeCategories.slice(0, 5).map((category: HelpCategory) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {category.faqs_count || 0} FAQs
                        </div>
                      </div>
                    ))}
                    {safeCategories.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="h-8 w-8 mx-auto mb-2" />
                        <div>No category data available</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {safeFAQs.slice(0, 5).map((faq: FAQ) => (
                    <div key={faq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          faq.is_published ? "bg-green-500" : "bg-yellow-500"
                        )} />
                        <div>
                          <div className="font-medium text-sm">{faq.question}</div>
                          <div className="text-xs text-gray-500">
                            {faq.is_published ? 'Published' : (faq.created_by ? 'Suggested' : 'Draft')}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(faq.updated_at || faq.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {safeFAQs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <div>No recent activity</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cache Performance Info */}
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <span className="font-medium">Cache Performance:</span>
                  <span className="text-gray-600 ml-2">
                    {cacheStats.cacheSize} entries, {Math.round(cacheStats.totalMemory / 1024)}KB memory
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  invalidateAllQueries()
                  toast.success('Cache cleared and data refreshed')
                }}
              >
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FIXED: All Dialogs with proper form handling */}
      
      {/* Create FAQ Dialog */}
      <Dialog open={showCreateFAQDialog} onOpenChange={setShowCreateFAQDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New FAQ</DialogTitle>
            <DialogDescription>
              Add a new frequently asked question to help users find answers quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={faqForm.category_id} onValueChange={(value) => setFAQForm(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.filter((cat: HelpCategory) => cat.is_active).map((category: HelpCategory) => (
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
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={faqForm.question}
                onChange={(e) => setFAQForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the frequently asked question..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {faqForm.question.length}/500 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={faqForm.answer}
                onChange={(e) => setFAQForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide a comprehensive answer..."
                className="min-h-[120px] resize-none"
                maxLength={5000}
              />
              <div className="text-xs text-gray-500 text-right">
                {faqForm.answer.length}/5000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {faqForm.tags.map((tag: string, index: number) => (
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
              <div className="text-xs text-gray-500">
                Press Enter to add tags. Click on tags to remove them.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={faqForm.sort_order}
                  onChange={(e) => setFAQForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={faqForm.is_published}
                    onCheckedChange={(checked) => setFAQForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={faqForm.is_featured}
                    onCheckedChange={(checked) => setFAQForm(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured">Feature this FAQ</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFAQDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFAQ} disabled={createFAQ.isPending}>
              {createFAQ.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={showEditFAQDialog} onOpenChange={setShowEditFAQDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the FAQ content and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={faqForm.category_id} onValueChange={(value) => setFAQForm(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.filter((cat: HelpCategory) => cat.is_active).map((category: HelpCategory) => (
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
              <Label htmlFor="edit-question">Question *</Label>
              <Input
                id="edit-question"
                value={faqForm.question}
                onChange={(e) => setFAQForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the frequently asked question..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {faqForm.question.length}/500 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer *</Label>
              <Textarea
                id="edit-answer"
                value={faqForm.answer}
                onChange={(e) => setFAQForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide a comprehensive answer..."
                className="min-h-[120px] resize-none"
                maxLength={5000}
              />
              <div className="text-xs text-gray-500 text-right">
                {faqForm.answer.length}/5000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {faqForm.tags.map((tag: string, index: number) => (
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
              <div className="space-y-2">
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={faqForm.sort_order}
                  onChange={(e) => setFAQForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_published"
                    checked={faqForm.is_published}
                    onCheckedChange={(checked) => setFAQForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="edit-is_published">Published</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_featured"
                    checked={faqForm.is_featured}
                    onCheckedChange={(checked) => setFAQForm(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="edit-is_featured">Featured</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFAQDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFAQ} disabled={updateFAQ.isPending}>
              {updateFAQ.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Confirmation Dialog */}
      <AlertDialog open={showDeleteFAQDialog} onOpenChange={setShowDeleteFAQDialog}>
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
              disabled={deleteFAQ.isPending}
            >
              {deleteFAQ.isPending ? (
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
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your help content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name..."
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                maxLength={1000}
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
            <Button variant="outline" onClick={() => setShowCreateCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
              {createCategory.isPending ? (
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
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name *</Label>
              <Input
                id="edit-category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name..."
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                maxLength={1000}
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
            <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
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
              disabled={deleteCategory.isPending || (selectedCategory?.faqs_count || 0) > 0}
            >
              {deleteCategory.isPending ? (
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
  )
}