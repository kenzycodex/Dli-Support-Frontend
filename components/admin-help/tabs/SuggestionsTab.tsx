// components/admin-help/tabs/SuggestionsTab.tsx
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
  Loader2
} from "lucide-react"
import type { HelpFAQ } from "@/stores/help-store"
import { AdminStats } from "@/types/admin-help"

interface SuggestionsTabProps {
  suggestedFAQs: HelpFAQ[]
  adminStats: AdminStats
  loading: {
    faqs: boolean
    update: boolean
    delete: boolean
  }
  isApproving: boolean
  isRejecting: boolean
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
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Suggestions</CardTitle>
            <CardDescription>Review and manage content suggestions from counselors</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {adminStats.suggested_faqs} Pending
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {loading.faqs ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : suggestedFAQs.length > 0 ? (
          <div className="space-y-6">
            {suggestedFAQs.map((faq: HelpFAQ) => (
              <Card key={faq.id} className="border border-blue-200 bg-blue-50/30">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Suggestion Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Content Suggestion</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Suggested by: {faq.creator?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: faq.category?.color || '#gray' }}
                              />
                              <span>{faq.category?.name || 'Unknown Category'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditFAQ(faq)}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          disabled={loading.update}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onApproveSuggestion(faq)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isApproving || loading.update}
                        >
                          {isApproving || loading.update ? (
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
                          disabled={isRejecting || loading.delete}
                        >
                          {isRejecting || loading.delete ? (
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
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Question:</Label>
                        <p className="text-gray-900 font-medium">{faq.question}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Answer:</Label>
                        <div className="text-gray-700 prose prose-sm max-w-none">
                          {faq.answer.length > 300 ? (
                            <>
                              <p>{faq.answer.substring(0, 300)}...</p>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 h-auto text-blue-600"
                                onClick={() => onEditFAQ(faq)}
                              >
                                Read full answer
                              </Button>
                            </>
                          ) : (
                            <p>{faq.answer}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tags:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {faq.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs bg-white">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Suggestion Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                      <div className="text-sm text-gray-500">
                        Suggestion ID: #{faq.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(faq.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Suggestions</h3>
            <p className="text-gray-600 mb-4">
              Content suggestions from counselors will appear here for review and approval.
            </p>
            <div className="space-y-2 text-sm text-gray-500 max-w-md mx-auto">
              <p>• Counselors can suggest new FAQ content</p>
              <p>• You can approve, reject, or edit suggestions</p>
              <p>• Approved suggestions become published FAQs</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}