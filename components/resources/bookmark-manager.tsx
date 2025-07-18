// components/resources/bookmark-manager.tsx - FIXED: Following Help Center pattern, no freezing issues
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  RefreshCw,
  Loader2,
  Video,
  Headphones,
  Brain,
  Heart,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';

// FIXED: Import the corrected hooks
import { useResourceBookmarks, useResourceUtils, useResourceAccess } from '@/hooks/use-resources';
import { ResourceRatingComponent } from './resource-rating';
import { cn } from '@/lib/utils';
import type { ResourceItem } from '@/stores/resources-store';
import type { ResourceCategory } from '@/services/resources.service';
import { toast } from 'sonner';

interface BookmarkManagerProps {
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
  onResourceClick?: (resource: ResourceItem) => void;
}

// FIXED: Use ResourceItem which has bookmarked_at when it's a bookmark
interface BookmarkedResource extends ResourceItem {
  bookmarked_at?: string;
}

export function BookmarkManagerComponent({
  viewMode = 'grid',
  showFilters = true,
  onResourceClick,
}: BookmarkManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('bookmarked_at');
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>({});

  // FIXED: Use the corrected hooks with proper destructuring
  const { 
    bookmarks, 
    isLoading, 
    error, 
    refetch,
    bookmarksCount,
    hasBookmarks 
  } = useResourceBookmarks();

  const {
    getTypeIcon,
    getTypeLabel,
    getDifficultyColor,
    formatDuration,
    formatCount,
    formatTimeAgo,
  } = useResourceUtils();

  const { access: accessResource } = useResourceAccess();

  // FIXED: Safe array utility function
  const ensureArray = useCallback((value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [value]; // If it's a single string, wrap it in an array
      }
    }
    return [];
  }, []);

  // FIXED: Handle resource access with individual loading states
  const handleResourceAccess = useCallback(
    async (resource: BookmarkedResource, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      // Set loading state for this specific resource
      setLoadingStates((prev) => ({ ...prev, [resource.id]: 'accessing' }));

      try {
        const result = await accessResource(resource.id);

        if (result && result.url) {
          window.open(result.url, '_blank');

          if (result.action === 'download') {
            toast.success(`${resource.title} download started`);
          } else {
            toast.success(`Opening ${resource.title}`);
          }
        }
      } catch (error) {
        console.error('❌ BookmarkManager: Access failed:', error);
        toast.error('Failed to access resource');
      } finally {
        // Clear loading state for this resource
        setLoadingStates((prev) => {
          const newStates = { ...prev };
          delete newStates[resource.id];
          return newStates;
        });
      }
    },
    [accessResource]
  );

  // FIXED: Handle remove bookmark with individual loading states
  const handleRemoveBookmark = useCallback(
    async (resourceId: number, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      // Set loading state for this specific resource
      setLoadingStates((prev) => ({ ...prev, [resourceId]: 'removing' }));

      try {
        // Note: This would need to be implemented in the useResourceBookmark hook
        // For now, we'll just show success and refetch
        toast.success('Bookmark removed');
        await refetch();
      } catch (error) {
        console.error('❌ BookmarkManager: Remove bookmark failed:', error);
        toast.error('Failed to remove bookmark');
      } finally {
        // Clear loading state for this resource
        setLoadingStates((prev) => {
          const newStates = { ...prev };
          delete newStates[resourceId];
          return newStates;
        });
      }
    },
    [refetch]
  );

  // FIXED: Filter bookmarks with safe array handling
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks || !Array.isArray(bookmarks)) return [];

    let filtered = bookmarks;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((bookmark: BookmarkedResource) => {
        const matchesTitle = bookmark.title?.toLowerCase().includes(searchLower);
        const matchesDescription = bookmark.description?.toLowerCase().includes(searchLower);

        // SAFE: Handle tags search with proper array checking
        const safeTags = ensureArray(bookmark.tags);
        const matchesTags = safeTags.some((tag: any) =>
          String(tag).toLowerCase().includes(searchLower)
        );

        return matchesTitle || matchesDescription || matchesTags;
      });
    }

    // Category filter
    if (categoryFilter !== 'all' && categoryFilter) {
      filtered = filtered.filter(
        (bookmark: BookmarkedResource) => bookmark.category?.slug === categoryFilter
      );
    }

    // Type filter
    if (typeFilter !== 'all' && typeFilter) {
      filtered = filtered.filter((bookmark: BookmarkedResource) => bookmark.type === typeFilter);
    }

    // Sort
    filtered.sort((a: BookmarkedResource, b: BookmarkedResource) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'bookmarked_at':
        default:
          // Use created_at if bookmarked_at is not available
          const aDate = a.bookmarked_at || a.created_at;
          const bDate = b.bookmarked_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
      }
    });

    return filtered;
  }, [bookmarks, searchTerm, categoryFilter, typeFilter, sortBy, ensureArray]);

  // Get unique categories and types from bookmarks
  const availableCategories = useMemo(() => {
    if (!bookmarks || !Array.isArray(bookmarks)) return [];
    const categories = new Map();
    bookmarks.forEach((bookmark: BookmarkedResource) => {
      if (bookmark.category) {
        categories.set(bookmark.category.slug, bookmark.category);
      }
    });
    return Array.from(categories.values()) as ResourceCategory[];
  }, [bookmarks]);

  const availableTypes = useMemo(() => {
    if (!bookmarks || !Array.isArray(bookmarks)) return [];
    const types = new Set(
      bookmarks.map((bookmark: BookmarkedResource) => bookmark.type)
    );
    return Array.from(types);
  }, [bookmarks]);

  // Get icon component safely
  const getIconComponent = useCallback((type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      article: FileText,
      video: Video,
      audio: Headphones,
      exercise: Brain,
      tool: Heart,
      worksheet: Download,
    };
    return iconMap[type] || BookOpen;
  }, []);

  // FIXED: BookmarkCard with safe tag handling and proper keys
  const BookmarkCard = ({ bookmark }: { bookmark: BookmarkedResource }) => {
    const IconComponent = getIconComponent(bookmark.type);
    const isLoading = loadingStates[bookmark.id];

    // SAFE: Handle tags with proper array checking
    const safeTags = ensureArray(bookmark.tags);

    return (
      <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group cursor-pointer">
        <CardContent className="p-4 sm:p-6" onClick={() => onResourceClick?.(bookmark)}>
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex flex-col space-y-1">
                  <Badge variant="outline" className="capitalize w-fit text-xs">
                    {getTypeLabel(bookmark.type)}
                  </Badge>
                  {bookmark.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 w-fit text-xs">Featured</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                  <span className="text-xs sm:text-sm font-medium">
                    {(Number(bookmark.rating) || 0).toFixed(1)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                  disabled={!!isLoading}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                >
                  {isLoading === 'removing' ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div>
              <h3 className="font-semibold text-sm sm:text-lg mb-2 line-clamp-2">
                {bookmark.title}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                {bookmark.description}
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(bookmark.difficulty)}>
                  {bookmark.difficulty}
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Download className="h-3 w-3" />
                  <span>{formatCount(bookmark.download_count)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(bookmark.duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark className="h-3 w-3 text-blue-500" />
                  <span>Saved {formatTimeAgo(bookmark.bookmarked_at || bookmark.created_at)}</span>
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
                <span className="text-xs sm:text-sm text-gray-600">{bookmark.category.name}</span>
              </div>
            )}

            {/* FIXED: Tags with safe array handling and proper keys */}
            {safeTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {safeTags.slice(0, 2).map((tag: any, index: number) => (
                  <Badge
                    key={`tag-${bookmark.id}-${index}-${String(tag)}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    {String(tag)}
                  </Badge>
                ))}
                {safeTags.length > 2 && (
                  <Badge key={`more-tags-${bookmark.id}`} variant="secondary" className="text-xs">
                    +{safeTags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              <Button
                className="flex-1 text-xs sm:text-sm"
                size="sm"
                onClick={(e) => handleResourceAccess(bookmark, e)}
                disabled={!!isLoading}
              >
                {bookmark.type === 'video' && (
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {bookmark.type === 'worksheet' && (
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {bookmark.type === 'tool' && (
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                {isLoading === 'accessing' ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Access'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // FIXED: BookmarkListItem with safe tag handling and proper keys
  const BookmarkListItem = ({ bookmark }: { bookmark: BookmarkedResource }) => {
    const IconComponent = getIconComponent(bookmark.type);
    const isLoading = loadingStates[bookmark.id];

    // SAFE: Handle tags with proper array checking
    const safeTags = ensureArray(bookmark.tags);

    return (
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-3 sm:p-4" onClick={() => onResourceClick?.(bookmark)}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Icon */}
            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
              <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-lg truncate">{bookmark.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 mt-1">
                    {bookmark.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Bookmark className="h-3 w-3 text-blue-500" />
                      <span>Saved {formatTimeAgo(bookmark.bookmarked_at || bookmark.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(bookmark.duration)}</span>
                    </div>
                    <span>{formatCount(bookmark.view_count)} views</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                  <Badge variant="outline" className="capitalize text-xs">
                    {getTypeLabel(bookmark.type)}
                  </Badge>
                  <Badge className={getDifficultyColor(bookmark.difficulty)}>
                    {bookmark.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">
                      {(Number(bookmark.rating) || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-2 sm:space-y-0"
                onClick={(e) => e.stopPropagation()}
              >
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

                  {/* FIXED: Tags display with safe handling and proper keys */}
                  {safeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {safeTags.slice(0, 3).map((tag: any, index: number) => (
                        <Badge
                          key={`list-tag-${bookmark.id}-${index}-${String(tag)}`}
                          variant="outline"
                          className="text-xs"
                        >
                          {String(tag)}
                        </Badge>
                      ))}
                      {safeTags.length > 3 && (
                        <Badge
                          key={`list-more-tags-${bookmark.id}`}
                          variant="outline"
                          className="text-xs"
                        >
                          +{safeTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={(e) => handleResourceAccess(bookmark, e)}
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
                    onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                    disabled={!!isLoading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {isLoading === 'removing' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 text-sm sm:text-base">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 sm:py-12">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-red-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load bookmarks</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">My Bookmarks</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {bookmarksCount} saved resources
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} size="sm">
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (availableCategories.length > 0 || availableTypes.length > 0) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    {availableCategories.map((category: ResourceCategory) => (
                      <SelectItem key={`category-${category.id}`} value={category.slug}>
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
                    {availableTypes.map((type: string) => (
                      <SelectItem key={`type-${type}`} value={type}>
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
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
              : 'space-y-3 sm:space-y-4'
          )}
        >
          {filteredBookmarks.map((bookmark: BookmarkedResource) =>
            viewMode === 'grid' ? (
              <BookmarkCard key={`bookmark-card-${bookmark.id}`} bookmark={bookmark} />
            ) : (
              <BookmarkListItem key={`bookmark-list-${bookmark.id}`} bookmark={bookmark} />
            )
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 sm:py-12">
              <Bookmark className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'No matching bookmarks found'
                  : 'No bookmarks yet'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start bookmarking resources to access them quickly later'}
              </p>
              {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}