// components/dashboards/student-dashboard.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { AppointmentBooking } from "@/components/features/appointment-booking"
import { TicketSubmission } from "@/components/features/ticket-submission"
import { CrisisSupport } from "@/components/features/crisis-support"

interface StudentDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
  onNavigate?: (page: string) => void
}

export function StudentDashboard({ user, onNavigate }: StudentDashboardProps) {
  const [showBooking, setShowBooking] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showCrisisSupport, setShowCrisisSupport] = useState(false)

  const upcomingAppointments = [
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
  ]

  const openTickets = [
    {
      id: "T001",
      subject: "Unable to access course materials",
      category: "Technical",
      priority: "Medium",
      status: "In Progress",
      lastUpdate: "2 hours ago",
    },
    {
      id: "T002",
      subject: "Academic planning assistance",
      category: "Academic",
      priority: "Low",
      status: "Open",
      lastUpdate: "1 day ago",
    },
  ]

  const selfHelpResources = [
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
  ]

  const handleNavigateToPage = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
    }
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
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(" ")[0]}! 👋</h1>
          <p className="text-blue-100 text-lg mb-6">How can we support you today?</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => setShowBooking(true)}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Calendar className="h-7 w-7" />
          <span className="font-medium">Book Appointment</span>
        </Button>
        <Button
          onClick={() => setShowTicketForm(true)}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Ticket className="h-7 w-7" />
          <span className="font-medium">Submit Ticket</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="font-medium">Live Chat</span>
        </Button>
        <Button
          onClick={() => setShowCrisisSupport(true)}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 border-0 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <Heart className="h-7 w-7" />
          <span className="font-medium">Crisis Support</span>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-slate-800">Upcoming Appointments</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage("appointments")}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
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
                  onClick={() => setShowBooking(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Schedule Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Ticket className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-slate-800">Your Support Tickets</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToPage("tickets")}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {openTickets.length > 0 ? (
              <div className="space-y-4">
                {openTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-semibold text-emerald-600">#{ticket.id}</span>
                        <Badge variant="outline" className="border-slate-200">
                          {ticket.category}
                        </Badge>
                        <Badge
                          variant={
                            ticket.priority === "High"
                              ? "destructive"
                              : ticket.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                          className={
                            ticket.priority === "Medium"
                              ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                              : ""
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="hover:bg-emerald-50">
                        View
                      </Button>
                    </div>
                    <h4 className="font-medium text-slate-800 mb-2">{ticket.subject}</h4>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{ticket.status}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated {ticket.lastUpdate}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 mb-2">No open tickets</h3>
                <p className="text-slate-600">You're all caught up!</p>
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

      {/* Crisis Support */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-md">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900 mb-1">Need immediate help?</h3>
              <p className="text-rose-700">If you're experiencing a crisis, reach out immediately</p>
            </div>
            <Button
              onClick={() => setShowCrisisSupport(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg"
            >
              Crisis Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AppointmentBooking open={showBooking} onClose={() => setShowBooking(false)} />
      <TicketSubmission open={showTicketForm} onClose={() => setShowTicketForm(false)} />
      <CrisisSupport open={showCrisisSupport} onClose={() => setShowCrisisSupport(false)} />
    </div>
  )
}
