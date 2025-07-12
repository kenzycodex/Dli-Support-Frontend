// components/pages/resources-page.tsx (ENHANCED - Role-based access with smart caching)
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
  Eye
} from "lucide-react"

// Import hooks and components
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
import { ResourceRatingComponent } from "@/components/resources/resource-rating"
import { BookmarkManagerComponent } from "@/components/resources/bookmark-manager"
import { SearchWithSuggestions } from "@/components/common/search-with-suggestions"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import type { Resource } from "@/services/resources.service"
import { toast } from 'sonner'

interface ResourcesPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function ResourcesPage({ onNavigate }: ResourcesPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState("browse")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  
  // Resource filtering and search
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useResourceFilters()
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
    formatRating,
    formatRatingDisplay
  } = useResourceUtils()
  
  // Data fetching with stable caching
  const {
    categories,
    featured,
    popular,
    topRated,
    stats,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useResourcesDashboard()
  
  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources
  } = useResources(filters)

  // Mutations
  const accessMutation = useResourceAccess()
  const bookmarkMutation = useResourceBookmark()

  // Role-based permissions
  const canManageResources = useMemo(() => user?.role === 'admin', [user?.role])
  const canSuggestContent = useMemo(() => 
    user?.role === 'counselor' || user?.role === 'admin', [user?.role]
  )

  // Enhanced refresh - only when explicitly requested
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchDashboard(), refetchResources()])
      toast.success('Resources refreshed successfully')
    } catch (error) {
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
      trackResourceSearch(query, resourcesData?.resources?.length || 0)
    }
  }, [updateFilter, addRecentSearch, trackResourceSearch, resourcesData])

  const handleCategorySelect = useCallback((categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug)
    if (category) {
      updateFilter('category', categorySlug)
      trackResourceCategoryClick(categorySlug, category.name)
    }
  }, [categories, updateFilter, trackResourceCategoryClick])

  const handleResourceAccess = useCallback(async (resource: Resource) => {
    try {
      trackResourceView(resource.id, resource.title, resource.type)
      
      const result = await accessMutation.mutateAsync(resource.id)
      
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
      toast.error('Failed to access resource')
    }
  }, [accessMutation, trackResourceView, trackResourceAccess])

  const handleBookmarkToggle = useCallback(async (resource: Resource) => {
    try {
      await bookmarkMutation.mutateAsync(resource.id)
    } catch (error) {
      // Error handling is done in the mutation
    }
  }, [bookmarkMutation])

  const handleResourceClick = useCallback((resource: Resource) => {
    setSelectedResource(resource)
    trackResourceView(resource.id, resource.title, resource.type)
  }, [trackResourceView])

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer">
      <CardContent className="p-6" onClick={() => handleResourceClick(resource)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                {React.createElement(
                  require('lucide-react')[getTypeIcon(resource.type)], 
                  { className: "h-5 w-5 text-blue-600" }
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="capitalize w-fit">
                  {getTypeLabel(resource.type)}
                </Badge>
                {resource.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 w-fit">Featured</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{formatRatingDisplay(resource.rating)}</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{resource.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {resource.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getDifficultyColor(resource.difficulty)}>
                {resource.difficulty}
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Download className="h-3 w-3" />
                <span>{formatCount(resource.download_count)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(resource.duration)}</span>
              <span>•</span>
              <span>{resource.author_name}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              className="flex-1" 
              size="sm"
              onClick={() => handleResourceAccess(resource)}
              disabled={accessMutation.isPending}
            >
              {resource.type === "video" && <Play className="h-4 w-4 mr-2" />}
              {resource.type === "worksheet" && <Download className="h-4 w-4 mr-2" />}
              {resource.type === "tool" && <ExternalLink className="h-4 w-4 mr-2" />}
              {accessMutation.isPending ? 'Loading...' : 'Access'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBookmarkToggle(resource)}
              disabled={bookmarkMutation.isPending}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ResourceListItem = ({ resource }: { resource: Resource }) => (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-4" onClick={() => handleResourceClick(resource)}>
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="p-2 bg-gray-100 rounded-lg">
            {React.createElement(
              require('lucide-react')[getTypeIcon(resource.type)], 
              { className: "h-5 w-5 text-blue-600" }
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg truncate">{resource.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                  {resource.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Badge variant="outline" className="capitalize">
                  {getTypeLabel(resource.type)}
                </Badge>
                <Badge className={getDifficultyColor(resource.difficulty)}>
                  {resource.difficulty}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{resource.rating}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(resource.duration)}</span>
                </div>
                <span>{formatCount(resource.view_count)} views</span>
                <span>{resource.author_name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm"
                  onClick={() => handleResourceAccess(resource)}
                  disabled={accessMutation.isPending}
                >
                  {accessMutation.isPending ? 'Loading...' : 'Access'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBookmarkToggle(resource)}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Loading skeleton for initial load only
  if (dashboardLoading && !stats) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <div className="h-8 w-8 bg-white/30 rounded"></div>
              </div>
              <div>
                <div className="h-8 w-48 bg-white/30 rounded mb-2"></div>
                <div className="h-5 w-64 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4">
                  <div className="h-8 w-16 bg-white/30 rounded mb-2"></div>
                  <div className="h-4 w-20 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Role-Based Actions */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Resource Library</h1>
                <p className="text-indigo-100 text-lg">
                  Comprehensive collection of mental health and wellness resources
                </p>
              </div>
            </div>
            
            {/* Role-Based Actions */}
            <div className="flex items-center space-x-3">
              {canSuggestContent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info('Content suggestion feature coming soon')}
                  className="bg-white/20 hover:bg-white/30 border-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Suggest Resource
                </Button>
              )}
              
              {canManageResources && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAdminNavigate}
                  className="bg-white/20 hover:bg-white/30 border-white/30"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Stats Grid - STABLE */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {stats?.total_resources || 0}+
              </div>
              <div className="text-sm text-indigo-100">Total Resources</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {categories.length}
              </div>
              <div className="text-sm text-indigo-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">Free</div>
              <div className="text-sm text-indigo-100">All Resources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Resources - STABLE */}
      {featured.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <span>Featured Resources</span>
                </CardTitle>
                <CardDescription>Hand-picked resources recommended by our counselors</CardDescription>
              </div>
              
              {/* Role-based badge for admins */}
              {canManageResources && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Admin View
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search - OPTIMIZED */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <SearchWithSuggestions
            value={filters.search || ''}
            onChange={(value) => updateFilter('search', value)}
            onSearch={handleSearch}
            placeholder="Search resources by title, description, or tags..."
            recentSearches={recentSearches}
            popularSearches={popular.map(r => r.title)}
            onRecentSearchRemove={removeRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            isLoading={resourcesLoading}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="browse" className="rounded-lg font-medium">
            Browse Resources
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="rounded-lg font-medium">
            My Bookmarks
          </TabsTrigger>
          <TabsTrigger value="popular" className="rounded-lg font-medium">
            Popular & Top Rated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters and View Controls */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                  <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-full lg:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name} ({category.resources_count || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value)}>
                    <SelectTrigger className="w-full lg:w-48">
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
                  
                  <Select value={filters.difficulty || 'all'} onValueChange={(value) => updateFilter('difficulty', value)}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.sort_by || 'featured'} onValueChange={(value) => updateFilter('sort_by', value)}>
                    <SelectTrigger className="w-full lg:w-48">
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
                
                <div className="flex items-center space-x-2">
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
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid/List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Resources</h2>
              {resourcesData && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {resourcesData.resources.length} resources found
                </Badge>
              )}
            </div>

            {resourcesLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : resourcesError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load resources</h3>
                    <p className="text-gray-600 mb-4">Please try again later</p>
                    <Button onClick={() => refetchResources()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : resourcesData && resourcesData.resources.length > 0 ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {resourcesData.resources.map((resource) => (
                  viewMode === 'grid' 
                    ? <ResourceCard key={resource.id} resource={resource} />
                    : <ResourceListItem key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          <BookmarkManagerComponent 
            viewMode={viewMode}
            showFilters={true}
            onResourceClick={handleResourceClick}
          />
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          {/* Top Rated Resources */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-purple-600" />
                <span>Top Rated Resources</span>
              </CardTitle>
              <CardDescription>Highest rated resources by our community</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topRated.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Popular Resources */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <span>Most Popular Resources</span>
              </CardTitle>
              <CardDescription>Most accessed resources this month</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popular.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {React.createElement(
                      require('lucide-react')[getTypeIcon(selectedResource.type)], 
                      { className: "h-6 w-6 text-blue-600" }
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedResource.title}</DialogTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {getTypeLabel(selectedResource.type)}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedResource.difficulty)}>
                        {selectedResource.difficulty}
                      </Badge>
                      {selectedResource.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              <DialogDescription className="text-gray-700 leading-relaxed">
                {selectedResource.description}
              </DialogDescription>
              
              {/* Resource Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">{formatDuration(selectedResource.duration)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Views</div>
                  <div className="font-medium">{formatCount(selectedResource.view_count)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Downloads</div>
                  <div className="font-medium">{formatCount(selectedResource.download_count)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Rating</div>
                  <div className="font-medium flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{selectedResource.rating}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedResource.tags && selectedResource.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Info */}
              {selectedResource.author_name && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-1">About the Author</h4>
                  <p className="text-sm text-gray-700">
                    <strong>{selectedResource.author_name}</strong>
                    {selectedResource.author_bio && (
                      <span> - {selectedResource.author_bio}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Resource Actions */}
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleResourceAccess(selectedResource)}
                  disabled={accessMutation.isPending}
                >
                  {selectedResource.type === "video" && <Play className="h-4 w-4 mr-2" />}
                  {selectedResource.type === "worksheet" && <Download className="h-4 w-4 mr-2" />}
                  {selectedResource.type === "tool" && <ExternalLink className="h-4 w-4 mr-2" />}
                  {accessMutation.isPending ? 'Loading...' : 'Access Resource'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleBookmarkToggle(selectedResource)}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
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