// components/pages/admin-help-page.tsx (NEW - Admin Help Management Page)
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
  Zap
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { 
  useHelpCategories,
  useFAQs,
  useFAQFilters,
  useAdminFAQManagement,
  useHelpStats,
  useFAQUtils
} from "@/hooks/use-help"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { FAQ, HelpCategory } from "@/services/help.service"

interface AdminHelpPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function AdminHelpPage({ onNavigate }: AdminHelpPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState("faqs")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
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

  // Hooks
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFAQFilters()
  const { createFAQ, updateFAQ, deleteFAQ, canManage } = useAdminFAQManagement()
  const { getCacheStats } = useFAQUtils()

  // Data fetching
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useHelpCategories({ 
    includeInactive: true,
    useCache: false // Admin always gets fresh data
  })

  const {
    data: faqsData,
    isLoading: faqsLoading,
    refetch: refetchFAQs
  } = useFAQs({
    ...filters,
    search: searchTerm,
    include_drafts: true // Admin can see drafts
  }, {
    useCache: false // Admin always gets fresh data
  })

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useHelpStats({ useCache: false })

  // Check admin permissions
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      if (onNavigate) {
        onNavigate('help')
      }
    }
  }, [user, onNavigate])

  // Handle refresh all data
  const handleRefreshAll = useCallback(async () => {
    try {
      await Promise.all([
        refetchCategories(),
        refetchFAQs(),
        refetchStats()
      ])
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh data')
    }
  }, [refetchCategories, refetchFAQs, refetchStats])

  // FAQ CRUD Operations
  const handleCreateFAQ = useCallback(async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim() || !faqForm.category_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await createFAQ.mutateAsync(faqForm)
      setShowCreateDialog(false)
      setFAQForm({
        category_id: "",
        question: "",
        answer: "",
        tags: [],
        is_published: false,
        is_featured: false,
        sort_order: 0
      })
      refetchFAQs()
    } catch (error) {
      // Error handled by mutation
    }
  }, [faqForm, createFAQ, refetchFAQs])

  const handleEditFAQ = useCallback((faq: FAQ) => {
    setSelectedFAQ(faq)
    setFAQForm({
      category_id: faq.category_id.toString(),
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags || [],
      is_published: faq.is_published,
      is_featured: faq.is_featured,
      sort_order: faq.sort_order
    })
    setShowEditDialog(true)
  }, [])

  const handleUpdateFAQ = useCallback(async () => {
    if (!selectedFAQ || !faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await updateFAQ.mutateAsync({
        id: selectedFAQ.id,
        data: faqForm
      })
      setShowEditDialog(false)
      setSelectedFAQ(null)
      refetchFAQs()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedFAQ, faqForm, updateFAQ, refetchFAQs])

  const handleDeleteFAQ = useCallback(async () => {
    if (!selectedFAQ) return

    try {
      await deleteFAQ.mutateAsync(selectedFAQ.id)
      setShowDeleteDialog(false)
      setSelectedFAQ(null)
      refetchFAQs()
    } catch (error) {
      // Error handled by mutation
    }
  }, [selectedFAQ, deleteFAQ, refetchFAQs])

  // Quick actions
  const handleTogglePublish = useCallback(async (faq: FAQ) => {
    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { is_published: !faq.is_published }
      })
      refetchFAQs()
      toast.success(`FAQ ${faq.is_published ? 'unpublished' : 'published'} successfully`)
    } catch (error) {
      // Error handled by mutation
    }
  }, [updateFAQ, refetchFAQs])

  const handleToggleFeature = useCallback(async (faq: FAQ) => {
    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { is_featured: !faq.is_featured }
      })
      refetchFAQs()
      toast.success(`FAQ ${faq.is_featured ? 'unfeatured' : 'featured'} successfully`)
    } catch (error) {
      // Error handled by mutation
    }
  }, [updateFAQ, refetchFAQs])

  // Handle tag input
  const handleAddTag = useCallback((tag: string) => {
    if (tag.trim() && !faqForm.tags.includes(tag.trim())) {
      setFAQForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
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

  const cacheStats = getCacheStats()

  if (!canManage || user?.role !== 'admin') {
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
                <p className="text-blue-100 text-lg">Manage FAQs, categories, and analytics</p>
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
                disabled={categoriesLoading || faqsLoading || statsLoading}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                {(categoriesLoading || faqsLoading || statsLoading) ? (
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
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_faqs || 0}
              </div>
              <div className="text-sm text-blue-100">Total FAQs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {categoriesLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories?.length || 0}
              </div>
              <div className="text-sm text-blue-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {faqsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                  faqsData?.faqs.filter(faq => !faq.is_published).length || 0}
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
            <TabsTrigger value="faqs" className="rounded-lg font-medium">
              <Target className="h-4 w-4 mr-2" />
              FAQ Management
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-medium">
              <Settings className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg font-medium">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="rounded-lg font-medium">
              <Users className="h-4 w-4 mr-2" />
              Suggestions
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
                  <Button onClick={() => setShowCreateDialog(true)}>
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

                  <Select value={filters.sort_by || 'newest'} onValueChange={(value) => updateFilter('sort_by', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="helpful">Most Helpful</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* FAQ Table */}
                {faqsLoading ? (
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
                          <TableHead>Question</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Stats</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faqsData?.faqs.map((faq) => (
                          <TableRow key={faq.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium line-clamp-1">{faq.question}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {faq.answer.substring(0, 100)}...
                                </div>
                                {faq.tags && faq.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {faq.tags.slice(0, 2).map((tag, index) => (
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
                                  style={{ backgroundColor: faq.category?.color }}
                                />
                                <span className="text-sm">{faq.category?.name}</span>
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
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Eye className="h-3 w-3 text-gray-400" />
                                  <span>{faq.view_count} views</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span>
                                    {Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count)) * 100) || 0}% helpful
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
                                      setShowDeleteDialog(true)
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

                    {!faqsData?.faqs.length && (
                      <div className="text-center py-12">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                        <p className="text-gray-600 mb-4">Get started by creating your first FAQ</p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create FAQ
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
                    <CardDescription>Organize your help content with categories</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Category Management</h3>
                  <p className="text-gray-600">Category management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Key Metrics */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.total_faqs || 0}</div>
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
                      <div className="text-2xl font-bold">
                        {faqsData?.faqs.filter(faq => faq.is_published).length || 0}
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
                        {faqsData?.faqs.filter(faq => faq.is_featured).length || 0}
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
                        {faqsData?.faqs.filter(faq => !faq.is_published).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Drafts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts Placeholder */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Detailed analytics and insights</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">Detailed analytics and reporting features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle>Content Suggestions</CardTitle>
                <CardDescription>Review and manage content suggestions from counselors</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Content Suggestions</h3>
                  <p className="text-gray-600">Suggestion management features coming soon</p>
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

      {/* Create FAQ Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                  {categories?.filter(cat => cat.is_active).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {faqForm.tags.map((tag, index) => (
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
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
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the FAQ content and settings.
            </DialogDescription>
          </DialogHeader>

          {/* Same form fields as create dialog */}
          <div className="space-y-4">
            {/* Category, Question, Answer, Tags, Settings - Same as create form */}
            {/* ... Copy the form content from create dialog ... */}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
    </div>
  )
}