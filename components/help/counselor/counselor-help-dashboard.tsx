// components/help/counselor/counselor-help-dashboard.tsx
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  BookOpen, 
  Users, 
  MessageSquare,
  TrendingUp,
  Star,
  Clock,
  Eye,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Send,
  Edit
} from 'lucide-react'
import { 
  useHelpDashboard, 
  useContentSuggestion, 
  useHelpCategories, 
  useFAQs
} from '@/hooks/use-help'
import { StatsSkeleton } from '@/components/common/loading-skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import type { FAQ, HelpCategory } from '@/services/help.service'

interface CounselorHelpDashboardProps {
  onNavigate?: (page: string) => void
}

interface ContentSuggestionData {
  category_id: number
  question: string
  answer: string
  tags: string[]
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

export function CounselorHelpDashboard({ onNavigate }: CounselorHelpDashboardProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false)

  const { 
    categories, 
    featured, 
    popular, 
    stats, 
    canSuggestContent, 
    isLoading, 
    error, 
    refetch 
  } = useHelpDashboard()

  const contentSuggestionMutation = useContentSuggestion()

  if (isLoading) {
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">Unable to fetch help center data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Counselor Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600">Browse content and suggest improvements for students</p>
        </div>
        <div className="flex items-center space-x-3">
          {canSuggestContent && (
            <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggest Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Suggest FAQ Content</DialogTitle>
                  <DialogDescription>
                    Help improve our help center by suggesting new FAQ content based on common
                    student questions
                  </DialogDescription>
                </DialogHeader>
                <ContentSuggestionForm onClose={() => setShowSuggestionDialog(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Counselor Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available FAQs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_faqs || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Ready to share with students</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Helpful</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.most_helpful_faq
                    ? Math.round(
                        (stats.most_helpful_faq.helpful_count /
                          (stats.most_helpful_faq.helpful_count + 1)) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Average helpfulness rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Clock className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">Topics available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Counselors */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for counselors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setShowSuggestionDialog(true)}
            >
              <Lightbulb className="h-6 w-6" />
              <span>Suggest FAQ</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Eye className="h-6 w-6" />
              <span>Browse FAQs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Student Resources</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="browse">Browse FAQs</TabsTrigger>
          <TabsTrigger value="insights">Student Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Featured Content for Counselors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Featured FAQs</span>
                </CardTitle>
                <CardDescription>Top content to reference with students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featured.slice(0, 3).map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg"
                    >
                      <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{faq.question}</h4>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>{faq.view_count} views</span>
                          <span>
                            {Math.round(
                              (faq.helpful_count /
                                (faq.helpful_count + faq.not_helpful_count || 1)) *
                                100
                            )}
                            % helpful
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Most Popular</span>
                </CardTitle>
                <CardDescription>FAQs students access most frequently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popular.slice(0, 3).map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
                    >
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{faq.question}</h4>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>{faq.view_count} views</span>
                          <span>{faq.helpful_count} helpful votes</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Categories</CardTitle>
              <CardDescription>Browse help content by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.faqs_count || 0} FAQs</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse">
          <CounselorFAQBrowser />
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Student Insights</CardTitle>
              <CardDescription>Analytics and trends from student help center usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Insights coming soon</h3>
                <p className="text-gray-600">
                  We're working on providing detailed analytics about student help center usage.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Content Suggestion Form
function ContentSuggestionForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState<ContentSuggestionData>({
    category_id: 0,
    question: '',
    answer: '',
    tags: [],
  })

  const { data: categories } = useHelpCategories()
  const contentSuggestionMutation = useContentSuggestion()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await contentSuggestionMutation.mutateAsync(formData)
      onClose()
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category_id.toString()}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, category_id: parseInt(value) }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          value={formData.question}
          onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
          placeholder="What question do students frequently ask?"
          required
        />
      </div>

      <div>
        <Label htmlFor="answer">Suggested Answer *</Label>
        <Textarea
          value={formData.answer}
          onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
          placeholder="Provide a comprehensive answer that would help students..."
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          value={formData.tags.join(', ')}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              tags: e.target.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            }))
          }
          placeholder="e.g., stress, coping, anxiety"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={contentSuggestionMutation.isPending}>
          <Send className="h-4 w-4 mr-2" />
          {contentSuggestionMutation.isPending ? 'Submitting...' : 'Submit Suggestion'}
        </Button>
      </div>
    </form>
  )
}

// Counselor FAQ Browser Component
function CounselorFAQBrowser() {
  const { data: faqsData, isLoading } = useFAQs({ sort_by: 'helpful' })

  if (isLoading) {
    return <div>Loading FAQs...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browse All FAQs</CardTitle>
        <CardDescription>View and reference FAQ content for student support</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {faqsData?.faqs.map((faq: FAQ) => (
            <div key={faq.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3">{faq.answer}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>{faq.view_count} views</span>
                    <span>{faq.helpful_count} helpful</span>
                    <span>
                      {Math.round(
                        (faq.helpful_count / (faq.helpful_count + faq.not_helpful_count || 1)) * 100
                      )}
                      % helpful
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {faq.category && <Badge variant="outline">{faq.category.name}</Badge>}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}