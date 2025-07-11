// components/help/admin/admin-help-analytics.tsx
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { StatsSkeleton } from '@/components/common/loading-skeleton'
import { cn } from '@/lib/utils'

export function AdminHelpAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [metricType, setMetricType] = useState('overview')

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-help-analytics', timeRange, metricType],
    queryFn: async () => {
      // This would be replaced with actual API call
      // const response = await helpService.getAnalytics({ timeRange, metricType })
      // return response.data
      
      return {
        overview: {
          total_views: 15847,
          total_searches: 3291,
          avg_session_duration: '4m 32s',
          bounce_rate: 23.4,
          satisfaction_rate: 87.2,
          trends: {
            views: 12.5,
            searches: -3.2,
            satisfaction: 4.8
          }
        },
        top_faqs: [
          { id: 1, question: "How to reset my password?", views: 1247, helpful_rate: 94.2, category: "Account" },
          { id: 2, question: "Where to find my grades?", views: 986, helpful_rate: 89.1, category: "Academic" },
          { id: 3, question: "How to book an appointment?", views: 823, helpful_rate: 91.7, category: "Services" },
          { id: 4, question: "Campus WiFi setup", views: 756, helpful_rate: 85.3, category: "Technical" },
          { id: 5, question: "Library hours and access", views: 678, helpful_rate: 92.8, category: "Facilities" }
        ],
        search_analytics: {
          top_searches: [
            { query: "password reset", count: 342, results: 12 },
            { query: "grades portal", count: 298, results: 8 },
            { query: "wifi setup", count: 256, results: 15 },
            { query: "library hours", count: 234, results: 6 },
            { query: "appointment booking", count: 198, results: 9 }
          ],
          failed_searches: [
            { query: "cafeteria menu", count: 45, results: 0 },
            { query: "parking permits", count: 38, results: 1 },
            { query: "graduation requirements", count: 32, results: 2 }
          ]
        },
        user_behavior: {
          device_breakdown: {
            mobile: 52.3,
            desktop: 35.7,
            tablet: 12.0
          },
          time_distribution: {
            morning: 23.5,
            afternoon: 41.2,
            evening: 28.3,
            night: 7.0
          },
          category_preferences: [
            { category: "Academic", percentage: 34.2 },
            { category: "Technical", percentage: 28.7 },
            { category: "Services", percentage: 21.5 },
            { category: "Account", percentage: 15.6 }
          ]
        },
        performance_metrics: {
          avg_response_time: 245,
          uptime_percentage: 99.8,
          error_rate: 0.12,
          cache_hit_rate: 87.3
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPerformanceStatus = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold
    return isGood ? 'text-green-600' : 'text-red-600'
  }

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
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">Unable to fetch analytics data</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Help Center Analytics</h2>
          <p className="text-gray-600">Insights into user behavior and content performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview.total_views.toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              {getTrendIcon(analytics?.overview.trends.views || 0)}
              <span className={cn("ml-1", getTrendColor(analytics?.overview.trends.views || 0))}>
                {Math.abs(analytics?.overview.trends.views || 0)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Searches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview.total_searches.toLocaleString()}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              {getTrendIcon(analytics?.overview.trends.searches || 0)}
              <span className={cn("ml-1", getTrendColor(analytics?.overview.trends.searches || 0))}>
                {Math.abs(analytics?.overview.trends.searches || 0)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview.avg_session_duration}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Good engagement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview.bounce_rate}%
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Low bounce rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.overview.satisfaction_rate}%
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              {getTrendIcon(analytics?.overview.trends.satisfaction || 0)}
              <span className={cn("ml-1", getTrendColor(analytics?.overview.trends.satisfaction || 0))}>
                {Math.abs(analytics?.overview.trends.satisfaction || 0)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Top Performing FAQs</span>
          </CardTitle>
          <CardDescription>Most viewed and helpful content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.top_faqs.map((faq, index) => (
              <div key={faq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <h4 className="font-medium">{faq.question}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <Badge variant="outline">{faq.category}</Badge>
                      <span>{faq.views} views</span>
                      <span className="text-green-600">{faq.helpful_rate}% helpful</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Search Queries</CardTitle>
            <CardDescription>Most popular search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.search_analytics.top_searches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <span className="font-medium">"{search.query}"</span>
                    <div className="text-sm text-gray-500">
                      {search.count} searches • {search.results} results
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Searches</CardTitle>
            <CardDescription>Queries with poor results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.search_analytics.failed_searches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium">"{search.query}"</span>
                    <div className="text-sm text-gray-500">
                      {search.count} searches • {search.results} results
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <Button size="sm" variant="outline">
                      Create FAQ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.user_behavior.device_breakdown || {}).map(([device, percentage]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{device}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics?.user_behavior.time_distribution || {}).map(([period, percentage]) => (
                <div key={period} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.user_behavior.category_preferences.map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{cat.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-orange-600" />
            <span>System Performance</span>
          </CardTitle>
          <CardDescription>Technical performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {analytics?.performance_metrics.avg_response_time}ms
              </div>
              <div className="text-sm text-blue-700">Avg Response Time</div>
              <div className={cn("text-xs mt-1", getPerformanceStatus(analytics?.performance_metrics.avg_response_time || 0, 500, true))}>
                {analytics?.performance_metrics.avg_response_time && analytics.performance_metrics.avg_response_time < 500 ? 'Excellent' : 'Needs attention'}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics?.performance_metrics.uptime_percentage}%
              </div>
              <div className="text-sm text-green-700">Uptime</div>
              <div className="text-xs text-green-600 mt-1">Excellent</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {analytics?.performance_metrics.error_rate}%
              </div>
              <div className="text-sm text-red-700">Error Rate</div>
              <div className={cn("text-xs mt-1", getPerformanceStatus(analytics?.performance_metrics.error_rate || 0, 1, true))}>
                {analytics?.performance_metrics.error_rate && analytics.performance_metrics.error_rate < 1 ? 'Good' : 'High'}
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analytics?.performance_metrics.cache_hit_rate}%
              </div>
              <div className="text-sm text-purple-700">Cache Hit Rate</div>
              <div className={cn("text-xs mt-1", getPerformanceStatus(analytics?.performance_metrics.cache_hit_rate || 0, 80))}>
                {analytics?.performance_metrics.cache_hit_rate && analytics.performance_metrics.cache_hit_rate > 80 ? 'Good' : 'Low'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}