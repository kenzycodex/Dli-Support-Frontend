// components/common/enhanced-pagination.tsx - Comprehensive pagination component

import React from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationInfo {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
  has_more_pages?: boolean
}

interface EnhancedPaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  isLoading?: boolean
  showPerPageSelector?: boolean
  showResultsInfo?: boolean
  perPageOptions?: number[]
  compact?: boolean
  className?: string
}

export function EnhancedPagination({
  pagination,
  onPageChange,
  onPerPageChange,
  isLoading = false,
  showPerPageSelector = true,
  showResultsInfo = true,
  perPageOptions = [10, 15, 25, 50, 100],
  compact = false,
  className
}: EnhancedPaginationProps) {
  const {
    current_page,
    last_page,
    per_page,
    total,
    from = 0,
    to = 0
  } = pagination

  // Don't show pagination if there's only one page or no data
  if (!total || last_page <= 1) {
    return showResultsInfo && total > 0 ? (
      <div className={cn("flex items-center justify-between text-sm text-gray-600", className)}>
        <span>Showing {total} result{total !== 1 ? 's' : ''}</span>
      </div>
    ) : null
  }

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = compact ? 3 : 5
    
    if (last_page <= maxVisible + 2) {
      // Show all pages if total pages is small
      for (let i = 1; i <= last_page; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate range around current page
      const start = Math.max(2, current_page - Math.floor(maxVisible / 2))
      const end = Math.min(last_page - 1, current_page + Math.floor(maxVisible / 2))
      
      // Add ellipsis if there's a gap after first page
      if (start > 2) {
        pages.push('ellipsis')
      }
      
      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if there's a gap before last page
      if (end < last_page - 1) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      pages.push(last_page)
    }
    
    return pages
  }

  const pageNumbers = generatePageNumbers()

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= last_page && page !== current_page && !isLoading) {
      onPageChange(page)
    }
  }

  const handlePerPageChange = (newPerPage: string) => {
    const perPage = parseInt(newPerPage)
    if (perPage !== per_page && !isLoading) {
      onPerPageChange(perPage)
    }
  }

  return (
    <div className={cn(
      "flex flex-col gap-4",
      compact ? "sm:flex-row sm:items-center sm:justify-between" : "space-y-4",
      className
    )}>
      {/* Results Info */}
      {showResultsInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
          <span>
            Showing {from?.toLocaleString()} to {to?.toLocaleString()} of {total.toLocaleString()} results
          </span>
          {current_page > 1 && (
            <Badge variant="outline" className="text-xs w-fit">
              Page {current_page} of {last_page}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Per Page Selector */}
        {showPerPageSelector && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 whitespace-nowrap">Show:</span>
            <Select
              value={per_page.toString()}
              onValueChange={handlePerPageChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-gray-600">per page</span>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={current_page === 1 || isLoading}
            className="h-8 w-8 p-0"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page - 1)}
            disabled={current_page === 1 || isLoading}
            className="h-8 w-8 p-0"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              page === 'ellipsis' ? (
                <div key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              ) : (
                <Button
                  key={page}
                  variant={current_page === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page + 1)}
            disabled={current_page === last_page || isLoading}
            className="h-8 w-8 p-0"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(last_page)}
            disabled={current_page === last_page || isLoading}
            className="h-8 w-8 p-0"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactPagination(props: Omit<EnhancedPaginationProps, 'compact'>) {
  return <EnhancedPagination {...props} compact={true} showResultsInfo={false} />
}

// Simple previous/next only version
export function SimplePagination({
  pagination,
  onPageChange,
  isLoading = false,
  className
}: Pick<EnhancedPaginationProps, 'pagination' | 'onPageChange' | 'isLoading' | 'className'>) {
  const { current_page, last_page, total } = pagination

  if (!total || last_page <= 1) return null

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        onClick={() => onPageChange(current_page - 1)}
        disabled={current_page === 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      
      <span className="text-sm text-gray-600">
        Page {current_page} of {last_page}
      </span>
      
      <Button
        variant="outline"
        onClick={() => onPageChange(current_page + 1)}
        disabled={current_page === last_page || isLoading}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}