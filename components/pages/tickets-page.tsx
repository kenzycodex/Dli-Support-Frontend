// components/pages/tickets-page.tsx (Fixed navigation and infinite loops)
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Ticket,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Eye,
  Flag,
  Loader2,
  RefreshCw,
  AlertCircle,
  Download,
  Users,
  UserPlus,
  Settings,
  ArrowUpDown,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Archive,
  Copy,
  ExternalLink,
  Tags,
  UserCheck,
  X,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketSelectors, 
  useTicketLoading, 
  useTicketError,
  useTicketStats,
  useTicketFilters,
  useTicketPermissions,
  TicketData 
} from "@/stores/ticket-store"
import { authService } from "@/services/auth.service"

interface TicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function TicketsPage({ onNavigate }: TicketsPageProps) {
  // Zustand store hooks
  const store = useTicketStore()
  const selectors = useTicketSelectors()
  const loading = useTicketLoading('list')
  const error = useTicketError('list')
  const stats = useTicketStats()
  const { filters, setFilters, clearFilters } = useTicketFilters()
  const permissions = useTicketPermissions()

  // Local UI state
  const [currentView, setCurrentView] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  
  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // FIXED: Initialize tickets only once on mount
  useEffect(() => {
    let isMounted = true

    const initializeTickets = async () => {
      if (isInitialized) return
      
      try {
        console.log("🎫 TicketsPage: Initializing tickets data")
        
        // Check if we already have valid cached data
        if (!selectors.isCacheValid || selectors.tickets.length === 0) {
          await store.actions.fetchTickets()
        }
        
        if (isMounted) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("❌ TicketsPage: Failed to initialize:", error)
      }
    }

    initializeTickets()

    return () => {
      isMounted = false
    }
  }, [store.actions, isInitialized, selectors.isCacheValid, selectors.tickets.length])

  // FIXED: Handle search with proper debouncing
  useEffect(() => {
    if (!isInitialized) return

    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        console.log("🎫 TicketsPage: Updating search filter:", searchTerm)
        setFilters({ search: searchTerm || undefined })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters.search, setFilters, isInitialized])

  // Memoized filtered tickets based on current view
  const currentTabTickets = useMemo(() => {
    switch (currentView) {
      case 'all':
        return selectors.tickets
      case 'open':
        return selectors.openTickets
      case 'closed':
        return selectors.closedTickets
      case 'crisis':
        return selectors.crisisTickets
      case 'unassigned':
        return selectors.unassignedTickets
      case 'my_assigned':
        return selectors.myAssignedTickets
      default:
        return selectors.tickets
    }
  }, [currentView, selectors])

  // FIXED: Handle navigation with proper error handling
  const handleViewTicket = useCallback((ticket: TicketData): void => {
    try {
      console.log("🎫 TicketsPage: Navigating to ticket details:", ticket.id)
      store.actions.setCurrentTicket(ticket)
      if (onNavigate) {
        onNavigate('ticket-details', { ticketId: ticket.id })
      }
    } catch (error) {
      console.error("❌ TicketsPage: Navigation error:", error)
    }
  }, [onNavigate, store.actions])

  const handleCreateTicket = useCallback((): void => {
    try {
      console.log("🎫 TicketsPage: Navigating to create ticket")
      if (onNavigate) {
        onNavigate('submit-ticket')
      }
    } catch (error) {
      console.error("❌ TicketsPage: Navigation error:", error)
    }
  }, [onNavigate])

  // FIXED: Handle page changes without infinite loops
  const handlePageChange = useCallback((page: number): void => {
    console.log("🎫 TicketsPage: Changing page to:", page)
    setFilters({ page })
  }, [setFilters])

  // FIXED: Handle sorting
  const handleSort = useCallback((field: string): void => {
    const newDirection = filters.sort_by === field && filters.sort_direction === 'desc' ? 'asc' : 'desc'
    console.log("🎫 TicketsPage: Sorting by:", field, newDirection)
    setFilters({
      sort_by: field,
      sort_direction: newDirection
    })
  }, [filters.sort_by, filters.sort_direction, setFilters])

