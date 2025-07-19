// components/pages/resources-page.tsx - FINAL WORKING VERSION: Direct store usage like ticket system
"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  Star,
  Clock,
  Download,
  ExternalLink,
  Play,
  Bookmark,
  Share,
  Filter,
  Loader2,
  TrendingUp,
  Award,
  Grid3X3,
  List,
  Settings,
  Plus,
  BarChart3,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  Search,
  X
} from "lucide-react"

import { EnhancedPagination } from "@/components/common/enhanced-pagination"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'

// SIMPLIFIED: Direct store usage like ticket system
import {
  useResourcesSelectors,
  useResourcesActions,
  useResourcesLoading,
  useResourcesErrors,
  type ResourceItem,
} from "@/stores/resources-store"

// Components
import { ResourceRatingComponent } from "@/components/resources/resource-rating"
import { BookmarkManagerComponent } from "@/components/resources/bookmark-manager"

interface ResourcesPageProps {
  onNavigate?: (page: string, params?: any) => void
}

// SIMPLIFIED: Resource Card component
function ResourceCard({ 
  resource, 
  onResourceClick, 
  onResourceAccess, 
  onBookmarkToggle,
  loadingStates,
}: {
  resource: ResourceItem
  onResourceClick: (resource: ResourceItem) => void
  onResourceAccess: (resource: ResourceItem, e: React.MouseEvent) => void
  onBookmarkToggle: (resource: ResourceItem, e: React.MouseEvent) => void
  loadingStates: Record<number, string>
}) {
  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      article: FileText,
      video: Video,
      audio: Headphones,
      exercise: Brain,
      tool: Heart,
      worksheet: Download,
    }
    return iconMap[type] || BookOpen
  }

  const TypeIcon = getTypeIcon(resource.type)
  const isLoading = loadingStates[resource.id]

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer">
      <CardContent className="p-4 sm:p-6" onClick={() => onResourceClick(resource)}>
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="capitalize w-fit text-xs">
                  {resource.type}
                </Badge>
                {resource.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 w-fit text-xs">Featured</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
              <span className="text-xs sm:text-sm font-medium">
                {typeof resource.rating === 'number' ? resource.rating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-sm sm:text-lg mb-2 line-clamp-2">{resource.title}</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
              {resource.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={`${resource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : 
                                 resource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                                 'bg-red-100 text-red-800'}`}>
                {resource.difficulty}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Download className="h-3 w-3" />
                <span>{resource.download_count || 0}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{resource.duration || 'Self-paced'}</span>
              <span>•</span>
              <span className="truncate">{resource.author_name || 'Unknown'}</span>
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 2).map((tag: string, index: number) => (
                <Badge key={`${resource.id}-tag-${index}`} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {resource.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{resource.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              className="flex-1 text-xs sm:text-sm" 
              size="sm"
              onClick={(e) => onResourceAccess(resource, e)}
              disabled={!!isLoading}
            >
              {resource.type === "video" && <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              {resource.type === "worksheet" && <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              {resource.type === "tool" && <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              {isLoading === 'accessing' ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Access'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => onBookmarkToggle(resource, e)}
              disabled={!!isLoading}
              className="px-2 sm:px-3"
            >
              {isLoading === 'bookmarking' ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Bookmark className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4",
                  resource.is_bookmarked ? "fill-current text-black" : "text-gray-500"
                )} />
              )}
            </Button>
            <Button variant="outline" size="sm" className="px-2 sm:px-3">
              <Share className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResourcesPage({ onNavigate }: ResourcesPageProps) {
  const { user } = useAuth()
  
  // SIMPLIFIED: Direct store usage like ticket system
  const { 
    resources, 
    categories, 
    stats, 
    pagination,
    featuredResources,
    publishedResources 
  } = useResourcesSelectors()
  
  const { 
    fetchResources, 
    fetchCategories, 
    fetchStats,
    accessResource,
    toggleBookmark,
    refreshAll 
  } = useResourcesActions()
  
  const loading = useResourcesLoading()
  const errors = useResourcesErrors()

  // SIMPLIFIED: Local state - no complex types
  const [selectedTab, setSelectedTab] = useState("browse")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null)
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [isInitialized, setIsInitialized] = useState(false)

  // SIMPLIFIED: Single initialization - like ticket system
  useEffect(() => {
    if (!user || isInitialized) return

    const initializeData = async () => {
      try {
        console.log('📚 ResourcesPage: Initializing data...')
        
        // Fetch all data in parallel - single call like ticket system
        await Promise.all([
          fetchResources({ per_page: 50, sort_by: 'featured' }),
          fetchCategories(),
          fetchStats()
        ])
        
        setIsInitialized(true)
        console.log('✅ ResourcesPage: Data initialized successfully')
      } catch (error) {
        console.error('❌ ResourcesPage: Initialization failed:', error)
      }
    }

    initializeData()
  }, [user, isInitialized, fetchResources, fetchCategories, fetchStats])

  // Role-based permissions
  const canManageResources = useMemo(() => user?.role === 'admin', [user?.role])
  const canSuggestContent = useMemo(() => 
    user?.role === 'counselor' || user?.role === 'admin', [user?.role]
  )

  // SIMPLIFIED: Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 ResourcesPage: Manual refresh triggered')
      await refreshAll()
      toast.success('Resources refreshed successfully')
    } catch (error) {
      console.error('❌ ResourcesPage: Refresh failed:', error)
      toast.error('Failed to refresh resources')
    }
  }, [refreshAll])

  // SIMPLIFIED: Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    setCurrentPage(1)
  }, [])

  // SIMPLIFIED: Filter handlers
  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }, [])

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
  }, [])

  const handleDifficultyChange = useCallback((value: string) => {
    setDifficultyFilter(value)
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setCategoryFilter('all')
    setTypeFilter('all')
    setDifficultyFilter('all')
    setSortBy('featured')
    setCurrentPage(1)
  }, [])

  // SIMPLIFIED: Resource access handler
  const handleResourceAccess = useCallback(async (resource: ResourceItem, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    setLoadingStates(prev => ({ ...prev, [resource.id]: 'accessing' }))
    
    try {
      const result = await accessResource(resource.id)
      
      if (result && result.url) {
        window.open(result.url, '_blank')
        toast.success(`Opening ${resource.title}`)
      }
    } catch (error: any) {
      console.error('❌ ResourcesPage: Resource access failed:', error)
      toast.error('Failed to access resource')
    } finally {
      setLoadingStates(prev => {
        const newStates = { ...prev }
        delete newStates[resource.id]
        return newStates
      })
    }
  }, [accessResource])

  // SIMPLIFIED: Bookmark toggle handler
  const handleBookmarkToggle = useCallback(async (resource: ResourceItem, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    setLoadingStates(prev => ({ ...prev, [resource.id]: 'bookmarking' }))
    
    try {
      await toggleBookmark(resource.id)
    } catch (error: any) {
      console.error('❌ ResourcesPage: Bookmark toggle failed:', error)
    } finally {
      setLoadingStates(prev => {
        const newStates = { ...prev }
        delete newStates[resource.id]
        return newStates
      })
    }
  }, [toggleBookmark])

  const handleResourceClick = useCallback((resource: ResourceItem) => {
    setSelectedResource(resource)
  }, [])

  // Navigation handler
  const handleAdminNavigate = useCallback(() => {
    if (onNavigate && canManageResources) {
      onNavigate('admin-resources')
    }
  }, [onNavigate, canManageResources])

  // SIMPLIFIED: Client-side filtering - like ticket system
  const filteredResources = useMemo(() => {
    console.log('🔍 ResourcesPage: Filtering resources', {
      publishedCount: publishedResources.length,
      searchTerm,
      categoryFilter,
      typeFilter,
      difficultyFilter,
      sortBy
    })
    
    let filtered = [...publishedResources]

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category?.slug === categoryFilter)
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter)
    }

    // Difficulty filter
    if (difficultyFilter && difficultyFilter !== 'all') {
      filtered = filtered.filter(r => r.difficulty === difficultyFilter)
    }

    // Sort
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        break
      case 'rating':
        filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        break
      case 'popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        break
      case 'downloads':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    console.log('✅ ResourcesPage: Filtered results:', filtered.length)
    return filtered
  }, [publishedResources, searchTerm, categoryFilter, typeFilter, difficultyFilter, sortBy])

  // Pagination
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    return filteredResources.slice(startIndex, startIndex + perPage)
  }, [filteredResources, currentPage, perPage])

  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(filteredResources.length / perPage)
    const startIndex = (currentPage - 1) * perPage
    
    return {
      current_page: currentPage,
      last_page: totalPages,
      per_page: perPage,
      total: filteredResources.length,
      from: filteredResources.length > 0 ? startIndex + 1 : 0,
      to: Math.min(startIndex + perPage, filteredResources.length),
      has_more_pages: currentPage < totalPages
    }
  }, [filteredResources, currentPage, perPage])

  // Loading state for initial load only
  if (!isInitialized && (loading.resources || loading.categories || loading.stats)) {
    return (
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-0">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl p-6 sm:p-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/30 rounded"></div>
              </div>
              <div>
                <div className="h-6 sm:h-8 w-32 sm:w-48 bg-white/30 rounded mb-2"></div>
                <div className="h-4 sm:h-5 w-48 sm:w-64 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Resource Library</h1>
                <p className="text-indigo-100 text-sm sm:text-lg">
                  Comprehensive collection of mental health resources
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {canSuggestContent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info('Content suggestion feature coming soon')}
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Suggest
                </Button>
              )}
              
              {canManageResources && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminNavigate}
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Admin
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading.resources}
                className="text-white hover:bg-white/20"
              >
                {loading.resources ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">
                {stats?.total_resources || resources.length}
              </div>
              <div className="text-xs sm:text-sm text-indigo-100">Total Resources</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">
                {categories.length}
              </div>
              <div className="text-xs sm:text-sm text-indigo-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">Free</div>
              <div className="text-xs sm:text-sm text-indigo-100">All Resources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {(errors.resources || errors.categories || errors.stats) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">Data Loading Error</h4>
                <p className="text-sm text-red-700">
                  Some data couldn't be loaded. Please try refreshing.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              <span>Featured Resources</span>
            </CardTitle>
            <CardDescription className="text-sm">Hand-picked resources by our counselors</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredResources.slice(0, 6).map((resource: ResourceItem) => (
                <ResourceCard 
                  key={resource.id} 
                  resource={resource}
                  onResourceClick={handleResourceClick}
                  onResourceAccess={handleResourceAccess}
                  onBookmarkToggle={handleBookmarkToggle}
                  loadingStates={loadingStates}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="browse" className="rounded-lg font-medium text-xs sm:text-sm">
            Browse Resources
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="rounded-lg font-medium text-xs sm:text-sm">
            My Bookmarks
          </TabsTrigger>
          <TabsTrigger value="popular" className="rounded-lg font-medium text-xs sm:text-sm">
            Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 sm:space-y-6">
          {/* Search */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="worksheet">Worksheets</SelectItem>
                    <SelectItem value="tool">Tools</SelectItem>
                    <SelectItem value="exercise">Exercises</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={difficultyFilter} onValueChange={handleDifficultyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0">
                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Clear Filters */}
                {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || difficultyFilter !== 'all') && (
                  <Button variant="outline" onClick={handleClearFilters} size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resources List */}
          <div className="space-y-4 sm:space-y-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold">All Resources</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
                  {paginationInfo.total} total resources
                </Badge>
                {paginationInfo.total > paginationInfo.per_page && (
                  <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
                    Page {paginationInfo.current_page} of {paginationInfo.last_page}
                  </Badge>
                )}
              </div>
            </div>

            {/* Resources Grid/List */}
            {loading.resources && !paginatedResources.length ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 sm:h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : paginatedResources.length > 0 ? (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-3 sm:space-y-4"
                )}>
                  {paginatedResources.map((resource: ResourceItem) => (
                    <ResourceCard 
                      key={resource.id} 
                      resource={resource}
                      onResourceClick={handleResourceClick}
                      onResourceAccess={handleResourceAccess}
                      onBookmarkToggle={handleBookmarkToggle}
                      loadingStates={loadingStates}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {paginationInfo.total > paginationInfo.per_page && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                      <EnhancedPagination
                        pagination={paginationInfo}
                        onPageChange={setCurrentPage}
                        onPerPageChange={(newPerPage) => {
                          setPerPage(newPerPage)
                          setCurrentPage(1)
                        }}
                        isLoading={loading.resources}
                        showPerPageSelector={true}
                        showResultsInfo={true}
                        perPageOptions={[10, 25, 50, 100]}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || difficultyFilter !== 'all'
                        ? 'No resources match your current filters. Try adjusting your search criteria.'
                        : 'No resources available at the moment.'
                      }
                    </p>
                    <Button onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-4 sm:space-y-6">
          <BookmarkManagerComponent 
            viewMode={viewMode}
            showFilters={true}
            onResourceClick={handleResourceClick}
            showPagination={true}
          />
        </TabsContent>

        {/* Popular Tab */}
        <TabsContent value="popular" className="space-y-4 sm:space-y-6">
          {/* Top Rated Resources */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <span>Top Rated Resources</span>
              </CardTitle>
              <CardDescription className="text-sm">Highest rated resources by our community</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...publishedResources]
                  .filter(r => typeof r.rating === 'number' && r.rating > 0)
                  .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
                  .slice(0, 6)
                  .map((resource: ResourceItem) => (
                    <ResourceCard 
                      key={resource.id} 
                      resource={resource}
                      onResourceClick={handleResourceClick}
                      onResourceAccess={handleResourceAccess}
                      onBookmarkToggle={handleBookmarkToggle}
                      loadingStates={loadingStates}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Popular Resources */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                <span>Most Popular Resources</span>
              </CardTitle>
              <CardDescription className="text-sm">Most accessed resources this month</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...publishedResources]
                  .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                  .slice(0, 6)
                  .map((resource: ResourceItem) => (
                    <ResourceCard 
                      key={resource.id} 
                      resource={resource}
                      onResourceClick={handleResourceClick}
                      onResourceAccess={handleResourceAccess}
                      onBookmarkToggle={handleBookmarkToggle}
                      loadingStates={loadingStates}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {(() => {
                      const iconMap: Record<string, React.ComponentType<any>> = {
                        article: FileText,
                        video: Video,
                        audio: Headphones,
                        exercise: Brain,
                        tool: Heart,
                        worksheet: Download,
                      }
                      const IconComponent = iconMap[selectedResource.type] || BookOpen
                      return <IconComponent className="h-6 w-6 text-blue-600" />
                    })()}
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl">{selectedResource.title}</DialogTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {selectedResource.type}
                      </Badge>
                      <Badge className={`${selectedResource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : 
                                         selectedResource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'}`}>
                        {selectedResource.difficulty}
                      </Badge>
                      {selectedResource.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              <DialogDescription className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {selectedResource.description}
              </DialogDescription>
              
              {/* Resource Metadata */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Duration</div>
                  <div className="font-medium text-sm sm:text-base">{selectedResource.duration || 'Self-paced'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Views</div>
                  <div className="font-medium text-sm sm:text-base">{selectedResource.view_count || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Downloads</div>
                  <div className="font-medium text-sm sm:text-base">{selectedResource.download_count || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Rating</div>
                  <div className="font-medium flex items-center justify-center space-x-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                    <span className="text-sm sm:text-base">
                      {typeof selectedResource.rating === 'number' ? selectedResource.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedResource.tags && selectedResource.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Info */}
              {selectedResource.author_name && (
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm sm:text-base">About the Author</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>{selectedResource.author_name}</strong>
                    {selectedResource.author_bio && (
                      <span> - {selectedResource.author_bio}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Resource Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={(e) => handleResourceAccess(selectedResource, e)}
                  disabled={!!loadingStates[selectedResource.id]}
                >
                  {selectedResource.type === "video" && <Play className="h-4 w-4 mr-2" />}
                  {selectedResource.type === "worksheet" && <Download className="h-4 w-4 mr-2" />}
                  {selectedResource.type === "tool" && <ExternalLink className="h-4 w-4 mr-2" />}
                  {loadingStates[selectedResource.id] === 'accessing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Access Resource'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={(e) => handleBookmarkToggle(selectedResource, e)}
                  disabled={!!loadingStates[selectedResource.id]}
                >
                  {loadingStates[selectedResource.id] === 'bookmarking' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Bookmark className={cn(
                      "h-4 w-4 mr-2",
                      selectedResource.is_bookmarked ? "fill-current text-black" : "text-gray-500"
                    )} />
                  )}
                  Bookmark
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Rating Component */}
              <ResourceRatingComponent 
                resource={selectedResource}
                showStats={true}
                compact={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}