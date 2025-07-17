// components/admin-help/shared/SearchAndFilters.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { HelpCategory } from "@/services/help.service"
import { FilterOptions } from "@/types/admin-help"

interface SearchAndFiltersProps {
  searchTerm: string
  filters: FilterOptions
  categories: HelpCategory[]
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export function SearchAndFilters({
  searchTerm,
  filters,
  categories,
  hasActiveFilters,
  onSearchChange,
  onFilterChange,
  onClearFilters
}: SearchAndFiltersProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select 
        value={filters.category || 'all'} 
        onValueChange={(value) => onFilterChange('category', value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category: HelpCategory) => (
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

      <Select 
        value={filters.status || 'all'} 
        onValueChange={(value) => onFilterChange('status', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="unpublished">Unpublished</SelectItem>
          <SelectItem value="featured">Featured</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.sort_by || 'newest'} 
        onValueChange={(value) => onFilterChange('sort_by', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="featured">Featured</SelectItem>
          <SelectItem value="helpful">Most Helpful</SelectItem>
        </SelectContent>
      </Select>

      {(hasActiveFilters || searchTerm) && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}