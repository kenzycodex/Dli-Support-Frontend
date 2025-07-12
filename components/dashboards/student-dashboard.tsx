// components/dashboards/student-dashboard.tsx (FIXED - Smart initialization + NaN error)
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Ticket,
  Video,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Heart,
  BookOpen,
  Headphones,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketStats, 
  useTicketLoading, 
  useTicketSelectors,
  TicketData 
} from "@/stores/ticket-store"

interface StudentDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
  onNavigate?: (page: string, params?: any) => void
}

interface AppointmentData {
  id: number
  type: string
  counselor: string
  date: string
  time: string
  status: string
  canJoin: boolean
}

interface SelfHelpResource {
  title: string
  type: string
  duration: string
  icon: any
  color: string
}

export function StudentDashboard({ user, onNavigate }: StudentDashboardProps) {
  // FIXED: Use store state directly instead of hooks to prevent loading loops
  const store = useTicketStore()
  const stats = useTicketStats()
  const loading = useTicketLoading('list')
  const selectors = useTicketSelectors()
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasData, setHasData] = useState(false)
  const initRef = useRef(false)

  // Memoized recent tickets to prevent re-renders
  const recentTickets = useMemo(() => {
    return selectors.tickets.slice(0, 3)
  }, [selectors.tickets])

  // FIXED: Smart initialization that doesn't always show loading (same as AdminDashboard)
  useEffect(() => {
    let isMounted = true

    const initializeDashboard = async () => {
      // FIXED: Check if we already have recent data
      const hasRecentData = store.tickets.length > 0 && 
        Date.now() - store.lastFetch < 300000 // 5 minute cache

      if (hasRecentData) {
        console.log("🎫 StudentDashboard: Using cached data")
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
        console.log("🎫 StudentDashboard: Initializing dashboard data")
        
        // Only fetch if we don't have tickets or data is stale
        if (store.tickets.length === 0 || Date.now() - store.lastFetch > 60000) {
          await store.actions.fetchTickets({ 
            page: 1, 
            per_page: 3,
            sort_by: 'updated_at',
            sort_direction: 'desc'
          })
        }
        
        if (isMounted) {
          setIsInitialized(true)
          setHasData(true)
        }
      } catch (error) {
        console.error("❌ StudentDashboard: Failed to initialize:", error)
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

  // Memoized appointment data
  const upcomingAppointments: AppointmentData[] = useMemo(() => [
    {
      id: 1,
      type: "Video Call",
      counselor: "Dr. Sarah Wilson",
      date: "Today",
      time: "2:00 PM",
      status: "confirmed",
      canJoin: true,
    },
    {
      id: 2,
      type: "Phone Call",
      counselor: "Prof. Michael Chen",
      date: "Tomorrow",
      time: "10:30 AM",
      status: "confirmed",
      canJoin: false,
    },
  ], [])

  const selfHelpResources: SelfHelpResource[] = useMemo(() => [
    {
      title: "Stress Management Techniques",
      type: "Video",
      duration: "15 min",
      icon: Heart,
      color: "from-rose-500 to-pink-500",
    },
    {
      title: "Study Skills Workshop",
      type: "Article",
      duration: "10 min read",
      icon: BookOpen,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Meditation for Students",
      type: "Audio",
      duration: "20 min",
      icon: Headphones,
      color: "from-violet-500 to-purple-500",
    },
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

  // FIXED: Navigation handler with proper error handling
  const handleNavigateToPage = useCallback((page: string, params?: any): void => {
    try {
      console.log("🎫 StudentDashboard: Navigating to:", page, params)
      if (onNavigate) {
        onNavigate(page, params)
      }
    } catch (error) {
      console.error("❌ StudentDashboard: Navigation error:", error)
    }
  }, [onNavigate])

  // FIXED: Refresh handler with proper error handling
  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      console.log("🎫 StudentDashboard: Refreshing dashboard")
      await store.actions.fetchTickets({ 
        page: 1, 
        per_page: 3,
        sort_by: 'updated_at',
        sort_direction: 'desc'
      })
    } catch (error) {
      console.error("❌ StudentDashboard: Refresh failed:", error)
    }
  }, [store.actions])

  // FIXED: Only show loading for initial load, not for refresh or cached data
  if (!isInitialized && !hasData && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Getting your information ready...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Heart className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(" ")[0]}! 👋</h1>
              <p className="text-blue-100 text-lg mb-6">How can we support you today?</p>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-blue-100">Support Available</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">15+</div>
              <div className="text-sm text-blue-100">Counselors</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-blue-100">Confidential</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Stats Overview */}
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
                <p className="text-2xl font-bold text-amber-900">{(stats.open || 0) + (stats.in_progress || 0)}</p>
                <p className="text-sm text-amber-600">Active Tickets</p>
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
                <p className="text-sm text-green-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{(stats.high_priority || 0) + (stats.crisis || 0)}</p>
                <p className="text-sm text-red-600">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => handleNavigateToPage('submit-ticket')}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Plus className="h-7 w-7" />
          <span className="font-medium">Submit Ticket</span>
        </Button>
        
        <Button
          onClick={() => handleNavigateToPage('tickets')}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Eye className="h-7 w-7" />
          <span className="font-medium">View All Tickets</span>
        </Button>
        
        <Button
          onClick={() => handleNavigateToPage('appointments')}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Calendar className="h-7 w-7" />
          <span className="font-medium">Book Appointment</span>
        </Button>
        
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Heart className="h-7 w-7" />
          <span className="font-medium">Crisis Support</span>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-slate-800">Recent Support Tickets</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage("tickets")}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading && recentTickets.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Loading your tickets...</span>
              </div>
            ) : recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusIcon(ticket.status)}
                        <span className="text-xs font-mono text-blue-600">#{ticket.ticket_number}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 truncate max-w-48">{ticket.subject}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                            {ticket.category}
                          </Badge>
                          <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-xs`}>
                            {ticket.priority}
                          </Badge>
                          {ticket.crisis_flag && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              CRISIS
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Updated {formatDate(ticket.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToPage('ticket-details', { ticketId: ticket.id })}
                        className="hover:bg-blue-50 hover:border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                  <Ticket className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 mb-2">No tickets yet</h3>
                <p className="text-slate-600 mb-4">Get started by submitting your first support request</p>
                <Button
                  onClick={() => handleNavigateToPage('submit-ticket')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-slate-800">Upcoming Appointments</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage("appointments")}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-lg ${appointment.type === "Video Call" ? "bg-blue-100" : "bg-emerald-100"}`}
                      >
                        {appointment.type === "Video Call" ? (
                          <Video className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Phone className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{appointment.counselor}</p>
                        <p className="text-sm text-slate-600">
                          {appointment.date} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {appointment.status}
                      </Badge>
                      {appointment.canJoin && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        >
                          Join Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 mb-2">No upcoming appointments</h3>
                <p className="text-slate-600 mb-4">Schedule your first session with a counselor</p>
                <Button
                  onClick={() => handleNavigateToPage("appointments")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Self-Help Resources */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-violet-50/50">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg border-b border-violet-100">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-slate-800">Self-Help Resources</span>
            </div>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Explore tools and content to support your wellbeing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {selfHelpResources.map((resource, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className={`p-3 bg-gradient-to-br ${resource.color} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200`}
                  >
                    <resource.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-200 group-hover:border-violet-200 group-hover:bg-violet-50"
                  >
                    {resource.type}
                  </Badge>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
                  {resource.title}
                </h4>
                <p className="text-sm text-slate-600">{resource.duration}</p>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full h-12 border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
            onClick={() => handleNavigateToPage("resources")}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Browse All Resources
          </Button>
        </CardContent>
      </Card>

      {/* Crisis Support Banner */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-md">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900 mb-1">Need immediate help?</h3>
              <p className="text-rose-700">If you're experiencing a crisis, reach out immediately. Our support team is here 24/7.</p>
            </div>
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
            >
              Crisis Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}