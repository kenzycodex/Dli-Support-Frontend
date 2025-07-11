// components/resources/bookmark-manager.tsx
import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bookmark, 
  BookmarkCheck,
  Search, 
  Filter,
  Calendar,
  Star,
  ExternalLink,
  Download,
  Video,
  BookOpen,
  Headphones,
  Brain,
  Heart,
  Trash2,
  SortAsc,
  SortDesc,
  Grid3X3,
  List
} from 'lucide-react'
import { 
  useResourceBookmarks, 
  useResourceBookmark, 
  useResourceAnalytics,
  useResourceUtils 
} from '@/hooks/use-resources'
import { cn } from '@/lib/utils'
import type { Resource } from '@/services/resources.service'
import { toast } from 'sonner'

interface BookmarkManagerProps {
  className?: string
  viewMode?: 'grid' | 'list'
  showFilters?: boolean
  onResourceClick?: (resource: Resource) => void
}

interface BookmarkFilters {
  search: string
  type: string
  difficulty: string
  sortBy: 'newest' | 'oldest' | 'title' | 'rating'
  sortOrder: 'asc' | 'desc'
}

export function BookmarkManagerComponent({ 
  className,
  viewMode: initialViewMode = 'grid',
  showFilters = true,
  onResourceClick
}: BookmarkManagerProps) {
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [filters, setFilters] = useState<BookmarkFilters>({
    search: '',
    type: 'all',
    difficulty: 'all',
    sortBy: 'newest',
    sortOrder: 'desc'
  })

  const { data: bookmarksData, isLoading, error, refetch } = useResourceBookmarks(page, 20)
  const bookmarkMutation = useResourceBookmark()
  const { trackResourceBookmark } = useResourceAnalytics()
  const { getTypeIcon, getTypeLabel, getDifficultyColor, formatCount } = useResourceUtils()

  const bookmarks = bookmarksData?.bookmarks || []
  const pagination = bookmarksData?.pagination

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = [...bookmarks]

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.description.toLowerCase().includes(searchTerm) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.type === filters.type)
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.difficulty === filters.difficulty)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'newest':
          comparison = new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
          break
        case 'oldest':
          comparison = new Date(a.bookmarked_at).getTime() - new Date(b.bookmarked_at).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'rating':
          comparison = b.rating - a.rating
          break
        default:
          comparison = 0
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [bookmarks, filters])

  const handleRemoveBookmark = useCallback(async (resource: Resource) => {
    try {
      await bookmarkMutation.mutateAsync(resource.id)
      trackResourceBookmark(resource.id, resource.title, false)
      refetch() // Refresh the bookmarks list
    } catch (error) {
      toast.error('Failed to remove bookmark')
    }
  }, [bookmarkMutation, trackResourceBookmark, refetch])

  const handleResourceAccess = useCallback((resource: Resource) => {
    onResourceClick?.(resource)
  }, [onResourceClick])

  const updateFilter = useCallback((key: keyof BookmarkFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filtering
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      difficulty: 'all',
      sortBy: 'newest',
      sortOrder: 'desc'
    })
    setPage(1)
  }, [])

  const formatBookmarkedDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }, [])

  const ResourceCard = ({ resource }: { resource: Resource & { bookmarked_at: string } }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
      <CardContent className="p-6">
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
              <div>
                <Badge variant="outline" className="capitalize mb-1">
                  {getTypeLabel(resource.type)}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Badge className={getDifficultyColor(resource.difficulty)}>
                    {resource.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{resource.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveBookmark(resource)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={bookmarkMutation.isPending}
            >
              <Bookmark className="h-4 w-4 fill-current" />
            </Button>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{resource.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {resource.description}
            </p>
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

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>Bookmarked {formatBookmarkedDate(resource.bookmarked_at)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>{formatCount(resource.view_count)} views</span>
              {resource.type === 'worksheet' && (
                <span>{formatCount(resource.download_count)} downloads</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button 
              className="flex-1" 
              size="sm"
              onClick={() => handleResourceAccess(resource)}
            >
              {resource.type === 'video' && <Video className="h-4 w-4 mr-2" />}
              {resource.type === 'worksheet' && <Download className="h-4 w-4 mr-2" />}
              {resource.type === 'tool' && <ExternalLink className="h-4 w-4 mr-2" />}
              Access
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ResourceListItem = ({ resource }: { resource: Resource & { bookmarked_at: string } }) => (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
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
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{resource.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Bookmarked {formatBookmarkedDate(resource.bookmarked_at)}</span>
                </div>
                <span>{formatCount(resource.view_count)} views</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm"
                  onClick={() => handleResourceAccess(resource)}
                >
                  Access
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBookmark(resource)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-2">Failed to load bookmarks</div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BookmarkCheck className="h-6 w-6 text-blue-600" />
            <span>My Bookmarks</span>
            {!isLoading && (
              <Badge variant="secondary">{filteredBookmarks.length}</Badge>
            )}
          </CardTitle>
          
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookmarks..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
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
              
              <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Added</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredBookmarks.length === 0 && (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.search || filters.type !== 'all' || filters.difficulty !== 'all' 
                ? 'No bookmarks match your filters' 
                : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.type !== 'all' || filters.difficulty !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start bookmarking resources you want to revisit later'}
            </p>
            {(filters.search || filters.type !== 'all' || filters.difficulty !== 'all') && (
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Bookmarks Grid/List */}
        {!isLoading && filteredBookmarks.length > 0 && (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredBookmarks.map((resource) => (
              viewMode === 'grid' 
                ? <ResourceCard key={resource.id} resource={resource} />
                : <ResourceListItem key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} bookmarks
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={pagination.current_page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}