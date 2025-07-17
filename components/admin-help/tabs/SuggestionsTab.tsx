// components/admin-help/tabs/SuggestionsTab.tsx - FIXED: Better suggestion display

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  MessageSquare,
  User,
  Calendar,
  Edit,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Clock,
  AlertCircle
} from "lucide-react"
import type { HelpFAQ } from "@/stores/help-store"

// FIXED: Proper AdminStats interface
interface AdminStats {
  total_faqs: number
  published_faqs: number
  draft_faqs: number
  featured_faqs: number
  categories_count: number
  active_categories: number
  suggested_faqs: number
}

interface SuggestionsTabProps {
  suggestedFAQs: HelpFAQ[]
  adminStats: AdminStats
  loading: {
    faqs: boolean
    update: boolean
    delete: boolean
    approve: boolean
    reject: boolean
  }
  isApproving: boolean  // FIXED: Added missing prop
  isRejecting: boolean  // FIXED: Added missing prop
  onEditFAQ: (faq: HelpFAQ) => void
  onApproveSuggestion: (faq: HelpFAQ) => void
  onRejectSuggestion: (faq: HelpFAQ) => void
}

export function SuggestionsTab({
  suggestedFAQs,
  adminStats,
  loading,
  isApproving,
  isRejecting,
  onEditFAQ,
  onApproveSuggestion,
  onRejectSuggestion
}: SuggestionsTabProps) {
  // FIXED: Better suggestion filtering logic
  const actualSuggestions = suggestedFAQs.filter(faq => 
    !faq.is_published && 
    faq.created_by && 
    faq.created_by !== 0  // Not created by system/admin
  )

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <span>Content Suggestions</span>
            </CardTitle>
            <CardDescription>Review and manage content suggestions from counselors</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {actualSuggestions.length} Pending
            </Badge>
            {loading.faqs && (
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {loading.faqs ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : actualSuggestions.length > 0 ? (
          <div className="space-y-6">
            {actualSuggestions.map((faq: HelpFAQ) => {
              const isCurrentlyApproving = isApproving && loading.approve
              const isCurrentlyRejecting = isRejecting && loading.reject
              
              return (
                <Card key={faq.id} className="border border-orange-200 bg-orange-50/30 hover:bg-orange-50/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Suggestion Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                              <span>Content Suggestion</span>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>By: {faq.creator?.name || 'Unknown User'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                              </div>
                              {faq.category && (
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: faq.category.color || '#gray' }}
                                  />
                                  <span>{faq.category.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditFAQ(faq)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            disabled={loading.update || isCurrentlyApproving || isCurrentlyRejecting}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onApproveSuggestion(faq)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isCurrentlyApproving || isCurrentlyRejecting || loading.update}
                          >
                            {isCurrentlyApproving ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectSuggestion(faq)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            disabled={isCurrentlyRejecting || isCurrentlyApproving || loading.update}
                          >
                            {isCurrentlyRejecting ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      {/* Question and Answer Preview */}
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Question:</Label>
                          <p className="text-gray-900 font-medium">{faq.question}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Answer:</Label>
                          <div className="text-gray-700 prose prose-sm max-w-none">
                            {faq.answer && faq.answer.length > 300 ? (
                              <div className="space-y-2">
                                <p>{faq.answer.substring(0, 300)}...</p>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 h-auto text-orange-600 hover:text-orange-700"
                                  onClick={() => onEditFAQ(faq)}
                                >
                                  Read full answer →
                                </Button>
                              </div>
                            ) : (
                              <p>{faq.answer}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-orange-200">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags:</Label>
                            <div className="flex flex-wrap gap-2">
                              {faq.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-800 border-orange-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Suggestion Metadata */}
                      <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Suggestion ID: #{faq.id}</span>
                          {faq.creator?.email && (
                            <span>Email: {faq.creator.email}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span>Submitted: {new Date(faq.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-orange-100 rounded-full">
                  <MessageSquare className="h-16 w-16 text-orange-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">No Content Suggestions</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Content suggestions from counselors will appear here for review and approval.
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 text-left">
                    <p className="font-medium mb-2">How suggestions work:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Counselors can suggest new FAQ content</li>
                      <li>• You can approve, reject, or edit suggestions</li>
                      <li>• Approved suggestions become published FAQs</li>
                      <li>• Rejected suggestions are removed from the system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}