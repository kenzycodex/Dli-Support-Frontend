"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Video, Phone, MessageSquare, User, Star } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppointmentBookingProps {
  open: boolean
  onClose: () => void
}

export function AppointmentBooking({ open, onClose }: AppointmentBookingProps) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState("")
  const [selectedCounselor, setSelectedCounselor] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  const appointmentTypes = [
    {
      id: "video",
      name: "Video Call",
      description: "Face-to-face session via secure video",
      icon: Video,
      duration: "30-60 minutes",
    },
    {
      id: "phone",
      name: "Phone Call",
      description: "Voice-only conversation",
      icon: Phone,
      duration: "30-60 minutes",
    },
    {
      id: "chat",
      name: "Text Chat",
      description: "Written conversation in real-time",
      icon: MessageSquare,
      duration: "45 minutes",
    },
  ]

  const counselors = [
    {
      id: "1",
      name: "Dr. Sarah Wilson",
      specialization: "Anxiety & Depression",
      rating: 4.9,
      experience: "8 years",
      nextAvailable: "Today 2:00 PM",
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      specialization: "Academic Stress",
      rating: 4.8,
      experience: "6 years",
      nextAvailable: "Tomorrow 10:00 AM",
    },
    {
      id: "3",
      name: "Dr. Emily Rodriguez",
      specialization: "Relationship Issues",
      rating: 4.9,
      experience: "10 years",
      nextAvailable: "Today 4:30 PM",
    },
  ]

  const timeSlots = [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
  ]

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleBooking = () => {
    // Handle booking logic here
    onClose()
    setStep(1)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Appointment Type</h3>
            <div className="space-y-3">
              {appointmentTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-colors ${
                    selectedType === type.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <type.icon className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-medium">{type.name}</h4>
                        <p className="text-sm text-gray-600">{type.description}</p>
                        <p className="text-xs text-gray-500">{type.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <label htmlFor="anonymous" className="text-sm">
                Keep my identity anonymous during the session
              </label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Counselor</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => setSelectedCounselor("auto")}
              >
                <div className="text-left">
                  <h4 className="font-medium">Auto-Assign (Recommended)</h4>
                  <p className="text-sm text-gray-600">We'll match you with the best available counselor</p>
                </div>
              </Button>

              {counselors.map((counselor) => (
                <Card
                  key={counselor.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCounselor === counselor.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCounselor(counselor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-full p-2">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{counselor.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{counselor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{counselor.specialization}</p>
                        <p className="text-xs text-gray-500">
                          {counselor.experience} • Next: {counselor.nextAvailable}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Select Date</h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Available Times</h4>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className={
                        selectedTime === time
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs"
                          : "text-xs hover:bg-blue-50"
                      }
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Confirm Appointment</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="font-medium">{appointmentTypes.find((t) => t.id === selectedType)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Counselor:</span>
                  <span className="font-medium">
                    {selectedCounselor === "auto"
                      ? "Auto-Assigned"
                      : counselors.find((c) => c.id === selectedCounselor)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                {isAnonymous && (
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">Anonymous Session</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive a confirmation email</li>
                <li>• Reminders will be sent 24h and 1h before</li>
                <li>• Join link will be provided 15 minutes early</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return isMobile ? (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Book an Appointment</SheetTitle>
          <SheetDescription>Schedule a session with one of our qualified counselors</SheetDescription>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {i}
              </div>
              {i < 4 && <div className={`w-8 h-0.5 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="hover:bg-gray-50">
            Back
          </Button>
          <Button
            onClick={step === 4 ? handleBooking : handleNext}
            disabled={
              (step === 1 && !selectedType) ||
              (step === 2 && !selectedCounselor) ||
              (step === 3 && (!selectedDate || !selectedTime))
            }
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {step === 4 ? "Book Appointment" : "Next"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>Schedule a session with one of our qualified counselors</DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {i}
              </div>
              {i < 4 && <div className={`w-8 h-0.5 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="hover:bg-gray-50">
            Back
          </Button>
          <Button
            onClick={step === 4 ? handleBooking : handleNext}
            disabled={
              (step === 1 && !selectedType) ||
              (step === 2 && !selectedCounselor) ||
              (step === 3 && (!selectedDate || !selectedTime))
            }
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {step === 4 ? "Book Appointment" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
