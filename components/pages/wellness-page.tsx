"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Brain, Activity, Target, TrendingUp, Smile, Shield, MessageSquare } from "lucide-react"
import { MoodTracker } from "@/components/features/mood-tracker"
import { WellnessAssessment } from "@/components/features/wellness-assessment"
import { SafetyPlanning } from "@/components/features/safety-planning"
import { SecureMessaging } from "@/components/features/secure-messaging"

interface WellnessPageProps {
  onNavigate?: (page: string) => void
}

export function WellnessPage({ onNavigate }: WellnessPageProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const wellnessFeatures = [
    {
      id: "mood-tracker",
      title: "Mood Tracker",
      description: "Track your daily emotions and identify patterns",
      icon: Smile,
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-50 to-rose-50",
      component: MoodTracker,
    },
    {
      id: "wellness-assessment",
      title: "Wellness Assessment",
      description: "Standardized mental health screening tools",
      icon: Brain,
      color: "from-blue-500 to-indigo-500",
      bgColor: "from-blue-50 to-indigo-50",
      component: WellnessAssessment,
    },
    {
      id: "safety-planning",
      title: "Safety Planning",
      description: "Create your personalized crisis prevention plan",
      icon: Shield,
      color: "from-red-500 to-rose-500",
      bgColor: "from-red-50 to-rose-50",
      component: SafetyPlanning,
    },
    {
      id: "secure-messaging",
      title: "Secure Messaging",
      description: "Private communication with your counselors",
      icon: MessageSquare,
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
      component: SecureMessaging,
    },
  ]

  const selectedFeature = wellnessFeatures.find((f) => f.id === activeFeature)

  if (activeFeature && selectedFeature) {
    const FeatureComponent = selectedFeature.component
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setActiveFeature(null)} className="hover:bg-gray-50">
            ← Back to Wellness Hub
          </Button>
          <h1 className="text-2xl font-bold">{selectedFeature.title}</h1>
        </div>
        <FeatureComponent />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Heart className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Wellness Hub</h1>
              <p className="text-indigo-100 text-lg">Comprehensive tools for your mental health journey</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">4</div>
              <div className="text-sm text-indigo-100">Wellness Tools</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-indigo-100">Always Available</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Private</div>
              <div className="text-sm text-indigo-100">Confidential</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Evidence-Based</div>
              <div className="text-sm text-indigo-100">Clinically Proven</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wellness Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wellnessFeatures.map((feature) => (
          <Card
            key={feature.id}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            onClick={() => setActiveFeature(feature.id)}
          >
            <CardHeader className={`bg-gradient-to-r ${feature.bgColor} rounded-t-lg`}>
              <CardTitle className="flex items-center space-x-3">
                <div
                  className={`p-3 bg-gradient-to-r ${feature.color} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <span>{feature.title}</span>
              </CardTitle>
              <CardDescription className="text-gray-700">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Available Now
                  </Badge>
                  <Button size="sm" className={`bg-gradient-to-r ${feature.color} hover:opacity-90 transition-opacity`}>
                    Open Tool
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  {feature.id === "mood-tracker" && "Track daily emotions, energy, and activities"}
                  {feature.id === "wellness-assessment" && "PHQ-9, GAD-7, and other validated screenings"}
                  {feature.id === "safety-planning" && "Collaborative safety planning with your counselor"}
                  {feature.id === "secure-messaging" && "HIPAA-compliant messaging with end-to-end encryption"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Progress Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mood entries this week</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">7/7</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Safety plan updated</span>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Recent</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last assessment</span>
                <Badge variant="outline">2 weeks ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Mood tracked today</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Message from counselor</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Safety plan reviewed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span>Wellness Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily mood tracking</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">On track</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly check-ins</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Coping strategies</span>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In progress</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
