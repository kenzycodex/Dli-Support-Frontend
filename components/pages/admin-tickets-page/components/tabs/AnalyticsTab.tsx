// components/tabs/AnalyticsTab.tsx
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Activity } from "lucide-react"
import { TicketStats, CategoryStats } from "../../types/admin-types"

interface AnalyticsTabProps {
  ticketStats: TicketStats
  categoryStats: CategoryStats
}

export function AnalyticsTab({ ticketStats, categoryStats }: AnalyticsTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Ticket Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{ticketStats.total}</div>
                <div className="text-sm text-blue-700">Total Tickets</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
                <div className="text-sm text-green-700">Resolved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{ticketStats.crisis}</div>
                <div className="text-sm text-red-700">Crisis Cases</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{ticketStats.unassigned}</div>
                <div className="text-sm text-yellow-700">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Category Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{categoryStats.total}</div>
                <div className="text-sm text-indigo-700">Total Categories</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{categoryStats.active}</div>
                <div className="text-sm text-emerald-700">Active</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{categoryStats.with_auto_assign}</div>
                <div className="text-sm text-purple-700">Auto-assign</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{categoryStats.with_crisis_detection}</div>
                <div className="text-sm text-orange-700">Crisis Detection</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {ticketStats.total > 0 ? Math.round((ticketStats.resolved / ticketStats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-blue-700">Resolution Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-xl font-bold text-green-600">2.3h</div>
              <div className="text-sm text-green-700">Avg Response Time</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {ticketStats.total > 0 ? Math.round((ticketStats.auto_assigned / ticketStats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-purple-700">Auto-assignment Rate</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-xl font-bold text-orange-600">
                {ticketStats.total > 0 ? Math.round((ticketStats.crisis / ticketStats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-orange-700">Crisis Detection Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}