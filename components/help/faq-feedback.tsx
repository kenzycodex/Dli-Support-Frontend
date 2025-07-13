// components/help/faq-feedback.tsx (NEW - FAQ Feedback Component)
"use client"

import { useState, useCallback } from "react"
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
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  Users,
  Eye,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFAQFeedback, useFAQAnalytics, useFAQUtils } from "@/hooks/use-help"
import { useAuth } from "@/contexts/AuthContext"
import type { FAQ } from "@/services/help.service"

interface FAQFeedbackProps {
  faq: FAQ
  showStats?: boolean
  compact?: boolean
  className?: string
}

export function FAQFeedbackComponent({ 
  faq, 
  showStats = true, 
  compact = false,
  className 
}: FAQFeedbackProps) {
  const { user } = useAuth()
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'not_helpful'>('helpful')
  const [comment, setComment] = useState('')
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false)

  const faqFeedback = useFAQFeedback()
  const { trackFAQFeedback } = useFAQAnalytics()
  const { calculateHelpfulnessRate, getHelpfulnessColor, getHelpfulnessLabel } = useFAQUtils()

  // Calculate helpfulness statistics
  const helpfulnessRate = calculateHelpfulnessRate(faq.helpful_count, faq.not_helpful_count)
  const totalFeedback = faq.helpful_count + faq.not_helpful_count
  const helpfulnessColor = getHelpfulnessColor(helpfulnessRate)
  const helpfulnessLabel = getHelpfulnessLabel(helpfulnessRate)

  // Handle feedback button click
  const handleFeedbackClick = useCallback((isHelpful: boolean) => {
    if (!user) {
      // Could trigger login modal here
      return
    }

    setFeedbackType(isHelpful ? 'helpful' : 'not_helpful')
    setShowFeedbackDialog(true)
  }, [user])

  // Submit feedback
  const handleSubmitFeedback = useCallback(async () => {
    if (!user) return

    try {
      await faqFeedback.mutateAsync({
        faqId: faq.id,
        feedback: {
          is_helpful: feedbackType === 'helpful',
          comment: comment.trim() || undefined
        }
      })

      // Track analytics
      trackFAQFeedback(faq.id, feedbackType === 'helpful', faq.question)

      setHasSubmittedFeedback(true)
      setShowFeedbackDialog(false)
      setComment('')
    } catch (error) {
      // Error is handled by the mutation
      console.error('Feedback submission error:', error)
    }
  }, [user, faq.id, faq.question, feedbackType, comment, faqFeedback, trackFAQFeedback])

  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setShowFeedbackDialog(false)
    setComment('')
  }, [])

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-4", className)}>
        {/* Compact feedback buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackClick(true)}
            disabled={faqFeedback.isPending || hasSubmittedFeedback}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="ml-1 text-xs">{faq.helpful_count}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedbackClick(false)}
            disabled={faqFeedback.isPending || hasSubmittedFeedback}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="ml-1 text-xs">{faq.not_helpful_count}</span>
          </Button>
        </div>

        {showStats && totalFeedback > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <TrendingUp className="h-3 w-3" />
            <span>{helpfulnessRate}% helpful</span>
          </div>
        )}

        {/* Feedback Dialog */}
        <FeedbackDialog
          isOpen={showFeedbackDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitFeedback}
          feedbackType={feedbackType}
          comment={comment}
          onCommentChange={setComment}
          isLoading={faqFeedback.isPending}
          faqQuestion={faq.question}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main feedback section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Was this helpful?</span>
          
          {hasSubmittedFeedback ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Thank you for your feedback!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedbackClick(true)}
                disabled={faqFeedback.isPending}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                {faqFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                <span className="ml-1">Yes</span>
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  {faq.helpful_count}
                </Badge>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedbackClick(false)}
                disabled={faqFeedback.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {faqFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                <span className="ml-1">No</span>
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                  {faq.not_helpful_count}
                </Badge>
              </Button>
            </div>
          )}
        </div>

        {/* Additional feedback button */}
        {!hasSubmittedFeedback && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedbackDialog(true)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Add comment
          </Button>
        )}
      </div>

      {/* Statistics section */}
      {showStats && (
        <Card className="bg-gray-50 border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Helpfulness Rate */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <TrendingUp className={cn("h-5 w-5", helpfulnessColor)} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{helpfulnessRate}%</div>
                  <div className="text-xs text-gray-600">{helpfulnessLabel}</div>
                </div>
              </div>

              {/* Total Feedback */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalFeedback}</div>
                  <div className="text-xs text-gray-600">
                    {totalFeedback === 1 ? 'person gave' : 'people gave'} feedback
                  </div>
                </div>
              </div>
            </div>

            {/* Helpfulness breakdown */}
            {totalFeedback > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Feedback breakdown</span>
                  <span>{totalFeedback} total</span>
                </div>
                <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                  {faq.helpful_count > 0 && (
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${(faq.helpful_count / totalFeedback) * 100}%` }}
                    />
                  )}
                  {faq.not_helpful_count > 0 && (
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${(faq.not_helpful_count / totalFeedback) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Helpful ({faq.helpful_count})
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    Not helpful ({faq.not_helpful_count})
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitFeedback}
        feedbackType={feedbackType}
        comment={comment}
        onCommentChange={setComment}
        isLoading={faqFeedback.isPending}
        faqQuestion={faq.question}
      />
    </div>
  )
}

// Feedback Dialog Component
interface FeedbackDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  feedbackType: 'helpful' | 'not_helpful'
  comment: string
  onCommentChange: (comment: string) => void
  isLoading: boolean
  faqQuestion: string
}

function FeedbackDialog({
  isOpen,
  onClose,
  onSubmit,
  feedbackType,
  comment,
  onCommentChange,
  isLoading,
  faqQuestion
}: FeedbackDialogProps) {
  const isHelpful = feedbackType === 'helpful'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isHelpful ? (
              <ThumbsUp className="h-5 w-5 text-green-600" />
            ) : (
              <ThumbsDown className="h-5 w-5 text-red-600" />
            )}
            <span>
              {isHelpful ? 'Great!' : 'Sorry to hear that'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isHelpful 
              ? "We're glad this FAQ was helpful. Any additional comments?"
              : "Help us improve this FAQ. What could be better?"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* FAQ Question */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">FAQ:</div>
            <div className="text-sm text-gray-600 line-clamp-2">{faqQuestion}</div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {isHelpful ? 'Additional comments (optional)' : 'How can we improve this? (optional)'}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={
                isHelpful 
                  ? "Any additional thoughts or suggestions..."
                  : "Please tell us what was unclear or missing..."
              }
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isLoading}
            className={cn(
              isHelpful 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isHelpful ? (
              <ThumbsUp className="h-4 w-4 mr-2" />
            ) : (
              <ThumbsDown className="h-4 w-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}