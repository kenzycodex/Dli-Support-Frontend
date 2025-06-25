"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertTriangle, Brain, Heart } from "lucide-react"

interface AssessmentQuestion {
  id: string
  text: string
  options: { value: string; label: string; score: number }[]
}

interface WellnessAssessmentProps {
  open?: boolean
  onClose?: () => void
}

export function WellnessAssessment({ open, onClose }: WellnessAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

  const assessments = [
    {
      id: "phq9",
      name: "Depression Screening (PHQ-9)",
      description: "Assess symptoms of depression over the past 2 weeks",
      questions: [
        {
          id: "phq9_1",
          text: "Little interest or pleasure in doing things",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "phq9_2",
          text: "Feeling down, depressed, or hopeless",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "phq9_3",
          text: "Trouble falling or staying asleep, or sleeping too much",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "phq9_4",
          text: "Feeling tired or having little energy",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "phq9_5",
          text: "Poor appetite or overeating",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
      ],
    },
    {
      id: "gad7",
      name: "Anxiety Screening (GAD-7)",
      description: "Assess symptoms of anxiety over the past 2 weeks",
      questions: [
        {
          id: "gad7_1",
          text: "Feeling nervous, anxious, or on edge",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "gad7_2",
          text: "Not being able to stop or control worrying",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "gad7_3",
          text: "Worrying too much about different things",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "gad7_4",
          text: "Trouble relaxing",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
        {
          id: "gad7_5",
          text: "Being so restless that it's hard to sit still",
          options: [
            { value: "0", label: "Not at all", score: 0 },
            { value: "1", label: "Several days", score: 1 },
            { value: "2", label: "More than half the days", score: 2 },
            { value: "3", label: "Nearly every day", score: 3 },
          ],
        },
      ],
    },
  ]

  const [selectedAssessment, setSelectedAssessment] = useState(0)
  const currentAssessment = assessments[selectedAssessment]
  const currentQuestion = currentAssessment.questions[currentStep]
  const totalQuestions = currentAssessment.questions.length

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculateScore = () => {
    return currentAssessment.questions.reduce((total, question) => {
      const answer = answers[question.id]
      if (answer) {
        const option = question.options.find((opt) => opt.value === answer)
        return total + (option?.score || 0)
      }
      return total
    }, 0)
  }

  const getScoreInterpretation = (score: number, assessmentId: string) => {
    if (assessmentId === "phq9") {
      if (score <= 4) return { level: "Minimal", color: "green", description: "Minimal depression symptoms" }
      if (score <= 9) return { level: "Mild", color: "yellow", description: "Mild depression symptoms" }
      if (score <= 14) return { level: "Moderate", color: "orange", description: "Moderate depression symptoms" }
      if (score <= 19) return { level: "Moderately Severe", color: "red", description: "Moderately severe depression" }
      return { level: "Severe", color: "red", description: "Severe depression symptoms" }
    } else {
      if (score <= 4) return { level: "Minimal", color: "green", description: "Minimal anxiety symptoms" }
      if (score <= 9) return { level: "Mild", color: "yellow", description: "Mild anxiety symptoms" }
      if (score <= 14) return { level: "Moderate", color: "orange", description: "Moderate anxiety symptoms" }
      return { level: "Severe", color: "red", description: "Severe anxiety symptoms" }
    }
  }

  const resetAssessment = () => {
    setCurrentStep(0)
    setAnswers({})
    setShowResults(false)
  }

  if (showResults) {
    const score = calculateScore()
    const interpretation = getScoreInterpretation(score, currentAssessment.id)

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <span>Assessment Results</span>
            </CardTitle>
            <CardDescription>{currentAssessment.name} - Completed</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-gray-800">{score}</div>
              <div className="text-lg text-gray-600">out of {totalQuestions * 3}</div>
              <Badge
                className={`text-lg px-4 py-2 ${
                  interpretation.color === "green"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : interpretation.color === "yellow"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                      : interpretation.color === "orange"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {interpretation.level}
              </Badge>
              <p className="text-gray-700">{interpretation.description}</p>
            </div>

            {interpretation.color !== "green" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Recommended Actions</h4>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>• Consider scheduling an appointment with a counselor</li>
                      <li>• Explore our self-help resources and coping strategies</li>
                      <li>• Share these results with your healthcare provider</li>
                      {interpretation.color === "red" && (
                        <li className="font-medium">• If you're having thoughts of self-harm, seek immediate help</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={resetAssessment} variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                Retake Assessment
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                Book Appointment
              </Button>
              <Button variant="outline" className="hover:bg-green-50 hover:border-green-200">
                View Resources
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              This assessment is for screening purposes only and does not replace professional diagnosis.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Brain className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Wellness Assessment</h1>
              <p className="text-blue-100 text-lg">Standardized mental health screening tools</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Confidential</div>
              <div className="text-sm text-blue-100">Private & Secure</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">5-10 min</div>
              <div className="text-sm text-blue-100">Quick Assessment</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Evidence-Based</div>
              <div className="text-sm text-blue-100">Clinically Validated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Selection */}
      {currentStep === 0 && Object.keys(answers).length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((assessment, index) => (
            <Card
              key={assessment.id}
              className={`cursor-pointer transition-all duration-200 border-0 shadow-xl hover:shadow-2xl ${
                selectedAssessment === index ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedAssessment(index)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      {assessment.id === "phq9" ? (
                        <Heart className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Brain className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{assessment.name}</h3>
                      <p className="text-sm text-gray-600">{assessment.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {assessment.questions.length} questions
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      Start Assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assessment Questions */}
      {(currentStep > 0 || Object.keys(answers).length > 0) && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle>{currentAssessment.name}</CardTitle>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                {currentStep + 1} of {totalQuestions}
              </Badge>
            </div>
            <Progress value={((currentStep + 1) / totalQuestions) * 100} className="h-2" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Over the last 2 weeks, how often have you been bothered by:
                </h3>
                <p className="text-xl font-medium text-gray-800 mb-6">{currentQuestion.text}</p>
              </div>

              <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={handleAnswer} className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="hover:bg-gray-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {currentStep === totalQuestions - 1 ? "Complete Assessment" : "Next"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
