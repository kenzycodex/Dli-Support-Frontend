// components/resources/resource-rating.tsx - SIMPLIFIED & MODERN VERSION
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  Users,
  Loader2,
  Check,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Direct store usage
import {
  useResourcesActions,
  useResourcesLoading,
  type ResourceItem,
} from '@/stores/resources-store';

// Direct service import
import { resourcesService } from '@/services/resources.service';

export interface ResourceFeedback {
  id: number;
  resource_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}

interface ResourceRatingProps {
  resource: ResourceItem;
  showStats?: boolean;
  compact?: boolean;
  userFeedback?: ResourceFeedback;
}

// Utility functions
const calculateRatingPercentage = (rating: number): number => {
  return Math.round((rating / 5) * 100);
};

const formatCount = (count: number | undefined | null): string => {
  const safeCount = Number(count) || 0;
  if (safeCount < 1000) return safeCount.toString();
  if (safeCount < 1000000) return `${(safeCount / 1000).toFixed(1)}K`;
  return `${(safeCount / 1000000).toFixed(1)}M`;
};

export function ResourceRatingComponent({
  resource,
  showStats = true,
  compact = false,
  userFeedback,
}: ResourceRatingProps) {
  const { user } = useAuth();

  // Store usage
  const { provideFeedback } = useResourcesActions();
  const loading = useResourcesLoading();

  // Local state management
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState(userFeedback?.rating || 0);
  const [comment, setComment] = useState(userFeedback?.comment || '');
  const [isRecommended, setIsRecommended] = useState(userFeedback?.is_recommended ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit rating handler
  const handleSubmitRating = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to provide feedback');
      return;
    }

    if (!selectedRating) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resourcesService.provideFeedback(resource.id, {
        rating: selectedRating,
        comment: comment.trim() || undefined,
        is_recommended: isRecommended,
      });

      if (response.success) {
        setShowRatingDialog(false);
        toast.success('Thank you for your feedback!');

        await provideFeedback(resource.id, {
          rating: selectedRating,
          comment: comment.trim() || undefined,
          is_recommended: isRecommended,
        });
      } else {
        throw new Error(response.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRating, comment, isRecommended, resource.id, user, provideFeedback]);

  // Star rendering function - FIXED: No layout shift on hover
  const renderStars = useCallback(
    (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
      const starSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
      const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => interactive && setSelectedRating(star)}
              disabled={!interactive}
              className={cn(
                'transition-colors duration-150 focus:outline-none',
                interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  starSize,
                  star <= (interactive ? selectedRating : safeRating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300',
                  'transition-colors duration-150'
                )}
              />
            </button>
          ))}
        </div>
      );
    },
    [selectedRating]
  );

  // Computed values
  const resourceRating = useMemo(() => Number(resource.rating) || 0, [resource.rating]);
  const viewCount = useMemo(() => resource.view_count || 0, [resource.view_count]);
  const ratingPercentage = useMemo(
    () => calculateRatingPercentage(resourceRating),
    [resourceRating]
  );

  // Compact view
  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderStars(resourceRating, false, 'sm')}
          <span className="text-sm font-medium text-gray-700">{resourceRating.toFixed(1)}</span>
          {showStats && (
            <span className="text-xs text-gray-500">({formatCount(viewCount)} reviews)</span>
          )}
        </div>

        {user && !userFeedback && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRatingDialog(true)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Star className="h-3 w-3 mr-1" />
            Rate
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Rating Overview */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {renderStars(resourceRating, false, 'lg')}
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {resourceRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">out of 5</div>
                </div>
              </div>

              {showStats && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{ratingPercentage}% satisfaction</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{formatCount(viewCount)} reviews</span>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="text-right">
                {userFeedback ? (
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Rated
                    </Badge>
                    <div className="flex items-center gap-2">
                      {renderStars(userFeedback.rating, false, 'sm')}
                      <span className="text-sm font-medium">{userFeedback.rating}/5</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRating(userFeedback.rating);
                        setComment(userFeedback.comment || '');
                        setIsRecommended(userFeedback.is_recommended);
                        setShowRatingDialog(true);
                      }}
                    >
                      Edit Rating
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowRatingDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
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
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Your Review</span>
                  <Badge
                    variant={userFeedback.is_recommended ? 'default' : 'destructive'}
                    className="text-xs"
                  >
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
                <p className="text-gray-700 text-sm leading-relaxed">{userFeedback.comment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {userFeedback ? 'Update Rating' : 'Rate Resource'}
            </DialogTitle>
            <DialogDescription>
              Rate "{resource.title}" and help others discover great content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Simple Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Rating *</label>
              <div className="flex justify-center p-3 bg-gray-50 rounded-lg">
                {renderStars(selectedRating, true, 'lg')}
              </div>
              {selectedRating > 0 && (
                <p className="text-center text-sm text-gray-600">
                  {selectedRating === 1 && 'Poor'}
                  {selectedRating === 2 && 'Fair'}
                  {selectedRating === 3 && 'Good'}
                  {selectedRating === 4 && 'Very Good'}
                  {selectedRating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Simple Recommendation */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Recommendation</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isRecommended ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsRecommended(true)}
                  className="flex-1"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Recommend
                </Button>
                <Button
                  type="button"
                  variant={!isRecommended ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setIsRecommended(false)}
                  className="flex-1"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Don't Recommend
                </Button>
              </div>
            </div>

            {/* Simple Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                placeholder="Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 text-right">{comment.length}/300</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitRating}
              disabled={!selectedRating || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : userFeedback ? (
                'Update'
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
