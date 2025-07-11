// components/pages/help-page.tsx - COMPLETELY FIXED
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
  Filter,
  Loader2,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Search,
} from 'lucide-react';

// Import role-based components
import { AdminHelpDashboard } from '@/components/help/admin/admin-help-dashboard';
import { CounselorHelpDashboard } from '@/components/help/counselor/counselor-help-dashboard';
import { StudentHelpDashboard } from '@/components/help/student/student-help-dashboard';

// Import FIXED hooks
import {
  useHelpDashboard,
  useFAQs,
  useFAQFilters,
  useFAQBookmarks,
  useRecentFAQSearches,
  useFAQAnalytics,
  useHelpRefresh, // CRITICAL: Added refresh functionality
} from '@/hooks/use-help';
import { SearchWithSuggestions } from '@/components/common/search-with-suggestions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { FAQ, HelpCategory } from '@/services/help.service';

export function HelpPage() {
  const { user } = useAuth();

  // ROLE-BASED ROUTING - Return appropriate dashboard based on user role
  if (user) {
    switch (user.role) {
      case 'admin':
        return <AdminHelpDashboard />;

      case 'counselor':
      case 'advisor':
        return <CounselorHelpDashboard />;

      case 'student':
      default:
        return <StudentHelpDashboard />;
    }
  }

  // Fallback for non-authenticated users or during loading
  return <PublicHelpPage />;
}

// CRITICAL FIX: Component-level skeleton for dashboard stats
function DashboardStatsskeleton() {
  return (
    <div className="grid grid-cols-3 gap-6 mt-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <Skeleton className="h-8 w-16 mb-2 bg-white/20" />
          <Skeleton className="h-4 w-12 bg-white/20" />
        </div>
      ))}
    </div>
  );
}

// CRITICAL FIX: Component-level skeleton for featured FAQs
function FeaturedFAQskeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// CRITICAL FIX: Component-level skeleton for categories
function CategoriesSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// CRITICAL FIX: Component-level skeleton for FAQs
function FAQsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

