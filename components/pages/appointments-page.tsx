"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Video,
  Phone,
  MessageSquare,
  Clock,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Flag,
  Edit,
  UserX,
} from "lucide-react"
import { AppointmentBooking } from "@/components/features/appointment-booking"
import { VideoSession } from "@/components/features/video-session"
import { Textarea } from "@/components/ui/textarea"

interface Appointment {
  id: string
  type: "video" | "phone" | "chat"
  counselor?: string
  student?: string
  date: string
  time: string
  status: "upcoming" | "completed" | "cancelled" | "in-progress"
  duration: number
  notes?: string
  canJoin?: boolean
  canReschedule?: boolean
  isAnonymous?: boolean
  intakeFormSubmitted?: boolean
  needsFollowUp?: boolean
  sessionNotes?: string
  canAddNotes?: boolean
}

export function AppointmentsPage() {
  const [showBooking, setShowBooking] = useState(false)
  const [showVideoSession, setShowVideoSession] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCounselor, setIsCounselor] = useState(true) // Mock counselor role
  const [showSessionNotes, setShowSessionNotes] = useState(false)

  const appointments: Appointment[] = [
    {
      id: "1",
      type: "video",
      counselor: "Dr. Sarah Wilson",
      student: "Alice Johnson",
      date: "2024-01-15",
      time: "2:00 PM",
      status: "upcoming",
      duration: 60,
      canJoin: true,
      canReschedule: true,
      isAnonymous: false,
      intakeFormSubmitted: true,
      needsFollowUp: false,
      sessionNotes: "Initial assessment completed.",
      canAddNotes: true,
    },
    {
      id: "2",
      type: "phone",
      counselor: "Prof. Michael Chen",
      student: "Bob Williams",
      date: "2024-01-16",
      time: "10:30 AM",
      status: "upcoming",
      duration: 45,
      canReschedule: true,
      isAnonymous: false,
      intakeFormSubmitted: false,
      needsFollowUp: true,
      canAddNotes: false,
    },
    {
      id: "3",
      type: "video",
      counselor: "Dr. Emily Rodriguez",
      student: "Charlie Davis",
      date: "2024-01-10",
      time: "3:00 PM",
      status: "completed",
      duration: 60,
      notes: "Discussed stress management techniques. Follow-up recommended.",
      isAnonymous: true,
      intakeFormSubmitted: true,
      needsFollowUp: true,
      sessionNotes: "Client reported feeling better after session.",
      canAddNotes: false,
    },
    {
      id: "4",
      type: "chat",
      counselor: "Dr. Sarah Wilson",
      student: "Diana Garcia",
      date: "2024-01-08",
      time: "1:00 PM",
      status: "cancelled",
      duration: 45,
      isAnonymous: false,
      intakeFormSubmitted: false,
      needsFollowUp: false,
      canAddNotes: false,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-blue-600" />
      case "phone":
        return <Phone className="h-4 w-4 text-green-600" />
      case "chat":
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      (appointment.counselor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.student?.toLowerCase().includes(searchTerm.toLowerCase())) ??
      false
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingAppointments = appointments.filter((a) => a.status === "upcoming")
  const completedAppointments = appointments.filter((a) => a.status === "completed")

  const handleJoinSession = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    if (appointment.type === "video") {
      setShowVideoSession(true)
    }
    // Handle phone and chat sessions differently
  }

  const handleViewSessionNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowSessionNotes(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-8 w-8" />
            </div>
        <div>
              <h1 className="text-3xl font-bold">My Appointments</h1>
              <p className="text-blue-100 text-lg">Schedule and manage your counseling sessions</p>
        </div>
      </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <div className="text-sm text-blue-100">Upcoming Sessions</div>
              </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{completedAppointments.length}</div>
              <div className="text-sm text-blue-100">Completed Sessions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-blue-100">Support Available</div>
            </div>
              </div>
            </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by counselor or student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Appointments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTypeIcon(appointment.type)}
                      <div>
                        <h3 className="font-medium">{isCounselor ? appointment.student : appointment.counselor}</h3>
                        <p className="text-sm text-gray-600">
                          {appointment.date} at {appointment.time} • {appointment.duration} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isCounselor && appointment.isAnonymous && <UserX className="h-4 w-4 text-gray-500" />}
                      {isCounselor && appointment.intakeFormSubmitted && <Eye className="h-4 w-4 text-blue-500" />}
                      {isCounselor && appointment.needsFollowUp && <Flag className="h-4 w-4 text-orange-500" />}
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(appointment.status)}
                        <Badge
                          variant={
                            appointment.status === "upcoming"
                              ? "default"
                              : appointment.status === "completed"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      {appointment.canJoin && (
                        <Button size="sm" onClick={() => handleJoinSession(appointment)}>
                          Join Session
                        </Button>
                      )}
                      {appointment.canReschedule && (
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      )}
                      {isCounselor && appointment.canAddNotes && (
                        <Button variant="outline" size="sm" onClick={() => handleViewSessionNotes(appointment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Add Notes
                        </Button>
                      )}
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => setShowBooking(true)}>Book Your First Appointment</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(appointment.type)}
                    <div>
                      <h3 className="font-medium">{appointment.counselor}</h3>
                      <p className="text-sm text-gray-600">
                        {appointment.date} at {appointment.time} • {appointment.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {appointment.canJoin && (
                      <Button size="sm" onClick={() => handleJoinSession(appointment)}>
                        Join Session
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(appointment.type)}
                    <div>
                      <h3 className="font-medium">{appointment.counselor}</h3>
                      <p className="text-sm text-gray-600">
                        {appointment.date} at {appointment.time} • {appointment.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">Completed</Badge>
                    <Button variant="outline" size="sm">
                      Book Again
                    </Button>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AppointmentBooking open={showBooking} onClose={() => setShowBooking(false)} />
      <VideoSession
        open={showVideoSession}
        onClose={() => setShowVideoSession(false)}
        appointment={selectedAppointment}
      />

      {/* Session Notes Modal */}
      {selectedAppointment && (
        <SessionNotesModal
          open={showSessionNotes}
          onClose={() => setShowSessionNotes(false)}
          appointment={selectedAppointment}
        />
      )}
    </div>
  )
}

interface SessionNotesModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment
}

const SessionNotesModal: React.FC<SessionNotesModalProps> = ({ open, onClose, appointment }) => {
  const [notes, setNotes] = useState(appointment.sessionNotes || "")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Session Notes for {appointment.student}</h2>
        <Textarea
          placeholder="Enter session notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Save notes logic here (e.g., update state or API call)
              alert("Notes saved: " + notes)
              onClose()
            }}
          >
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  )
}
