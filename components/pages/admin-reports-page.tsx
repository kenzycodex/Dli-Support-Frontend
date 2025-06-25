"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Ticket,
  Heart,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart,
} from "lucide-react"

interface AdminReportsPageProps {
  onNavigate?: (page: string) => void
}

export function AdminReportsPage({ onNavigate }: AdminReportsPageProps) {
  const systemMetrics = {
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 156,
    completedTickets: 89,
    avgResponseTime: "2.3 hours",
    satisfactionRate: 94.5,
  }

  const weeklyStats = [
    { name: "New Users", value: 45, change: 12, trend: "up" },
    { name: "Sessions", value: 234, change: -8, trend: "down" },
    { name: "Tickets", value: 67, change: 15, trend: "up" },
    { name: "Satisfaction", value: 4.8, change: 0.2, trend: "up" },
  ]

  const counselorPerformance = [
    { name: "Dr. Sarah Wilson", sessions: 45, rating: 4.9, responseTime: "1.2h" },
    { name: "Dr. Michael Chen", sessions: 38, rating: 4.8, responseTime: "1.8h" },
    { name: "Dr. Emily Rodriguez", sessions: 42, rating: 4.9, responseTime: "1.5h" },
  ]

  const ticketCategories = [
    { category: "Technical", count: 45, percentage: 35 },
    { category: "Mental Health", count: 38, percentage: 30 },
    { category: "Academic", count: 25, percentage: 20 },
    { category: "Administrative", count: 19, percentage: 15 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BarChart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Analytics & Reports</h1>
              <p className="text-emerald-100 text-lg">Comprehensive insights and performance metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemMetrics.totalSessions}</div>
              <div className="text-sm text-emerald-100">Total Sessions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemMetrics.activeUsers}</div>
              <div className="text-sm text-emerald-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemMetrics.avgResponseTime}</div>
              <div className="text-sm text-emerald-100">Avg Response</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{systemMetrics.satisfactionRate}%</div>
              <div className="text-sm text-emerald-100">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg font-medium">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-medium">
            Users
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-lg font-medium">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="tickets" className="rounded-lg font-medium">
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Performance */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Weekly Performance</span>
                </CardTitle>
                <CardDescription>Key metrics compared to last week</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {weeklyStats.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{stat.name}</div>
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <Badge
                        variant={stat.trend === "up" ? "default" : "destructive"}
                        className={
                          stat.trend === "up"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }
                      >
                        {stat.trend === "up" ? "+" : ""}
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Counselor Performance */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  <span>Counselor Performance</span>
                </CardTitle>
                <CardDescription>Top performing counselors this week</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {counselorPerformance.map((counselor, index) => (
                  <div
                    key={counselor.name}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{counselor.name}</div>
                        <div className="text-sm text-slate-600">{counselor.sessions} sessions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-sm font-medium">⭐ {counselor.rating}</span>
                      </div>
                      <div className="text-xs text-slate-500">{counselor.responseTime} avg</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Support Ticket Categories */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-violet-600" />
                <span>Support Ticket Categories</span>
              </CardTitle>
              <CardDescription>Distribution of support requests by category</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {ticketCategories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{category.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">{category.count} tickets</span>
                        <Badge variant="outline">{category.percentage}%</Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>User Growth</span>
                </CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="text-3xl font-bold text-slate-800 mb-2">+{weeklyStats[0].value}</div>
                  <div className="text-slate-600">New users this week</div>
                  <div className="mt-4">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <TrendingUp className="h-3 w-3 mr-1" />+{weeklyStats[0].change}% from last week
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>Active Users</span>
                </CardTitle>
                <CardDescription>Currently active user sessions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="text-3xl font-bold text-slate-800 mb-2">{systemMetrics.activeUsers}</div>
                  <div className="text-slate-600">Active users</div>
                  <div className="mt-4">
                    <Progress value={71} className="h-2" />
                    <div className="text-sm text-slate-500 mt-2">71% of total users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-violet-600" />
                  <span>Engagement</span>
                </CardTitle>
                <CardDescription>Average session duration</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="text-3xl font-bold text-slate-800 mb-2">24m</div>
                  <div className="text-slate-600">Avg session time</div>
                  <div className="mt-4">
                    <Badge className="bg-violet-100 text-violet-700 border-violet-200">High engagement</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-rose-600" />
                <span>Session Analytics</span>
              </CardTitle>
              <CardDescription>Counseling session metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-rose-50 rounded-xl">
                  <div className="text-2xl font-bold text-rose-600">{systemMetrics.totalSessions}</div>
                  <div className="text-sm text-slate-600">Total Sessions</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">142</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">14</div>
                  <div className="text-sm text-slate-600">Scheduled</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">45m</div>
                  <div className="text-sm text-slate-600">Avg Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Ticket Status</span>
                </CardTitle>
                <CardDescription>Current support ticket distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium text-emerald-800">Resolved</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">89</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-800">In Progress</span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">23</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="font-medium text-amber-800">Open</span>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">15</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  <span>Response Times</span>
                </CardTitle>
                <CardDescription>Average response time by priority</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">High Priority</span>
                    <span className="text-red-600 font-bold">30 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Medium Priority</span>
                    <span className="text-amber-600 font-bold">2.3 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Low Priority</span>
                    <span className="text-emerald-600 font-bold">8.5 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
