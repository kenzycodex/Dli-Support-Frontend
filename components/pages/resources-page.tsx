// components/pages/resources-page.tsx - FIXED: Following Help Center pattern, no freezing issues
"use client"

import React, { useState, useCallback, useMemo } from "react"
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

// Import hooks following the help pattern
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'

// FIXED: Import the store-based hooks that match help pattern
import {
  useResourcesDashboard,
  useResources,
  useResourceFilters,
  useResourceAccess,
  useResourceBookmark,
  useRecentResourceSearches,
  useResourceAnalytics,
  useResourceUtils
} from "@/hooks/use-resources"

// Components
import { ResourceRatingComponent } from "@/components/resources/resource-rating"
import { BookmarkManagerComponent } from "@/components/resources/bookmark-manager"
import { SearchWithSuggestions } from "@/components/common/search-with-suggestions"

// Types
import type { ResourceItem } from "@/stores/resources-store"
import type { ResourceCategory } from "@/services/resources.service"

// FIXED: Proper filter interface following help pattern
interface ResourceFilters {
  search?: string
  category?: string
  type?: string
  difficulty?: string
  sort_by?: string
  page?: number
  per_page?: number
  featured?: boolean
  include_drafts?: boolean
}

interface ResourcesPageProps {
  onNavigate?: (page: string, params?: any) => void
}

