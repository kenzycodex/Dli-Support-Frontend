"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  Star,
  Clock,
  Download,
  ExternalLink,
  Play,
  Bookmark,
  Share,
} from "lucide-react"

interface Resource {
  id: string
  title: string
  description: string
  type: "article" | "video" | "audio" | "exercise" | "tool" | "worksheet"
  category: string
  subcategory: string
  duration: string
  difficulty: "beginner" | "intermediate" | "advanced"
  rating: number
  downloads: number
  tags: string[]
  author: string
  publishedDate: string
  featured: boolean
}

export function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("featured")

  const resources: Resource[] = [
    {
      id: "1",
      title: "Mindfulness Meditation for Beginners",
      description:
        "Learn the basics of mindfulness meditation with this comprehensive guide designed specifically for students.",
      type: "video",
      category: "Mental Health",
      subcategory: "Mindfulness",
      duration: "25 min",
      difficulty: "beginner",
      rating: 4.8,
      downloads: 1250,
      tags: ["meditation", "stress relief", "mindfulness", "beginner"],
      author: "Dr. Sarah Wilson",
      publishedDate: "2024-01-15",
      featured: true,
    },
    {
      id: "2",
      title: "Study Schedule Planner Template",
      description: "Downloadable template to help you organize your study time and improve academic performance.",
      type: "worksheet",
      category: "Academic Success",
      subcategory: "Time Management",
      duration: "Self-paced",
      difficulty: "beginner",
      rating: 4.6,
      downloads: 2100,
      tags: ["planning", "organization", "study skills", "templates"],
      author: "Academic Success Team",
      publishedDate: "2024-01-12",
      featured: true,
    },
    {
      id: "3",
      title: "Breathing Exercises for Anxiety",
      description: "Quick and effective breathing techniques to help manage anxiety and panic attacks.",
      type: "audio",
      category: "Mental Health",
      subcategory: "Anxiety Management",
      duration: "15 min",
      difficulty: "beginner",
      rating: 4.9,
      downloads: 1800,
      tags: ["anxiety", "breathing", "relaxation", "quick relief"],
      author: "Dr. Michael Chen",
      publishedDate: "2024-01-10",
      featured: true,
    },
    {
      id: "4",
      title: "Building Healthy Relationships",
      description: "Comprehensive guide to developing and maintaining healthy relationships during college years.",
      type: "article",
      category: "Social Wellness",
      subcategory: "Relationships",
      duration: "20 min read",
      difficulty: "intermediate",
      rating: 4.7,
      downloads: 950,
      tags: ["relationships", "communication", "social skills", "college life"],
      author: "Dr. Emily Rodriguez",
      publishedDate: "2024-01-08",
      featured: false,
    },
    {
      id: "5",
      title: "Cognitive Behavioral Therapy Workbook",
      description: "Interactive workbook with CBT exercises and techniques for managing negative thought patterns.",
      type: "worksheet",
      category: "Mental Health",
      subcategory: "Therapy Techniques",
      duration: "Self-paced",
      difficulty: "intermediate",
      rating: 4.8,
      downloads: 1400,
      tags: ["CBT", "therapy", "mental health", "self-help"],
      author: "Clinical Psychology Team",
      publishedDate: "2024-01-05",
      featured: true,
    },
    {
      id: "6",
      title: "Sleep Hygiene for Students",
      description: "Evidence-based strategies to improve sleep quality and establish healthy sleep habits.",
      type: "video",
      category: "Physical Wellness",
      subcategory: "Sleep Health",
      duration: "18 min",
      difficulty: "beginner",
      rating: 4.5,
      downloads: 1100,
      tags: ["sleep", "health", "wellness", "habits"],
      author: "Wellness Center",
      publishedDate: "2024-01-03",
      featured: false,
    },
    {
      id: "7",
      title: "Progressive Muscle Relaxation",
      description: "Guided audio session for deep relaxation and stress relief through progressive muscle relaxation.",
      type: "audio",
      category: "Mental Health",
      subcategory: "Stress Management",
      duration: "30 min",
      difficulty: "beginner",
      rating: 4.7,
      downloads: 1600,
      tags: ["relaxation", "stress relief", "muscle tension", "guided"],
      author: "Dr. Sarah Wilson",
      publishedDate: "2024-01-01",
      featured: false,
    },
    {
      id: "8",
      title: "Financial Wellness for Students",
      description: "Practical tools and strategies for managing finances and reducing money-related stress.",
      type: "tool",
      category: "Life Skills",
      subcategory: "Financial Management",
      duration: "Interactive",
      difficulty: "intermediate",
      rating: 4.4,
      downloads: 800,
      tags: ["finance", "budgeting", "money management", "stress"],
      author: "Student Services",
      publishedDate: "2023-12-28",
      featured: false,
    },
  ]

  const categories = [
    { id: "all", name: "All Categories", count: resources.length },
    {
      id: "Mental Health",
      name: "Mental Health",
      count: resources.filter((r) => r.category === "Mental Health").length,
    },
    {
      id: "Academic Success",
      name: "Academic Success",
      count: resources.filter((r) => r.category === "Academic Success").length,
    },
    {
      id: "Social Wellness",
      name: "Social Wellness",
      count: resources.filter((r) => r.category === "Social Wellness").length,
    },
    {
      id: "Physical Wellness",
      name: "Physical Wellness",
      count: resources.filter((r) => r.category === "Physical Wellness").length,
    },
    { id: "Life Skills", name: "Life Skills", count: resources.filter((r) => r.category === "Life Skills").length },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5 text-blue-600" />
      case "audio":
        return <Headphones className="h-5 w-5 text-purple-600" />
      case "article":
        return <BookOpen className="h-5 w-5 text-green-600" />
      case "exercise":
        return <Brain className="h-5 w-5 text-orange-600" />
      case "tool":
        return <Heart className="h-5 w-5 text-pink-600" />
      case "worksheet":
        return <Download className="h-5 w-5 text-indigo-600" />
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />
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

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    const matchesType = selectedType === "all" || resource.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case "featured":
        return b.featured ? 1 : -1
      case "rating":
        return b.rating - a.rating
      case "downloads":
        return b.downloads - a.downloads
      case "newest":
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      default:
        return 0
    }
  })

  const featuredResources = resources.filter((r) => r.featured).slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Resource Library</h1>
              <p className="text-indigo-100 text-lg">
                Comprehensive collection of mental health and wellness resources
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">{resources.length}+</div>
              <div className="text-sm text-indigo-100">Total Resources</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">6</div>
              <div className="text-sm text-indigo-100">Categories</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold">Free</div>
              <div className="text-sm text-indigo-100">All Resources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-600" />
            <span>Featured Resources</span>
          </CardTitle>
          <CardDescription>Hand-picked resources recommended by our counselors</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                          {getTypeIcon(resource.type)}
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{resource.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {resource.type}
                        </Badge>
                        <span className="text-sm text-gray-500">{resource.duration}</span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      >
                        Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search resources by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-0 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="worksheet">Worksheets</SelectItem>
                  <SelectItem value="tool">Tools</SelectItem>
                  <SelectItem value="exercise">Exercises</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Resources</h2>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {sortedResources.length} resources found
          </Badge>
        </div>

        {sortedResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge variant="outline" className="capitalize w-fit">
                            {resource.type}
                          </Badge>
                          {resource.featured && <Badge className="bg-yellow-100 text-yellow-800 w-fit">Featured</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{resource.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(resource.difficulty)}>{resource.difficulty}</Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Download className="h-3 w-3" />
                          <span>{resource.downloads}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{resource.duration}</span>
                        <span>•</span>
                        <span>{resource.author}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{resource.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1" size="sm">
                        {resource.type === "video" && <Play className="h-4 w-4 mr-2" />}
                        {resource.type === "worksheet" && <Download className="h-4 w-4 mr-2" />}
                        {resource.type === "tool" && <ExternalLink className="h-4 w-4 mr-2" />}
                        Access
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedType("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
