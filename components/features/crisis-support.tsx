"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Phone, MessageSquare, Heart, Clock, Shield, AlertTriangle, Send, User } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface CrisisSupportProps {
  open: boolean
  onClose: () => void
}

interface CrisisResource {
  id: string
  name: string
  phone: string
  description: string
  availability: string
  type: "hotline" | "text" | "chat" | "emergency"
}

export function CrisisSupport({ open, onClose }: CrisisSupportProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string; time: string }>>([])

  const crisisResources: CrisisResource[] = [
    {
      id: "988",
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "Free and confidential emotional support for people in suicidal crisis or emotional distress",
      availability: "24/7",
      type: "hotline",
    },
    {
      id: "crisis-text",
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Free, 24/7 support for those in crisis via text message",
      availability: "24/7",
      type: "text",
    },
    {
      id: "campus-security",
      name: "Campus Security",
      phone: "(555) 123-9999",
      description: "Immediate campus emergency response and safety assistance",
      availability: "24/7",
      type: "emergency",
    },
    {
      id: "counseling-crisis",
      name: "University Crisis Counselor",
      phone: "(555) 123-HELP",
      description: "On-call licensed counselor for university students",
      availability: "24/7",
      type: "hotline",
    },
    {
      id: "emergency",
      name: "Emergency Services",
      phone: "911",
      description: "For immediate life-threatening emergencies",
      availability: "24/7",
      type: "emergency",
    },
  ]

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "hotline":
        return <Phone className="h-5 w-5 text-red-600" />
      case "text":
        return <MessageSquare className="h-5 w-5 text-blue-600" />
      case "chat":
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case "emergency":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Phone className="h-5 w-5 text-gray-600" />
    }
  }

  const getResourceColor = (type: string) => {
    switch (type) {
      case "hotline":
        return "border-red-200 bg-red-50 hover:bg-red-100"
      case "text":
        return "border-blue-200 bg-blue-50 hover:bg-blue-100"
      case "chat":
        return "border-green-200 bg-green-50 hover:bg-green-100"
      case "emergency":
        return "border-orange-200 bg-orange-50 hover:bg-orange-100"
      default:
        return "border-gray-200 bg-gray-50 hover:bg-gray-100"
    }
  }

  const handleStartChat = () => {
    setShowChat(true)
    setChatMessages([
      {
        sender: "Crisis Counselor",
        message: "Hello, I'm here to help. You've taken a brave step by reaching out. How are you feeling right now?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "You",
          message: chatMessage,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
      setChatMessage("")

      // Simulate counselor response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "Crisis Counselor",
            message:
              "Thank you for sharing that with me. I want you to know that you're not alone, and what you're feeling is valid. Can you tell me more about what's been going on?",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      }, 2000)
    }
  }

  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2 text-red-600">
              <Heart className="h-6 w-6" />
              <span>Crisis Support - You're Not Alone</span>
            </SheetTitle>
          </SheetHeader>

          {!showChat ? (
            <div className="space-y-6">
              {/* Emergency Notice */}
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">If you're in immediate danger</h3>
                      <p className="text-red-800 mb-4">
                        If you're having thoughts of suicide or are in immediate danger, please call 911 or go to your
                        nearest emergency room right away.
                      </p>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call 911 Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crisis Resources */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Crisis Support Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {crisisResources.map((resource) => (
                    <Card
                      key={resource.id}
                      className={`cursor-pointer transition-all duration-200 ${getResourceColor(resource.type)}`}
                      onClick={() => setSelectedResource(resource.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              {getResourceIcon(resource.type)}
                              <div>
                                <h4 className="font-medium">{resource.name}</h4>
                                <p className="text-lg font-mono font-bold text-gray-900">{resource.phone}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-white">
                              <Clock className="h-3 w-3 mr-1" />
                              {resource.availability}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{resource.description}</p>
                          <div className="flex space-x-2">
                            <Button size="sm" className="flex-1">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Now
                            </Button>
                            {resource.type === "text" && (
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Text
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* University Crisis Chat */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-900">University Crisis Chat</h3>
                        <p className="text-green-800">Connect with a licensed counselor right now</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Confidential
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Available 24/7
                      </Badge>
                    </div>
                    <Button onClick={handleStartChat} className="bg-green-600 hover:bg-green-700">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Crisis Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Planning */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span>Safety Planning Resources</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-4 justify-start">
                        <div className="text-left">
                          <h4 className="font-medium">Create Safety Plan</h4>
                          <p className="text-sm text-gray-600">Step-by-step crisis management plan</p>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 justify-start">
                        <div className="text-left">
                          <h4 className="font-medium">Coping Strategies</h4>
                          <p className="text-sm text-gray-600">Immediate techniques to manage distress</p>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 justify-start">
                        <div className="text-left">
                          <h4 className="font-medium">Support Network</h4>
                          <p className="text-sm text-gray-600">Build your personal support system</p>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 justify-start">
                        <div className="text-left">
                          <h4 className="font-medium">Warning Signs</h4>
                          <p className="text-sm text-gray-600">Recognize early warning signals</p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Crisis Chat Interface */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Crisis Counselor</h3>
                    <p className="text-sm text-green-600">Licensed Professional • Online Now</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Confidential
                </Badge>
              </div>

              <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === "You" ? "bg-blue-600 text-white" : "bg-white border"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender === "You" ? "text-blue-100" : "text-gray-500"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message here... Remember, this is a safe space."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 min-h-0 h-12"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowChat(false)}>
                  Back to Resources
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Phone className="h-4 w-4 mr-2" />
                    Call 988
                  </Button>
                  <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Heart className="h-6 w-6" />
            <span>Crisis Support - You're Not Alone</span>
          </DialogTitle>
        </DialogHeader>

        {!showChat ? (
          <div className="space-y-6">
            {/* Emergency Notice */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">If you're in immediate danger</h3>
                    <p className="text-red-800 mb-4">
                      If you're having thoughts of suicide or are in immediate danger, please call 911 or go to your
                      nearest emergency room right away.
                    </p>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Call 911 Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crisis Resources */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Crisis Support Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crisisResources.map((resource) => (
                  <Card
                    key={resource.id}
                    className={`cursor-pointer transition-all duration-200 ${getResourceColor(resource.type)}`}
                    onClick={() => setSelectedResource(resource.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getResourceIcon(resource.type)}
                            <div>
                              <h4 className="font-medium">{resource.name}</h4>
                              <p className="text-lg font-mono font-bold text-gray-900">{resource.phone}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            <Clock className="h-3 w-3 mr-1" />
                            {resource.availability}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{resource.description}</p>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </Button>
                          {resource.type === "text" && (
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Text
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* University Crisis Chat */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">University Crisis Chat</h3>
                      <p className="text-green-800">Connect with a licensed counselor right now</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Confidential
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Available 24/7
                    </Badge>
                  </div>
                  <Button onClick={handleStartChat} className="bg-green-600 hover:bg-green-700">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Crisis Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Planning */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Safety Planning Resources</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto p-4 justify-start">
                      <div className="text-left">
                        <h4 className="font-medium">Create Safety Plan</h4>
                        <p className="text-sm text-gray-600">Step-by-step crisis management plan</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 justify-start">
                      <div className="text-left">
                        <h4 className="font-medium">Coping Strategies</h4>
                        <p className="text-sm text-gray-600">Immediate techniques to manage distress</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 justify-start">
                      <div className="text-left">
                        <h4 className="font-medium">Support Network</h4>
                        <p className="text-sm text-gray-600">Build your personal support system</p>
                      </div>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 justify-start">
                      <div className="text-left">
                        <h4 className="font-medium">Warning Signs</h4>
                        <p className="text-sm text-gray-600">Recognize early warning signals</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Crisis Chat Interface */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Crisis Counselor</h3>
                  <p className="text-sm text-green-600">Licensed Professional • Online Now</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Confidential
              </Badge>
            </div>

            <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === "You" ? "bg-blue-600 text-white" : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === "You" ? "text-blue-100" : "text-gray-500"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message here... Remember, this is a safe space."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 min-h-0 h-12"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowChat(false)}>
                Back to Resources
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Phone className="h-4 w-4 mr-2" />
                  Call 988
                </Button>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
