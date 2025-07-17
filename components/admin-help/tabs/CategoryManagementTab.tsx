// components/admin-help/tabs/CategoryManagementTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Edit, Trash2, MoreHorizontal, Settings, Loader2 } from "lucide-react"
import type { HelpCategory } from "@/services/help.service"

interface CategoryManagementTabProps {
  categories: HelpCategory[]
  loading: {
    categories: boolean
    create: boolean
  }
  onCreateCategory: () => void
  onEditCategory: (category: HelpCategory) => void
  onDeleteCategory: (category: HelpCategory) => void
}

export function CategoryManagementTab({
  categories,
  loading,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryManagementTabProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Category Management</CardTitle>
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
              <Card key={category.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.faqs_count || 0} FAQs</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditCategory(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDeleteCategory(category)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Sort: {category.sort_order}</span>
                      <span>Updated {new Date(category.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">Create your first category to organize FAQs</p>
            <Button onClick={onCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}