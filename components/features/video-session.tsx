"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Settings,
  MessageSquare,
  Clock,
  Maximize,
  Minimize,
  Shield,
  Send,
  AlertTriangle,
} from "lucide-react"

interface VideoSessionProps {
  open: boolean
  onClose: () => void
  appointment: {
    id: string
    counselor: string
    date: string
    time: string
    duration: number
  } | null
}

export function VideoSession({ open, onClose, appointment }: VideoSessionProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string; time: string }>>([])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (open) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
      setSessionTime(0)
    }
  }, [open])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
    }
  }

  const handleEndCall = () => {
    // Handle session end logic
    onClose()
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? "max-w-full h-full" : "max-w-4xl"} p-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <Video className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Session with {appointment.counselor}</h3>
                <p className="text-sm text-gray-600">
                  {appointment.date} • {formatTime(sessionTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(sessionTime)}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 flex">
            <div className="flex-1 bg-gray-900 relative">
              {/* Main Video */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {appointment.counselor
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <p className="text-white font-medium">{appointment.counselor}</p>
                  <p className="text-gray-300 text-sm">Counselor</p>
                </div>
              </div>

              {/* Self Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg border-2 border-white">
                <div className="w-full h-full flex items-center justify-center">
                  {isVideoOn ? (
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                      <span className="text-white font-bold">You</span>
                    </div>
                  ) : (
                    <VideoOff className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Connection Status */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
              </div>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="w-80 border-l bg-white flex flex-col">
                <div className="p-4 border-b">
                  <h4 className="font-medium">Session Chat</h4>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Confidential
                  </Badge>
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm bg-gray-100 p-2 rounded">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 min-h-0 h-10"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex mt-2 space-x-2">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call 988
                    </Button>
                    <Button
                      variant="outline"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Emergency
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isAudioOn ? "default" : "destructive"}
                size="icon"
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={
                  isAudioOn
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    : ""
                }
              >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isVideoOn ? "default" : "destructive"}
                size="icon"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={
                  isVideoOn
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    : ""
                }
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={showChat ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className={
                  showChat
                    ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                    : "hover:bg-purple-50"
                }
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="hover:bg-gray-50">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndCall}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              >
                <Phone className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
