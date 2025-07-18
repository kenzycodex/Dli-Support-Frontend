// components/admin-help/tabs/SuggestionsTab.tsx - FIXED: Icon actions without freezing

"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MessageSquare,
  User,
  Calendar,
  Edit,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Clock,
  AlertCircle,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { helpService, type FAQFilters } from "@/services/help.service"
import type { HelpFAQ } from "@/stores/help-store"
import { toast } from "sonner"

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
  suggestedFAQs: HelpFAQ[] // This will be ignored - we'll fetch our own
  adminStats: AdminStats
  loading: {
    faqs: boolean
    update: boolean
    delete: boolean
    approve: boolean
    reject: boolean
  }
  isApproving: boolean
  isRejecting: boolean
  onEditFAQ: (faq: HelpFAQ) => void
  onApproveSuggestion: (faq: HelpFAQ) => void
  onRejectSuggestion: (faq: HelpFAQ) => void
}

// FIXED: Content suggestion item interface
interface ContentSuggestionItem {
  id: number
  category_id: number
  question: string
  answer: string
  slug: string
  tags: string[]
  is_published: boolean
  is_featured: boolean
  created_by: number
  created_at: string
  updated_at: string
  time_ago?: string
  suggestion_type?: string
  helpfulness_rate?: number
  category?: {
    id: number
    name: string
    color: string
  }
  creator?: {
    id: number
    name: string
    email: string
    role?: string
  }
}

