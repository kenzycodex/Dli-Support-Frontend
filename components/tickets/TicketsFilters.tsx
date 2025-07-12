// components/tickets/TicketsFilters.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown, 
  Filter as FilterIcon 
} from "lucide-react"
import { 
  STATUS_OPTIONS, 
  CATEGORY_OPTIONS, 
  PRIORITY_OPTIONS, 
  ASSIGNMENT_OPTIONS, 
  SORT_OPTIONS 
} from '@/constants/tickets.constants'

interface TicketsFiltersProps {
  searchTerm: string
  filters: any
  loading: boolean
  userRole?: string
  selectedCount: number
  totalCount: number
  canBulkActions: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string | undefined) => void
  onClearFilters: () => void
  onSelectAll: (selected: boolean) => void
}

export function TicketsFilters({
  searchTerm,
  filters,
  loading,
  userRole,
  selectedCount,
  totalCount,
  canBulkActions,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onSelectAll
}: TicketsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const hasActiveFilters = searchTerm || 
    filters.status || 
    filters.category || 
    filters.priority || 
    filters.assigned

  const isAllSelected = selectedCount === totalCount && totalCount > 0

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets by ID, subject, description, or user..."
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

          {/* Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
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

              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => onFilterChange('category', value)}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                      {option.label}
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

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Created Date Range
                </label>
                <div className="flex gap-2">
                  <Input type="date" className="h-9" />
                  <Input type="date" className="h-9" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Has Attachments
                </label>
                <Select>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">With attachments</SelectItem>
                    <SelectItem value="no">Without attachments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Response Count
                </label>
                <Select>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="none">No responses</SelectItem>
                    <SelectItem value="some">Has responses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {loading ? 'Loading...' : `${totalCount} tickets found`}
              {selectedCount > 0 && ` • ${selectedCount} selected`}
            </span>

            {/* Bulk Selection */}
            {canBulkActions && totalCount > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  disabled={loading}
                />
                <span className="text-xs">Select all</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}