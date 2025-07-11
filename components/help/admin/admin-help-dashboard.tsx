// components/help/admin/admin-help-dashboard.tsx
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Users, 
  MessageSquare,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { AdminFAQManager } from './admin-faq-manager'
import { AdminCategoryManager } from './admin-category-manager'
import { AdminHelpAnalytics } from './admin-help-analytics'
import { useHelpDashboard } from '@/hooks/use-help'
import { StatsSkeleton } from '@/components/common/loading-skeleton'

interface AdminHelpDashboardProps {
  onNavigate?: (page: string) => void
}

export function AdminHelpDashboard({ onNavigate }: AdminHelpDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  
  const {
    categories,
    featured,
    popular,
    stats,
    isLoading,
    error,
    refetch
  } = useHelpDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <p className="text-gray-600 mb-4">Unable to fetch help system data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center Administration</h1>
          <p className="text-gray-600">Manage FAQs, categories, and help content</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refetch()}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create FAQ
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total FAQs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_faqs || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Active content</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_categories || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">{categories.filter(c => c.is_active).length} active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.recent_faqs?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-600">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Helpfulness</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.most_helpful_faq ? 
                    Math.round((stats.most_helpful_faq.helpful_count / (stats.most_helpful_faq.helpful_count + 1)) * 100) : 0}%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Excellent rating</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Create FAQ</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>Manage Categories</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Content Suggestions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faqs">Manage FAQs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent FAQs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recent_faqs?.slice(0, 5).map((faq) => (
                    <div key={faq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{faq.question}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(faq.published_at || faq.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={faq.is_published ? "default" : "secondary"}>
                          {faq.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Performing Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popular.slice(0, 5).map((faq) => (
                    <div key={faq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{faq.question}</h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{faq.view_count} views</span>
                          <span>{faq.helpful_count} helpful</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {faq.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Categories Overview</CardTitle>
              <CardDescription>Active help categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 border rounded-lg hover:bg-gray-50">
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

        <TabsContent value="faqs">
          <AdminFAQManager />
        </TabsContent>

        <TabsContent value="categories">
          <AdminCategoryManager />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminHelpAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}