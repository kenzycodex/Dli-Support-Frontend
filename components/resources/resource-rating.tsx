// components/resources/resource-rating.tsx
import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  MessageSquare, 
  Check, 
  X,
  TrendingUp,
  ThumbsUp,
  Heart,
  Award
} from 'lucide-react'
import { useResourceFeedback, useResourceAnalytics, useResourceUtils } from '@/hooks/use-resources'
import { cn } from '@/lib/utils'
import type { Resource, ResourceFeedback } from '@/services/resources.service'

interface ResourceRatingProps {
  resource: Resource
  userFeedback?: ResourceFeedback
  className?: string
  showStats?: boolean
  compact?: boolean
  onRatingChange?: (rating: number) => void
}

export function ResourceRatingComponent({ 
  resource, 
  userFeedback, 
  className,
  showStats = true,
  compact = false,
  onRatingChange
}: ResourceRatingProps) {
  const [rating, setRating] = useState(userFeedback?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(userFeedback?.comment || '')
  const [isRecommended, setIsRecommended] = useState(userFeedback?.is_recommended ?? true)
  const [showForm, setShowForm] = useState(false)

  const feedbackMutation = useResourceFeedback()
  const { trackResourceRating } = useResourceAnalytics()
  const { calculateRatingPercentage, formatCount } = useResourceUtils()

  const hasUserFeedback = !!userFeedback
  const isSubmitting = feedbackMutation.isPending
  const displayRating = hoverRating || rating
  const ratingPercentage = calculateRatingPercentage(resource.rating)

  const handleStarClick = useCallback((starRating: number) => {
    if (hasUserFeedback && !showForm) return

    setRating(starRating)
    onRatingChange?.(starRating)
    
    if (!showForm) {
      setShowForm(true)
    }
  }, [hasUserFeedback, showForm, onRatingChange])

  const handleSubmit = useCallback(async () => {
    if (!rating || isSubmitting) return

    try {
      await feedbackMutation.mutateAsync({
        resourceId: resource.id,
        feedback: {
          rating,
          comment: comment.trim() || undefined,
          is_recommended: isRecommended
        }
      })

      // Track analytics
      trackResourceRating(resource.id, resource.title, rating)

      setShowForm(false)
    } catch (error) {
      // Error handling is done in the mutation
    }
  }, [rating, comment, isRecommended, resource, feedbackMutation, trackResourceRating, isSubmitting])

  const handleCancel = useCallback(() => {
    if (!hasUserFeedback) {
      setRating(0)
      setComment('')
      setIsRecommended(true)
    } else {
      setRating(userFeedback.rating)
      setComment(userFeedback.comment || '')
      setIsRecommended(userFeedback.is_recommended)
    }
    setShowForm(false)
  }, [hasUserFeedback, userFeedback])

  const StarIcon = ({ index }: { index: number }) => (
    <button
      type="button"
      className={cn(
        "transition-colors duration-150",
        hasUserFeedback && !showForm ? "cursor-default" : "cursor-pointer hover:scale-110"
      )}
      onClick={() => handleStarClick(index)}
      onMouseEnter={() => !hasUserFeedback && setHoverRating(index)}
      onMouseLeave={() => !hasUserFeedback && setHoverRating(0)}
      disabled={hasUserFeedback && !showForm}
    >
      <Star
        className={cn(
          "h-5 w-5 transition-colors",
          index <= displayRating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        )}
      />
    </button>
  )

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">
            ({formatCount(resource.view_count)} views)
          </span>
        </div>
        
        {hasUserFeedback && (
          <Badge variant="secondary" className="text-xs">
            You rated: {userFeedback.rating} stars
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("border-0 bg-gray-50", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Award className="h-5 w-5 text-purple-600" />
          <span>Rate this resource</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Resource Rating */}
        {showStats && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {resource.rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3 w-3",
                        star <= Math.round(resource.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <div className="border-l pl-3">
                <div className="text-sm font-medium text-gray-900">
                  {ratingPercentage}% positive
                </div>
                <div className="text-xs text-gray-500">
                  Based on community feedback
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{formatCount(resource.view_count)} views</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ThumbsUp className="h-4 w-4" />
                <span>{formatCount(resource.download_count)} downloads</span>
              </div>
            </div>
          </div>
        )}

        {/* User Rating Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {hasUserFeedback ? 'Your rating:' : 'Rate this resource:'}
            </span>
            
            {hasUserFeedback && !showForm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(true)}
                className="text-sm"
              >
                Edit rating
              </Button>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((index) => (
              <StarIcon key={index} index={index} />
            ))}
            
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Previous Feedback Display */}
          {hasUserFeedback && !showForm && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= userFeedback.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-900">
                      You rated this {userFeedback.rating} star{userFeedback.rating !== 1 ? 's' : ''}
                    </span>
                    
                    {userFeedback.is_recommended && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Heart className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  
                  {userFeedback.comment && (
                    <p className="text-sm text-blue-800 mt-2">{userFeedback.comment}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rating Form */}
          {showForm && rating > 0 && (
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              {/* Recommendation Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRecommended(!isRecommended)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors",
                    isRecommended
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isRecommended && "fill-current")} />
                  <span className="text-sm font-medium">
                    {isRecommended ? 'I recommend this resource' : 'Click to recommend'}
                  </span>
                </button>
              </div>

              {/* Comment Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Share your thoughts (optional)
                </label>
                <Textarea
                  placeholder="What did you think of this resource? Your feedback helps others..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 text-right">
                  {comment.length}/1000 characters
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !rating}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {hasUserFeedback ? 'Update' : 'Submit'} Rating
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {hasUserFeedback && !showForm && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Thank you for rating this resource! Your feedback helps others discover quality content.
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}