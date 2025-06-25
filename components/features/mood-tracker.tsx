"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import {
  Smile,
  Heart,
  Brain,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Dumbbell,
  BookOpen,
  Users,
  TrendingUp,
  CalendarIcon,
} from "lucide-react"

interface MoodEntry {
  date: string
  mood: number // 1-5 scale
  energy: number
  stress: number
  sleep: number
  notes: string
  activities: string[]
}

interface MoodTrackerProps {
  open?: boolean
  onClose?: () => void
}

export function MoodTracker({ open, onClose }: MoodTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMood, setCurrentMood] = useState(3)
  const [currentEnergy, setCurrentEnergy] = useState(3)
  const [currentStress, setCurrentStress] = useState(3)
  const [currentSleep, setCurrentSleep] = useState(3)
  const [notes, setNotes] = useState("")
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])

  const moodEmojis = ["😢", "😕", "😐", "🙂", "😊"]
  const moodLabels = ["Very Low", "Low", "Neutral", "Good", "Excellent"]

  const activities = [
    { id: "exercise", label: "Exercise", icon: Dumbbell, color: "bg-green-100 text-green-800" },
    { id: "study", label: "Study", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
    { id: "social", label: "Social Time", icon: Users, color: "bg-purple-100 text-purple-800" },
    { id: "sleep", label: "Good Sleep", icon: Moon, color: "bg-indigo-100 text-indigo-800" },
    { id: "meals", label: "Regular Meals", icon: Utensils, color: "bg-orange-100 text-orange-800" },
    { id: "outdoors", label: "Time Outdoors", icon: Sun, color: "bg-yellow-100 text-yellow-800" },
    { id: "caffeine", label: "Caffeine", icon: Coffee, color: "bg-amber-100 text-amber-800" },
  ]

  const weeklyData = [
    { date: "Mon", mood: 3, energy: 4, stress: 2 },
    { date: "Tue", mood: 4, energy: 3, stress: 3 },
    { date: "Wed", mood: 2, energy: 2, stress: 4 },
    { date: "Thu", mood: 3, energy: 3, stress: 3 },
    { date: "Fri", mood: 4, energy: 4, stress: 2 },
    { date: "Sat", mood: 5, energy: 5, stress: 1 },
    { date: "Sun", mood: 4, energy: 4, stress: 2 },
  ]

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId],
    )
  }

  const handleSaveEntry = () => {
    const entry: MoodEntry = {
      date: selectedDate.toISOString().split("T")[0],
      mood: currentMood,
      energy: currentEnergy,
      stress: currentStress,
      sleep: currentSleep,
      notes,
      activities: selectedActivities,
    }
    console.log("Saving mood entry:", entry)
    // Reset form
    setNotes("")
    setSelectedActivities([])
  }

  const averageMood = weeklyData.reduce((sum, day) => sum + day.mood, 0) / weeklyData.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Heart className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Smile className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mood Tracker</h1>
              <p className="text-rose-100 text-lg">Track your daily wellness and emotional patterns</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">{averageMood.toFixed(1)}/5</div>
              <div className="text-sm text-rose-100">Weekly Average</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">7</div>
              <div className="text-sm text-rose-100">Days Tracked</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">
                <TrendingUp className="h-6 w-6 inline" />
              </div>
              <div className="text-sm text-rose-100">Trending Up</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Entry */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-pink-600" />
              <span>Daily Check-in</span>
            </CardTitle>
            <CardDescription>How are you feeling today?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Date Selection */}
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>

            {/* Mood Rating */}
            <div className="space-y-3">
              <h4 className="font-medium">Overall Mood</h4>
              <div className="grid grid-cols-5 gap-2">
                {moodEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant={currentMood === index + 1 ? "default" : "outline"}
                    className={`h-16 text-2xl ${
                      currentMood === index + 1
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                        : "hover:bg-pink-50"
                    }`}
                    onClick={() => setCurrentMood(index + 1)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-600">{moodLabels[currentMood - 1]}</p>
            </div>

            {/* Energy, Stress, Sleep */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Energy Level</span>
                  <span className="text-sm text-gray-600">{currentEnergy}/5</span>
                </div>
                <Progress value={currentEnergy * 20} className="h-2" />
                <div className="flex justify-between mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentEnergy(level)}
                      className="text-xs hover:bg-green-50"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Stress Level</span>
                  <span className="text-sm text-gray-600">{currentStress}/5</span>
                </div>
                <Progress value={currentStress * 20} className="h-2" />
                <div className="flex justify-between mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStress(level)}
                      className="text-xs hover:bg-red-50"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Sleep Quality</span>
                  <span className="text-sm text-gray-600">{currentSleep}/5</span>
                </div>
                <Progress value={currentSleep * 20} className="h-2" />
                <div className="flex justify-between mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentSleep(level)}
                      className="text-xs hover:bg-blue-50"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              <h4 className="font-medium">Today's Activities</h4>
              <div className="grid grid-cols-2 gap-2">
                {activities.map((activity) => (
                  <Button
                    key={activity.id}
                    variant={selectedActivities.includes(activity.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleActivityToggle(activity.id)}
                    className={`justify-start ${
                      selectedActivities.includes(activity.id)
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        : "hover:bg-purple-50"
                    }`}
                  >
                    <activity.icon className="h-4 w-4 mr-2" />
                    {activity.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h4 className="font-medium">Notes (Optional)</h4>
              <Textarea
                placeholder="How was your day? Any thoughts or reflections..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleSaveEntry}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              Save Today's Entry
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Weekly Overview</span>
            </CardTitle>
            <CardDescription>Your mood patterns this week</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Weekly Chart */}
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day.date}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{moodEmojis[day.mood - 1]}</span>
                      <span className="text-sm text-gray-600">{day.mood}/5</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Energy:</span>
                      <Progress value={day.energy * 20} className="h-1 mt-1" />
                    </div>
                    <div>
                      <span className="text-gray-500">Stress:</span>
                      <Progress value={day.stress * 20} className="h-1 mt-1" />
                    </div>
                    <div>
                      <span className="text-gray-500">Overall:</span>
                      <Progress value={day.mood * 20} className="h-1 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Weekly Insights</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Your mood improved significantly over the weekend</li>
                <li>• Stress levels were highest on Wednesday</li>
                <li>• Exercise days correlate with better mood scores</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-200">
                <Brain className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-200">
                <Heart className="h-4 w-4 mr-2" />
                Share with Counselor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
