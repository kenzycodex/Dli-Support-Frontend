"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  HelpCircle,
  BookOpen,
  Video,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
  lastUpdated: string
}

interface Guide {
  id: string
  title: string
  description: string
  type: "article" | "video" | "tutorial"
  duration: string
  difficulty: "beginner" | "intermediate" | "advanced"
  rating: number
}

export function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I book an appointment with a counselor?",
      answer:
        "You can book an appointment by clicking the 'Book Appointment' button on your dashboard or in the Appointments section. Choose your preferred type (video, phone, or chat), select a counselor, pick a date and time, and confirm your booking.",
      category: "appointments",
      helpful: 45,
      notHelpful: 2,
      lastUpdated: "2024-01-15",
    },
    {
      id: "2",
      question: "Is my information kept confidential?",
      answer:
        "Yes, absolutely. All your personal information, session notes, and communications are kept strictly confidential in accordance with HIPAA regulations and our privacy policy. Information is only shared with your explicit consent or in cases where there's immediate danger.",
      category: "privacy",
      helpful: 67,
      notHelpful: 1,
      lastUpdated: "2024-01-10",
    },
    {
      id: "3",
      question: "What should I do if I'm having a mental health crisis?",
      answer:
        "If you're experiencing a mental health crisis, please reach out immediately. Use our Crisis Support button for 24/7 assistance, call the National Suicide Prevention Lifeline at 988, or contact emergency services at 911 if you're in immediate danger.",
      category: "crisis",
      helpful: 89,
      notHelpful: 0,
      lastUpdated: "2024-01-12",
    },
    {
      id: "4",
      question: "How do I reset my password?",
      answer:
        "Click the 'Forgot Password' link on the login page, enter your email address, and you'll receive a password reset link. Follow the instructions in the email to create a new password.",
      category: "technical",
      helpful: 34,
      notHelpful: 3,
      lastUpdated: "2024-01-08",
    },
    {
      id: "5",
      question: "Can I cancel or reschedule my appointment?",
      answer:
        "Yes, you can cancel or reschedule appointments up to 24 hours before the scheduled time. Go to your Appointments page, find the appointment, and click 'Reschedule' or 'Cancel'. Please note our cancellation policy for late cancellations.",
      category: "appointments",
      helpful: 56,
      notHelpful: 4,
      lastUpdated: "2024-01-14",
    },
    {
      id: "6",
      question: "What types of counseling services are available?",
      answer:
        "We offer individual counseling, group therapy, crisis intervention, academic counseling, and specialized support for anxiety, depression, stress management, and relationship issues. All services are provided by licensed professionals.",
      category: "services",
      helpful: 78,
      notHelpful: 2,
      lastUpdated: "2024-01-11",
    },
  ]

  const guides: Guide[] = [
    {
      id: "1",
      title: "Getting Started with the Platform",
      description: "Complete guide to navigating your student support hub",
      type: "tutorial",
      duration: "10 min",
      difficulty: "beginner",
      rating: 4.8,
    },
    {
      id: "2",
      title: "Preparing for Your First Counseling Session",
      description: "Tips and advice for making the most of your counseling experience",
      type: "article",
      duration: "5 min read",
      difficulty: "beginner",
      rating: 4.9,
    },
    {
      id: "3",
      title: "Using Video Sessions Effectively",
      description: "Technical setup and best practices for video counseling",
      type: "video",
      duration: "8 min",
      difficulty: "intermediate",
      rating: 4.7,
    },
    {
      id: "4",
      title: "Crisis Resources and Emergency Contacts",
      description: "Important information about crisis support and emergency resources",
      type: "article",
      duration: "3 min read",
      difficulty: "beginner",
      rating: 5.0,
    },
  ]

  const categories = [
    { id: "all", name: "All Categories", count: faqs.length },
    { id: "appointments", name: "Appointments", count: faqs.filter((f) => f.category === "appointments").length },
    { id: "technical", name: "Technical", count: faqs.filter((f) => f.category === "technical").length },
    { id: "privacy", name: "Privacy & Security", count: faqs.filter((f) => f.category === "privacy").length },
    { id: "crisis", name: "Crisis Support", count: faqs.filter((f) => f.category === "crisis").length },
    { id: "services", name: "Services", count: faqs.filter((f) => f.category === "services").length },
  ]

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-blue-600" />
      case "tutorial":
        return <BookOpen className="h-4 w-4 text-green-600" />
      case "article":
        return <BookOpen className="h-4 w-4 text-purple-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <HelpCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Help Center</h1>
              <p className="text-blue-100 text-lg">Find answers and get support</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{faqs.length}</div>
              <div className="text-sm text-blue-100">FAQs</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{guides.length}</div>
              <div className="text-sm text-blue-100">Guides</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, FAQs, or guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Options */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="font-medium">Live Chat</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Phone className="h-7 w-7" />
          <span className="font-medium">Call Support</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <Mail className="h-7 w-7" />
          <span className="font-medium">Email Us</span>
        </Button>
        <Button
          className="h-24 flex-col space-y-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg transition-all duration-200"
          size="lg"
        >
          <BookOpen className="h-7 w-7" />
          <span className="font-medium">User Guide</span>
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="faqs" className="rounded-lg font-medium">
            FAQs
          </TabsTrigger>
          <TabsTrigger value="guides" className="rounded-lg font-medium">
            Guides & Tutorials
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg font-medium">
            Contact Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <Card className="border-0 shadow-lg lg:col-span-1">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQs */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <span>Frequently Asked Questions</span>
                    <Badge variant="secondary">{filteredFAQs.length} results</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredFAQs.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-4">
                      {filteredFAQs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-start space-x-3">
                              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="font-medium">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-6">
                            <div className="space-y-4">
                              <p className="text-gray-700 leading-relaxed ml-8">{faq.answer}</p>
                              <div className="flex items-center justify-between ml-8">
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">Was this helpful?</span>
                                  <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm">
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      {faq.helpful}
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <ThumbsDown className="h-4 w-4 mr-1" />
                                      {faq.notHelpful}
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>Updated {new Date(faq.lastUpdated).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12">
                      <HelpCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                      <p className="text-gray-600">Try adjusting your search or browse different categories</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <span>Guides & Tutorials</span>
              </CardTitle>
              <CardDescription>Step-by-step guides to help you make the most of our platform</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide) => (
                  <Card key={guide.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                              {getTypeIcon(guide.type)}
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{guide.title}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="capitalize">
                                  {guide.type}
                                </Badge>
                                <span className="text-sm text-gray-500">{guide.duration}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{guide.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{guide.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(guide.difficulty)}>{guide.difficulty}</Badge>
                          <Button size="sm" variant="outline" className="hover:bg-purple-50">
                            <span>View Guide</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-medium">Phone Support</h4>
                      <p className="text-sm text-gray-600">Mon-Fri, 8AM-6PM</p>
                      <p className="font-mono text-lg">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email Support</h4>
                      <p className="text-sm text-gray-600">Response within 24 hours</p>
                      <p className="text-blue-600">support@university.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Live Chat</h4>
                      <p className="text-sm text-gray-600">Available 24/7</p>
                      <Button size="sm" className="mt-2">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-6 w-6 text-orange-600" />
                  <span>Additional Resources</span>
                </CardTitle>
                <CardDescription>External links and emergency contacts</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">University IT Help Desk</h4>
                      <p className="text-sm text-gray-600">Technical support for university systems</p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Student Services Portal</h4>
                      <p className="text-sm text-gray-600">Academic and administrative support</p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Campus Safety</h4>
                      <p className="text-sm text-gray-600">Emergency services and safety resources</p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
