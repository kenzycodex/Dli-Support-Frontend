"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Users,
  BookOpen,
  Headphones,
  Video,
  Calendar,
  Star,
  Clock,
  Shield,
  Phone,
  Heart,
  TrendingUp,
  Target,
  Smile,
  Menu,
  X,
} from "lucide-react"
import { AppointmentBooking } from "@/components/features/appointment-booking"
import { CrisisSupport } from "@/components/features/crisis-support"
import { PageHeader } from "@/components/ui/page-header"

interface CounselorProfile {
  id: string
  name: string
  title: string
  specializations: string[]
  rating: number
  experience: string
  bio: string
  languages: string[]
  image: string
}

interface Resource {
  id: string
  title: string
  type: "article" | "video" | "audio" | "exercise"
  category: string
  duration: string
  description: string
  rating: number
}

interface WellnessMetric {
  name: string
  value: number
  change: number
  icon: any
  color: string
}

export function CounselingPage() {
  const [showBooking, setShowBooking] = useState(false)
  const [showCrisisSupport, setShowCrisisSupport] = useState(false)
  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("counselors")

  const counselors: CounselorProfile[] = [
    {
      id: "1",
      name: "Dr. Sarah Wilson",
      title: "Licensed Clinical Psychologist",
      specializations: ["Anxiety", "Depression", "Stress Management"],
      rating: 4.9,
      experience: "8 years",
      bio: "Dr. Wilson specializes in cognitive behavioral therapy and has extensive experience helping students manage academic stress and anxiety.",
      languages: ["English", "Spanish"],
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      title: "Academic Counselor",
      specializations: ["Academic Planning", "Career Guidance", "Study Skills"],
      rating: 4.8,
      experience: "6 years",
      bio: "Dr. Chen helps students navigate academic challenges and develop effective study strategies for success.",
      languages: ["English", "Mandarin"],
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "3",
      name: "Dr. Emily Rodriguez",
      title: "Licensed Therapist",
      specializations: ["Relationship Issues", "Social Anxiety", "Self-Esteem"],
      rating: 4.9,
      experience: "10 years",
      bio: "Dr. Rodriguez focuses on helping students build healthy relationships and develop confidence in social situations.",
      languages: ["English", "Spanish", "Portuguese"],
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const resources: Resource[] = [
    {
      id: "1",
      title: "Managing Test Anxiety",
      type: "video",
      category: "Anxiety",
      duration: "15 min",
      description: "Learn practical techniques to reduce anxiety before and during exams.",
      rating: 4.7,
    },
    {
      id: "2",
      title: "Mindfulness for Students",
      type: "audio",
      category: "Stress Management",
      duration: "20 min",
      description: "Guided meditation session designed specifically for busy students.",
      rating: 4.8,
    },
    {
      id: "3",
      title: "Building Healthy Study Habits",
      type: "article",
      category: "Academic Success",
      duration: "10 min read",
      description: "Evidence-based strategies for creating sustainable study routines.",
      rating: 4.6,
    },
    {
      id: "4",
      title: "Breathing Exercise for Stress Relief",
      type: "exercise",
      category: "Stress Management",
      duration: "5 min",
      description: "Quick breathing technique you can use anywhere to reduce stress.",
      rating: 4.9,
    },
  ]

  const wellnessMetrics: WellnessMetric[] = [
    { name: "Mood", value: 75, change: 5, icon: Smile, color: "bg-green-500" },
    { name: "Stress Level", value: 40, change: -10, icon: Brain, color: "bg-blue-500" },
    { name: "Sleep Quality", value: 80, change: 15, icon: Clock, color: "bg-purple-500" },
    { name: "Energy", value: 65, change: 8, icon: TrendingUp, color: "bg-orange-500" },
  ]

  const tabs = [
    { id: "counselors", label: "Counselors", icon: Users },
    { id: "resources", label: "Self-Help", icon: BookOpen },
    { id: "wellness", label: "Wellness", icon: Target },
  ]

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
      case "audio":
        return <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
      case "article":
        return <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
      case "exercise":
        return <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
      default:
        return <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
    }
  }

  const handleBookWithCounselor = (counselorId: string) => {
    setSelectedCounselor(counselorId)
    setShowBooking(true)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Heart}
        title="Counseling & Mental Health"
        description="Professional support for your mental health and wellbeing"
        className="from-green-600 via-emerald-600 to-teal-700"
        stats={[
          { value: "24/7", label: "Crisis Support" },
          { value: "15+", label: "Licensed Counselors" },
          { value: "100%", label: "Confidential" }
        ]}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => setShowBooking(true)}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg"
          size="lg"
        >
          <Calendar className="h-7 w-7" />
          <span className="font-medium">Book Session</span>
        </Button>
        <Button
          onClick={() => setShowCrisisSupport(true)}
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg"
          size="lg"
        >
          <Phone className="h-7 w-7" />
          <span className="font-medium">Crisis Support</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-0 shadow-lg"
          size="lg"
        >
          <Users className="h-7 w-7" />
          <span className="font-medium">Group Therapy</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 shadow-lg"
          size="lg"
        >
          <Shield className="h-7 w-7" />
          <span className="font-medium">Anonymous Chat</span>
        </Button>
      </div>

      {/* Mobile Horizontal Tabs */}
      <div className="lg:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 text-center
                    ${isActive 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium leading-tight ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {tab.label.replace(' Resources', '').replace(' Tracking', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Vertical Tabs */}
        <Card className="hidden lg:block lg:w-64 xl:w-72 border-0 shadow-lg h-fit">
          <CardHeader className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <tab.icon className="h-4 w-4 mr-3" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "counselors" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-lg sm:text-xl">Meet Our Counselors</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">Professional, licensed counselors ready to support you</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  {counselors.map((counselor) => (
                    <Card key={counselor.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                            <img
                              src={counselor.image || "/placeholder.svg"}
                              alt={counselor.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-blue-100 mx-auto sm:mx-0"
                            />
                            <div className="flex-1 text-center sm:text-left">
                              <h3 className="font-semibold text-lg sm:text-xl">{counselor.name}</h3>
                              <p className="text-gray-600 text-sm sm:text-base">{counselor.title}</p>
                              <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{counselor.rating}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-600">{counselor.experience}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                              {counselor.specializations.map((spec) => (
                                <Badge
                                  key={spec}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center sm:text-left">{counselor.bio}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                              <span className="text-sm text-gray-500 font-medium text-center sm:text-left">Languages:</span>
                              <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                                {counselor.languages.map((lang) => (
                                  <Badge key={lang} variant="outline" className="text-xs">
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "resources" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  <span className="text-lg sm:text-xl">Self-Help Resources</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">Curated content to support your mental health journey</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {resources.map((resource) => (
                    <Card
                      key={resource.id}
                      className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-base sm:text-lg">{resource.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {resource.type}
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-gray-500">{resource.duration}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 justify-center sm:justify-start">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{resource.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{resource.description}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 w-fit mx-auto sm:mx-0">
                              {resource.category}
                            </Badge>
                            <Button size="sm" variant="outline" className="hover:bg-purple-50 w-full sm:w-auto">
                              Access Resource
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 w-full sm:w-auto"
                  >
                    View All Resources
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "wellness" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      <span className="text-lg sm:text-xl">Wellness Metrics</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">Track your mental health progress</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {wellnessMetrics.map((metric) => (
                      <div key={metric.name} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 ${metric.color} rounded-lg`}>
                              <metric.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-sm sm:text-base">{metric.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{metric.value}%</span>
                            <Badge variant={metric.change > 0 ? "default" : "secondary"} className="text-xs">
                              {metric.change > 0 ? "+" : ""}
                              {metric.change}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                      <span className="text-lg sm:text-xl">Daily Check-in</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">How are you feeling today?</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {["😢", "😕", "😐", "🙂", "😊"].map((emoji, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-12 sm:h-16 text-xl sm:text-2xl hover:bg-orange-50 hover:border-orange-200"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                      Submit Check-in
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AppointmentBooking open={showBooking} onClose={() => setShowBooking(false)} />
      <CrisisSupport open={showCrisisSupport} onClose={() => setShowCrisisSupport(false)} />
    </div>
  )
}