// components/pages/admin-resources-page.tsx (NEW - Admin resource management)
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
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  FileText,
  Activity
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { 
  useResourceCategories,
  useResources,
  useResourceFilters,
  useAdminResourceManagement,
  useResourceStats,
  useResourceUtils,
} from "@/hooks/use-resources"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Resource, ResourceCategory } from "@/services/resources.service"

interface AdminResourcesPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function AdminResourcesPage({ onNavigate }: AdminResourcesPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState("resources")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [showCreateResourceDialog, setShowCreateResourceDialog] = useState(false)
  const [showEditResourceDialog, setShowEditResourceDialog] = useState(false)
  const [showDeleteResourceDialog, setShowDeleteResourceDialog] = useState(false)
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)

  // Form states
  const [resourceForm, setResourceForm] = useState({
    category_id: "",
    title: "",
    description: "",
    type: "article" as const,
    subcategory: "",
    difficulty: "beginner" as const,
    duration: "",
    external_url: "",
    download_url: "",
    thumbnail_url: "",
    tags: [] as string[],
    author_name: "",
    author_bio: "",
    sort_order: 0,
    is_published: false,
    is_featured: false
  })

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "BookOpen",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0
  })

  // Hooks
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useResourceFilters()
  const { 
    createResource, 
    updateResource, 
    deleteResource, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    canManage 
  } = useAdminResourceManagement()
  const { getCacheStats } = useResourceUtils()

  // Data fetching
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useResourceCategories({ 
    includeInactive: true,
    enabled: true
  })

  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    refetch: refetchResources
  } = useResources({
    ...filters,
    search: searchTerm,
    include_drafts: true
  }, {
    enabled: true
  })

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useResourceStats({ enabled: true })

  // Check admin permissions
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      if (onNavigate) {
        onNavigate('resources')
      }
    }
  }, [user, onNavigate])

  // Handle refresh all data
  const handleRefreshAll = useCallback(async () => {
    try {
      await Promise.all([
        refetchCategories(),
        refetchResources(),
        refetchStats()
      ])
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh data')
    }
  }, [refetchCategories, refetchResources, refetchStats])

  // Resource CRUD Operations
  const handleCreateResource = useCallback(async () => {
    if (!resourceForm.title.trim() || !resourceForm.description.trim() || !resourceForm.category_id || !resourceForm.external_url.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createResource.mutateAsync({
        ...resourceForm,
        category_id: parseInt(resourceForm.category_id)
      })
      setShowCreateResourceDialog(false)
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
      refetchResources()
    } catch (error) {
      // Error handled by mutation
    }
  }, [resourceForm, createResource, refetchResources])

  const handleEditResource = useCallback((resource: Resource) => {
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
    setShowEditResourceDialog(true)
  }, [])

  const handleUpdateResource = useCallback(async () => {
    if (!selectedResource || !resourceForm.title.trim() || !resourceForm.description.trim() || !resourceForm.external_url.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await updateResource.mutateAsync({
        id: selectedResource.id,
        data: {
          ...resourceForm,
          category_id: parseInt(resourceForm.category_id)
        }
      })
      setShowEditResourceDialog(false)
      setSelectedResource(null)
      refetchResources()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedResource, resourceForm, updateResource, refetchResources])

  const handleDeleteResource = useCallback(async () => {
    if (!selectedResource) return

    try {
      await deleteResource.mutateAsync(selectedResource.id)
      setShowDeleteResourceDialog(false)
      setSelectedResource(null)
      refetchResources()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedResource, deleteResource, refetchResources])

  // Category CRUD Operations
  const handleCreateCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      await createCategory.mutateAsync(categoryForm)
      setShowCreateCategoryDialog(false)
      setCategoryForm({
        name: "",
        description: "",
        icon: "BookOpen",
        color: "#3B82F6",
        is_active: true,
        sort_order: 0
      })
      refetchCategories()
    } catch (error) {
      // Error handled by mutation
    }
  }, [categoryForm, createCategory, refetchCategories])

  const handleEditCategory = useCallback((category: ResourceCategory) => {
    setSelectedCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      color: category.color,
      is_active: category.is_active,
      sort_order: category.sort_order
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
      setShowEditCategoryDialog(false)
      setSelectedCategory(null)
      refetchCategories()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedCategory, categoryForm, updateCategory, refetchCategories])

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return

    try {
      await deleteCategory.mutateAsync(selectedCategory.id)
      setShowDeleteCategoryDialog(false)
      setSelectedCategory(null)
      refetchCategories()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedCategory, deleteCategory, refetchCategories])

  // Quick actions
  const handleTogglePublish = useCallback(async (resource: Resource) => {
    try {
      await updateResource.mutateAsync({
        id: resource.id,
        data: { is_published: !resource.is_published }
      })
      refetchResources()
      toast.success(`Resource ${resource.is_published ? 'unpublished' : 'published'} successfully`)
    } catch (error) {
      // Error handled by mutation
    }
  }, [updateResource, refetchResources])

  const handleToggleFeature = useCallback(async (resource: Resource) => {
    try {
      await updateResource.mutateAsync({
        id: resource.id,
        data: { is_featured: !resource.is_featured }
      })
      refetchResources()
      toast.success(`Resource ${resource.is_featured ? 'unfeatured' : 'featured'} successfully`)
    } catch (error) {
      // Error handled by mutation
    }
  }, [updateResource, refetchResources])

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

  // Navigation back to public resources
  const handleBackToResources = useCallback(() => {
    if (onNavigate) {
      onNavigate('resources')
    }
  }, [onNavigate])

  const cacheStats = getCacheStats()

  if (!canManage || user?.role !== 'admin') {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Resource Management</h1>
                <p className="text-blue-100 text-lg">Manage resources, categories, and analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBackToResources}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefreshAll}
                disabled={categoriesLoading || resourcesLoading || statsLoading}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                {(categoriesLoading || resourcesLoading || statsLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_resources || 0}
              </div>
              <div className="text-sm text-blue-100">Total Resources</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {categoriesLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.length || 0}
              </div>
              <div className="text-sm text-blue-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {resourcesLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                  resourcesData?.resources.filter(resource => !resource.is_published).length || 0}
              </div>
              <div className="text-sm text-blue-100">Unpublished</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{cacheStats.cacheSize}</div>
              <div className="text-sm text-blue-100">Cache Entries</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-white rounded-xl shadow-sm">
            <TabsTrigger value="resources" className="rounded-lg font-medium">
              <Target className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-medium">
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg font-medium">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="imports" className="rounded-lg font-medium">
              <Upload className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
          </TabsList>

          {/* Resources Management Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resource Management</CardTitle>
                    <CardDescription>Create, edit, and manage educational resources</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateResourceDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Resource
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
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="worksheet">Worksheets</SelectItem>
                      <SelectItem value="tool">Tools</SelectItem>
                      <SelectItem value="exercise">Exercises</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Resources Table */}
                {resourcesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Resource</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Stats</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resourcesData?.resources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium line-clamp-1">{resource.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {resource.description}
                                </div>
                                {resource.tags && resource.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {resource.tags.slice(0, 2).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {resource.tags.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{resource.tags.length - 2} more
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
                                  style={{ backgroundColor: resource.category?.color }}
                                />
                                <span className="text-sm">{resource.category?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {React.createElement(
                                  require('lucide-react')[
                                    resource.type === 'article' ? 'FileText' :
                                    resource.type === 'video' ? 'Video' :
                                    resource.type === 'audio' ? 'Headphones' :
                                    resource.type === 'exercise' ? 'Brain' :
                                    resource.type === 'tool' ? 'Heart' :
                                    'Download'
                                  ], 
                                  { className: "h-4 w-4 text-gray-500" }
                                )}
                                <span className="text-sm capitalize">{resource.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={resource.is_published ? "default" : "secondary"}
                                    className={cn(
                                      resource.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {resource.is_published ? "Published" : "Draft"}
                                  </Badge>
                                  {resource.is_featured && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Eye className="h-3 w-3 text-gray-400" />
                                  <span>{resource.view_count} views</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Download className="h-3 w-3 text-blue-500" />
                                  <span>{resource.download_count} downloads</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span>{resource.rating.toFixed(1)} rating</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(resource.updated_at).toLocaleDateString()}
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
                                  <DropdownMenuItem onClick={() => handleEditResource(resource)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePublish(resource)}>
                                    {resource.is_published ? (
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
                                  <DropdownMenuItem onClick={() => handleToggleFeature(resource)}>
                                    {resource.is_featured ? (
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
                                      setSelectedResource(resource)
                                      setShowDeleteResourceDialog(true)
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

                    {!resourcesData?.resources.length && (
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                        <p className="text-gray-600 mb-4">Get started by creating your first resource</p>
                        <Button onClick={() => setShowCreateResourceDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Resource
                        </Button>
                      </div>
                    )}
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
                    <CardDescription>Organize your resources with categories</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateCategoryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {categoriesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories?.map((category) => (
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
                                  <p className="text-sm text-gray-500">{category.resources_count || 0} resources</p>
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
                )}

                {!categories?.length && !categoriesLoading && (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">Create your first category to organize resources</p>
                    <Button onClick={() => setShowCreateCategoryDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
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
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.total_resources || 0}</div>
                      <div className="text-sm text-gray-600">Total Resources</div>
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
                      <div className="text-2xl font-bold">
                        {resourcesData?.resources.filter(resource => resource.is_published).length || 0}
                      </div>
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
                      <div className="text-2xl font-bold">
                        {resourcesData?.resources.filter(resource => resource.is_featured).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Featured</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {resourcesData?.resources.filter(resource => !resource.is_published).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Drafts</div>
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
                    <span>Resource Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {resourcesData?.resources.slice(0, 5).map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-1">{resource.title}</div>
                          <div className="text-xs text-gray-500">{resource.view_count} views • {resource.download_count} downloads</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {(Number(resource.rating) || 0).toFixed(1)}★
                          </div>
                          <div className="text-xs text-gray-500">rating</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <div>No resource data available</div>
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
                    {categories?.slice(0, 5).map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {category.resources_count || 0} resources
                        </div>
                      </div>
                    )) || (
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
                  {resourcesData?.resources.slice(0, 5).map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          resource.is_published ? "bg-green-500" : "bg-yellow-500"
                        )} />
                        <div>
                          <div className="font-medium text-sm">{resource.title}</div>
                          <div className="text-xs text-gray-500">
                            {resource.is_published ? 'Published' : 'Draft'} • {resource.view_count} views • {resource.download_count} downloads
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(resource.published_at || resource.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <div>No recent activity</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="imports" className="space-y-6">
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
                  // Clear cache and refresh
                  window.location.reload()
                }}
              >
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Resource Dialog */}
      <Dialog open={showCreateResourceDialog} onOpenChange={setShowCreateResourceDialog}>
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
                <Select value={resourceForm.category_id} onValueChange={(value) => setResourceForm(prev => ({ ...prev, category_id: value }))}>
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
                <Select value={resourceForm.type} onValueChange={(value: any) => setResourceForm(prev => ({ ...prev, type: value }))}>
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
                <Select value={resourceForm.difficulty} onValueChange={(value: any) => setResourceForm(prev => ({ ...prev, difficulty: value }))}>
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
                {resourceForm.tags.map((tag, index) => (
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
            <Button variant="outline" onClick={() => setShowCreateResourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateResource} disabled={createResource.isPending}>
              {createResource.isPending ? (
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
      <Dialog open={showEditResourceDialog} onOpenChange={setShowEditResourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource information and settings.
            </DialogDescription>
          </DialogHeader>

          {/* Same form fields as create dialog */}
          <div className="space-y-4">
            {/* ... Same form content as create dialog ... */}
            <div className="text-center py-4 text-gray-500">
              Edit form fields would be identical to create form fields above
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditResourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateResource} disabled={updateResource.isPending}>
              {updateResource.isPending ? (
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
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
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

      {/* Delete Resource Confirmation Dialog */}
      <AlertDialog open={showDeleteResourceDialog} onOpenChange={setShowDeleteResourceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
              <br />
              <br />
              <strong>Resource:</strong> {selectedResource?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResource}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteResource.isPending}
            >
              {deleteResource.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Resource
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <strong>Resources in this category:</strong> {selectedCategory?.resources_count || 0}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategory.isPending}
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