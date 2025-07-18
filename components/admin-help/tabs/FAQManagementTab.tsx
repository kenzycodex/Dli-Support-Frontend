// components/admin-help/tabs/FAQManagementTab.tsx - SIMPLIFIED: No bulk actions

"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Plus, 
  Search, 
  X, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff, 
  Edit, 
  Trash2, 
  Loader2,
  Settings,
  Tag,
  Calendar,
  User,
  Globe,
  Lock,
  Heart
} from "lucide-react"
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory, FAQFilters } from "@/services/help.service"

// SIMPLIFIED: Filter options interface
interface FilterOptions {
  search?: string
  status?: 'all' | 'published' | 'unpublished' | 'featured'
  category?: string
  sort_by?: 'featured' | 'helpful' | 'views' | 'newest'
  page?: number
  per_page?: number
}

interface FAQManagementTabProps {
  faqs: HelpFAQ[]
  categories: HelpCategory[]
  filters: FilterOptions
  hasActiveFilters: boolean
  loading: {
    faqs: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  onCreateFAQ: () => void
  onEditFAQ: (faq: HelpFAQ) => void
  onDeleteFAQ: (faq: HelpFAQ) => void
  onTogglePublish: (faq: HelpFAQ) => void
  onToggleFeature: (faq: HelpFAQ) => void
  setFilters: (filters: Partial<FilterOptions>, immediate?: boolean) => void
}

// SIMPLIFIED: Individual FAQ action dialog
interface IndividualActionDialogProps {
  isOpen: boolean
  faq: HelpFAQ | null
  action: 'edit' | 'delete'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

function IndividualActionDialog({
  isOpen,
  faq,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: IndividualActionDialogProps) {
  if (!faq) return null

  const isDelete = action === 'delete'

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete ? 'Delete FAQ' : 'Edit FAQ'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {isDelete 
                  ? 'Are you sure you want to delete this FAQ? This action cannot be undone.'
                  : 'Are you sure you want to edit this FAQ?'
                }
              </p>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="font-medium">
                  {faq.question}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {faq.answer.substring(0, 100)}...
                </p>
              </div>
              {isDelete && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ This will permanently delete the FAQ and all associated data.
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
            className={isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isDelete ? 'Deleting...' : 'Opening...'}
              </>
            ) : (
              <>
                {isDelete ? (
                  <><Trash2 className="h-4 w-4 mr-2" />Delete FAQ</>
                ) : (
                  <><Edit className="h-4 w-4 mr-2" />Edit FAQ</>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function FAQManagementTab({
  faqs,
  categories,
  filters,
  hasActiveFilters,
  loading,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onCreateFAQ,
  onEditFAQ,
  onDeleteFAQ,
  onTogglePublish,
  onToggleFeature,
  setFilters
}: FAQManagementTabProps) {
  // SIMPLIFIED: Individual action dialog state only
  const [individualActionDialog, setIndividualActionDialog] = useState<{
    isOpen: boolean
    faq: HelpFAQ | null
    action: 'edit' | 'delete'
    isProcessing: boolean
  }>({
    isOpen: false,
    faq: null,
    action: 'edit',
    isProcessing: false
  })

  // Local search state with debouncing
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // SIMPLIFIED: Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    
    // Simple debouncing
    const timeoutId = setTimeout(() => {
      onSearchChange(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [onSearchChange])

  // SIMPLIFIED: Individual action handlers
  const handleIndividualEdit = useCallback((faq: HelpFAQ) => {
    setIndividualActionDialog({
      isOpen: true,
      faq,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  const handleIndividualDelete = useCallback((faq: HelpFAQ) => {
    setIndividualActionDialog({
      isOpen: true,
      faq,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  // SIMPLIFIED: Execute individual action
  const executeIndividualAction = useCallback(async () => {
    const { faq, action } = individualActionDialog
    if (!faq) return

    setIndividualActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      if (action === 'edit') {
        onEditFAQ(faq)
      } else if (action === 'delete') {
        await onDeleteFAQ(faq)
      }

      setIndividualActionDialog({
        isOpen: false,
        faq: null,
        action: 'edit',
        isProcessing: false
      })
    } catch (error: any) {
      console.error(`Failed to ${action} FAQ:`, error)
      setIndividualActionDialog(prev => ({ ...prev, isProcessing: false }))
    }
  }, [individualActionDialog, onEditFAQ, onDeleteFAQ])

  // SIMPLIFIED: Safe quick actions with event propagation handling
  const handleQuickPublish = useCallback(async (faq: HelpFAQ, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await onTogglePublish(faq)
    } catch (error) {
      console.error('Quick publish failed:', error)
    }
  }, [onTogglePublish])

  const handleQuickFeature = useCallback(async (faq: HelpFAQ, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await onToggleFeature(faq)
    } catch (error) {
      console.error('Quick feature failed:', error)
    }
  }, [onToggleFeature])

  // SIMPLIFIED: Filtered FAQs
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          faq.question.toLowerCase().includes(searchLower) ||
          faq.answer.toLowerCase().includes(searchLower) ||
          faq.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'published':
            if (!faq.is_published) return false
            break
          case 'unpublished':
            if (faq.is_published) return false
            break
          case 'featured':
            if (!faq.is_featured) return false
            break
        }
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && faq.category_id !== category.id) return false
      }
      
      return true
    })
  }, [faqs, searchTerm, filters, categories])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>FAQ Management</span>
            </CardTitle>
            <CardDescription>
              Manage help articles with individual actions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCreateFAQ} disabled={loading.create}>
              {loading.create ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create FAQ
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
                placeholder="Search FAQs by question, answer, or tags..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.status || 'all'} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category || 'all'} onValueChange={(value) => onFilterChange('category', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* FAQs List */}
        {loading.faqs ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">
                Showing {filteredFAQs.length} FAQ{filteredFAQs.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500">
                {filteredFAQs.length} total results
              </div>
            </div>

            {/* FAQ Cards */}
            {filteredFAQs.map((faq) => (
              <Card 
                key={faq.id} 
                className="transition-all duration-200 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* FAQ Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {/* Question */}
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {faq.question}
                          </h3>
                          
                          {/* Answer Preview */}
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {faq.answer.substring(0, 150)}...
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <span>ID: {faq.id}</span>
                            </div>
                            {faq.category && (
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: faq.category.color }}
                                />
                                <span>{faq.category.name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                            </div>
                            {faq.creator && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{faq.creator.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Tags */}
                          {faq.tags && faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {faq.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{faq.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {/* Status Badges */}
                          <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center space-x-1">
                              {faq.is_published ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Draft
                                </Badge>
                              )}
                              {faq.is_featured && (
                                <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{faq.view_count || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Heart className="h-3 w-3" />
                                <span>{faq.helpful_count || 0}</span>
                              </span>
                            </div>
                          </div>

                          {/* SIMPLIFIED: Safe Action Buttons */}
                          <div className="flex items-center space-x-1">
                            {/* Quick Publish Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleQuickPublish(faq, e)}
                              className={faq.is_published ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                              disabled={loading.update}
                              title={faq.is_published ? 'Unpublish FAQ' : 'Publish FAQ'}
                            >
                              {faq.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>

                            {/* Quick Feature Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleQuickFeature(faq, e)}
                              className={faq.is_featured ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-gray-600'}
                              disabled={loading.update}
                              title={faq.is_featured ? 'Unfeature FAQ' : 'Feature FAQ'}
                            >
                              {faq.is_featured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                            </Button>
                            
                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleIndividualEdit(faq)
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit FAQ"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleIndividualDelete(faq)
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Delete FAQ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">No FAQs Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {hasActiveFilters 
                    ? 'No FAQs match your current filters. Try adjusting your search criteria.'
                    : 'Get started by creating your first FAQ.'
                  }
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={onClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={onCreateFAQ}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First FAQ
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* SIMPLIFIED: Individual Action Confirmation Dialog */}
      <IndividualActionDialog
        isOpen={individualActionDialog.isOpen}
        faq={individualActionDialog.faq}
        action={individualActionDialog.action}
        isProcessing={individualActionDialog.isProcessing}
        onConfirm={executeIndividualAction}
        onCancel={() => setIndividualActionDialog({ 
          isOpen: false, 
          faq: null, 
          action: 'edit', 
          isProcessing: false 
        })}
      />
    </Card>
  )
}