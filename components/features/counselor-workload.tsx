"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users, Clock, Star, TrendingUp, Calendar, AlertTriangle, CheckCircle, Download } from "lucide-react"

interface CounselorWorkloadProps {
  counselorId: string
}

export function CounselorWorkload({ counselorId }: CounselorWorkloadProps) {
  const workloadData = {
    thisWeek: {
      sessionsCompleted: 18,
      sessionsScheduled: 22,
      averageSessionDuration: 52,
      studentsHelped: 15,
      ticketsResolved: 8,
      averageRating: 4.8,
      responseTime: 2.3,
    },
    thisMonth: {
      sessionsCompleted: 76,
      studentsHelped: 58,
      ticketsResolved: 34,
      followUpsCompleted: 12,
    },
    goals: {
      weeklySessionTarget: 20,
      responseTimeTarget: 4.0,
      ratingTarget: 4.5,
    },
  }

  const upcomingFollowUps = [
    {
      id: "1",
      student: "Alex J.",
      scheduledDate: "2024-01-16",
      reason: "Anxiety management check-in",
      priority: "Medium",
    },
    {
      id: "2",
      student: "Anonymous",
      scheduledDate: "2024-01-17",
      reason: "Crisis follow-up",
      priority: "High",
    },
    {
      id: "3",
      student: "Sarah M.",
      scheduledDate: "2024-01-18",
      reason: "Progress review",
      priority: "Low",
    },
  ]

  const recentAchievements = [
    {
      title: "Excellent Response Time",
      description: "Maintained under 3-hour response time this week",
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "High Student Satisfaction",
      description: "Achieved 4.8/5 average rating",
      icon: Star,
      color: "text-yellow-600",
    },
    {
      title: "Crisis Intervention",
      description: "Successfully handled 2 crisis situations",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  const exportSummary = () => {
    // Export anonymized session summaries
    console.log("Exporting session summaries for counselor:", counselorId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <BarChart3 className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Workload Analytics</h1>
                <p className="text-indigo-100 text-lg">Your impact and performance metrics</p>
              </div>
            </div>
            <Button onClick={exportSummary} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Export Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workloadData.thisWeek.sessionsCompleted}</p>
                <p className="text-sm text-gray-600">Sessions This Week</p>
                <Progress
                  value={(workloadData.thisWeek.sessionsCompleted / workloadData.goals.weeklySessionTarget) * 100}
                  className="mt-2 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workloadData.thisWeek.averageRating}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
                  <span className="text-xs text-emerald-600">Above target</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workloadData.thisWeek.responseTime}h</p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <Progress
                  value={
                    ((workloadData.goals.responseTimeTarget - workloadData.thisWeek.responseTime) /
                      workloadData.goals.responseTimeTarget) *
                    100
                  }
                  className="mt-2 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workloadData.thisWeek.ticketsResolved}</p>
                <p className="text-sm text-gray-600">Tickets Resolved</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-purple-600 mr-1" />
                  <span className="text-xs text-purple-600">+15% vs last week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups Needed */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <span>Upcoming Follow-ups</span>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">{upcomingFollowUps.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {upcomingFollowUps.map((followUp) => (
              <div
                key={followUp.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium">{followUp.student}</h4>
                    <p className="text-sm text-gray-600">{followUp.reason}</p>
                    <p className="text-xs text-gray-500">Scheduled: {followUp.scheduledDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      followUp.priority === "High"
                        ? "destructive"
                        : followUp.priority === "Medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {followUp.priority}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-green-600" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center space-x-3 mb-2">
                  <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                  <h4 className="font-medium">{achievement.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sessions Completed</span>
                <span className="text-lg font-bold">{workloadData.thisMonth.sessionsCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Students Helped</span>
                <span className="text-lg font-bold">{workloadData.thisMonth.studentsHelped}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tickets Resolved</span>
                <span className="text-lg font-bold">{workloadData.thisMonth.ticketsResolved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Follow-ups Completed</span>
                <span className="text-lg font-bold">{workloadData.thisMonth.followUpsCompleted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Weekly Sessions Goal</span>
                  <span>
                    {workloadData.thisWeek.sessionsCompleted}/{workloadData.goals.weeklySessionTarget}
                  </span>
                </div>
                <Progress
                  value={(workloadData.thisWeek.sessionsCompleted / workloadData.goals.weeklySessionTarget) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Response Time Goal</span>
                  <span>
                    {workloadData.thisWeek.responseTime}/{workloadData.goals.responseTimeTarget}h
                  </span>
                </div>
                <Progress
                  value={
                    ((workloadData.goals.responseTimeTarget - workloadData.thisWeek.responseTime) /
                      workloadData.goals.responseTimeTarget) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Rating Goal</span>
                  <span>
                    {workloadData.thisWeek.averageRating}/{workloadData.goals.ratingTarget}
                  </span>
                </div>
                <Progress value={(workloadData.thisWeek.averageRating / 5) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