// FIXED: Resource Card component with proper event handling
function ResourceCard({ 
  resource, 
  onResourceClick, 
  onResourceAccess, 
  onBookmarkToggle,
  loadingStates,
  getTypeIcon,
  getTypeLabel,
  getDifficultyColor,
  formatDuration,
  formatCount,
  formatRatingDisplay
}: {
  resource: ResourceItem
  onResourceClick: (resource: ResourceItem) => void
  onResourceAccess: (resource: ResourceItem, e: React.MouseEvent) => void
  onBookmarkToggle: (resource: ResourceItem, e: React.MouseEvent) => void
  loadingStates: Record<number, string>
  getTypeIcon: (type: string) => string
  getTypeLabel: (type: string) => string
  getDifficultyColor: (difficulty: string) => string
  formatDuration: (duration?: string) => string
  formatCount: (count: number | undefined | null) => string
  formatRatingDisplay: (rating: any) => string
}) {
  const TypeIcon = useMemo(() => {
    const iconName = getTypeIcon(resource.type)
    const iconMap: Record<string, React.ComponentType<any>> = {
      FileText,
      Video,
      Headphones,
      Brain,
      Heart,
      Download,
      BookOpen
    }
    return iconMap[iconName] || BookOpen
  }, [resource.type, getTypeIcon])

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
                  {getTypeLabel(resource.type)}
                </Badge>
                {resource.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 w-fit text-xs">Featured</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
              <span className="text-xs sm:text-sm font-medium">{formatRatingDisplay(resource.rating)}</span>
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
              <Badge className={getDifficultyColor(resource.difficulty)}>
                {resource.difficulty}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Download className="h-3 w-3" />
                <span>{formatCount(resource.download_count)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(resource.duration)}</span>
              <span>•</span>
              <span className="truncate">{resource.author_name}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {resource.tags?.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags && resource.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* FIXED: Actions with proper event handling */}
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

// FIXED: Resource List Item with proper event handling
function ResourceListItem({ 
  resource, 
  onResourceClick, 
  onResourceAccess, 
  onBookmarkToggle,
  loadingStates,
  getTypeIcon,
  getTypeLabel,
  getDifficultyColor,
  formatDuration,
  formatCount
}: {
  resource: ResourceItem
  onResourceClick: (resource: ResourceItem) => void
  onResourceAccess: (resource: ResourceItem, e: React.MouseEvent) => void
  onBookmarkToggle: (resource: ResourceItem, e: React.MouseEvent) => void
  loadingStates: Record<number, string>
  getTypeIcon: (type: string) => string
  getTypeLabel: (type: string) => string
  getDifficultyColor: (difficulty: string) => string
  formatDuration: (duration?: string) => string
  formatCount: (count: number | undefined | null) => string
}) {
  const TypeIcon = useMemo(() => {
    const iconName = getTypeIcon(resource.type)
    const iconMap: Record<string, React.ComponentType<any>> = {
      FileText,
      Video,
      Headphones,
      Brain,
      Heart,
      Download,
      BookOpen
    }
    return iconMap[iconName] || BookOpen
  }, [resource.type, getTypeIcon])

  const isLoading = loadingStates[resource.id]

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-3 sm:p-4" onClick={() => onResourceClick(resource)}>
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Icon */}
          <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
            <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-lg truncate">{resource.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 mt-1">
                  {resource.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                <Badge variant="outline" className="capitalize text-xs">
                  {getTypeLabel(resource.type)}
                </Badge>
                <Badge className={getDifficultyColor(resource.difficulty)}>
                  {resource.difficulty}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">{resource.rating}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(resource.duration)}</span>
                </div>
                <span>{formatCount(resource.view_count)} views</span>
                <span className="truncate">{resource.author_name}</span>
              </div>
              
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="sm"
                  onClick={(e) => onResourceAccess(resource, e)}
                  disabled={!!isLoading}
                  className="text-xs"
                >
                  {isLoading === 'accessing' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
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
                >
                  {isLoading === 'bookmarking' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Bookmark className={cn(
                      "h-3 w-3",
                      resource.is_bookmarked ? "fill-current text-black" : "text-gray-500"
                    )} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResourcesPage({ onNavigate }: ResourcesPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState("browse")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null)
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>({})
  
  // FIXED: Use proper filter hooks following help pattern
  // UPDATED: Use proper filter hooks with pagination support
  const { 
    filters, 
    updateFilter, 
    updatePage, 
    updatePerPage, 
    clearFilters, 
    hasActiveFilters 
  } = useResourceFilters({
    per_page: 25, // Default to 25 per page
    sort_by: 'featured'
  })
  const { 
    recentSearches, 
    addRecentSearch, 
    removeRecentSearch, 
    clearRecentSearches 
  } = useRecentResourceSearches()
  const { 
    trackResourceSearch, 
    trackResourceCategoryClick,
    trackResourceView,
    trackResourceAccess
  } = useResourceAnalytics()
  const {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    formatDuration,
    formatCount,
    formatRatingDisplay
  } = useResourceUtils()
  
  // FIXED: Data fetching with proper hook usage
  // Data fetching with proper pagination
  const {
    categories,
    featured,
    popular,
    topRated,
    stats,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    hasData,
    forceRefresh
  } = useResourcesDashboard({ enabled: true })
  
  // UPDATED: Resources query with pagination
  const {
    resources,
    pagination,
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
    totalCount,
    currentPageCount
  } = useResources(filters, { enabled: true })

  // FIXED: Mutations with proper hook usage
  const { access: accessResource, isLoading: accessLoading } = useResourceAccess()
  const { toggle: toggleBookmark, isLoading: bookmarkLoading } = useResourceBookmark()

  // Role-based permissions
  const canManageResources = useMemo(() => user?.role === 'admin', [user?.role])
  const canSuggestContent = useMemo(() => 
    user?.role === 'counselor' || user?.role === 'admin', [user?.role]
  )

  // FIXED: Enhanced refresh - only when explicitly requested
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 ResourcesPage: Manual refresh triggered')
      await Promise.all([refetchDashboard(), refetchResources()])
      toast.success('Resources refreshed successfully')
    } catch (error) {
      console.error('❌ ResourcesPage: Refresh failed:', error)
      toast.error('Failed to refresh resources')
    }
  }, [refetchDashboard, refetchResources])

  // Navigation to admin panel
  const handleAdminNavigate = useCallback(() => {
    if (onNavigate && canManageResources) {
      onNavigate('admin-resources')
    }
  }, [onNavigate, canManageResources])

  const handleSearch = useCallback((query: string) => {
    updateFilter('search', query)
    
    if (query.trim()) {
      addRecentSearch(query)
      trackResourceSearch(query, resources?.length || 0)
    }
  }, [updateFilter, addRecentSearch, trackResourceSearch, resources])

  // UPDATED: Filter handlers with auto-fetch
  const handleFilterChange = useCallback((key: keyof ResourceFilters, value: string) => {
    updateFilter(key, value === 'all' ? '' : value)
    // Auto-fetch with new filter
    setTimeout(() => refetchResources(), 100)
  }, [updateFilter, refetchResources])

  const handleCategorySelect = useCallback((categorySlug: string) => {
    const category = categories.find((c: ResourceCategory) => c.slug === categorySlug)
    if (category) {
      updateFilter('category', categorySlug)
      trackResourceCategoryClick(categorySlug, category.name)
      // Auto-fetch with new category
      setTimeout(() => refetchResources(), 100)
    }
  }, [categories, updateFilter, trackResourceCategoryClick, refetchResources])

  // UPDATED: Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    updatePage(page)
    // Auto-fetch with new page
    setTimeout(() => refetchResources(), 100)
    // Scroll to top of results
    const resultsSection = document.getElementById('resources-results')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [updatePage, refetchResources])

  const handlePerPageChange = useCallback((perPage: number) => {
    updatePerPage(perPage)
    // Auto-fetch with new per page
    setTimeout(() => refetchResources(), 100)
  }, [updatePerPage, refetchResources])

  // UPDATED: Clear filters handler
  const handleClearFilters = useCallback(() => {
    clearFilters()
    // Auto-fetch after clearing
    setTimeout(() => refetchResources(), 100)
  }, [clearFilters, refetchResources])

  // FIXED: Handle resource access with proper loading state
  const handleResourceAccess = useCallback(async (resource: ResourceItem, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    // Set loading state for this specific resource
    setLoadingStates(prev => ({ ...prev, [resource.id]: 'accessing' }))
    
    try {
      trackResourceView(resource.id, resource.title, resource.type)
      
      // FIXED: Use the returned function directly
      const result = await accessResource(resource.id)
      
      if (result && result.url) {
        trackResourceAccess(resource.id, resource.title, resource.type, result.action)
        window.open(result.url, '_blank')
        
        if (result.action === 'download') {
          toast.success(`${resource.title} download started`)
        } else {
          toast.success(`Opening ${resource.title}`)
        }
      }
    } catch (error) {
      console.error('❌ ResourcesPage: Resource access failed:', error)
      toast.error('Failed to access resource')
    } finally {
      // Clear loading state for this resource
      setLoadingStates(prev => {
        const newStates = { ...prev }
        delete newStates[resource.id]
        return newStates
      })
    }
  }, [accessResource, trackResourceView, trackResourceAccess])

  // FIXED: Handle bookmark toggle with proper loading state
  const handleBookmarkToggle = useCallback(async (resource: ResourceItem, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    // Set loading state for this specific resource
    setLoadingStates(prev => ({ ...prev, [resource.id]: 'bookmarking' }))
    
    try {
      // FIXED: Use the returned function directly
      await toggleBookmark(resource.id)
    } catch (error) {
      console.error('❌ ResourcesPage: Bookmark toggle failed:', error)
    } finally {
      // Clear loading state for this resource
      setLoadingStates(prev => {
        const newStates = { ...prev }
        delete newStates[resource.id]
        return newStates
      })
    }
  }, [toggleBookmark])

  const handleResourceClick = useCallback((resource: ResourceItem) => {
    setSelectedResource(resource)
    trackResourceView(resource.id, resource.title, resource.type)
  }, [trackResourceView])

  // Loading skeleton for initial load only
  if (dashboardLoading && !hasData) {
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4">
                  <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/30 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 w-16 sm:w-20 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          <div className="h-12 sm:h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 sm:h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-0">
      {/* Header with Role-Based Actions */}
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
            
            {/* Role-Based Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {canSuggestContent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info('Content suggestion feature coming soon')}
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Suggest Resource</span>
                  <span className="sm:hidden">Suggest</span>
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
                  <span className="hidden sm:inline">Manage</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={dashboardLoading}
                className="text-white hover:bg-white/20"
              >
                {dashboardLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* FIXED: Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">
                {totalCount || 0}
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
      {(dashboardError || resourcesError) && (
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

      {/* Featured Resources - STABLE */}
      {featured.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  <span>Featured Resources</span>
                </CardTitle>
                <CardDescription className="text-sm">Hand-picked resources by our counselors</CardDescription>
              </div>
              
              {/* Role-based badge for admins */}
              {canManageResources && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Admin View
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featured.map((resource: ResourceItem) => (
                <ResourceCard 
                  key={resource.id} 
                  resource={resource}
                  onResourceClick={handleResourceClick}
                  onResourceAccess={handleResourceAccess}
                  onBookmarkToggle={handleBookmarkToggle}
                  loadingStates={loadingStates}
                  getTypeIcon={getTypeIcon}
                  getTypeLabel={getTypeLabel}
                  getDifficultyColor={getDifficultyColor}
                  formatDuration={formatDuration}
                  formatCount={formatCount}
                  formatRatingDisplay={formatRatingDisplay}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search - OPTIMIZED */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <SearchWithSuggestions
            value={filters.search || ''}
            onChange={(value) => updateFilter('search', value)}
            onSearch={handleSearch}
            placeholder="Search resources..."
            recentSearches={recentSearches}
            popularSearches={popular.map((r: ResourceItem) => r.title)}
            onRecentSearchRemove={removeRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            isLoading={resourcesLoading}
          />
        </CardContent>
      </Card>

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
            Popular & Top Rated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 sm:space-y-6">
          {/* Filters and View Controls */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: ResourceCategory) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name} ({category.resources_count || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filters.type || 'all'} 
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Resource Type" />
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
                  
                  <Select 
                    value={filters.difficulty || 'all'} 
                    onValueChange={(value) => handleFilterChange('difficulty', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filters.sort_by || 'featured'} 
                    onValueChange={(value) => handleFilterChange('sort_by', value)}
                  >
                    <SelectTrigger className="w-full">
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
                
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
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
                  
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters} size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UPDATED: Resources Grid/List with Pagination */}
          <div className="space-y-4 sm:space-y-6" id="resources-results">
            {/* Results Header with Pagination Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold">All Resources</h2>
              {pagination && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                  <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
                    {pagination.total.toLocaleString()} total resources
                  </Badge>
                  {pagination.total > pagination.per_page && (
                    <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
                      Page {pagination.current_page} of {pagination.last_page}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Resources List/Grid */}
            {resourcesLoading && !resources ? (
              <div className="space-y-4">
                {[...Array(filters.per_page || 25)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 sm:h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : resourcesError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load resources</h3>
                    <p className="text-gray-600 mb-4">Please try again later</p>
                    <Button onClick={() => refetchResources()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : resources && resources.length > 0 ? (
              <>
                {/* Resources Display */}
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-3 sm:space-y-4"
                )}>
                  {resources.map((resource: ResourceItem) => (
                    viewMode === 'grid' 
                      ? <ResourceCard 
                          key={resource.id} 
                          resource={resource}
                          onResourceClick={handleResourceClick}
                          onResourceAccess={handleResourceAccess}
                          onBookmarkToggle={handleBookmarkToggle}
                          loadingStates={loadingStates}
                          getTypeIcon={getTypeIcon}
                          getTypeLabel={getTypeLabel}
                          getDifficultyColor={getDifficultyColor}
                          formatDuration={formatDuration}
                          formatCount={formatCount}
                          formatRatingDisplay={formatRatingDisplay}
                        />
                      : <ResourceListItem 
                          key={resource.id} 
                          resource={resource}
                          onResourceClick={handleResourceClick}
                          onResourceAccess={handleResourceAccess}
                          onBookmarkToggle={handleBookmarkToggle}
                          loadingStates={loadingStates}
                          getTypeIcon={getTypeIcon}
                          getTypeLabel={getTypeLabel}
                          getDifficultyColor={getDifficultyColor}
                          formatDuration={formatDuration}
                          formatCount={formatCount}
                        />
                  ))}
                </div>

                {/* UPDATED: Enhanced Pagination Component */}
                {pagination && pagination.total > pagination.per_page && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                      <EnhancedPagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        isLoading={resourcesLoading}
                        showPerPageSelector={true}
                        showResultsInfo={true}
                        perPageOptions={[10, 25, 50, 100]}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Loading state for pagination */}
                {resourcesLoading && resources.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        <span className="text-blue-800">Loading resources...</span>
                      </div>
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
                      {hasActiveFilters 
                        ? 'No resources match your current filters. Try adjusting your search criteria.'
                        : 'No resources available at the moment.'
                      }
                    </p>
                    {hasActiveFilters ? (
                      <Button onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    ) : (
                      <Button onClick={() => refetchResources()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* UPDATED: Bookmarks Tab with Pagination */}
        <TabsContent value="bookmarks" className="space-y-4 sm:space-y-6">
          <BookmarkManagerComponent 
            viewMode={viewMode}
            showFilters={true}
            onResourceClick={handleResourceClick}
            showPagination={true} // Enable pagination for bookmarks too
          />
        </TabsContent>

        {/* Popular Tab - Keep as is since these are curated lists */}
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
                {topRated.map((resource: ResourceItem) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource}
                    onResourceClick={handleResourceClick}
                    onResourceAccess={handleResourceAccess}
                    onBookmarkToggle={handleBookmarkToggle}
                    loadingStates={loadingStates}
                    getTypeIcon={getTypeIcon}
                    getTypeLabel={getTypeLabel}
                    getDifficultyColor={getDifficultyColor}
                    formatDuration={formatDuration}
                    formatCount={formatCount}
                    formatRatingDisplay={formatRatingDisplay}
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
                {popular.map((resource: ResourceItem) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource}
                    onResourceClick={handleResourceClick}
                    onResourceAccess={handleResourceAccess}
                    onBookmarkToggle={handleBookmarkToggle}
                    loadingStates={loadingStates}
                    getTypeIcon={getTypeIcon}
                    getTypeLabel={getTypeLabel}
                    getDifficultyColor={getDifficultyColor}
                    formatDuration={formatDuration}
                    formatCount={formatCount}
                    formatRatingDisplay={formatRatingDisplay}
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
                    {React.createElement(
                      useMemo(() => {
                        const iconName = getTypeIcon(selectedResource.type)
                        const iconMap: Record<string, React.ComponentType<any>> = {
                          FileText,
                          Video,
                          Headphones,
                          Brain,
                          Heart,
                          Download,
                          BookOpen
                        }
                        return iconMap[iconName] || BookOpen
                      }, [selectedResource.type]),
                      { className: "h-6 w-6 text-blue-600" }
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl">{selectedResource.title}</DialogTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {getTypeLabel(selectedResource.type)}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedResource.difficulty)}>
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
                  <div className="font-medium text-sm sm:text-base">{formatDuration(selectedResource.duration)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Views</div>
                  <div className="font-medium text-sm sm:text-base">{formatCount(selectedResource.view_count)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Downloads</div>
                  <div className="font-medium text-sm sm:text-base">{formatCount(selectedResource.download_count)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Rating</div>
                  <div className="font-medium flex items-center justify-center space-x-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                    <span className="text-sm sm:text-base">{(Number(selectedResource.rating) || 0).toFixed(1)}</span>
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