// FIXED: Suggestion action dialog
interface SuggestionActionDialogProps {
  isOpen: boolean
  suggestion: ContentSuggestionItem | null
  action: 'edit' | 'approve' | 'reject'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

function SuggestionActionDialog({
  isOpen,
  suggestion,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: SuggestionActionDialogProps) {
  if (!suggestion) return null

  const actionConfig = {
    edit: {
      title: 'Edit Suggestion',
      description: 'Are you sure you want to edit this suggestion?',
      confirmText: 'Edit Suggestion',
      icon: <Edit className="h-4 w-4 mr-2" />,
      className: 'bg-blue-600 hover:bg-blue-700'
    },
    approve: {
      title: 'Approve Suggestion',
      description: 'Are you sure you want to approve this suggestion? It will be published as a new FAQ.',
      confirmText: 'Approve & Publish',
      icon: <ThumbsUp className="h-4 w-4 mr-2" />,
      className: 'bg-green-600 hover:bg-green-700'
    },
    reject: {
      title: 'Reject Suggestion',
      description: 'Are you sure you want to reject this suggestion? This action cannot be undone.',
      confirmText: 'Reject Suggestion',
      icon: <ThumbsDown className="h-4 w-4 mr-2" />,
      className: 'bg-red-600 hover:bg-red-700'
    }
  }

  const config = actionConfig[action]

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{config.description}</p>
              
              <div className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Suggestion #{suggestion.id}</p>
                    <p className="text-sm text-gray-600">By: {suggestion.creator?.name || 'Unknown User'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Question:</p>
                    <p className="text-sm text-gray-900">{suggestion.question}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Answer Preview:</p>
                    <p className="text-sm text-gray-900">{suggestion.answer.substring(0, 100)}...</p>
                  </div>
                </div>
              </div>

              {action === 'approve' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm font-medium">
                    ✅ This suggestion will be published as a new FAQ and become visible to users.
                  </p>
                </div>
              )}

              {action === 'reject' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ This suggestion will be permanently removed and cannot be recovered.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isProcessing}
            className={config.className}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {action === 'edit' ? 'Opening...' : `${action === 'approve' ? 'Approving' : 'Rejecting'}...`}
              </>
            ) : (
              <>
                {config.icon}
                {config.confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SuggestionsTab({
  adminStats,
  loading,
  isApproving,
  isRejecting,
  onEditFAQ,
  onApproveSuggestion,
  onRejectSuggestion
}: SuggestionsTabProps) {
  // FIXED: Local state for suggestions fetched from API
  const [suggestions, setSuggestions] = useState<ContentSuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  })

  // FIXED: Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    suggestion: ContentSuggestionItem | null
    action: 'edit' | 'approve' | 'reject'
    isProcessing: boolean
  }>({
    isOpen: false,
    suggestion: null,
    action: 'edit',
    isProcessing: false
  })

  // Filters state
  const [filters, setFilters] = useState<FAQFilters>({
    search: '',
    status: 'all',
    page: 1,
    per_page: 20
  })

  // FIXED: Fetch suggestions from API
  const fetchSuggestions = useCallback(async (refresh = false) => {
    try {
      if (!refresh) setIsLoading(true)
      setError(null)

      console.log('🎯 SuggestionsTab: Fetching content suggestions with filters:', filters)

      const response = await helpService.getContentSuggestions(filters)

      if (response.success && response.data) {
        console.log('✅ SuggestionsTab: Suggestions fetched successfully:', response.data)
        
        setSuggestions(response.data.suggestions || response.data.items || [])
        setPagination(response.data.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0
        })
      } else {
        throw new Error(response.message || 'Failed to fetch suggestions')
      }
    } catch (error: any) {
      console.error('❌ SuggestionsTab: Failed to fetch suggestions:', error)
      setError(error.message || 'Failed to load content suggestions')
      toast.error('Failed to load content suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Initial load
  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  // Handle filter changes
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as any, page: 1 }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      page: 1,
      per_page: 20
    })
  }, [])

  const handleRefresh = useCallback(() => {
    fetchSuggestions(true)
  }, [fetchSuggestions])

  // FIXED: Convert suggestion to HelpFAQ format for handlers with all required fields
  const convertToHelpFAQ = useCallback((suggestion: ContentSuggestionItem): HelpFAQ => {
    return {
      id: suggestion.id,
      category_id: suggestion.category_id,
      question: suggestion.question,
      answer: suggestion.answer,
      slug: suggestion.slug || `suggestion-${suggestion.id}`,
      tags: suggestion.tags || [],
      sort_order: 0,
      is_published: false, // Suggestions are always unpublished initially
      is_featured: false,
      helpful_count: 0,
      not_helpful_count: 0,
      view_count: 0,
      created_by: suggestion.created_by,
      created_at: suggestion.created_at,
      updated_at: suggestion.updated_at,
      category: suggestion.category
        ? {
            id: suggestion.category.id,
            name: suggestion.category.name,
            color: suggestion.category.color,
            slug: suggestion.category.name.toLowerCase().replace(/\s+/g, '-'),
            icon: "HelpCircle",
            sort_order: 0,
            is_active: true,
            created_at: suggestion.created_at,
            updated_at: suggestion.updated_at
          }
        : undefined,
      creator: suggestion.creator
    }
  }, [])

  // FIXED: Safe action handlers
  const handleEdit = useCallback((suggestion: ContentSuggestionItem) => {
    setActionDialog({
      isOpen: true,
      suggestion,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  const handleApprove = useCallback((suggestion: ContentSuggestionItem) => {
    setActionDialog({
      isOpen: true,
      suggestion,
      action: 'approve',
      isProcessing: false
    })
  }, [])

  const handleReject = useCallback((suggestion: ContentSuggestionItem) => {
    setActionDialog({
      isOpen: true,
      suggestion,
      action: 'reject',
      isProcessing: false
    })
  }, [])

  // FIXED: Execute action safely
  const executeAction = useCallback(async () => {
    const { suggestion, action } = actionDialog
    if (!suggestion) return

    setActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      const helpFAQ = convertToHelpFAQ(suggestion)

      if (action === 'edit') {
        onEditFAQ(helpFAQ)
      } else if (action === 'approve') {
        await onApproveSuggestion(helpFAQ)
        // Refresh suggestions after approval
        await fetchSuggestions(true)
      } else if (action === 'reject') {
        await onRejectSuggestion(helpFAQ)
        // Refresh suggestions after rejection
        await fetchSuggestions(true)
      }

      setActionDialog({
        isOpen: false,
        suggestion: null,
        action: 'edit',
        isProcessing: false
      })
    } catch (error: any) {
      console.error(`Failed to ${action} suggestion:`, error)
      setActionDialog(prev => ({ ...prev, isProcessing: false }))
    }
  }, [actionDialog, convertToHelpFAQ, onEditFAQ, onApproveSuggestion, onRejectSuggestion, fetchSuggestions])

  const cancelAction = useCallback(() => {
    setActionDialog({
      isOpen: false,
      suggestion: null,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const hasActiveFilters = filters.search || (filters.status && filters.status !== 'all')

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
              {pagination.total} Total
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suggestions by question or answer..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-6">
            {suggestions.map((suggestion: ContentSuggestionItem) => {
              const isCurrentlyProcessing = actionDialog.isProcessing && actionDialog.suggestion?.id === suggestion.id
              
              return (
                <Card key={suggestion.id} className="border border-orange-200 bg-orange-50/30 hover:bg-orange-50/50 transition-colors">
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
                              <span>Content Suggestion #{suggestion.id}</span>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>By: {suggestion.creator?.name || 'Unknown User'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                              </div>
                              {suggestion.category && (
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: suggestion.category.color || '#gray' }}
                                  />
                                  <span>{suggestion.category.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* FIXED: Icon-based Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEdit(suggestion)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            disabled={isCurrentlyProcessing || loading.update}
                            title="Edit Suggestion"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleApprove(suggestion)
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={isCurrentlyProcessing || loading.approve}
                            title="Approve Suggestion"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleReject(suggestion)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isCurrentlyProcessing || loading.reject}
                            title="Reject Suggestion"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Question and Answer Preview */}
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Question:</Label>
                          <p className="text-gray-900 font-medium">{suggestion.question}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Answer:</Label>
                          <div className="text-gray-700 prose prose-sm max-w-none">
                            {suggestion.answer && suggestion.answer.length > 300 ? (
                              <div className="space-y-2">
                                <p>{suggestion.answer.substring(0, 300)}...</p>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 h-auto text-orange-600 hover:text-orange-700"
                                  onClick={() => handleEdit(suggestion)}
                                >
                                  Read full answer →
                                </Button>
                              </div>
                            ) : (
                              <p>{suggestion.answer}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {suggestion.tags && Array.isArray(suggestion.tags) && suggestion.tags.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-orange-200">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags:</Label>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.tags.map((tag: string, index: number) => (
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
                          <span>Suggestion ID: #{suggestion.id}</span>
                          {suggestion.creator?.email && (
                            <span>Email: {suggestion.creator.email}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span>Submitted: {new Date(suggestion.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between pt-6">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} suggestions
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
                <h3 className="text-lg font-medium text-gray-900">
                  {hasActiveFilters ? 'No Matching Suggestions' : 'No Content Suggestions'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {hasActiveFilters 
                    ? 'No suggestions match your current filters. Try adjusting your search criteria.'
                    : 'Content suggestions from counselors will appear here for review and approval.'
                  }
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* FIXED: Suggestion Action Confirmation Dialog */}
      <SuggestionActionDialog
        isOpen={actionDialog.isOpen}
        suggestion={actionDialog.suggestion}
        action={actionDialog.action}
        isProcessing={actionDialog.isProcessing}
        onConfirm={executeAction}
        onCancel={cancelAction}
      />
    </Card>
  )
}