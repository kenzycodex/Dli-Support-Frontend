// components/dashboards/admin-dashboard.tsx (Fixed infinite loops and TypeScript errors)
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Settings,
  BarChart3,
  UserPlus,
  Ticket,
  RefreshCw,
  Loader2,
  Filter,
  Download,
  Search,
  Eye,
  Flag,
  Zap,
  MessageSquare,
  Calendar,
  Bell,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketStats, 
  useTicketLoading, 
  useTicketSelectors,
  TicketData 
} from "@/stores/ticket-store"

interface AdminDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
  onNavigate?: (page: string, params?: any) => void
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  systemUptime: number
  storageUsed: number
  responseTime: number
}

interface AlertItem {
  id: number
  type: string
  message: string
  severity: 'high' | 'medium' | 'low'
  time: string
  ticketId?: string
}

interface UserStat {
  role: string
  count: number
  change: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

interface StaffPerformance {
  name: string
  role: string
  cases: number
  resolved: number
  rating: number
  responseTime: string
}

export function AdminDashboard({ user, onNavigate }: AdminDashboardProps) {
  // Use ticket store instead of hooks
  const store = useTicketStore()
  const stats = useTicketStats()
  const loading = useTicketLoading('list')
  const selectors = useTicketSelectors()
  
  // Local state
  const [systemMetrics] = useState<SystemMetrics>({
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 156,
    systemUptime: 99.8,
    storageUsed: 67,
    responseTime: 245,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [isInitialized, setIsInitialized] = useState(false)

  // Memoized recent tickets to prevent re-renders
  const recentTickets = useMemo(() => {
    return selectors.tickets.slice(0, 8)
  }, [selectors.tickets])

  // FIXED: Proper initialization with dependency array
  useEffect(() => {
    let isMounted = true

    const initializeDashboard = async () => {
      if (isInitialized) return
      
      try {
        console.log("🎫 AdminDashboard: Initializing dashboard data")
        await store.actions.fetchTickets({ 
          page: 1, 
          per_page: 10,
          sort_by: 'updated_at',
          sort_direction: 'desc'
        })
        
        if (isMounted) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("❌ AdminDashboard: Failed to initialize:", error)
      }
    }

    initializeDashboard()

    return () => {
      isMounted = false
    }
  }, [store.actions, isInitialized]) // FIXED: Added proper dependencies

  // Memoized alert data
  const recentAlerts: AlertItem[] = useMemo(() => [
    {
      id: 1,
      type: "High Priority Ticket",
      message: "Crisis ticket #T00512 requires immediate attention",
      severity: "high",
      time: "15 min ago",
      ticketId: "T00512"
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
      type: "Unassigned Tickets",
      message: "5 tickets remain unassigned for over 2 hours",
      severity: "medium",
      time: "2 hours ago",
    },
    {
      id: 4,
      type: "User Activity",
      message: "New counselor registered - Dr. Emily Watson",
      severity: "low",
      time: "3 hours ago",
    },
  ], [])

  const userStats: UserStat[] = useMemo(() => [
    { role: "Students", count: 1089, change: "+12", color: "blue" },
    { role: "Counselors", count: 45, change: "+2", color: "green" },
    { role: "Advisors", count: 23, change: "0", color: "purple" },
    { role: "Admins", count: 8, change: "0", color: "orange" },
  ], [])

  const staffPerformance: StaffPerformance[] = useMemo(() => [
    { name: "Dr. Sarah Wilson", role: "Counselor", cases: 28, resolved: 24, rating: 4.9, responseTime: "1.2h" },
    { name: "Prof. Michael Chen", role: "Advisor", cases: 35, resolved: 32, rating: 4.7, responseTime: "2.1h" },
    { name: "Dr. Emily Rodriguez", role: "Counselor", cases: 22, resolved: 20, rating: 4.8, responseTime: "1.5h" },
    { name: "Dr. James Park", role: "Advisor", cases: 30, resolved: 28, rating: 4.6, responseTime: "2.8h" },
  ], [])

  // FIXED: Proper utility functions with useCallback
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }, [])

  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse"
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }, [])

  const getSeverityIcon = useCallback((severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case "high":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  // FIXED: Navigation handler with proper error handling
  const handleNavigateToPage = useCallback((page: string, params?: any): void => {
    try {
      console.log("🎫 AdminDashboard: Navigating to:", page, params)
      if (onNavigate) {
        onNavigate(page, params)
      }
    } catch (error) {
      console.error("❌ AdminDashboard: Navigation error:", error)
    }
  }, [onNavigate])

  // FIXED: Refresh handler with proper error handling
  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      console.log("🎫 AdminDashboard: Refreshing dashboard")
      await store.actions.fetchTickets({ 
        page: 1, 
        per_page: 10,
        sort_by: 'updated_at',
        sort_direction: 'desc'
      })
    } catch (error) {
      console.error("❌ AdminDashboard: Refresh failed:", error)
    }
  }, [store.actions])

  // Memoized filtered tickets to prevent unnecessary calculations
  const unassignedTickets = useMemo(() => 
    recentTickets.filter(ticket => !ticket.assigned_to), 
    [recentTickets]
  )
  
  const crisisTickets = useMemo(() => 
    recentTickets.filter(ticket => ticket.crisis_flag || ticket.priority === "Urgent"), 
    [recentTickets]
  )

  // Show loading state during initialization
  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching system data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Shield className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">System Administration</h1>
              <p className="text-purple-100 text-lg mb-6">Monitor and manage your support platform</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshDashboard}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{systemMetrics.systemUptime}%</div>
                  <div className="text-sm text-purple-100">System Uptime</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{systemMetrics.activeUsers}</div>
                  <div className="text-sm text-purple-100">Active Users</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{stats.total || 0}</div>
                  <div className="text-sm text-purple-100">Total Tickets</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{crisisTickets.length}</div>
                  <div className="text-sm text-purple-100">Crisis Cases</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {(crisisTickets.length > 0 || unassignedTickets.length > 0) && (
        <div className="space-y-4">
          {crisisTickets.length > 0 && (
            <Card className="border-red-200 bg-red-50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-500 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">🚨 Crisis Cases Require Immediate Attention</h3>
                    <p className="text-red-700">{crisisTickets.length} crisis ticket(s) need urgent assignment and response.</p>
                  </div>
                  <Button
                    onClick={() => handleNavigateToPage('tickets')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Manage Crisis Cases
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {unassignedTickets.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-1">⚠️ Unassigned Tickets</h3>
                    <p className="text-orange-700">{unassignedTickets.length} ticket(s) waiting for staff assignment.</p>
                  </div>
                  <Button
                    onClick={() => handleNavigateToPage('tickets')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Assign Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Metrics */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Sessions</span>
                    <span>{systemMetrics.totalSessions}</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {userStats.map((stat) => (
                    <div key={stat.role} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{stat.role}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{stat.count}</span>
                        <Badge 
                          variant={stat.change.startsWith("+") ? "default" : "secondary"} 
                          className={`text-xs ${stat.change.startsWith("+") ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleNavigateToPage('admin-users')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent System Alerts */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Recent System Alerts</span>
                <Badge variant="destructive">{recentAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <p className="font-medium">{alert.type}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          alert.severity === "high" ? "destructive" : 
                          alert.severity === "medium" ? "default" : "secondary"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      {alert.ticketId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateToPage('ticket-details', { ticketId: alert.ticketId })}
                        >
                          View
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {/* Ticket Management Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.total || 0}</p>
                    <p className="text-sm text-blue-600">Total Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold text-amber-900">{unassignedTickets.length}</p>
                    <p className="text-sm text-amber-600">Unassigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">{crisisTickets.length}</p>
                    <p className="text-sm text-red-600">Crisis Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.resolved || 0}</p>
                    <p className="text-sm text-green-600">Resolved Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5" />
                  <span>Recent Tickets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateToPage('tickets')}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">Loading tickets...</span>
                </div>
              ) : recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-xs font-mono text-blue-600">#{ticket.ticket_number}</span>
                          {ticket.crisis_flag && <Flag className="h-3 w-3 text-red-600 animate-pulse" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium truncate max-w-64">{ticket.subject}</p>
                            {ticket.crisis_flag && (
                              <Badge variant="destructive" className="animate-pulse">CRISIS</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                              {ticket.category}
                            </Badge>
                            <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-xs`}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(ticket.status)} text-xs`}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ticket.user?.name} • {formatDate(ticket.updated_at)}
                            {ticket.assignedTo && <span> • Assigned to {ticket.assignedTo.name}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!ticket.assigned_to && (
                          <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
                            Assign
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-600">All tickets are up to date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Button
              onClick={() => handleNavigateToPage('admin-users')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Manage All Users
              </Button>
          </div>

          {/* User Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userStats.map((stat, index) => (
                    <div key={stat.role} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stat.color === 'blue' ? 'bg-blue-500' :
                          stat.color === 'green' ? 'bg-green-500' :
                          stat.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="font-medium">{stat.role}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{stat.count}</span>
                        <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"}>
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigateToPage('admin-users')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigateToPage('admin-users')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigateToPage('admin-users')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigateToPage('admin-settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  User Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Staff Performance */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Staff Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {staffPerformance.map((staff, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{staff.name}</h4>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold">{staff.cases}</p>
                          <p className="text-gray-600">Cases</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{staff.resolved}</p>
                          <p className="text-gray-600">Resolved</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{staff.rating}</p>
                          <p className="text-gray-600">Rating</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{staff.responseTime}</p>
                          <p className="text-gray-600">Response</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(staff.resolved / staff.cases) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleNavigateToPage('admin-reports')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-lg font-bold">{systemMetrics.responseTime}ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Best: 180ms</p>
                      <p className="text-gray-600">Worst: 450ms</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Target: 200ms</p>
                      <p className="text-gray-600">Threshold: 500ms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Resolution Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Resolution Time</span>
                    <span className="text-lg font-bold">4.2 hours</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Same Day: 78%</p>
                      <p className="text-gray-600">Next Day: 95%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Target: 4h</p>
                      <p className="text-gray-600">SLA: 24h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
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

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{systemMetrics.activeUsers}</p>
                    <p className="text-sm text-gray-600">Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{systemMetrics.storageUsed}%</p>
                    <p className="text-sm text-gray-600">Storage Used</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{systemMetrics.responseTime}ms</p>
                    <p className="text-sm text-gray-600">Response Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Resources Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Server Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Usage</span>
                    <span>42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Usage</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Disk I/O</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Network Usage</span>
                    <span>15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Database Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection Pool</span>
                  <Badge variant="secondary">Healthy</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Connections</span>
                    <span>45/100</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Query Performance</span>
                    <span>Good</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm text-gray-600">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Actions */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleNavigateToPage('admin-settings')}
                >
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">System Settings</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                >
                  <Database className="h-6 w-6" />
                  <span className="text-sm">Database Backup</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">Security Logs</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleNavigateToPage('admin-reports')}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Generate Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Bar */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage('admin-users')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage('tickets')}
              >
                <Search className="h-4 w-4 mr-2" />
                Search Tickets
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage('admin-reports')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage('admin-settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}