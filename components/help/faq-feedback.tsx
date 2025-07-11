// components/help/faq-feedback.tsx
import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Check, 
  X,
  Clock,
  TrendingUp
} from 'lucide-react'
import { useFAQFeedback, useFAQAnalytics, useFAQUtils } from '@/hooks/use-help'
import { cn } from '@/lib/utils'
import type { FAQ, FAQFeedback } from '@/services/help.service'

interface FAQFeedbackProps {
  faq: FAQ
  userFeedback?: FAQFeedback
  className?: string
  showStats?: boolean
  compact?: boolean
}

export function FAQFeedbackComponent({ 
  faq, 
  userFeedback, 
  className,
  showStats = true,
  compact = false
}: FAQFeedbackProps) {
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [comment, setComment] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null)

  const feedbackMutation = useFAQFeedback()
  const { trackFAQFeedback } = useFAQAnalytics()
  const { calculateHelpfulnessRate, getHelpfulnessColor, getHelpfulnessLabel, formatTimeAgo } = useFAQUtils()

  const helpfulnessRate = calculateHelpfulnessRate(faq.helpful_count, faq.not_helpful_count)
  const hasUserFeedback = !!userFeedback
  const isSubmitting = feedbackMutation.isPending

  const handleFeedback = useCallback(async (isHelpful: boolean) => {
    if (hasUserFeedback || isSubmitting) return

    setSelectedFeedback(isHelpful)
    
    try {
      await feedbackMutation.mutateAsync({
        faqId: faq.id,
        feedback: { is_helpful: isHelpful, comment: comment.trim() || undefined }
      })

      // Track analytics
      trackFAQFeedback(faq.id, isHelpful, faq.question)

      // Reset form
      setComment('')
      setShowCommentForm(false)
      setSelectedFeedback(null)
    } catch (error) {
      setSelectedFeedback(null)
    }
  }, [faq, comment, hasUserFeedback, isSubmitting, feedbackMutation, trackFAQFeedback])

  const handleThumbsClick = useCallback((isHelpful: boolean) => {
    if (hasUserFeedback) return
    
    if (comment.trim()) {
      // Submit immediately if comment is provided
      handleFeedback(isHelpful)
    } else {
      // Show comment form for additional feedback
      setSelectedFeedback(isHelpful)
      setShowCommentForm(true)
    }
  }, [comment, hasUserFeedback, handleFeedback])

  const handleSubmitWithComment = useCallback(() => {
    if (selectedFeedback !== null) {
      handleFeedback(selectedFeedback)
    }
  }, [selectedFeedback, handleFeedback])

  const handleCancel = useCallback(() => {
    setShowCommentForm(false)
    setSelectedFeedback(null)
    setComment('')
  }, [])

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        <div className="flex items-center space-x-2">
          <Button
            variant={hasUserFeedback && userFeedback.is_helpful ? "default" : "outline"}
            size="sm"
            onClick={() => handleThumbsClick(true)}
            disabled={hasUserFeedback || isSubmitting}
            className="h-8"
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            {faq.helpful_count}
          </Button>
          <Button
            variant={hasUserFeedback && !userFeedback.is_helpful ? "default" : "outline"}
            size="sm"
            onClick={() => handleThumbsClick(false)}
            disabled={hasUserFeedback || isSubmitting}
            className="h-8"
          >
            <ThumbsDown className="h-3 w-3 mr-1" />
            {faq.not_helpful_count}
          </Button>
        </div>
        
        {showStats && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-3 w-3" />
            <span className={getHelpfulnessColor(helpfulnessRate)}>
              {helpfulnessRate}% helpful
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("border-0 bg-gray-50", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Feedback Stats */}
        {showStats && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {helpfulnessRate}% found this helpful
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getHelpfulnessColor(helpfulnessRate))}
                >
                  {getHelpfulnessLabel(helpfulnessRate)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Updated {formatTimeAgo(faq.updated_at)}</span>
            </div>
          </div>
        )}

        {/* Feedback Question */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">
            Was this helpful?
          </p>

          {/* Feedback Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant={hasUserFeedback && userFeedback.is_helpful ? "default" : "outline"}
              size="sm"
              onClick={() => handleThumbsClick(true)}
              disabled={hasUserFeedback || isSubmitting}
              className={cn(
                "flex items-center space-x-2",
                selectedFeedback === true && "ring-2 ring-green-500"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Yes ({faq.helpful_count})</span>
              {hasUserFeedback && userFeedback.is_helpful && (
                <Check className="h-3 w-3 ml-1" />
              )}
            </Button>

            <Button
              variant={hasUserFeedback && !userFeedback.is_helpful ? "default" : "outline"}
              size="sm"
              onClick={() => handleThumbsClick(false)}
              disabled={hasUserFeedback || isSubmitting}
              className={cn(
                "flex items-center space-x-2",
                selectedFeedback === false && "ring-2 ring-red-500"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>No ({faq.not_helpful_count})</span>
              {hasUserFeedback && !userFeedback.is_helpful && (
                <Check className="h-3 w-3 ml-1" />
              )}
            </Button>

            {!hasUserFeedback && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Add comment</span>
              </Button>
            )}
          </div>

          {/* User's Previous Feedback */}
          {hasUserFeedback && userFeedback.comment && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Your feedback:</p>
                  <p className="text-sm text-blue-800 mt-1">{userFeedback.comment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Comment Form */}
          {showCommentForm && !hasUserFeedback && (
            <div className="space-y-3 p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {selectedFeedback === true ? 'What made this helpful?' : 
                   selectedFeedback === false ? 'How can we improve this?' : 
                   'Additional feedback (optional)'}
                </span>
              </div>
              
              <Textarea
                placeholder="Share your thoughts to help us improve..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {comment.length}/500 characters
                </span>
                
                <div className="flex items-center space-x-2">
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
                    onClick={selectedFeedback !== null ? handleSubmitWithComment : () => {
                      // If no thumbs selection, ask user to select first
                      if (selectedFeedback === null) {
                        setSelectedFeedback(true) // Default to helpful
                      }
                      handleSubmitWithComment()
                    }}
                    disabled={isSubmitting}
                    className="min-w-[80px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {hasUserFeedback && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Thank you for your feedback! This helps us improve our content.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Overall Stats Summary */}
        {showStats && !compact && (faq.helpful_count > 0 || faq.not_helpful_count > 0) && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {faq.helpful_count + faq.not_helpful_count} people rated this FAQ
              </span>
              <span>
                {faq.view_count} views
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}