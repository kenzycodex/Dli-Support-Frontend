// components/tickets/ModernTicketsFilters.tsx - Modern Mobile-First Filters

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  X, 
  SlidersHorizontal,
  Filter as FilterIcon,
  Flag,
  AlertTriangle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { 
  STATUS_OPTIONS, 
  PRIORITY_OPTIONS, 
  ASSIGNMENT_OPTIONS, 
  SORT_OPTIONS 
} from '@/constants/tickets.constants'
import type { TicketCategory } from '@/services/ticketCategories.service'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ModernTicketsFiltersProps {
  searchTerm: string
  filters: any
  loading: boolean
  userRole?: string
  selectedCount: number
  totalCount: number
  canBulkActions: boolean
  categories: TicketCategory[]
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string | undefined) => void
  onClearFilters: () => void
  onSelectAll: (selected: boolean) => void
}

export function ModernTicketsFilters({
  searchTerm,
  filters,
  loading,
  userRole,
  selectedCount,
  totalCount,
  canBulkActions,
  categories,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onSelectAll
}: ModernTicketsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Check for active filters including category_id
  const hasActiveFilters = searchTerm || 
    filters.status || 
    filters.category_id || 
    filters.priority || 
    filters.assigned ||
    filters.crisis_flag ||
    filters.auto_assigned

  // Get active categories for filtering
  const activeCategories = categories.filter(c => c.is_active)

  // Get currently selected category for display
  const selectedCategory = filters.category_id 
    ? categories.find(c => c.id.toString() === filters.category_id.toString())
    : null

  const activeFiltersCount = [
    searchTerm,
    filters.status && filters.status !== 'all',
    filters.category_id && filters.category_id !== 'all',
    filters.priority && filters.priority !== 'all',
    filters.assigned && filters.assigned !== 'all'
  ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Mobile Search Bar */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-20 h-12 text-base border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              disabled={loading}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Mobile Filter Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <div className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </div>
                )}
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Filters Section */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent>
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-900">Active:</span>
                  
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      "{searchTerm.slice(0, 20)}{searchTerm.length > 20 ? '...' : ''}"
                      <button
                        onClick={() => onSearchChange('')}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.status && filters.status !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {filters.status}
                      <button
                        onClick={() => onFilterChange('status', undefined)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  {selectedCategory && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      {selectedCategory.name}
                      <button
                        onClick={() => onFilterChange('category_id', undefined)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  {filters.priority && filters.priority !== 'all' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      {filters.priority}
                      <button
                        onClick={() => onFilterChange('priority', undefined)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-blue-600 hover:text-blue-800 h-6 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {/* Main Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => onFilterChange('status', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                  <Select
                    value={filters.category_id?.toString() || 'all'}
                    onValueChange={(value) => onFilterChange('category_id', value)}
                    disabled={loading || activeCategories.length === 0}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {activeCategories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()} className="text-sm">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="truncate">{category.name}</span>
                            {category.crisis_detection_enabled && (
                              <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
                  <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) => onFilterChange('priority', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          <div className="flex items-center space-x-2">
                            {option.value === 'Urgent' && <Flag className="h-3 w-3 text-red-500" />}
                            {option.value === 'High' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                            {option.value === 'Medium' && <Clock className="h-3 w-3 text-yellow-500" />}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignment filter for staff/admin */}
                {userRole !== 'student' && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Assignment</label>
                    <Select
                      value={filters.assigned || 'all'}
                      onValueChange={(value) => onFilterChange('assigned', value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="All assignments" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full h-8 text-sm text-gray-600 hover:text-gray-800"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Advanced Filters
                {showAdvancedFilters ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  {/* Crisis Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Crisis Status</label>
                    <Select
                      value={filters.crisis_flag?.toString() || 'all'}
                      onValueChange={(value) => onFilterChange('crisis_flag', value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="true">
                          <div className="flex items-center space-x-2">
                            <Flag className="h-3 w-3 text-red-500" />
                            <span>Crisis Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="false">Non-Crisis Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto-Assignment Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Assignment Type</label>
                    <Select
                      value={filters.auto_assigned || 'all'}
                      onValueChange={(value) => onFilterChange('auto_assigned', value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="yes">
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-green-500" />
                            <span>Auto-assigned</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">Manually assigned</SelectItem>
                        <SelectItem value="no">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SLA Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">SLA Status</label>
                    <Select
                      value={filters.overdue?.toString() || 'all'}
                      onValueChange={(value) => onFilterChange('overdue', value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="true">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-red-500" />
                            <span>Overdue</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="false">Within SLA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Sort By</label>
                    <Select
                      value={`${filters.sort_by || 'updated_at'}-${filters.sort_direction || 'desc'}`}
                      onValueChange={(value) => {
                        const [sort_by, sort_direction] = value.split('-');
                        onFilterChange('sort_by', sort_by);
                        onFilterChange('sort_direction', sort_direction);
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="text-sm text-gray-600">
                    {loading ? 'Loading...' : `${totalCount} tickets found`}
                    {selectedCount > 0 && ` • ${selectedCount} selected`}
                  </span>
                  
                  {/* Category Summary */}
                  {selectedCategory && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span>in {selectedCategory.name}</span>
                      {selectedCategory.sla_response_hours && (
                        <span className="text-gray-400">
                          (SLA: {selectedCategory.sla_response_hours}h)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClearFilters}
                      disabled={loading}
                      className="h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}