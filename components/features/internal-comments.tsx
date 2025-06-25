// components/features/internal-comments.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Lock, Eye, AlertTriangle, Clock, Shield, Users } from "lucide-react"

interface InternalComment {
  id: string
  author: string
  role: "counselor" | "admin" | "supervisor"
  content: string
  timestamp: Date
  isUrgent: boolean
  visibility: "counselors" | "admins" | "all-staff"
}

interface InternalCommentsProps {
  ticketId: string
  comments: InternalComment[]
  onAddComment: (comment: string, isUrgent: boolean, visibility: string) => void
}

export function InternalComments({ ticketId, comments, onAddComment }: InternalCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [visibility, setVisibility] = useState("counselors")

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment, isUrgent, visibility)
      setNewComment("")
      setIsUrgent(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "counselors":
        return <Users className="h-3 w-3" />
      case "admins":
        return <Shield className="h-3 w-3" />
      case "all-staff":
        return <Eye className="h-3 w-3" />
      default:
        return <Lock className="h-3 w-3" />
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "counselors":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "admins":
        return "bg-red-100 text-red-800 border-red-200"
      case "all-staff":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b">
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-slate-600" />
          <span>Internal Staff Comments</span>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            {comments.length} comments
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">Private comments visible only to authorized staff members</p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Comments List */}
        <ScrollArea className="h-64 p-4">
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xs">
                        {comment.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                          {comment.role}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getVisibilityColor(comment.visibility)}`}>
                          {getVisibilityIcon(comment.visibility)}
                          <span className="ml-1 capitalize">{comment.visibility}</span>
                        </Badge>
                        {comment.isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{comment.content}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No internal comments yet</h3>
                <p className="text-gray-600">Add the first staff comment for this ticket</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Add Comment Form */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-3">
            <Textarea
              placeholder="Add internal staff comment... (not visible to students)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] bg-white"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>Mark as urgent</span>
                </label>

                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="counselors">Counselors only</option>
                  <option value="admins">Admins only</option>
                  <option value="all-staff">All staff</option>
                </select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                size="sm"
                className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>

            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Lock className="h-3 w-3" />
              <span>Internal comments are encrypted and only visible to authorized staff</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
