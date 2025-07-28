// components/dashboards/counselor-dashboard.tsx (FIXED - Category display issue)
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Users,
  Star,
  Video,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  RefreshCw,
  Loader2,
  Eye,
  Filter,
  ArrowRight,
  Flag,
  UserCheck,
  MessageCircle,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketStats, 
  useTicketLoading, 
  useTicketSelectors,
  TicketData 
} from "@/stores/ticket-store"

interface CounselorDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
  onNavigate?: (page: string, params?: any) => void
}

interface SessionData {
  id: number
  student: string
  time: string
  type: "Video" | "Chat" | "Phone"
  status: "upcoming" | "completed"
  isAnonymous: boolean
  canStart?: boolean
  intakeFormSubmitted?: boolean
  lastSession?: string
  priority: "Low" | "Medium" | "High"
  needsFollowUp?: boolean
  sessionNotes?: boolean
}

interface PersonalAnalytics {
  sessionsThisWeek: number
  averageRating: number
  responseTime: string
  studentsHelped: number
  followUpsNeeded: number
  highPriorityTickets: number
  crisisTickets: number
}

export function CounselorDashboard({ user, onNavigate }: CounselorDashboardProps) {
  // FIXED: Use store state directly instead of hooks to prevent loading loops
  const store = useTicketStore()
  const stats = useTicketStats()
  const loading = useTicketLoading('list')
  const selectors = useTicketSelectors()
  
  // Local state
  const [activeTab, setActiveTab] = useState("overview")
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasData, setHasData] = useState(false)
  const initRef = useRef(false)

  // Memoized assigned tickets to prevent re-renders
  const assignedTickets = useMemo(() => {
    return selectors.myAssignedTickets
  }, [selectors.myAssignedTickets])

  // FIXED: Smart initialization that doesn't always show loading (same as AdminDashboard)
  useEffect(() => {
    let isMounted = true

    const initializeDashboard = async () => {
      // FIXED: Check if we already have recent data
      const hasRecentData = store.tickets.length > 0 && 
        Date.now() - store.lastFetch < 300000 // 5 minute cache

      if (hasRecentData) {
        console.log("🎫 CounselorDashboard: Using cached data")
        if (isMounted) {
          setIsInitialized(true)
          setHasData(true)
        }
        return
      }

      // Only fetch if we don't have recent data
      if (initRef.current || isInitialized) return
      
      initRef.current = true
      
      try {
        console.log("🎫 CounselorDashboard: Initializing dashboard data")
        
        // Only fetch if we don't have tickets or data is stale
        if (store.tickets.length === 0 || Date.now() - store.lastFetch > 60000) {
          await store.actions.fetchTickets({ 
            page: 1, 
            per_page: 10,
            sort_by: 'updated_at',
            sort_direction: 'desc'
          })
        }
        
        if (isMounted) {
          setIsInitialized(true)
          setHasData(true)
        }
      } catch (error) {
        console.error("❌ CounselorDashboard: Failed to initialize:", error)
        if (isMounted) {
          setIsInitialized(true)
          setHasData(false)
        }
      }
    }

    initializeDashboard()

    return () => {
      isMounted = false
    }
  }, [store.actions, store.tickets.length, store.lastFetch, isInitialized])

  // Sample data for counselor-specific features - FIXED: Memoized
  const todaySessions: SessionData[] = useMemo(() => [
    {
      id: 1,
      student: "Alex J.",
      time: "9:00 AM",
      type: "Video",
      status: "upcoming",
      isAnonymous: false,
      canStart: true,
      intakeFormSubmitted: true,
      lastSession: "2024-01-10",
      priority: "Medium"
    },
    {
      id: 2,
      student: "Anonymous",
      time: "10:30 AM",
      type: "Chat",
      status: "upcoming",
      isAnonymous: true,
      canStart: false,
      intakeFormSubmitted: false,
      priority: "High"
    },
    {
      id: 3,
      student: "Sarah M.",
      time: "2:00 PM",
      type: "Video",
      status: "completed",
      isAnonymous: false,
      needsFollowUp: true,
      sessionNotes: false,
      priority: "Low"
    },
  ], [])

  const personalAnalytics: PersonalAnalytics = useMemo(() => ({
    sessionsThisWeek: 18,
    averageRating: 4.8,
    responseTime: "2.3 hours",
    studentsHelped: 15,
    followUpsNeeded: 3,
    highPriorityTickets: stats.high_priority || 1,
    crisisTickets: stats.crisis || 0,
  }), [stats.high_priority, stats.crisis])

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

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "In Progress":
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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

  // FIXED: Safe category name getter
  const getCategoryName = useCallback((ticket: TicketData): string => {
    // Handle both old string format and new category object format
    if (typeof ticket.category === 'string') {
      return ticket.category
    }
    if (ticket.category && typeof ticket.category === 'object' && ticket.category.name) {
      return ticket.category.name
    }
    return 'General' // Fallback
  }, [])

  // FIXED: Navigation handler with proper error handling
  const handleNavigateToPage = useCallback((page: string, params?: any): void => {
    try {
      console.log("🎫 CounselorDashboard: Navigating to:", page, params)
      if (onNavigate) {
        onNavigate(page, params)
      }
    } catch (error) {
      console.error("❌ CounselorDashboard: Navigation error:", error)
    }
  }, [onNavigate])

  // FIXED: Refresh handler with proper error handling
  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      console.log("🎫 CounselorDashboard: Refreshing dashboard")
      await store.actions.fetchTickets({ 
        page: 1, 
        per_page: 10,
        sort_by: 'updated_at',
        sort_direction: 'desc'
      })
    } catch (error) {
      console.error("❌ CounselorDashboard: Refresh failed:", error)
    }
  }, [store.actions])

  // Memoized filtered tickets to prevent unnecessary calculations
  const crisisTickets = useMemo(() => 
    assignedTickets.filter(ticket => ticket.crisis_flag || ticket.priority === "Urgent"), 
    [assignedTickets]
  )
  
  const urgentTickets = useMemo(() => 
    assignedTickets.filter(ticket => ticket.priority === "High" && !ticket.crisis_flag), 
    [assignedTickets]
  )
  
  const recentTickets = useMemo(() => 
    assignedTickets.slice(0, 5), 
    [assignedTickets]
  )

  // FIXED: Only show loading for initial load, not for refresh or cached data
  if (!isInitialized && !hasData && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching your cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Heart className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Good morning, {user.name.split(" ")[0]}! 🌟</h1>
              <p className="text-green-100 text-lg mb-6">You have {assignedTickets.filter(t => t.status === "Open" || t.status === "In Progress").length} active cases and {todaySessions.filter(s => s.status === "upcoming").length} sessions today</p>
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
                <Shield className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{assignedTickets.length}</div>
                  <div className="text-sm text-green-100">Total Cases</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{crisisTickets.length}</div>
                  <div className="text-sm text-green-100">Crisis Cases</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{personalAnalytics.averageRating}</div>
                  <div className="text-sm text-green-100">Avg Rating</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <div>
                  <div className="text-2xl font-bold">{personalAnalytics.responseTime}</div>
                  <div className="text-sm text-green-100">Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Alert Banner */}
      {crisisTickets.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500 rounded-full">
                <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">🚨 Crisis Cases Require Immediate Attention</h3>
                <p className="text-red-700">You have {crisisTickets.length} crisis ticket(s) that need urgent response.</p>
              </div>
              <Button
                onClick={() => handleNavigateToPage('tickets')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                View Crisis Cases
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{personalAnalytics.sessionsThisWeek}</p>
                <p className="text-sm text-gray-600">Sessions this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{personalAnalytics.averageRating}</p>
                <p className="text-sm text-gray-600">Average rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{personalAnalytics.responseTime}</p>
                <p className="text-sm text-gray-600">Avg response time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{personalAnalytics.studentsHelped}</p>
                <p className="text-sm text-gray-600">Students helped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Today's Sessions</TabsTrigger>
          <TabsTrigger value="tickets">My Cases</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Tickets Overview */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Recent Cases</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateToPage('tickets')}
                    className="hover:bg-blue-50"
                  >
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {loading && recentTickets.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading cases...</span>
                  </div>
                ) : recentTickets.length > 0 ? (
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-center space-y-1">
                            {getStatusIcon(ticket.status)}
                            <span className="text-xs font-mono text-blue-600">#{ticket.ticket_number}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium truncate max-w-48">{ticket.subject}</p>
                              {ticket.crisis_flag && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  <Flag className="h-3 w-3 mr-1" />
                                  CRISIS
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* FIXED: Safe category name display */}
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                {getCategoryName(ticket)}
                              </Badge>
                              <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-xs`}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {ticket.user?.name} • {formatDate(ticket.updated_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned cases</h3>
                    <p className="text-gray-600">New cases will appear here when assigned to you</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Your impact this week</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sessions Goal</span>
                    <span>18/20</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Response Time Goal</span>
                    <span>2.3/4.0 hours</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Student Satisfaction</span>
                    <span>4.8/5.0</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Cases Resolved</span>
                    <span>{stats.resolved || 0}/{stats.total || 0}</span>
                  </div>
                  <Progress value={(stats.total || 0) > 0 ? ((stats.resolved || 0) / (stats.total || 0)) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Today's Sessions</span>
                <Badge variant="secondary">{todaySessions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {session.type === "Video" ? (
                        <Video className="h-5 w-5 text-blue-600" />
                      ) : session.type === "Phone" ? (
                        <Phone className="h-5 w-5 text-green-600" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{session.student}</p>
                          {session.isAnonymous && <Badge variant="secondary">Anonymous</Badge>}
                          <Badge variant="outline" className={getPriorityColor(session.priority)}>
                            {session.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{session.time}</p>
                        {session.lastSession && (
                          <p className="text-xs text-gray-500">Last session: {session.lastSession}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.status === "completed" ? (
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          {session.needsFollowUp && (
                            <Button size="sm" variant="secondary">
                              Follow Up
                            </Button>
                          )}
                          {session.sessionNotes === false && <Button size="sm">Add Notes</Button>}
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          {!session.intakeFormSubmitted && (
                            <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">
                              Intake Pending
                            </Badge>
                          )}
                          <Button size="sm" disabled={!session.canStart}>
                            {session.canStart ? "Start Session" : "5 min early"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Assigned Cases</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDashboard}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage('tickets')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>

          {/* Crisis and Urgent Tickets */}
          {(crisisTickets.length > 0 || urgentTickets.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {crisisTickets.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-900 flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Crisis Cases ({crisisTickets.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {crisisTickets.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-white rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">#{ticket.ticket_number}</p>
                              <p className="text-xs text-gray-600 truncate max-w-32">{ticket.subject}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                            >
                              Respond Now
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {urgentTickets.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                  <CardTitle className="text-orange-900 flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>High Priority ({urgentTickets.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {urgentTickets.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="p-3 bg-white rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">#{ticket.ticket_number}</p>
                              <p className="text-xs text-gray-600 truncate max-w-32">{ticket.subject}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* All Assigned Tickets */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>All Assigned Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && assignedTickets.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">Loading your cases...</span>
                </div>
              ) : assignedTickets.length > 0 ? (
                <div className="space-y-4">
                  {assignedTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center space-y-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-xs font-mono text-blue-600">#{ticket.ticket_number}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">{ticket.subject}</p>
                            {ticket.crisis_flag && (
                              <Badge variant="destructive" className="animate-pulse">
                                <Flag className="h-3 w-3 mr-1" />
                                CRISIS
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            {/* FIXED: Safe category name display */}
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                              {getCategoryName(ticket)}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {ticket.user?.name} • {formatDate(ticket.updated_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {ticket.response_count && ticket.response_count > 0 && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{ticket.response_count}</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned cases</h3>
                  <p className="text-gray-600">New cases will be assigned to you automatically based on your specialization</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Your key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions This Week</p>
                    <p className="text-2xl font-bold">{personalAnalytics.sessionsThisWeek}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{personalAnalytics.averageRating}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold">{personalAnalytics.responseTime}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Students Helped</p>
                    <p className="text-2xl font-bold">{personalAnalytics.studentsHelped}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Follow-ups Needed</p>
                    <p className="text-2xl font-bold">{personalAnalytics.followUpsNeeded}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crisis Cases Handled</p>
                    <p className="text-2xl font-bold">{personalAnalytics.crisisTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Distribution */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Case Distribution</CardTitle>
                <CardDescription>Breakdown of your assigned cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mental Health</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Crisis Support</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">General Support</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">10%</span>
                    </div>
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