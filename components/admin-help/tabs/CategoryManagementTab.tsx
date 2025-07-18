// components/admin-help/tabs/CategoryManagementTab.tsx - FIXED: Icon actions without freezing

"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Edit, 
  Trash2, 
  Settings, 
  Loader2, 
  Eye,
  EyeOff,
  Palette,
  Hash
} from "lucide-react"
import type { HelpCategory } from "@/services/help.service"

interface CategoryManagementTabProps {
  categories: HelpCategory[]
  loading: {
    categories: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  onCreateCategory: () => void
  onEditCategory: (category: HelpCategory) => void
  onDeleteCategory: (category: HelpCategory) => void
}

// FIXED: Individual action dialog for safe operations
interface CategoryActionDialogProps {
  isOpen: boolean
  category: HelpCategory | null
  action: 'edit' | 'delete'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

function CategoryActionDialog({
  isOpen,
  category,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: CategoryActionDialogProps) {
  if (!category) return null

  const isDelete = action === 'delete'
  const hasConnectedFAQs = (category.faqs_count || 0) > 0

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete ? 'Delete Category' : 'Edit Category'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {isDelete 
                  ? 'Are you sure you want to delete this category? This action cannot be undone.'
                  : 'Are you sure you want to edit this category?'
                }
              </p>
              
              <div className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-gray-600">{category.faqs_count || 0} FAQs</p>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
              </div>

              {isDelete && hasConnectedFAQs && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-amber-800 text-sm font-medium">
                    ⚠️ Warning: This category contains {category.faqs_count} FAQ{category.faqs_count! > 1 ? 's' : ''}. 
                    Please move them to another category first or they will become uncategorized.
                  </p>
                </div>
              )}

              {isDelete && !hasConnectedFAQs && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ This will permanently delete the category and cannot be undone.
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
                  <><Trash2 className="h-4 w-4 mr-2" />Delete Category</>
                ) : (
                  <><Edit className="h-4 w-4 mr-2" />Edit Category</>
                )}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CategoryManagementTab({
  categories,
  loading,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryManagementTabProps) {
  // FIXED: Individual action dialog state
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    category: HelpCategory | null
    action: 'edit' | 'delete'
    isProcessing: boolean
  }>({
    isOpen: false,
    category: null,
    action: 'edit',
    isProcessing: false
  })

  // FIXED: Safe action handlers
  const handleEdit = useCallback((category: HelpCategory) => {
    setActionDialog({
      isOpen: true,
      category,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  const handleDelete = useCallback((category: HelpCategory) => {
    setActionDialog({
      isOpen: true,
      category,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  // FIXED: Execute action safely
  const executeAction = useCallback(async () => {
    const { category, action } = actionDialog
    if (!category) return

    setActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      if (action === 'edit') {
        onEditCategory(category)
      } else if (action === 'delete') {
        await onDeleteCategory(category)
      }

      setActionDialog({
        isOpen: false,
        category: null,
        action: 'edit',
        isProcessing: false
      })
    } catch (error: any) {
      console.error(`Failed to ${action} category:`, error)
      setActionDialog(prev => ({ ...prev, isProcessing: false }))
    }
  }, [actionDialog, onEditCategory, onDeleteCategory])

  const cancelAction = useCallback(() => {
    setActionDialog({
      isOpen: false,
      category: null,
      action: 'edit',
      isProcessing: false
    })
  }, [])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>Category Management</span>
            </CardTitle>
            <CardDescription>Organize your help content with categories</CardDescription>
          </div>
          <Button onClick={onCreateCategory} disabled={loading.create}>
            {loading.create ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Category
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {loading.categories ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: HelpCategory) => (
              <Card key={category.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <div 
                            className="w-6 h-6 rounded transition-colors"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span>{category.faqs_count || 0} FAQs</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* FIXED: Icon-based action buttons instead of dropdown */}
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={category.is_active ? "default" : "secondary"}
                          className={category.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                        >
                          {category.is_active ? (
                            <><Eye className="h-3 w-3 mr-1" />Active</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" />Inactive</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Palette className="h-3 w-3" />
                        <span>Sort: {category.sort_order}</span>
                      </span>
                      <span>Updated {new Date(category.updated_at).toLocaleDateString()}</span>
                    </div>

                    {/* FIXED: Safe Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleEdit(category)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={loading.update}
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(category)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loading.delete}
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
                <p className="text-gray-600">Create your first category to organize FAQs</p>
              </div>
              <Button onClick={onCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* FIXED: Category Action Confirmation Dialog */}
      <CategoryActionDialog
        isOpen={actionDialog.isOpen}
        category={actionDialog.category}
        action={actionDialog.action}
        isProcessing={actionDialog.isProcessing}
        onConfirm={executeAction}
        onCancel={cancelAction}
      />
    </Card>
  )
}