// components/pages/help-page.tsx (FIXED - No stale indicators, working content suggestion)
"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Plus,
  BarChart3,
  RefreshCw
} from "lucide-react"

// Updated hooks and components
import { 
  useHelpDashboard,
  useFAQs,
  useFAQFilters,
  useFAQBookmarks,
  useRecentFAQSearches,
  useFAQAnalytics,
  useContentSuggestion,
  useHelpCategories
} from "@/hooks/use-help"
import { FAQFeedbackComponent } from "@/components/help/faq-feedback"
import { SearchWithSuggestions } from "@/components/common/search-with-suggestions"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { FAQ } from "@/services/help.service"

// Role-based interface props
interface HelpPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function HelpPage({ onNavigate }: HelpPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState("faqs")
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false)
  
  // Content suggestion form state
  const [suggestionForm, setSuggestionForm] = useState({
    category_id: "",
    question: "",
    answer: "",
    tags: [] as string[]
  })
  
  // FAQ filtering and search
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFAQFilters()
  const { 
    recentSearches, 
    addRecentSearch, 
    removeRecentSearch, 
    clearRecentSearches 
  } = useRecentFAQSearches()
  const { bookmarkedFAQs, toggleBookmark, isBookmarked } = useFAQBookmarks()
  const { trackFAQSearch, trackCategoryClick, trackFAQView } = useFAQAnalytics()
  
  // Data fetching - stable without stale indicators
  const {
    categories,
    featured,
    popular,
    stats,
    canSuggestContent,
    canManageContent,
    isLoading: dashboardLoading,
    error: dashboardError,
    hasData,
    forceRefresh
  } = useHelpDashboard()
  
  const {
    data: faqsData,
    isLoading: faqsLoading,
    error: faqsError,
    refetch: refetchFAQs
  } = useFAQs(filters)

  const {
    data: allCategories,
    isLoading: categoriesLoading
  } = useHelpCategories({ includeInactive: false })

  // Content suggestion hook
  const contentSuggestion = useContentSuggestion()

  // Handle search with analytics tracking
  const handleSearch = useCallback((query: string) => {
    updateFilter('search', query)
    addRecentSearch(query)
    trackFAQSearch(query, faqsData?.faqs?.length || 0)
  }, [updateFilter, addRecentSearch, trackFAQSearch, faqsData])

  // Handle category selection with analytics
  const handleCategorySelect = useCallback((categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug)
    if (category) {
      updateFilter('category', categorySlug)
      trackCategoryClick(categorySlug, category.name)
    }
  }, [categories, updateFilter, trackCategoryClick])

  // Handle FAQ bookmark toggle
  const handleFAQBookmark = useCallback((faq: FAQ) => {
    toggleBookmark(faq.id)
    toast.success(
      isBookmarked(faq.id) ? 'Bookmark removed' : 'FAQ bookmarked',
      { duration: 2000 }
    )
  }, [toggleBookmark, isBookmarked])

  // Handle FAQ view with analytics
  const handleFAQView = useCallback((faq: FAQ) => {
    trackFAQView(faq.id, faq.question)
  }, [trackFAQView])

  // Enhanced refresh
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([forceRefresh(), refetchFAQs()])
      toast.success('Help content refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh content')
    }
  }, [forceRefresh, refetchFAQs])

  // Navigation to admin panel
  const handleAdminNavigate = useCallback(() => {
    if (onNavigate && canManageContent) {
      onNavigate('admin-help')
    }
  }, [onNavigate, canManageContent])

  // Handle suggestion form
  const handleSuggestContent = useCallback(() => {
    if (canSuggestContent) {
      setShowSuggestionDialog(true)
    } else {
      toast.error('Only counselors and administrators can suggest content')
    }
  }, [canSuggestContent])

  const handleSubmitSuggestion = useCallback(async () => {
    if (!suggestionForm.category_id || !suggestionForm.question.trim() || !suggestionForm.answer.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await contentSuggestion.mutateAsync({
        category_id: parseInt(suggestionForm.category_id),
        question: suggestionForm.question.trim(),
        answer: suggestionForm.answer.trim(),
        tags: suggestionForm.tags
      })
      
      setShowSuggestionDialog(false)
      setSuggestionForm({
        category_id: "",
        question: "",
        answer: "",
        tags: []
      })
    } catch (error) {
      // Error handled by mutation
    }
  }, [suggestionForm, contentSuggestion])

  // Handle tag management for suggestions
  const handleAddTag = useCallback((tag: string) => {
    if (tag.trim() && !suggestionForm.tags.includes(tag.trim())) {
      setSuggestionForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }, [suggestionForm.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setSuggestionForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Loading skeleton for initial load
  if (dashboardLoading && !hasData) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8">
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
            
            {/* Role-Based Actions */}
            <div className="flex items-center space-x-3">
              {canSuggestContent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSuggestContent}
                  className="bg-white/20 hover:bg-white/30 border-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Suggest Content
                </Button>
              )}
              
              {canManageContent && (
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
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {dashboardLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_faqs || 0}
              </div>
              <div className="text-sm text-blue-100">FAQs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {dashboardLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : categories.length}
              </div>
              <div className="text-sm text-blue-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-blue-100">Support</div>
            </div>
          </div>

          {/* User Bookmarks Count (if any) */}
          {bookmarkedFAQs.length > 0 && (
            <div className="mt-4 bg-white/10 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-sm">You have {bookmarkedFAQs.length} bookmarked FAQ{bookmarkedFAQs.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
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

      {/* Quick Help Options */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="font-medium">Live Chat</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Phone className="h-7 w-7" />
          <span className="font-medium">Call Support</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Mail className="h-7 w-7" />
          <span className="font-medium">Email Us</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <BookOpen className="h-7 w-7" />
          <span className="font-medium">User Guide</span>
        </Button>
      </div>

      {/* Featured FAQs */}
      {featured.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <span>Featured FAQs</span>
                </CardTitle>
                <CardDescription>Most helpful questions answered by our team</CardDescription>
              </div>
              
              {/* Role-based badge for admins */}
              {canManageContent && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Admin View
                </Badge>
              )}
            </div>
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
                          <Star className={cn("h-4 w-4", isBookmarked(faq.id) && "fill-current")} />
                        </Button>
                      </div>
                      
                      <div onClick={() => handleFAQView(faq)}>
                        <h3 className="font-medium text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                          {faq.answer.substring(0, 150)}...
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">
                            {Math.round((faq.helpful_count / (faq.helpful_count + faq.not_helpful_count)) * 100) || 0}% helpful
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
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="faqs" className="rounded-lg font-medium">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="guides" className="rounded-lg font-medium">
            <BookOpen className="h-4 w-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg font-medium">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <Card className="border-0 shadow-lg lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Categories</span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
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
                    <span>All Categories</span>
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
                          className="w-3 h-3 rounded-full"
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

            {/* FAQs List */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Frequently Asked Questions</span>
                      {faqsData && (
                        <Badge variant="secondary">{faqsData.faqs.length} results</Badge>
                      )}
                      {faqsLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
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
                      
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {faqsLoading && !faqsData ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : faqsError ? (
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load FAQs</h3>
                      <p className="text-gray-600 mb-4">Please try again later</p>
                      <Button onClick={() => refetchFAQs()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : faqsData && faqsData.faqs.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqsData.faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id.toString()} className="border rounded-lg px-4">
                          <AccordionTrigger 
                            className="text-left hover:no-underline"
                            onClick={() => handleFAQView(faq)}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="flex items-start space-x-3">
                                <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium">{faq.question}</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {faq.is_featured && (
                                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                                    )}
                                    {faq.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {faq.category.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <div className="text-xs text-gray-500">
                                  {faq.view_count} views
                                </div>
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
                                  <Star className={cn("h-4 w-4", isBookmarked(faq.id) && "fill-current")} />
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-6">
                            <div className="space-y-4">
                              <div className="ml-8">
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                                </div>
                                
                                {/* FAQ Tags */}
                                {faq.tags && faq.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {faq.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {/* FAQ Feedback Component */}
                                <FAQFeedbackComponent 
                                  faq={faq}
                                  showStats={true}
                                  compact={false}
                                />
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
                      <p className="text-gray-600">Try adjusting your search or browse different categories</p>
                      {hasActiveFilters && (
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
              <CardDescription>Step-by-step guides to help you make the most of our platform</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Guides Coming Soon</h3>
                <p className="text-gray-600">We're working on comprehensive guides for you</p>
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
              <CardContent className="p-6 space-y-4">
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
              <CardContent className="p-6 space-y-3">
                <Button variant="outline" className="w-full justify-between h-auto p-4">
                  <div className="text-left">
                    <h4 className="font-medium">University IT Help Desk</h4>
                    <p className="text-sm text-gray-600">Technical support for university systems</p>
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
                    <p className="text-sm text-gray-600">Emergency services and safety resources</p>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Content Suggestion CTA for Counselors */}
      {canSuggestContent && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="max-w-md mx-auto">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Help Improve Our Content
              </h3>
              <p className="text-blue-700 mb-4">
                As a {user?.role}, you can suggest new FAQ content based on common student questions. 
                Your suggestions help make our help center more comprehensive.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSuggestContent}
                disabled={contentSuggestion.isPending}
              >
                {contentSuggestion.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Suggest FAQ Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Quick Actions */}
      {canManageContent && (
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-purple-900">Admin Controls</h3>
                  <p className="text-purple-700">Manage FAQs, categories, and view analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="border-purple-300 text-purple-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button 
                  onClick={handleAdminNavigate}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suggest FAQ Content</DialogTitle>
            <DialogDescription>
              Help improve our help center by suggesting new FAQ content based on common student questions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-category">Category *</Label>
              <Select 
                value={suggestionForm.category_id}
                onValueChange={(value) => setSuggestionForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories?.filter(cat => cat.is_active).map((category) => (
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
              <Label htmlFor="suggestion-question">Question *</Label>
              <Input
                id="suggestion-question"
                value={suggestionForm.question}
                onChange={(e) => setSuggestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What question do students frequently ask?"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {suggestionForm.question.length}/500 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion-answer">Answer *</Label>
              <Textarea
                id="suggestion-answer"
                value={suggestionForm.answer}
                onChange={(e) => setSuggestionForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide a comprehensive answer to help students..."
                className="min-h-[120px] resize-none"
                maxLength={5000}
              />
              <div className="text-xs text-gray-500 text-right">
                {suggestionForm.answer.length}/5000 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {suggestionForm.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800" 
                    onClick={() => handleRemoveTag(tag)}
                  >
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
              <div className="text-xs text-gray-500">
                Press Enter to add tags. Click on tags to remove them.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSuggestion} 
              disabled={contentSuggestion.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {contentSuggestion.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Submit Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}