  // FIXED: Handle refresh with proper error handling
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      console.log("🎫 TicketsPage: Manual refresh")
      await store.actions.refreshTickets()
    } catch (error) {
      console.error("❌ TicketsPage: Refresh error:", error)
    }
  }, [store.actions])

  // Handle ticket selection
  const handleSelectTicket = useCallback((ticketId: number): void => {
    if (store.selectedTickets.has(ticketId)) {
      store.actions.deselectTicket(ticketId)
    } else {
      store.actions.selectTicket(ticketId)
    }
  }, [store.selectedTickets, store.actions])

  const handleSelectAll = useCallback((): void => {
    if (store.selectedTickets.size === currentTabTickets.length) {
      store.actions.clearSelection()
    } else {
      store.actions.clearSelection()
      currentTabTickets.forEach(ticket => store.actions.selectTicket(ticket.id))
    }
  }, [store.selectedTickets.size, currentTabTickets, store.actions])

  // Handle ticket actions
  const handleTicketAction = useCallback(async (ticketId: number, action: string, params?: any) => {
    try {
      switch (action) {
        case 'assign':
          await store.actions.assignTicket(ticketId, params.assigned_to, params.reason)
          break
        case 'update_status':
          await store.actions.updateTicket(ticketId, { status: params.status })
          break
        case 'delete':
          await store.actions.deleteTicket(ticketId, params.reason, params.notifyUser)
          break
        case 'add_tag':
          await store.actions.addTag(ticketId, params.tag)
          break
        case 'remove_tag':
          await store.actions.removeTag(ticketId, params.tag)
          break
      }
    } catch (error) {
      console.error(`Failed to ${action} ticket:`, error)
    }
  }, [store.actions])

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string, params?: any) => {
    const selectedIds = Array.from(store.selectedTickets)
    if (selectedIds.length === 0) return
    
    try {
      switch (action) {
        case 'bulk_assign':
          await store.actions.bulkAssign(selectedIds, params.assigned_to, params.reason)
          break
        case 'bulk_update':
          for (const id of selectedIds) {
            await store.actions.updateTicket(id, params)
          }
          break
      }
      
      store.actions.clearSelection()
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error)
    }
  }, [store.selectedTickets, store.actions])

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      await store.actions.exportTickets('csv', filters)
    } catch (error) {
      console.error('Failed to export tickets:', error)
    }
  }, [store.actions, filters])

  // Utility functions
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }, [])

  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse"
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "In Progress":
        return <RefreshCw className="h-4 w-4 text-orange-600" />
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  const getPageTitle = useCallback((): string => {
    switch (currentUser?.role) {
      case 'student':
        return 'My Support Tickets'
      case 'counselor':
        return 'My Assigned Cases (Mental Health & Crisis)'
      case 'advisor':
        return 'My Assigned Cases (Academic & General)'
      case 'admin':
        return 'All System Tickets'
      default:
        return 'Support Tickets'
    }
  }, [currentUser?.role])

  const getPageDescription = useCallback((): string => {
    switch (currentUser?.role) {
      case 'student':
        return 'Track and manage your support requests'
      case 'counselor':
        return 'Manage mental health and crisis support cases'
      case 'advisor':
        return 'Handle academic and general support requests'
      case 'admin':
        return 'Oversee all tickets and system management'
      default:
        return 'Manage support tickets'
    }
  }, [currentUser?.role])

  // Action menu component
  const TicketActionMenu = useCallback(({ ticket }: { ticket: TicketData }) => {
    const isLoading = useTicketLoading(`action_${ticket.id}`)
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          
          {permissions.can_modify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'update_status', { status: 'In Progress' })}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Mark In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'update_status', { status: 'Resolved' })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </DropdownMenuItem>
            </>
          )}

          {permissions.can_assign && !ticket.assigned_to && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, 'assign', { assigned_to: currentUser?.id })}>
                <UserCheck className="h-4 w-4 mr-2" />
                Assign to Me
              </DropdownMenuItem>
            </>
          )}

          {currentUser?.role === 'student' && ticket.user_id === currentUser.id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Ticket
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tickets/${ticket.id}`)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(`/tickets/${ticket.id}`, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </DropdownMenuItem>

          {permissions.can_delete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleTicketAction(ticket.id, 'delete', { reason: 'Deleted by admin', notifyUser: true })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }, [permissions, currentUser, handleViewTicket, handleTicketAction])

  // Show loading state during initialization
  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Tickets</h3>
          <p className="text-gray-600">Fetching your support requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 lg:p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Ticket className="h-6 w-6 lg:h-8 lg:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">{getPageTitle()}</h1>
                    <p className="text-blue-100 text-sm lg:text-lg">{getPageDescription()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.total || 0}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Total Tickets</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{(stats.open || 0) + (stats.in_progress || 0)}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Active</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.resolved || 0}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Resolved</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.crisis || 0}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Crisis Cases</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-white hover:bg-white/20 backdrop-blur-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Show create button for students and admins */}
                {(currentUser?.role === 'student' || currentUser?.role === 'admin') && (
                  <Button 
                    onClick={handleCreateTicket}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {currentUser?.role === 'admin' ? 'Create Ticket' : 'Submit Ticket'}
                    </span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Alert for Staff/Admin */}
        {(currentUser?.role !== 'student' && selectors.crisisTickets.length > 0) && (
          <Card className="border-red-200 bg-red-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">🚨 Crisis Cases Require Immediate Attention</h3>
                  <p className="text-red-700">{selectors.crisisTickets.length} crisis ticket(s) need urgent response.</p>
                </div>
                <Button
                  onClick={() => {
                    setFilters({ priority: 'Urgent' })
                    setCurrentView('crisis')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  View Crisis Cases
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unassigned Alert for Admin */}
        {(currentUser?.role === 'admin' && selectors.unassignedTickets.length > 0) && (
          <Card className="border-orange-200 bg-orange-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-orange-500 rounded-full flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">⚠️ Unassigned Tickets</h3>
                  <p className="text-orange-700">{selectors.unassignedTickets.length} ticket(s) waiting for staff assignment.</p>
                </div>
                <Button
                  onClick={() => {
                    setFilters({ assigned: 'unassigned' })
                    setCurrentView('unassigned')
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                >
                  Assign Staff
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => store.actions.clearError('list')}
                className="text-red-600 hover:text-red-700 hover:bg-red-100 w-full sm:w-auto"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets by ID, subject, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => setFilters({ status: value === 'all' ? undefined : value })} 
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filters.category || 'all'} 
                  onValueChange={(value) => setFilters({ category: value === 'all' ? undefined : value })} 
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="academic">Academic Help</SelectItem>
                    <SelectItem value="mental-health">Mental Health</SelectItem>
                    <SelectItem value="crisis">Crisis Support</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.priority || 'all'} 
                  onValueChange={(value) => setFilters({ priority: value === 'all' ? undefined : value })} 
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Assignment filter for staff/admin */}
                {currentUser?.role !== 'student' && (
                  <Select 
                    value={filters.assigned || 'all'} 
                    onValueChange={(value) => setFilters({ assigned: value === 'all' ? undefined : value })} 
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Filter by assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {currentUser?.role === 'admin' && (
                        <SelectItem value="my-assigned">My Assigned</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}

                {/* Sort options */}
                <Select 
                  value={`${filters.sort_by}-${filters.sort_direction}`} 
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-') as [string, "asc" | "desc"]
                    setFilters({ sort_by: field, sort_direction: direction })
                  }} 
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                    <SelectItem value="created_at-desc">Recently Created</SelectItem>
                    <SelectItem value="priority-desc">Priority (High to Low)</SelectItem>
                    <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                    <SelectItem value="subject-asc">Subject (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* Bulk actions for admin */}
                  {currentUser?.role === 'admin' && store.selectedTickets.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('bulk_assign', { assigned_to: currentUser.id })}
                        disabled={useTicketLoading('assign')}
                        className="w-full sm:w-auto"
                      >
                        {useTicketLoading('assign') ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Bulk Assign ({store.selectedTickets.size})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('bulk_update', { status: 'In Progress' })}
                        disabled={useTicketLoading('update')}
                        className="w-full sm:w-auto"
                      >
                        {useTicketLoading('update') ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4 mr-2" />
                        )}
                        Bulk Update
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    {loading ? 'Loading...' : `${store.pagination.total || 0} tickets found`}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Clear filters */}
                  {(filters.search || filters.status || filters.category || filters.priority || filters.assigned) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearFilters}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                  
                  {/* Export for admin */}
                  {permissions.can_export && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExport}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Tabs */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
              {/* Mobile-friendly tabs with horizontal scroll */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                  <div className="flex min-w-max space-x-0">
                    <TabsTrigger 
                      value="all" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                    >
                      <span className="hidden sm:inline">All Tickets</span>
                      <span className="sm:hidden">All</span>
                      <Badge variant="secondary" className="ml-2">
                        {selectors.tickets.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="open" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                    >
                      <span className="hidden sm:inline">Active</span>
                      <span className="sm:hidden">Active</span>
                      <Badge variant="secondary" className="ml-2">
                        {selectors.openTickets.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="closed" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                    >
                      <span className="hidden sm:inline">Closed</span>
                      <span className="sm:hidden">Closed</span>
                      <Badge variant="secondary" className="ml-2">
                        {selectors.closedTickets.length}
                      </Badge>
                    </TabsTrigger>
                    
                    {(currentUser?.role !== 'student' && selectors.crisisTickets.length > 0) && (
                      <TabsTrigger 
                        value="crisis" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-2 data-[state=active]:border-red-700 rounded-none border-b-2 border-transparent hover:text-red-600 hover:border-red-300 text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Crisis</span>
                        <span className="sm:hidden">Crisis</span>
                        <Badge variant="destructive" className="ml-2">
                          {selectors.crisisTickets.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    
                    {(currentUser?.role === 'admin' && selectors.unassignedTickets.length > 0) && (
                      <TabsTrigger 
                        value="unassigned" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-b-2 data-[state=active]:border-orange-700 rounded-none border-b-2 border-transparent hover:text-orange-600 hover:border-orange-300 text-orange-600"
                      >
                        <span className="hidden sm:inline">Unassigned</span>
                        <span className="sm:hidden">Unassigned</span>
                        <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700">
                          {selectors.unassignedTickets.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    
                    {currentUser?.role !== 'student' && (
                      <TabsTrigger 
                        value="my_assigned" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-700 rounded-none border-b-2 border-transparent hover:text-green-600 hover:border-green-300"
                      >
                        <span className="hidden sm:inline">My Cases</span>
                        <span className="sm:hidden">Mine</span>
                        <Badge variant="secondary" className="ml-2">
                          {selectors.myAssignedTickets.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                  </div>
                </TabsList>
              </div>

              {/* Tickets Display */}
              <TabsContent value={currentView} className="p-6 space-y-4 mt-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <span className="text-lg text-gray-600">Loading tickets...</span>
                    <span className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</span>
                  </div>
                ) : currentTabTickets.length > 0 ? (
                  <>
                    {/* Select All Header for Admin */}
                    {currentUser?.role === 'admin' && (
                      <Card className="bg-gray-50 border border-gray-200">
                        <CardContent className="py-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={store.selectedTickets.size === currentTabTickets.length && currentTabTickets.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">
                              {store.selectedTickets.size > 0 
                                ? `${store.selectedTickets.size} selected` 
                                : 'Select all tickets'
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tickets List */}
                    <div className="space-y-3">
                      {currentTabTickets.map((ticket: TicketData) => (
                        <Card key={ticket.id} className="hover:shadow-md transition-all duration-200 border-0 shadow-lg">
                          <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                              <div className="flex items-start space-x-4 flex-1">
                                {/* Checkbox for admin */}
                                {currentUser?.role === 'admin' && (
                                  <input
                                    type="checkbox"
                                    checked={store.selectedTickets.has(ticket.id)}
                                    onChange={() => handleSelectTicket(ticket.id)}
                                    className="mt-1 rounded border-gray-300 flex-shrink-0"
                                  />
                                )}

                                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                                  {getStatusIcon(ticket.status)}
                                  <span className="font-mono text-sm font-medium text-blue-600">
                                    #{ticket.ticket_number}
                                  </span>
                                  {ticket.crisis_flag && <Flag className="h-3 w-3 text-red-600 animate-pulse" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                    <h3 className="font-medium text-gray-900 truncate flex-1">{ticket.subject}</h3>
                                    {ticket.crisis_flag && (
                                      <Badge variant="destructive" className="animate-pulse self-start">
                                        <Flag className="h-3 w-3 mr-1" />
                                        CRISIS
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                      {ticket.category}
                                    </Badge>
                                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                      {ticket.priority}
                                    </Badge>
                                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                      {ticket.status}
                                    </Badge>
                                  </div>

                                  {/* Show ticket description preview */}
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>{ticket.user?.name || 'Unknown User'}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span className="hidden sm:inline">Created: </span>
                                      <span>{formatDate(ticket.created_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span className="hidden sm:inline">Updated: </span>
                                      <span>{formatDate(ticket.updated_at)}</span>
                                    </div>
                                    {ticket.assignedTo && (
                                      <div className="flex items-center space-x-1">
                                        <UserPlus className="h-3 w-3" />
                                        <span className="hidden sm:inline">Assigned to: </span>
                                        <span>{ticket.assignedTo.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
                                {/* Indicators */}
                                <div className="flex items-center space-x-3">
                                  {ticket.attachments && ticket.attachments.length > 0 && (
                                    <div className="flex items-center space-x-1 text-gray-500">
                                      <Paperclip className="h-4 w-4" />
                                      <span className="text-xs">{ticket.attachments.length}</span>
                                    </div>
                                  )}
                                  {ticket.responses && ticket.responses.length > 0 && (
                                    <div className="flex items-center space-x-1 text-gray-500">
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="text-xs">{ticket.responses.length}</span>
                                    </div>
                                  )}
                                  {ticket.tags && ticket.tags.length > 0 && (
                                    <div className="flex items-center space-x-1 text-gray-500">
                                      <Tags className="h-4 w-4" />
                                      <span className="text-xs">{ticket.tags.length}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center space-x-2">
                                  {!ticket.assigned_to && permissions.can_assign && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-orange-600 border-orange-200"
                                      onClick={() => handleTicketAction(ticket.id, 'assign', { assigned_to: currentUser?.id })}
                                      disabled={useTicketLoading(`assign_${ticket.id}`)}
                                    >
                                      {useTicketLoading(`assign_${ticket.id}`) ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <UserPlus className="h-4 w-4 mr-1" />
                                      )}
                                      <span className="hidden sm:inline">Assign</span>
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewTicket(ticket)}
                                    className="hover:bg-blue-50 hover:border-blue-200"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">View</span>
                                  </Button>

                                  {/* Action Menu */}
                                  <TicketActionMenu ticket={ticket} />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    {store.pagination.last_page > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="text-sm text-gray-600 text-center sm:text-left">
                          Showing {((store.pagination.current_page - 1) * store.pagination.per_page) + 1} to{' '}
                          {Math.min(store.pagination.current_page * store.pagination.per_page, store.pagination.total)} of{' '}
                          {store.pagination.total} tickets
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={store.pagination.current_page === 1 || loading}
                            className="hidden sm:inline-flex"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(store.pagination.current_page - 1)}
                            disabled={store.pagination.current_page === 1 || loading}
                          >
                            Previous
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, store.pagination.last_page) }, (_, i) => {
                              let pageNum: number
                              const totalPages = store.pagination.last_page
                              const currentPage = store.pagination.current_page

                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={pageNum === store.pagination.current_page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={loading}
                                  className={pageNum === store.pagination.current_page ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(store.pagination.current_page + 1)}
                            disabled={store.pagination.current_page === store.pagination.last_page || loading}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(store.pagination.last_page)}
                            disabled={store.pagination.current_page === store.pagination.last_page || loading}
                            className="hidden sm:inline-flex"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filters.status || filters.category || filters.priority
                        ? "Try adjusting your filters or search term"
                        : currentUser?.role === 'student' 
                          ? "Get started by submitting your first ticket"
                          : "No tickets have been assigned to you yet"
                      }
                    </p>
                    {(!searchTerm && !filters.status && !filters.category && !filters.priority && currentUser?.role === 'student') && (
                      <Button 
                        onClick={handleCreateTicket}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Submit First Ticket
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}