// CRITICAL FIX: Error boundary component
function ErrorDisplay({
  error,
  onRetry,
  title = 'Something went wrong',
}: {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// Public Help Page Component (for non-authenticated users)
function PublicHelpPage() {
  const [selectedTab, setSelectedTab] = useState('faqs');

  // FAQ filtering and search
  const { filters, updateFilter, clearFilters } = useFAQFilters();
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentFAQSearches();
  const { bookmarkedFAQs, toggleBookmark, isBookmarked } = useFAQBookmarks();
  const { trackFAQSearch, trackCategoryClick } = useFAQAnalytics();

  // CRITICAL FIX: Use updated hooks with proper loading states
  const {
    categories,
    featured,
    popular,
    stats,
    showPageStructure, // CRITICAL: Always true
    showSkeletons, // CRITICAL: Only true on initial load
    showRefreshIndicator, // CRITICAL: True during refresh
    isLoading, // CRITICAL: Only true on initial load
    error: dashboardError,
    refetch: refetchDashboard,
  } = useHelpDashboard();

  const {
    data: faqsData,
    isLoading: faqsLoading,
    error: faqsError,
    refetch: refetchFAQs,
  } = useFAQs(filters);

  // CRITICAL FIX: Add refresh functionality
  const { refreshAll, isRefreshing } = useHelpRefresh();

  const handleSearch = useCallback(
    (query: string) => {
      updateFilter('search', query);
      addRecentSearch(query);
      trackFAQSearch(query, faqsData?.faqs?.length || 0);
    },
    [updateFilter, addRecentSearch, trackFAQSearch, faqsData]
  );

  const handleCategorySelect = useCallback(
    (categorySlug: string) => {
      const category = categories.find((c: HelpCategory) => c.slug === categorySlug);
      if (category) {
        updateFilter('category', categorySlug);
        trackCategoryClick(categorySlug, category.name);
      }
    },
    [categories, updateFilter, trackCategoryClick]
  );

  const handleFAQBookmark = useCallback(
    (faq: FAQ) => {
      toggleBookmark(faq.id);
    },
    [toggleBookmark]
  );

  const handleRetryDashboard = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

  const handleRetryFAQs = useCallback(() => {
    refetchFAQs();
  }, [refetchFAQs]);

  // Mock guides data
  const guides = [
    {
      id: '1',
      title: 'Getting Started with the Platform',
      description: 'Complete guide to navigating your student support hub',
      type: 'tutorial' as const,
      duration: '10 min',
      difficulty: 'beginner' as const,
      rating: 4.8,
    },
    {
      id: '2',
      title: 'Preparing for Your First Counseling Session',
      description: 'Tips and advice for making the most of your counseling experience',
      type: 'article' as const,
      duration: '5 min read',
      difficulty: 'beginner' as const,
      rating: 4.9,
    },
    {
      id: '3',
      title: 'Using Video Sessions Effectively',
      description: 'Technical setup and best practices for video counseling',
      type: 'video' as const,
      duration: '8 min',
      difficulty: 'intermediate' as const,
      rating: 4.7,
    },
    {
      id: '4',
      title: 'Crisis Resources and Emergency Contacts',
      description: 'Important information about crisis support and emergency resources',
      type: 'article' as const,
      duration: '3 min read',
      difficulty: 'beginner' as const,
      rating: 5.0,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'tutorial':
        return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'article':
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* CRITICAL FIX: Header always visible with proper loading/error states */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <HelpCircle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Help Center</h1>
                <p className="text-blue-100 text-lg">Find answers and get support</p>
              </div>
            </div>

            {/* CRITICAL FIX: Refresh button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 border-white/30"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {/* CRITICAL FIX: Stats with proper loading states */}
          {dashboardError ? (
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-2 text-red-200">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load statistics</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetryDashboard}
                  className="text-white hover:bg-white/20"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : showSkeletons ? (
            <DashboardStatskeeper />
          ) : (
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold flex items-center">
                  {showRefreshIndicator ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.total_faqs || 0
                  )}
                </div>
                <div className="text-sm text-blue-100">FAQs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold flex items-center">
                  {showRefreshIndicator ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    categories.length
                  )}
                </div>
                <div className="text-sm text-blue-100">Categories</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-blue-100">Support</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CRITICAL FIX: Search - always visible */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <SearchWithSuggestions
            value={filters.search || ''}
            onChange={(value) => updateFilter('search', value)}
            onSearch={handleSearch}
            placeholder="Search for help articles, FAQs, or guides..."
            recentSearches={recentSearches}
            popularSearches={popular.map((faq: FAQ) => faq.question)}
            onRecentSearchRemove={removeRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            isLoading={faqsLoading}
          />
        </CardContent>
      </Card>

      {/* CRITICAL FIX: Quick Help Options - always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="font-medium">Live Chat</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Phone className="h-7 w-7" />
          <span className="font-medium">Call Support</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Mail className="h-7 w-7" />
          <span className="font-medium">Email Us</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <BookOpen className="h-7 w-7" />
          <span className="font-medium">User Guide</span>
        </Button>
      </div>

      {/* CRITICAL FIX: Featured FAQs with proper loading/error states */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-600" />
            <span>Featured FAQs</span>
          </CardTitle>
          <CardDescription>Most helpful questions answered by our team</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {dashboardError ? (
            <ErrorDisplay
              error={dashboardError}
              onRetry={handleRetryDashboard}
              title="Failed to load featured FAQs"
            />
          ) : showSkeletons ? (
            <FeaturedFAQskeleton />
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((faq: FAQ) => (
                <Card
                  key={faq.id}
                  className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFAQBookmark(faq)}
                          className={cn(
                            'text-gray-400 hover:text-blue-600',
                            isBookmarked(faq.id) && 'text-blue-600'
                          )}
                        >
                          <Star className={cn('h-4 w-4', isBookmarked(faq.id) && 'fill-current')} />
                        </Button>
                      </div>

                      <div>
                        <h3 className="font-medium text-lg mb-2 line-clamp-2">{faq.question}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                          {faq.answer.substring(0, 150)}...
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            {Math.round(
                              (faq.helpful_count /
                                (faq.helpful_count + faq.not_helpful_count || 1)) *
                                100
                            )}
                            % helpful
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{faq.view_count} views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No featured FAQs</h3>
              <p className="text-gray-600">Featured content will appear here when available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL FIX: Main Content - always visible with proper loading states */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="faqs" className="rounded-lg font-medium">
            FAQs
          </TabsTrigger>
          <TabsTrigger value="guides" className="rounded-lg font-medium">
            Guides & Tutorials
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg font-medium">
            Contact Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* CRITICAL FIX: Categories Sidebar with proper loading */}
            <Card className="border-0 shadow-lg lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Categories</span>
                  {filters.category && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter('category', '')}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {dashboardError ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-gray-600">Failed to load categories</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryDashboard}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                ) : showSkeletons ? (
                  <CategoriesSkeleton />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant={!filters.category ? 'default' : 'ghost'}
                      className="w-full justify-between"
                      onClick={() => updateFilter('category', '')}
                    >
                      <span>All Categories</span>
                      <Badge variant="secondary" className="ml-2">
                        {stats?.total_faqs || 0}
                      </Badge>
                    </Button>

                    {categories.map((category: HelpCategory) => (
                      <Button
                        key={category.id}
                        variant={filters.category === category.slug ? 'default' : 'ghost'}
                        className="w-full justify-between"
                        onClick={() => handleCategorySelect(category.slug)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {category.faqs_count || 0}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CRITICAL FIX: FAQs with proper loading/error states */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Frequently Asked Questions</span>
                      {faqsData && (
                        <Badge variant="secondary">{faqsData.faqs.length} results</Badge>
                      )}
                    </CardTitle>

                    {/* Sorting and Filtering */}
                    <div className="flex items-center space-x-2">
                      <Select
                        value={filters.sort_by || 'featured'}
                        onValueChange={(value) => updateFilter('sort_by', value)}
                      >
                        <SelectTrigger className="w-40">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Featured First</SelectItem>
                          <SelectItem value="helpful">Most Helpful</SelectItem>
                          <SelectItem value="views">Most Viewed</SelectItem>
                          <SelectItem value="newest">Newest</SelectItem>
                        </SelectContent>
                      </Select>

                      {(filters.search || filters.category) && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {faqsError ? (
                    <ErrorDisplay
                      error={faqsError}
                      onRetry={handleRetryFAQs}
                      title="Failed to load FAQs"
                    />
                  ) : faqsLoading ? (
                    <FAQsSkeleton />
                  ) : faqsData && faqsData.faqs.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqsData.faqs.map((faq: FAQ) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id.toString()}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-start justify-between w-full">
                              <div className="flex items-start space-x-3">
                                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium">{faq.question}</span>
                                  {faq.is_featured && (
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFAQBookmark(faq);
                                  }}
                                  className={cn(
                                    'text-gray-400 hover:text-blue-600',
                                    isBookmarked(faq.id) && 'text-blue-600'
                                  )}
                                >
                                  <Star
                                    className={cn(
                                      'h-4 w-4',
                                      isBookmarked(faq.id) && 'fill-current'
                                    )}
                                  />
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-6">
                            <div className="space-y-4">
                              <div className="ml-8">
                                <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>

                                {/* Simple feedback display */}
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{faq.view_count} views</span>
                                  <span>{faq.helpful_count} helpful</span>
                                  <span className="text-green-600">
                                    {Math.round(
                                      (faq.helpful_count /
                                        (faq.helpful_count + faq.not_helpful_count || 1)) *
                                        100
                                    )}
                                    % helpful
                                  </span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                      <p className="text-gray-600">
                        Try adjusting your search or browse different categories
                      </p>
                      {(filters.search || filters.category) && (
                        <Button className="mt-4" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <span>Guides & Tutorials</span>
              </CardTitle>
              <CardDescription>
                Step-by-step guides to help you make the most of our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide) => (
                  <Card
                    key={guide.id}
                    className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                              {getTypeIcon(guide.type)}
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{guide.title}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="capitalize">
                                  {guide.type}
                                </Badge>
                                <span className="text-sm text-gray-500">{guide.duration}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{guide.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{guide.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(guide.difficulty)}>
                            {guide.difficulty}
                          </Badge>
                          <Button size="sm" variant="outline" className="hover:bg-purple-50">
                            <span>View Guide</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-medium">Phone Support</h4>
                      <p className="text-sm text-gray-600">Mon-Fri, 8AM-6PM</p>
                      <p className="font-mono text-lg">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email Support</h4>
                      <p className="text-sm text-gray-600">Response within 24 hours</p>
                      <p className="text-blue-600">support@university.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Live Chat</h4>
                      <p className="text-sm text-gray-600">Available 24/7</p>
                      <Button size="sm" className="mt-2">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-6 w-6 text-orange-600" />
                  <span>Additional Resources</span>
                </CardTitle>
                <CardDescription>External links and emergency contacts</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">University IT Help Desk</h4>
                      <p className="text-sm text-gray-600">
                        Technical support for university systems
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Student Services Portal</h4>
                      <p className="text-sm text-gray-600">Academic and administrative support</p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Campus Safety</h4>
                      <p className="text-sm text-gray-600">
                        Emergency services and safety resources
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
