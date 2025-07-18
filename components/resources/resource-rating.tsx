// components/resources/resource-rating.tsx - FIXED: Following Help Center pattern, no freezing issues
"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  Users,
  Loader2
} from "lucide-react"

// FIXED: Import the corrected hooks
import { useResourceFeedback, useResourceUtils } from "@/hooks/use-resources"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import type { ResourceItem } from "@/stores/resources-store"
import type { ResourceFeedback } from "@/services/resources.service"
import { toast } from "sonner"

interface ResourceRatingProps {
  resource: ResourceItem
  showStats?: boolean
  compact?: boolean
  userFeedback?: ResourceFeedback
}

export function ResourceRatingComponent({ 
  resource, 
  showStats = true, 
  compact = false,
  userFeedback 
}: ResourceRatingProps) {
  const { user } = useAuth()
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [selectedRating, setSelectedRating] = useState(userFeedback?.rating || 0)
  const [comment, setComment] = useState(userFeedback?.comment || "")
  const [isRecommended, setIsRecommended] = useState(userFeedback?.is_recommended ?? true)

  // FIXED: Use the corrected hooks with proper destructuring
  const { submitFeedback, isLoading: feedbackLoading } = useResourceFeedback()
  const { calculateRatingPercentage, formatCount } = useResourceUtils()

  const handleSubmitRating = useCallback(async () => {
    if (!selectedRating) {
      toast.error('Please select a rating')
      return
    }

    try {
      // FIXED: Use the returned function directly
      const success = await submitFeedback(resource.id, {
        rating: selectedRating,
        comment: comment.trim() || undefined,
        is_recommended: isRecommended
      })
      
      if (success) {
        setShowRatingDialog(false)
        toast.success('Thank you for your feedback!')
      }
    } catch (error) {
      console.error('❌ ResourceRating: Submit feedback failed:', error)
      // Error handling is done in the mutation hook
    }
  }, [selectedRating, comment, isRecommended, resource.id, submitFeedback])

  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0))
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setSelectedRating(star)}
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                starSize,
                star <= safeRating
                  ? "text-yellow-500 fill-current"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {renderStars(Number(resource.rating) || 0, false, 'sm')}
          <span className="text-sm font-medium">{(Number(resource.rating) || 0).toFixed(1)}</span>
          {showStats && (
            <span className="text-xs text-gray-500">
              ({formatCount(resource.view_count || 0)} reviews)
            </span>
          )}
        </div>
        
        {user && !userFeedback && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRatingDialog(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Rate
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Overview */}
      <Card className="border-0 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {renderStars(Number(resource.rating) || 0, false, 'lg')}
                <div>
                  <div className="text-2xl font-bold">{(Number(resource.rating) || 0).toFixed(1)}</div>
                  <div className="text-sm text-gray-600">out of 5 stars</div>
                </div>
              </div>
              
              {showStats && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{calculateRatingPercentage(Number(resource.rating) || 0)}% satisfaction</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{formatCount(resource.view_count || 0)} reviews</span>
                  </div>
                </div>
              )}
            </div>
            
            {user && (
              <div className="text-right space-y-2">
                {userFeedback ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      You rated this resource
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {renderStars(userFeedback.rating, false, 'sm')}
                      <span className="text-sm font-medium">{userFeedback.rating}/5</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRating(userFeedback.rating)
                        setComment(userFeedback.comment || "")
                        setIsRecommended(userFeedback.is_recommended)
                        setShowRatingDialog(true)
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Update Rating
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowRatingDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Resource
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User's Previous Feedback */}
      {userFeedback?.comment && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">Your Review</span>
                  <Badge variant="outline" className={cn(
                    userFeedback.is_recommended 
                      ? "bg-green-50 text-green-700" 
                      : "bg-red-50 text-red-700"
                  )}>
                    {userFeedback.is_recommended ? (
                      <>
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Recommended
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Not Recommended
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-gray-700 text-sm">{userFeedback.comment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userFeedback ? 'Update Your Rating' : 'Rate This Resource'}
            </DialogTitle>
            <DialogDescription>
              Share your experience with "{resource.title}" to help other users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Star Rating */}
            <div className="text-center space-y-2">
              <label className="text-sm font-medium">Your Rating *</label>
              <div className="flex justify-center">
                {renderStars(selectedRating, true, 'lg')}
              </div>
              {selectedRating > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedRating === 1 && "Poor - Not helpful"}
                  {selectedRating === 2 && "Fair - Somewhat helpful"}
                  {selectedRating === 3 && "Good - Helpful"}
                  {selectedRating === 4 && "Very Good - Very helpful"}
                  {selectedRating === 5 && "Excellent - Extremely helpful"}
                </p>
              )}
            </div>

            {/* Recommendation */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Would you recommend this resource?</label>
              <div className="flex space-x-3">
                <Button
                  variant={isRecommended ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsRecommended(true)}
                  className={cn(
                    "flex-1",
                    isRecommended && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  variant={!isRecommended ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsRecommended(false)}
                  className={cn(
                    "flex-1",
                    !isRecommended && "bg-red-600 hover:bg-red-700"
                  )}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comments (optional)
              </label>
              <Textarea
                placeholder="Share your thoughts about this resource..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 text-right">
                {comment.length}/500 characters
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              disabled={feedbackLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={!selectedRating || feedbackLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {feedbackLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  {userFeedback ? 'Update Rating' : 'Submit Rating'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}