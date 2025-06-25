// components/dashboards/counselor-dashboard.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { useState } from "react"

interface CounselorDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function CounselorDashboard({ user }: CounselorDashboardProps) {
  // Add state for session management
  const [canStartSessions, setCanStartSessions] = useState<string[]>([])

  // Update todaySessions to include more details and start capabilities
  const todaySessions = [
    {
      id: 1,
      student: "Alex J.",
      time: "9:00 AM",
      type: "Video",
      status: "upcoming",
      isAnonymous: false,
      canStart: true, // 5 mins before
      intakeFormSubmitted: true,
      lastSession: "2024-01-10",
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
    },
    {
      id: 3,
      student: "Sarah M.",
      time: "2:00 PM",
      type: "Video",
      status: "completed",
      isAnonymous: false,
      needsFollowUp: true,
      sessionNotes: false, // needs notes
    },
  ]

  // Update pendingTickets to show priority levels
  const pendingTickets = [
    {
      id: "T003",
      student: "Mike R.",
      subject: "Anxiety about upcoming exams",
      category: "Mental Health",
      priority: "High",
      timeAgo: "30 min ago",
      flagged: true, // crisis flag
      assignedToMe: true,
    },
    {
      id: "T004",
      student: "Emma L.",
      subject: "Career guidance needed",
      category: "Academic",
      priority: "Medium",
      timeAgo: "2 hours ago",
      canEscalate: true,
      assignedToMe: true,
    },
  ]

  // Add personal analytics
  const personalAnalytics = {
    sessionsThisWeek: 18,
    averageRating: 4.8,
    responseTime: "2.3 hours",
    studentsHelped: 15,
    followUpsNeeded: 3,
    highPriorityTickets: 1,
  }

  const weeklyStats = {
    sessionsCompleted: 18,
    averageRating: 4.8,
    responseTime: "2.3 hours",
    studentsHelped: 15,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Good morning, {user.name.split(" ")[0]}!</h1>
        <p className="text-green-100 mt-1">You have 3 sessions scheduled today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.sessionsCompleted}</p>
                <p className="text-sm text-gray-600">Sessions this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.averageRating}</p>
                <p className="text-sm text-gray-600">Average rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.responseTime}</p>
                <p className="text-sm text-gray-600">Avg response time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{weeklyStats.studentsHelped}</p>
                <p className="text-sm text-gray-600">Students helped</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Today's Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    </div>
                    <p className="text-sm text-gray-600">{session.time}</p>
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
                      {session.sessionNotes === false && <Button size="sm">Add Note</Button>}
                    </div>
                  ) : (
                    <Button size="sm" disabled={!session.canStart}>
                      Start Session
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Pending Tickets</span>
            <Badge variant="destructive">{pendingTickets.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">#{ticket.id}</span>
                    <Badge variant="outline">{ticket.category}</Badge>
                    <Badge variant={ticket.priority === "High" ? "destructive" : "default"}>{ticket.priority}</Badge>
                    {ticket.flagged && <Badge variant="destructive">Crisis</Badge>}
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">
                    From {ticket.student} • {ticket.timeAgo}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {ticket.canEscalate && (
                    <Button variant="secondary" size="sm">
                      Escalate
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>Your impact this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
      {/* Workload Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Workload Analytics</CardTitle>
          <CardDescription>Your performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-sm font-medium text-gray-600">High Priority Tickets</p>
              <p className="text-2xl font-bold">{personalAnalytics.highPriorityTickets}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
