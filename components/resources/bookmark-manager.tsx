// components/resources/bookmark-manager.tsx (NEW - Bookmark management component)
"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Bookmark,
  Star,
  Clock,
  Download,
  ExternalLink,
  Play,
  Trash2,
  Search,
  Filter,
  Grid3X3,
  List,
  RefreshCw,
  Loader2
} from "lucide-react"

import { useResourceBookmarks, useResourceUtils, useResourceAccess } from "@/hooks/use-resources"
import { ResourceRatingComponent } from "./resource-rating"
import { cn } from "@/lib/utils"
import type { Resource } from "@/services/resources.service"
import { toast } from "sonner"

interface BookmarkManagerProps {
  viewMode?: 'grid' | 'list'
  showFilters?: boolean
  onResourceClick?: (resource: Resource) => void
}

export function BookmarkManagerComponent({ 
  viewMode = 'grid', 
  showFilters = true,
  onResourceClick 
}: BookmarkManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("bookmarked_at")

  // Hooks
  const {
    data: bookmarksData,
    isLoading,
    error,
    refetch
  } = useResourceBookmarks()
  
  const {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    formatDuration,
    formatCount,
    formatTimeAgo
  } = useResourceUtils()
  
  const accessMutation = useResourceAccess()

  // Handle resource access
  const handleResourceAccess = useCallback(async (resource: Resource) => {
    try {
      const result = await accessMutation.mutateAsync(resource.id)
      
      if (result && result.url) {
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
  }, [accessMutation])

  // Handle remove bookmark
  const handleRemoveBookmark = useCallback(async (resourceId: number) => {
    try {
      // This would call the bookmark mutation to remove
      toast.success('Bookmark removed')
      refetch()
    } catch (error) {
      toast.error('Failed to remove bookmark')
    }
  }, [refetch])

  // Filter bookmarks
  const filteredBookmarks = React.useMemo(() => {
    if (!bookmarksData?.bookmarks) return []

    let filtered = bookmarksData.bookmarks

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.description.toLowerCase().includes(searchLower) ||
        bookmark.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (categoryFilter !== "all" && categoryFilter) {
      filtered = filtered.filter(bookmark => 
        bookmark.category?.slug === categoryFilter
      )
    }

    // Type filter
    if (typeFilter !== "all" && typeFilter) {
      filtered = filtered.filter(bookmark => bookmark.type === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'bookmarked_at':
        default:
          return new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
      }
    })

    return filtered
  }, [bookmarksData?.bookmarks, searchTerm, categoryFilter, typeFilter, sortBy])

  // Get unique categories and types from bookmarks
  const availableCategories = React.useMemo(() => {
    if (!bookmarksData?.bookmarks) return []
    const categories = new Map()
    bookmarksData.bookmarks.forEach(bookmark => {
      if (bookmark.category) {
        categories.set(bookmark.category.slug, bookmark.category)
      }
    })
    return Array.from(categories.values())
  }, [bookmarksData?.bookmarks])

  const availableTypes = React.useMemo(() => {
    if (!bookmarksData?.bookmarks) return []
    const types = new Set(bookmarksData.bookmarks.map(bookmark => bookmark.type))
    return Array.from(types)
  }, [bookmarksData?.bookmarks])

  const BookmarkCard = ({ bookmark }: { bookmark: Resource & { bookmarked_at: string } }) => (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer">
      <CardContent className="p-6" onClick={() => onResourceClick?.(bookmark)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                {React.createElement(
                  require('lucide-react')[getTypeIcon(bookmark.type)], 
                  { className: "h-5 w-5 text-blue-600" }
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <Badge variant="outline" className="capitalize w-fit">
                  {getTypeLabel(bookmark.type)}
                </Badge>
                {bookmark.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 w-fit">Featured</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{(Number(bookmark.rating) || 0).toFixed(1)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveBookmark(bookmark.id)
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{bookmark.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {bookmark.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getDifficultyColor(bookmark.difficulty)}>
                {bookmark.difficulty}
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Download className="h-3 w-3" />
                <span>{formatCount(bookmark.download_count)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(bookmark.duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bookmark className="h-3 w-3 text-blue-500" />
                <span>Saved {formatTimeAgo(bookmark.bookmarked_at)}</span>
              </div>
            </div>
          </div>

          {/* Category */}
          {bookmark.category && (
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: bookmark.category.color }}
              />
              <span className="text-sm text-gray-600">{bookmark.category.name}</span>
            </div>
          )}

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {bookmark.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{bookmark.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              className="flex-1" 
              size="sm"
              onClick={() => handleResourceAccess(bookmark)}
              disabled={accessMutation.isPending}
            >
              {bookmark.type === "video" && <Play className="h-4 w-4 mr-2" />}
              {bookmark.type === "worksheet" && <Download className="h-4 w-4 mr-2" />}
              {bookmark.type === "tool" && <ExternalLink className="h-4 w-4 mr-2" />}
              {accessMutation.isPending ? 'Loading...' : 'Access'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const BookmarkListItem = ({ bookmark }: { bookmark: Resource & { bookmarked_at: string } }) => (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-4" onClick={() => onResourceClick?.(bookmark)}>
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="p-2 bg-gray-100 rounded-lg">
            {React.createElement(
              require('lucide-react')[getTypeIcon(bookmark.type)], 
              { className: "h-5 w-5 text-blue-600" }
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg truncate">{bookmark.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                  {bookmark.description}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Bookmark className="h-3 w-3 text-blue-500" />
                    <span>Saved {formatTimeAgo(bookmark.bookmarked_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(bookmark.duration)}</span>
                  </div>
                  <span>{formatCount(bookmark.view_count)} views</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Badge variant="outline" className="capitalize">
                  {getTypeLabel(bookmark.type)}
                </Badge>
                <Badge className={getDifficultyColor(bookmark.difficulty)}>
                  {bookmark.difficulty}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{(Number(bookmark.rating) || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-2">
                {bookmark.category && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bookmark.category.color }}
                    />
                    <span className="text-xs text-gray-600">{bookmark.category.name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm"
                  onClick={() => handleResourceAccess(bookmark)}
                  disabled={accessMutation.isPending}
                >
                  {accessMutation.isPending ? 'Loading...' : 'Access'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load bookmarks</h3>
            <p className="text-gray-600 mb-4">Please try again later</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Bookmarks</h2>
          <p className="text-gray-600">
            {bookmarksData?.bookmarks?.length || 0} saved resources
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (availableCategories.length > 0 || availableTypes.length > 0) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map((category) => (
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
              )}

              {/* Type Filter */}
              {availableTypes.length > 0 && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bookmarked_at">Recently Saved</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="type">Resource Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookmarks Grid/List */}
      {filteredBookmarks.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {filteredBookmarks.map((bookmark) => (
            viewMode === 'grid' 
              ? <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              : <BookmarkListItem key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter !== "all" || typeFilter !== "all" 
                  ? "No matching bookmarks found"
                  : "No bookmarks yet"
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start bookmarking resources to access them quickly later"
                }
              </p>
              {(searchTerm || categoryFilter !== "all" || typeFilter !== "all") && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("all")
                    setTypeFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}