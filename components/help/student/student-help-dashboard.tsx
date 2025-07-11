// components/help/student/student-help-dashboard.tsx
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  BookOpen, 
  Star, 
  Search,
  TrendingUp,
  Clock,
  Heart,
  Eye,
  ThumbsUp,
  MessageSquare,
  HelpCircle,
  Bookmark,
  ChevronRight
} from 'lucide-react'
import { 
  useHelpDashboard, 
  useFAQs, 
  useFAQFilters, 
  useFAQBookmarks,
  useRecentFAQSearches,
  useFAQAnalytics
} from '@/hooks/use-help'
import { SearchWithSuggestions } from '@/components/common/search-with-suggestions'
import { StatsSkeleton, FAQSkeleton } from '@/components/common/loading-skeleton'
import { cn } from '@/lib/utils'
import type { FAQ } from '@/services/help.service'

interface StudentHelpDashboardProps {
  onNavigate?: (page: string) => void
}

export function StudentHelpDashboard({ onNavigate }: StudentHelpDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('browse')
  
  const { filters, updateFilter, clearFilters } = useFAQFilters()
  const { 
    recentSearches, 
    addRecentSearch, 
    removeRecentSearch, 
    clearRecentSearches 
  } = useRecentFAQSearches()
  const { bookmarkedFAQs, toggleBookmark, isBookmarked } = useFAQBookmarks()
  const { trackFAQSearch, trackCategoryCick } = useFAQAnalytics()

  const {
    categories,
    featured,
    popular,
    stats,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch
  } = useHelpDashboard()

  const {
    data: faqsData,
    isLoading: faqsLoading,
    error: faqsError
  } = useFAQs(filters)

  const handleSearch = (query: string) => {
    updateFilter('search', query)
    addRecentSearch(query)
    trackFAQSearch(query, faqsData?.faqs?.length || 0)
  }

  const handleCategorySelect = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug)
    if (category) {
      updateFilter('category', categorySlug)
      trackCategoryCick(categorySlug, category.name)
    }
  }

  const handleFAQBookmark = (faq: FAQ) => {
    toggleBookmark(faq.id)
  }

  // Get bookmarked FAQs from popular/featured lists
  const getBookmarkedFAQs = () => {
    const allFAQs = [...featured, ...popular, ...(faqsData?.faqs || [])]
    return allFAQs.filter(faq => bookmarkedFAQs.includes(faq.id))
  }

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <StatsSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <HelpCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Help Center</h1>
              <p className="text-blue-100 text-lg">Find answers to your questions</p>
            </div>
          </div>
          
          {/* Quick Stats for Students */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{stats?.total_faqs || 0}</div>
              <div className="text-sm text-blue-100">Help Articles</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{bookmarkedFAQs.length}</div>
              <div className="text-sm text-blue-100">Bookmarked</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <SearchWithSuggestions
            value={filters.search || ''}
            onChange={(value) => updateFilter('search', value)}
            onSearch={handleSearch}
            placeholder="Search for help articles, FAQs, or guides..."
            recentSearches={recentSearches}
            popularSearches={popular.map(faq => faq.question)}
            onRecentSearchRemove={removeRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            isLoading={faqsLoading}
          />
        </CardContent>
      </Card>

      {/* Quick Help Categories */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Browse by Category</span>
          </CardTitle>
          <CardDescription>Find help organized by topic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={cn(
                  "p-4 text-center border rounded-lg hover:shadow-md transition-all duration-200",
                  filters.category === category.slug 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-medium text-sm">{category.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{category.faqs_count || 0} articles</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured FAQs */}
      {featured.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <span>Featured Help Articles</span>
            </CardTitle>
            <CardDescription>Our most helpful content, recommended for you</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((faq) => (
                <Card key={faq.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
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
                            "text-gray-400 hover:text-blue-600",
                            isBookmarked(faq.id) && "text-blue-600"
                          )}
                        >
                          <Heart className={cn("h-4 w-4", isBookmarked(faq.id) && "fill-current")} />
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
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            {Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count || 1)) * 100)}% helpful
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Eye className="h-3 w-3" />
                          <span>{faq.view_count} views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="browse" className="rounded-lg font-medium">
            Browse FAQs
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="rounded-lg font-medium">
            My Bookmarks
          </TabsTrigger>
          <TabsTrigger value="popular" className="rounded-lg font-medium">
            Most Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Filter Sidebar */}
            <Card className="border-0 shadow-lg lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Filter by Topic</span>
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
                <div className="space-y-2">
                  <Button
                    variant={!filters.category ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => updateFilter('category', '')}
                  >
                    <span>All Topics</span>
                    <Badge variant="secondary" className="ml-2">
                      {stats?.total_faqs || 0}
                    </Badge>
                  </Button>
                  
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={filters.category === category.slug ? "default" : "ghost"}
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
              </CardContent>
            </Card>

            {/* FAQ List */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Help Articles</span>
                      {faqsData && (
                        <Badge variant="secondary">{faqsData.faqs.length} results</Badge>
                      )}
                    </CardTitle>
                    
                    {(filters.search || filters.category) && (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {faqsLoading ? (
                    <FAQSkeleton count={5} />
                  ) : faqsError ? (
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load help articles</h3>
                      <p className="text-gray-600">Please try again later</p>
                    </div>
                  ) : faqsData && faqsData.faqs.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqsData.faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id.toString()} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-start justify-between w-full">
                              <div className="flex items-start space-x-3">
                                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium">{faq.question}</span>
                                  <div className="flex items-center space-x-3 mt-2">
                                    {faq.is_featured && (
                                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                                    )}
                                    {faq.category && (
                                      <Badge variant="outline">{faq.category.name}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFAQBookmark(faq)
                                  }}
                                  className={cn(
                                    "text-gray-400 hover:text-blue-600",
                                    isBookmarked(faq.id) && "text-blue-600"
                                  )}
                                >
                                  <Heart className={cn("h-4 w-4", isBookmarked(faq.id) && "fill-current")} />
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
                                  <div className="flex items-center space-x-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{faq.view_count} views</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <ThumbsUp className="h-4 w-4 text-green-600" />
                                    <span>{faq.helpful_count} helpful</span>
                                  </div>
                                  <div className="text-green-600">
                                    {Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count || 1)) * 100)}% helpful
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No help articles found</h3>
                      <p className="text-gray-600 mb-4">
                        {filters.search || filters.category 
                          ? "Try different search terms or browse by category"
                          : "No articles available at the moment"
                        }
                      </p>
                      {(filters.search || filters.category) && (
                        <Button onClick={clearFilters}>
                          <Search className="h-4 w-4 mr-2" />
                          Clear Search and Browse All
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookmarks">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bookmark className="h-6 w-6 text-blue-600" />
                <span>My Bookmarked Articles</span>
                <Badge variant="secondary">{bookmarkedFAQs.length}</Badge>
              </CardTitle>
              <CardDescription>
                Quick access to your saved help articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getBookmarkedFAQs().length > 0 ? (
                <div className="space-y-4">
                  {getBookmarkedFAQs().map((faq) => (
                    <div key={faq.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {faq.answer.substring(0, 200)}...
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{faq.view_count} views</span>
                            <span>{Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count || 1)) * 100)}% helpful</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {faq.category && (
                            <Badge variant="outline">{faq.category.name}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFAQBookmark(faq)}
                            className="text-blue-600"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked articles</h3>
                  <p className="text-gray-600 mb-4">
                    Save helpful articles by clicking the heart icon when browsing
                  </p>
                  <Button onClick={() => setSelectedTab('browse')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Help Articles
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span>Most Popular Articles</span>
              </CardTitle>
              <CardDescription>
                Help articles that other students find most useful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popular.map((faq, index) => (
                  <div key={faq.id} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {faq.answer.substring(0, 200)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{faq.view_count} views</span>
                          <span>{faq.helpful_count} helpful votes</span>
                          <span>{Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count || 1)) * 100)}% helpful</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {faq.category && (
                            <Badge variant="outline">{faq.category.name}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFAQBookmark(faq)}
                            className={cn(
                              "text-gray-400 hover:text-blue-600",
                              isBookmarked(faq.id) && "text-blue-600"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", isBookmarked(faq.id) && "fill-current")} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}