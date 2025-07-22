// components/tickets/EnhancedTicketsFilters.tsx - Enhanced with Dynamic Categories

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown, 
  Filter as FilterIcon,
  Flag,
  AlertTriangle,
  Clock,
  Users
} from "lucide-react"
import { 
  STATUS_OPTIONS, 
  PRIORITY_OPTIONS, 
  ASSIGNMENT_OPTIONS, 
  SORT_OPTIONS 
} from '@/constants/tickets.constants'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface EnhancedTicketsFiltersProps {
  searchTerm: string
  filters: any
  loading: boolean
  userRole?: string
  selectedCount: number
  totalCount: number
  canBulkActions: boolean
  categories: TicketCategory[] // ENHANCED: Dynamic categories
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string | undefined) => void
  onClearFilters: () => void
  onSelectAll: (selected: boolean) => void
}

export function EnhancedTicketsFilters({
  searchTerm,
  filters,
  loading,
  userRole,
  selectedCount,
  totalCount,
  canBulkActions,
  categories, // ENHANCED: Categories data
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onSelectAll
}: EnhancedTicketsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // ENHANCED: Check for active filters including category_id
  const hasActiveFilters = searchTerm || 
    filters.status || 
    filters.category_id || 
    filters.priority || 
    filters.assigned ||
    filters.crisis_flag ||
    filters.auto_assigned

  const isAllSelected = selectedCount === totalCount && totalCount > 0

  // ENHANCED: Get active categories for filtering
  const activeCategories = categories.filter(c => c.is_active)

  // ENHANCED: Get currently selected category for display
  const selectedCategory = filters.category_id 
    ? categories.find(c => c.id.toString() === filters.category_id.toString())
    : null

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets by ID, subject, description, user, or category..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-11"
                disabled={loading}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* ENHANCED: Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border">
              <span className="text-sm font-medium text-blue-900">Active Filters:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.status && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Status: {filters.status}
                  <button
                    onClick={() => onFilterChange('status', undefined)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {selectedCategory && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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

              {filters.priority && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Priority: {filters.priority}
                  <button
                    onClick={() => onFilterChange('priority', undefined)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.assigned && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Assignment: {filters.assigned}
                  <button
                    onClick={() => onFilterChange('assigned', undefined)}
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
                className="text-blue-600 hover:text-blue-800 h-6"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              {/* Status Filter */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ENHANCED: Dynamic Categories Filter */}
              <Select
                value={filters.category_id?.toString() || 'all'}
                onValueChange={(value) => onFilterChange('category_id', value)}
                disabled={loading || activeCategories.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {activeCategories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                        {category.crisis_detection_enabled && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        {category.auto_assign && (
                          <Users className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => onFilterChange('priority', value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
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

              {/* Assignment filter for staff/admin */}
              {userRole !== 'student' && (
                <Select
                  value={filters.assigned || 'all'}
                  onValueChange={(value) => onFilterChange('assigned', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Filter by assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-11"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Advanced
              </Button>

              {/* Sort */}
              <Select
                value={`${filters.sort_by || 'updated_at'}-${filters.sort_direction || 'desc'}`}
                onValueChange={(value) => {
                  const [sort_by, sort_direction] = value.split('-');
                  onFilterChange('sort_by', sort_by);
                  onFilterChange('sort_direction', sort_direction);
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-11 w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  disabled={loading}
                  className="h-11"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* ENHANCED: Advanced Filters with Crisis and Auto-Assignment */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
              {/* Crisis Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Crisis Status
                </label>
                <Select
                  value={filters.crisis_flag?.toString() || 'all'}
                  onValueChange={(value) => onFilterChange('crisis_flag', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="h-9">
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
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Assignment Type
                </label>
                <Select
                  value={filters.auto_assigned || 'all'}
                  onValueChange={(value) => onFilterChange('auto_assigned', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="h-9">
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

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Created Date Range
                </label>
                <div className="flex gap-2">
                  <Input 
                    type="date" 
                    className="h-9" 
                    onChange={(e) => onFilterChange('created_after', e.target.value)}
                  />
                  <Input 
                    type="date" 
                    className="h-9"
                    onChange={(e) => onFilterChange('created_before', e.target.value)}
                  />
                </div>
              </div>

              {/* SLA Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  SLA Status
                </label>
                <Select
                  value={filters.overdue?.toString() || 'all'}
                  onValueChange={(value) => onFilterChange('overdue', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="h-9">
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
            </div>
          )}

          {/* ENHANCED: Results Summary with Category Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
            <div className="space-y-1">
              <span>
                {loading ? 'Loading...' : `${totalCount} tickets found`}
                {selectedCount > 0 && ` • ${selectedCount} selected`}
              </span>
              
              {/* Category Summary */}
              {selectedCategory && (
                <div className="flex items-center space-x-2 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <span>in {selectedCategory.name}</span>
                  {selectedCategory.sla_response_hours && (
                    <span className="text-gray-500">
                      (SLA: {selectedCategory.sla_response_hours}h)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bulk Selection */}
            {canBulkActions && totalCount > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  disabled={loading}
                />
                <span className="text-xs">Select all visible</span>
              </div>
            )}
          </div>

          {/* ENHANCED: Quick Filter Shortcuts */}
          {!hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Quick filters:</span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('crisis_flag', 'true')}
                className="h-6 text-xs"
              >
                <Flag className="h-3 w-3 mr-1 text-red-500" />
                Crisis
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('assigned', 'unassigned')}
                className="h-6 text-xs"
              >
                <Users className="h-3 w-3 mr-1 text-gray-500" />
                Unassigned
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('auto_assigned', 'yes')}
                className="h-6 text-xs"
              >
                <Users className="h-3 w-3 mr-1 text-green-500" />
                Auto-assigned
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange('overdue', 'true')}
                className="h-6 text-xs"
              >
                <Clock className="h-3 w-3 mr-1 text-red-500" />
                Overdue
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}