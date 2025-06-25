"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Paperclip, Search, Shield, CheckCircle, Heart, Phone, Video } from "lucide-react"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: "student" | "counselor"
  content: string
  timestamp: Date
  read: boolean
  attachments?: Array<{ name: string; type: string }>
}

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantRole: "counselor" | "student"
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isOnline: boolean
}

interface SecureMessagingProps {
  open?: boolean
  onClose?: () => void
}

export function SecureMessaging({ open, onClose }: SecureMessagingProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const conversations: Conversation[] = [
    {
      id: "1",
      participantId: "counselor_1",
      participantName: "Dr. Sarah Wilson",
      participantRole: "counselor",
      lastMessage: "How are you feeling after our last session?",
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      participantId: "counselor_2",
      participantName: "Dr. Michael Chen",
      participantRole: "counselor",
      lastMessage: "I've prepared some resources for you to review",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: "3",
      participantId: "counselor_3",
      participantName: "Dr. Emily Rodriguez",
      participantRole: "counselor",
      lastMessage: "Thank you for sharing that with me",
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 1,
      isOnline: true,
    },
  ]

  const messages: Message[] = [
    {
      id: "1",
      senderId: "counselor_1",
      senderName: "Dr. Sarah Wilson",
      senderRole: "counselor",
      content: "Hi Alex! I hope you're doing well. How have you been feeling since our last session?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "2",
      senderId: "student_1",
      senderName: "Ada Balogun",
      senderRole: "student",
      content:
        "Hi Dr. Wilson! I've been doing better, thanks for asking. The breathing exercises you taught me have been really helpful.",
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      read: true,
    },
    {
      id: "3",
      senderId: "counselor_1",
      senderName: "Dr. Sarah Wilson",
      senderRole: "counselor",
      content:
        "That's wonderful to hear! I'm so glad the techniques are working for you. How are you feeling about the upcoming exams?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
    },
    {
      id: "4",
      senderId: "counselor_1",
      senderName: "Dr. Sarah Wilson",
      senderRole: "counselor",
      content: "Remember, you can always reach out if you need support. I'm here to help.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      read: false,
    },
  ]

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const conversationMessages = selectedConversation ? messages : []

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // Handle sending message
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <MessageSquare className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Secure Messaging</h1>
              <p className="text-emerald-100 text-lg">Private communication with your counselors</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">
                <Shield className="h-6 w-6 inline" />
              </div>
              <div className="text-sm text-emerald-100">End-to-End Encrypted</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-emerald-100">Always Available</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">HIPAA</div>
              <div className="text-sm text-emerald-100">Compliant</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <span>Conversations</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <div className="space-y-1 p-4">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conversation.id
                        ? "bg-emerald-50 border border-emerald-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {conversation.participantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{conversation.participantName}</h4>
                          <div className="flex items-center space-x-1">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                        <Badge variant="outline" className="mt-2 text-xs bg-teal-100 text-teal-800 border-teal-200">
                          <Heart className="h-3 w-3 mr-1" />
                          Counselor
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedConv ? (
            <Card className="border-0 shadow-xl h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {selectedConv.participantName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConv.participantName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs bg-teal-100 text-teal-800 border-teal-200">
                          <Heart className="h-3 w-3 mr-1" />
                          Counselor
                        </Badge>
                        {selectedConv.isOnline && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Online</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hover:bg-blue-50">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-purple-50">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderRole === "student" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] ${message.senderRole === "student" ? "order-2" : "order-1"}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              message.senderRole === "student" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div
                            className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                              message.senderRole === "student" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {message.senderRole === "student" && <CheckCircle className="h-3 w-3 text-blue-600" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" className="hover:bg-gray-50">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-0 h-10 resize-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>End-to-end encrypted</span>
                    </div>
                    <span>Press Enter to send</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-300" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                  <p className="text-gray-600">Choose a counselor to start messaging</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
