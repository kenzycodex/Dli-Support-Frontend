// components/dashboards/admin-dashboard.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Server,
  Database,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface AdminDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const systemMetrics = {
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 156,
    systemUptime: 99.8,
    storageUsed: 67,
    responseTime: 245,
  }

  const recentAlerts = [
    {
      id: 1,
      type: "High Priority Ticket",
      message: "Unresolved ticket #T005 for 48+ hours",
      severity: "high",
      time: "15 min ago",
    },
    {
      id: 2,
      type: "System Performance",
      message: "Database response time increased by 15%",
      severity: "medium",
      time: "1 hour ago",
    },
    {
      id: 3,
      type: "User Activity",
      message: "Unusual login pattern detected",
      severity: "low",
      time: "3 hours ago",
    },
  ]

  const userStats = [
    { role: "Students", count: 1089, change: "+12" },
    { role: "Counselors", count: 45, change: "+2" },
    { role: "Advisors", count: 23, change: "0" },
    { role: "Admins", count: 8, change: "0" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">System Overview</h1>
        <p className="text-purple-100 mt-1">Monitor and manage your support platform</p>
      </div>

      {/* System Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{systemMetrics.systemUptime}%</p>
                <p className="text-sm text-gray-600">System Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{systemMetrics.activeUsers}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{systemMetrics.responseTime}ms</p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>System Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Storage Usage</span>
                <span>{systemMetrics.storageUsed}%</span>
              </div>
              <Progress value={systemMetrics.storageUsed} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Database Load</span>
                <span>34%</span>
              </div>
              <Progress value={34} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>API Rate Limit</span>
                <span>12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.map((stat) => (
                <div key={stat.role} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.role}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{stat.count}</span>
                    <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Recent Alerts</span>
            <Badge variant="destructive">{recentAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {alert.severity === "high" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : alert.severity === "medium" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      alert.severity === "high" ? "destructive" : alert.severity === "medium" ? "default" : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="h-20 flex-col space-y-2" variant="outline">
          <Users className="h-6 w-6" />
          <span className="text-sm">Manage Users</span>
        </Button>
        <Button className="h-20 flex-col space-y-2" variant="outline">
          <Database className="h-6 w-6" />
          <span className="text-sm">Database Backup</span>
        </Button>
        <Button className="h-20 flex-col space-y-2" variant="outline">
          <Shield className="h-6 w-6" />
          <span className="text-sm">Security Logs</span>
        </Button>
        <Button className="h-20 flex-col space-y-2" variant="outline">
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm">Generate Report</span>
        </Button>
      </div>
    </div>
  )
}
