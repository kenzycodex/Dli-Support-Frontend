// components/admin-help/tabs/AnalyticsTab.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  CheckCircle,
  Star,
  MessageSquare,
  Activity,
  Settings,
  Calendar,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory } from "@/services/help.service"
import { AdminStats } from "@/types/admin-help"

interface AnalyticsTabProps {
  faqs: HelpFAQ[]
  categories: HelpCategory[]
  adminStats: AdminStats
}

export function AnalyticsTab({
  faqs,
  categories,
  adminStats
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{adminStats.total_faqs}</div>
                <div className="text-sm text-gray-600">Total FAQs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{adminStats.published_faqs}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{adminStats.featured_faqs}</div>
                <div className="text-sm text-gray-600">Featured</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{adminStats.suggested_faqs}</div>
                <div className="text-sm text-gray-600">Suggestions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>FAQ Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {faqs.slice(0, 5).map((faq: HelpFAQ) => (
                <div key={faq.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm line-clamp-1">{faq.question}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {Math.round((faq.helpful_count / Math.max(faq.helpful_count + faq.not_helpful_count, 1)) * 100) || 0}%
                    </div>
                    <div className="text-xs text-gray-500">helpful</div>
                  </div>
                </div>
              ))}
              {faqs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <div>No FAQ data available</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>Category Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {categories.slice(0, 5).map((category: HelpCategory) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.faqs_count || 0} FAQs
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <div>No category data available</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {faqs.slice(0, 5).map((faq: HelpFAQ) => (
              <div key={faq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    faq.is_published ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  <div>
                    <div className="font-medium text-sm">{faq.question}</div>
                    <div className="text-xs text-gray-500">
                      {faq.is_published ? 'Published' : (faq.created_by ? 'Suggested' : 'Draft')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(faq.updated_at || faq.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <div>No recent activity</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}