"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  X,
  Send,
  Calendar,
  Ticket,
  HelpCircle,
  ChevronRight,
  Bot,
  Loader2,
} from "lucide-react"

interface Message {
  type: "user" | "bot"
  content: string | React.ReactNode
  timestamp: Date
}

interface QuickAction {
  icon: React.ReactNode
  title: string
  description: string
  action: () => void
}

interface ChatBotProps {
  open?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export function ChatBot({ open = false, onClose, isMobile = false }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Hi! I'm your support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const quickActions: QuickAction[] = [
    {
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      title: "Book Appointment",
      description: "Schedule a counseling session",
      action: () => handleQuickAction("I want to book an appointment"),
    },
    {
      icon: <Ticket className="h-5 w-5 text-indigo-600" />,
      title: "Submit Ticket",
      description: "Create a support request",
      action: () => handleQuickAction("I need to submit a support ticket"),
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-violet-600" />,
      title: "FAQ Help",
      description: "Browse common questions",
      action: () => handleQuickAction("Show me the FAQs"),
    },
  ]

  const handleQuickAction = async (query: string) => {
    // Add user message
    const userMessage: Message = {
      type: "user",
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate bot thinking
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Add bot response based on the query
    let botResponse: Message
    switch (query) {
      case "I want to book an appointment":
        botResponse = {
          type: "bot",
          content: (
            <div className="space-y-3">
              <p>I can help you book an appointment. Here are the next available slots:</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between">
                  Today, 2:00 PM - Dr. Sarah Wilson
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Tomorrow, 10:00 AM - Dr. Michael Chen
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Tomorrow, 3:30 PM - Dr. Emily Brown
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ),
          timestamp: new Date(),
        }
        break

      case "I need to submit a support ticket":
        botResponse = {
          type: "bot",
          content: (
            <div className="space-y-3">
              <p>I'll help you submit a support ticket. What type of support do you need?</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between">
                  Technical Support
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Academic Support
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Mental Health Support
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ),
          timestamp: new Date(),
        }
        break

      case "Show me the FAQs":
        botResponse = {
          type: "bot",
          content: (
            <div className="space-y-3">
              <p>Here are some frequently asked questions:</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left">
                  How do I book an appointment with a counselor?
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  What should I do if I'm having a mental health crisis?
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  How do I reset my password?
                </Button>
              </div>
            </div>
          ),
          timestamp: new Date(),
        }
        break

      default:
        botResponse = {
          type: "bot",
          content: "I'm searching through our knowledge base for relevant information...",
          timestamp: new Date(),
        }
    }

    setMessages((prev) => [...prev, botResponse])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot thinking
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Add bot response
    const botResponse: Message = {
      type: "bot",
      content: (
        <div className="space-y-3">
          <p>I couldn't find an exact match for your question. Here are some options that might help:</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => handleQuickAction("I want to book an appointment")}>
              Book an appointment with a counselor
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleQuickAction("I need to submit a support ticket")}>
              Submit a support ticket
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleQuickAction("Show me the FAQs")}>
              Browse FAQs
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, botResponse])
    setIsLoading(false)
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        className={`fixed ${
          isMobile ? "bottom-24 right-4" : "bottom-6 right-6"
        } h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-transform hover:scale-105`}
        onClick={onClose}
        size="icon"
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Support Assistant</h3>
                  <p className="text-sm text-blue-100">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-[85%] ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-2 bg-gray-100">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-4 grid gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="flex items-center space-x-3 w-full p-3 h-auto hover:bg-gray-50"
                    onClick={action.action}
                  >
                    {action.icon}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
