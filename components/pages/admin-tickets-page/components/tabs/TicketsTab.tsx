// components/tabs/TicketsTab.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Plus, Search, X, RefreshCw, AlertTriangle, Loader2 } from "lucide-react"
import { FilterOptions } from "../../types/admin-types"
import { AdminTicketCard } from "../cards/AdminTicketCard"
import { EnhancedPagination } from '@/components/common/enhanced-pagination'
import { TicketData } from "@/stores/ticket-store"
import { TicketCategory } from "@/services/ticketCategories.service"

interface TicketsTabProps {
  tickets: TicketData[]
  categories: TicketCategory[]
  filters: FilterOptions
  paginatedTickets: TicketData[]
  paginationInfo: any
  isLoading: boolean
  hasError: boolean
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onRefresh: () => void
  onNavigate?: (page: string, params?: any) => void
  onEditTicket: (ticket: TicketData) => void
  onDeleteTicket: (ticket: TicketData) => void
  onAssignTicket: (ticket: TicketData) => void
  onResolveTicket: (ticket: TicketData) => void
  onViewTicket: (ticket: TicketData) => void
}

export function TicketsTab({
  tickets,
  categories,
  filters,
  paginatedTickets,
  paginationInfo,
  isLoading,
  hasError,
  hasActiveFilters,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onPageChange,
  onPerPageChange,
  onRefresh,
  onNavigate,
  onEditTicket,
  onDeleteTicket,
  onAssignTicket,
  onResolveTicket,
  onViewTicket
}: TicketsTabProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Ticket Management</span>
            </CardTitle>
            <CardDescription>Manage all tickets with administrative controls</CardDescription>
          </div>
          <Button onClick={() => onNavigate?.('submit-ticket')} disabled={isLoading} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Ticket</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Search and Filters - Mobile Responsive */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={filters.search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Mobile Filter Row */}
            <div className="flex gap-2 sm:hidden">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange('status', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => onFilterChange('priority', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex gap-2">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange('status', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => onFilterChange('category', value)}
              >
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
              
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => onFilterChange('priority', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            )}
          </div>
          
          {/* Secondary Mobile Filters */}
          <div className="flex gap-2 sm:hidden overflow-x-auto pb-2">
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => onFilterChange('category', value)}
            >
              <SelectTrigger className="w-32 shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filters.assigned || 'all'}
              onValueChange={(value) => onFilterChange('assigned', value)}
            >
              <SelectTrigger className="w-28 shrink-0">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.crisis_flag || 'all'}
              onValueChange={(value) => onFilterChange('crisis_flag', value)}
            >
              <SelectTrigger className="w-24 shrink-0">
                <SelectValue placeholder="Crisis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Crisis</SelectItem>
                <SelectItem value="false">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tickets List with Pagination */}
        <div className="space-y-4 sm:space-y-6" id="admin-tickets-results">
          {isLoading && !tickets.length ? (
            <div className="space-y-4">
              {[...Array(filters.per_page || 25)].map((_, i) => (
                <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : hasError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load tickets
              </h3>
              <p className="text-gray-600 mb-4">Please try refreshing the page</p>
              <Button onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : paginatedTickets.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                <div className="text-sm font-medium text-gray-700">
                  Showing {paginationInfo.from}-{paginationInfo.to} of {paginationInfo.total} ticket{paginationInfo.total !== 1 ? 's' : ''}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{paginationInfo.total} total results</span>
                  <Badge variant="outline" className="text-xs">
                    {tickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length} active
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tickets.filter(t => t.crisis_flag).length} crisis
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tickets.filter(t => !t.assigned_to).length} unassigned
                  </Badge>
                </div>
              </div>

              {/* Ticket Cards */}
              <div className="space-y-3 sm:space-y-4">
                {paginatedTickets.map((ticket) => (
                  <AdminTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onEdit={onEditTicket}
                    onDelete={onDeleteTicket}
                    onAssign={onAssignTicket}
                    onResolve={onResolveTicket}
                    onView={onViewTicket}
                    isLoading={isLoading}
                  />
                ))}
              </div>

              {/* Enhanced Pagination */}
              {paginationInfo.total > (filters.per_page || 25) && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <EnhancedPagination
                      pagination={paginationInfo}
                      onPageChange={onPageChange}
                      onPerPageChange={onPerPageChange}
                      isLoading={isLoading}
                      showPerPageSelector={true}
                      showResultsInfo={true}
                      perPageOptions={[10, 25, 50, 100]}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">No Tickets Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {hasActiveFilters
                      ? 'No tickets match your current filters. Try adjusting your search criteria.'
                      : 'No tickets have been created yet.'}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={onClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => onNavigate?.('submit-ticket')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Ticket
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}