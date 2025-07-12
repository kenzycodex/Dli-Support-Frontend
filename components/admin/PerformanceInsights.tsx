// components/admin/PerformanceInsights.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { TicketStats } from '@/types/tickets.types'

interface PerformanceInsightsProps {
  stats: TicketStats
  userRole?: string
}

export function PerformanceInsights({ stats, userRole }: PerformanceInsightsProps) {
  if (userRole !== 'admin') {
    return null
  }

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
  const assignmentRate = stats.total > 0 ? Math.round(((stats.total - stats.unassigned) / stats.total) * 100) : 0

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Resolution Rate</span>
              <span className="text-sm font-bold text-green-600">{resolutionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${resolutionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Assignment Rate</span>
              <span className="text-sm font-bold text-blue-600">{assignmentRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${assignmentRate}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Crisis Response</span>
              <span className={`text-sm font-bold ${stats.crisis > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.crisis === 0 ? 'All Clear' : `${stats.crisis} Active`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${stats.crisis > 0 ? 'bg-red-600' : 'bg-green-600'}`}
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Avg. Response Time:</span> 2.3 hours
            </div>
            <div>
              <span className="font-medium">Avg. Resolution Time:</span> 1.2 days
            </div>
            <div>
              <span className="font-medium">Customer Satisfaction:</span> 4.8/5.0
            </div>
            <div>
              <span className="font-medium">First Response Rate:</span> 94%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}