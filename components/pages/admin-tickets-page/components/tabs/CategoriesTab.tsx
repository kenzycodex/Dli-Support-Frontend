// components/tabs/CategoriesTab.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, Edit, Trash2, Bot, AlertTriangle, Timer } from "lucide-react"
import { TicketData } from "@/stores/ticket-store"
import { TicketCategory } from "@/services/ticketCategories.service"

interface CategoriesTabProps {
  categories: TicketCategory[]
  tickets: TicketData[]
  isLoading: boolean
  onCreateCategory: () => void
  onEditCategory: (category: TicketCategory) => void
  onDeleteCategory: (category: TicketCategory) => void
}

export function CategoriesTab({
  categories,
  tickets,
  isLoading,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory
}: CategoriesTabProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <span>Category Management</span>
            </CardTitle>
            <CardDescription>Organize tickets with dynamic categories</CardDescription>
          </div>
          <Button 
            disabled={isLoading} 
            size="sm"
            onClick={onCreateCategory}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Category</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading && !categories.length ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category) => {
              const categoryTickets = tickets.filter(t => t.category_id === category.id)
              const openTickets = categoryTickets.filter(t => ['Open', 'In Progress'].includes(t.status))
              const crisisTickets = categoryTickets.filter(t => t.crisis_flag)

              return (
                <Card
                  key={category.id}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            <div
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-base sm:text-lg truncate">{category.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {categoryTickets.length} tickets
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-xs">
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Category Features */}
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        {category.auto_assign && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Auto-assign</span>
                          </div>
                        )}
                        {category.crisis_detection_enabled && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Crisis Detection</span>
                          </div>
                        )}
                        {category.sla_response_hours && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{category.sla_response_hours}h SLA</span>
                          </div>
                        )}
                      </div>

                      {category.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* Ticket Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="font-medium text-blue-700">{categoryTickets.length}</div>
                          <div className="text-blue-600 text-xs">Total</div>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded">
                          <div className="font-medium text-yellow-700">{openTickets.length}</div>
                          <div className="text-yellow-600 text-xs">Active</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-700">{crisisTickets.length}</div>
                          <div className="text-red-600 text-xs">Crisis</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-gray-500">
                          Sort: {category.sort_order}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditCategory(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteCategory(category)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              Create your first category to organize tickets
            </p>
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