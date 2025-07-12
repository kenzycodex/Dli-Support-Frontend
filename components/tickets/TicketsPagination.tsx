// components/tickets/TicketsPagination.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface TicketsPaginationProps {
  pagination: PaginationData
  loading: boolean
  onPageChange: (page: number) => void
}

export function TicketsPagination({
  pagination,
  loading,
  onPageChange
}: TicketsPaginationProps) {
  if (pagination.total <= pagination.per_page) {
    return null
  }

  const startItem = (pagination.current_page - 1) * pagination.per_page + 1
  const endItem = Math.min(pagination.current_page * pagination.per_page, pagination.total)

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {startItem} to {endItem} of {pagination.total} tickets
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1 || loading}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                const page = i + 1;
                const isCurrentPage = page === pagination.current_page;

                return (
                  <Button
                    key={page}
                    variant={isCurrentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    disabled={loading}
                    className={isCurrentPage ? 'bg-blue-600 text-white' : ''}
                  >
                    {page}
                  </Button>
                );
              })}

              {pagination.last_page > 5 && (
                <>
                  <span className="text-gray-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pagination.last_page)}
                    disabled={loading}
                  >
                    {pagination.last_page}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}