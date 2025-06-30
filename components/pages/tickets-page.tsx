// components/pages/tickets-page.tsx (Fixed with responsive design and type safety)
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  MessageCircle,
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
  FileText,
  Star,
  Archive,
  Copy,
  ExternalLink,
  Tags,
  UserCheck,
  Shield,
  Zap,
} from "lucide-react"
import { useTickets } from "@/hooks/use-tickets"
import { useDebounce } from "@/hooks/use-debounce"
import { authService } from "@/services/auth.service"
import { TicketData, TicketListParams } from "@/services/ticket.service"

interface TicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

// Define proper types for action loading
interface ActionLoading {
  [key: number]: string
  bulk?: string
  export?: string
}

export function TicketsPage({ onNavigate }: TicketsPageProps) {
  const {
    tickets,
    loading,
    error,
    stats,
    pagination,
    fetchTickets,
    clearError,
    refreshTickets,
    assignTicket,
    updateTicket,
    deleteTicket,
    exportTickets,
    permissions,
  } = useTickets()

  // Local state for filters and UI
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assignmentFilter, setAssignmentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updated_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedTickets, setSelectedTickets] = useState<number[]>([])
  const [actionLoading, setActionLoading] = useState<ActionLoading>({})
  const [currentView, setCurrentView] = useState("all")

  const currentUser = useMemo(() => authService.getStoredUser(), [])
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Track initialization state
  const initializationRef = useRef({
    hasInitialLoad: false,
    isFirstFilterChange: true
  })

  // Caching for performance
  const cacheRef = useRef<{[key: string]: {data: any, timestamp: number}}>({})
  const CACHE_DURATION = 30000 // 30 seconds

  // Initial load effect - runs only once
  useEffect(() => {
    if (!initializationRef.current.hasInitialLoad) {
      console.log("🎫 TicketsPage: Initial load")
      initializationRef.current.hasInitialLoad = true
      
      fetchTickets({
        page: 1,
        per_page: 20,
        sort_by: sortBy,
        sort_direction: sortDirection,
      })
    }
  }, [fetchTickets, sortBy, sortDirection])

  // Handle filter changes - but only after initial load
  const currentParams = useMemo((): TicketListParams => ({
    page: 1,
    per_page: 20,
    sort_by: sortBy,
    sort_direction: sortDirection,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(assignmentFilter !== 'all' && { assigned: assignmentFilter }),
  }), [
    debouncedSearchTerm,
    statusFilter,
    categoryFilter,
    priorityFilter,
    assignmentFilter,
    sortBy,
    sortDirection
  ])

  // Filter change effect - only after initial load is complete
  useEffect(() => {
    // Skip if we haven't done initial load yet
    if (!initializationRef.current.hasInitialLoad) {
      return
    }

    // Skip the very first filter change (which happens immediately after initial load)
    if (initializationRef.current.isFirstFilterChange) {
      initializationRef.current.isFirstFilterChange = false
      return
    }

    console.log("🎫 TicketsPage: Filters changed, fetching tickets", currentParams)
    fetchTickets(currentParams)
  }, [currentParams, fetchTickets])

  // Cached getter function
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current[key]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  // Cache setter function
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current[key] = {
      data,
      timestamp: Date.now()
    }
  }, [])

  const handleViewTicket = useCallback((ticket: TicketData): void => {
    if (onNavigate) {
      onNavigate('ticket-details', { ticketId: ticket.id })
    }
  }, [onNavigate])

  const handleCreateTicket = useCallback((): void => {
    if (onNavigate) {
      onNavigate('submit-ticket')
    }
  }, [onNavigate])

  const handlePageChange = useCallback((page: number): void => {
    const params = {
      ...currentParams,
      page,
    }
    fetchTickets(params)
  }, [currentParams, fetchTickets])

  const handleSort = useCallback((field: string): void => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }, [sortBy, sortDirection])

  const handleSelectTicket = useCallback((ticketId: number): void => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }, [])

  const handleSelectAll = useCallback((): void => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(tickets.map(t => t.id))
    }
  }, [selectedTickets.length, tickets])

  const handleRefresh = useCallback((): void => {
    console.log("🎫 TicketsPage: Manual refresh")
    // Clear cache on refresh
    cacheRef.current = {}
    fetchTickets(currentParams)
  }, [fetchTickets, currentParams])

  // Action handlers with loading states
  const handleTicketAction = useCallback(async (ticketId: number, action: string, params?: any) => {
    setActionLoading(prev => ({ ...prev, [ticketId]: action }))
    
    try {
      switch (action) {
        case 'assign':
          await assignTicket(ticketId, params)
          break
        case 'update_status':
          await updateTicket(ticketId, params)
          break
        case 'delete':
          await deleteTicket(ticketId, params.reason, params.notifyUser)
          break
      }
      
      // Refresh tickets after action
      await fetchTickets(currentParams)
    } catch (error) {
      console.error(`Failed to ${action} ticket:`, error)
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[ticketId]
        return newState
      })
    }
  }, [assignTicket, updateTicket, deleteTicket, fetchTickets, currentParams])

  const handleBulkAction = useCallback(async (action: string, params?: any) => {
    if (selectedTickets.length === 0) return
    
    setActionLoading(prev => ({ ...prev, bulk: action }))
    
    try {
      // Implement bulk actions based on action type
      for (const ticketId of selectedTickets) {
        await handleTicketAction(ticketId, action, params)
      }
      
      setSelectedTickets([])
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error)
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState.bulk
        return newState
      })
    }
  }, [selectedTickets, handleTicketAction])

  const handleExport = useCallback(async () => {
    setActionLoading(prev => ({ ...prev, export: 'exporting' }))
    
    try {
      await exportTickets('csv', currentParams)
    } catch (error) {
      console.error('Failed to export tickets:', error)
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState.export
        return newState
      })
    }
  }, [exportTickets, currentParams])

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

  // Filter tickets by status for tabs - memoized with caching
  const filteredTicketGroups = useMemo(() => {
    const cacheKey = `filtered_groups_${tickets.length}_${currentView}`
    const cached = getCachedData(cacheKey)
    
    if (cached) return cached

    const groups = {
      all: tickets,
      open: tickets.filter((t: TicketData) => t.status === "Open" || t.status === "In Progress"),
      closed: tickets.filter((t: TicketData) => t.status === "Resolved" || t.status === "Closed"),
      crisis: tickets.filter((t: TicketData) => t.crisis_flag || t.priority === "Urgent"),
      unassigned: tickets.filter((t: TicketData) => !t.assigned_to),
      high_priority: tickets.filter((t: TicketData) => t.priority === "High" || t.priority === "Urgent"),
      my_assigned: currentUser?.role !== 'student' ? tickets.filter((t: TicketData) => t.assigned_to === currentUser?.id) : [],
    }

    setCachedData(cacheKey, groups)
    return groups
  }, [tickets, currentView, getCachedData, setCachedData, currentUser?.id, currentUser?.role])

  // Get current tab tickets
  const currentTabTickets = useMemo(() => {
    return filteredTicketGroups[currentView as keyof typeof filteredTicketGroups] || []
  }, [filteredTicketGroups, currentView])

  // Action menu component
  const TicketActionMenu = useCallback(({ ticket }: { ticket: TicketData }) => {
    const isLoading = actionLoading[ticket.id]
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={!!isLoading}>
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
          <DropdownMenuItem>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem>
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
  }, [actionLoading, permissions, currentUser, handleViewTicket, handleTicketAction])

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
        {(currentUser?.role !== 'student' && filteredTicketGroups.crisis.length > 0) && (
          <Card className="border-red-200 bg-red-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">🚨 Crisis Cases Require Immediate Attention</h3>
                  <p className="text-red-700">{filteredTicketGroups.crisis.length} crisis ticket(s) need urgent response.</p>
                </div>
                <Button
                  onClick={() => {
                    setPriorityFilter('Urgent')
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
        {(currentUser?.role === 'admin' && filteredTicketGroups.unassigned.length > 0) && (
          <Card className="border-orange-200 bg-orange-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-orange-500 rounded-full flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">⚠️ Unassigned Tickets</h3>
                  <p className="text-orange-700">{filteredTicketGroups.unassigned.length} ticket(s) waiting for staff assignment.</p>
                </div>
                <Button
                  onClick={() => {
                    setAssignmentFilter('unassigned')
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
                onClick={clearError}
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
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
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
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading}>
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

                <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={loading}>
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
                  <Select value={assignmentFilter} onValueChange={setAssignmentFilter} disabled={loading}>
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
                <Select value={`${sortBy}-${sortDirection}`} onValueChange={(value) => {
                  const [field, direction] = value.split('-') as [string, "asc" | "desc"]
                  setSortBy(field)
                  setSortDirection(direction)
                }} disabled={loading}>
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
                  {currentUser?.role === 'admin' && selectedTickets.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('assign', { assigned_to: currentUser.id })}
                        disabled={!!actionLoading.bulk}
                        className="w-full sm:w-auto"
                      >
                        {actionLoading.bulk === 'assign' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Bulk Assign ({selectedTickets.length})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('update_status', { status: 'In Progress' })}
                        disabled={!!actionLoading.bulk}
                        className="w-full sm:w-auto"
                      >
                        {actionLoading.bulk === 'update_status' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4 mr-2" />
                        )}
                        Bulk Update
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    {loading ? 'Loading...' : `${pagination.total || 0} tickets found`}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Export for admin */}
                  {permissions.can_export && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExport}
                      disabled={!!actionLoading.export}
                      className="w-full sm:w-auto"
                    >
                      {actionLoading.export ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Tabs - Responsive Design */}
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
                        {filteredTicketGroups.all.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="open" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                    >
                      <span className="hidden sm:inline">Active</span>
                      <span className="sm:hidden">Active</span>
                      <Badge variant="secondary" className="ml-2">
                        {filteredTicketGroups.open.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="closed" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
                    >
                      <span className="hidden sm:inline">Closed</span>
                      <span className="sm:hidden">Closed</span>
                      <Badge variant="secondary" className="ml-2">
                        {filteredTicketGroups.closed.length}
                      </Badge>
                    </TabsTrigger>
                    
                    {(currentUser?.role !== 'student' && filteredTicketGroups.crisis.length > 0) && (
                      <TabsTrigger 
                        value="crisis" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-2 data-[state=active]:border-red-700 rounded-none border-b-2 border-transparent hover:text-red-600 hover:border-red-300 text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Crisis</span>
                        <span className="sm:hidden">Crisis</span>
                        <Badge variant="destructive" className="ml-2">
                          {filteredTicketGroups.crisis.length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    
                    {(currentUser?.role === 'admin' && filteredTicketGroups.unassigned.length > 0) && (
                      <TabsTrigger 
                        value="unassigned" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-b-2 data-[state=active]:border-orange-700 rounded-none border-b-2 border-transparent hover:text-orange-600 hover:border-orange-300 text-orange-600"
                      >
                        <span className="hidden sm:inline">Unassigned</span>
                        <span className="sm:hidden">Unassigned</span>
                        <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700">
                          {filteredTicketGroups.unassigned.length}
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
                          {filteredTicketGroups.my_assigned.length}
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
                              checked={selectedTickets.length === currentTabTickets.length && currentTabTickets.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">
                              {selectedTickets.length > 0 
                                ? `${selectedTickets.length} selected` 
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
                                    checked={selectedTickets.includes(ticket.id)}
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
                                      disabled={actionLoading[ticket.id] === 'assign'}
                                    >
                                      {actionLoading[ticket.id] === 'assign' ? (
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
                    {pagination.last_page > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="text-sm text-gray-600 text-center sm:text-left">
                          Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                          {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                          {pagination.total} tickets
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.current_page === 1 || loading}
                            className="hidden sm:inline-flex"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={pagination.current_page === 1 || loading}
                          >
                            Previous
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                              let pageNum: number
                              const totalPages = pagination.last_page
                              const currentPage = pagination.current_page

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
                                  variant={pageNum === pagination.current_page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  disabled={loading}
                                  className={pageNum === pagination.current_page ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={pagination.current_page === pagination.last_page || loading}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.last_page)}
                            disabled={pagination.current_page === pagination.last_page || loading}
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
                      {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
                        ? "Try adjusting your filters or search term"
                        : currentUser?.role === 'student' 
                          ? "Get started by submitting your first ticket"
                          : "No tickets have been assigned to you yet"
                      }
                    </p>
                    {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && priorityFilter === 'all' && currentUser?.role === 'student') && (
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

        {/* Quick Stats Footer for Admin */}
        {currentUser?.role === 'admin' && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-slate-50">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <h3 className="font-semibold text-gray-900">System Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{stats.total || 0}</div>
                    <div className="text-gray-600">Total Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{filteredTicketGroups.unassigned.length}</div>
                    <div className="text-gray-600">Unassigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{filteredTicketGroups.crisis.length}</div>
                    <div className="text-gray-600">Crisis Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {stats.total > 0 ? Math.round(((stats.resolved || 0) / stats.total) * 100) : 0}%
                    </div>
                    <div className="text-gray-600">Resolution Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{(stats.open || 0) + (stats.in_progress || 0)}</div>
                    <div className="text-gray-600">Active Cases</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary for Staff */}
        {(currentUser?.role === 'counselor' || currentUser?.role === 'advisor') && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <h3 className="font-semibold text-gray-900">My Performance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{filteredTicketGroups.my_assigned.length}</div>
                    <div className="text-gray-600">Assigned to Me</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {filteredTicketGroups.my_assigned.filter((t: TicketData) => t.status === 'Open' || t.status === 'In Progress').length}
                    </div>
                    <div className="text-gray-600">Active Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {filteredTicketGroups.my_assigned.filter((t: TicketData) => t.status === 'Resolved').length}
                    </div>
                    <div className="text-gray-600">Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {filteredTicketGroups.my_assigned.filter((t: TicketData) => t.crisis_flag).length}
                    </div>
                    <div className="text-gray-600">Crisis Handled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {filteredTicketGroups.my_assigned.length > 0 ? 
                        Math.round((filteredTicketGroups.my_assigned.filter((t: TicketData) => t.status === 'Resolved').length / filteredTicketGroups.my_assigned.length) * 100) : 0}%
                    </div>
                    <div className="text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section for Students */}
        {currentUser?.role === 'student' && tickets.length === 0 && !loading && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <MessageSquare className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Student Support</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Our support system is here to help you with academic questions, mental health support, 
                  technical issues, and more. Submit a ticket and our dedicated team will respond within 24 hours.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="text-blue-600 mb-2">📚</div>
                    <h4 className="font-medium mb-1">Academic Help</h4>
                    <p className="text-sm text-gray-600">Course questions, study support, academic planning</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <div className="text-green-600 mb-2">💚</div>
                    <h4 className="font-medium mb-1">Mental Health</h4>
                    <p className="text-sm text-gray-600">Counseling, stress management, wellbeing support</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-purple-200">
                    <div className="text-purple-600 mb-2">🛠️</div>
                    <h4 className="font-medium mb-1">Technical Issues</h4>
                    <p className="text-sm text-gray-600">Login problems, system errors, account access</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-red-200">
                    <div className="text-red-600 mb-2">🚨</div>
                    <h4 className="font-medium mb-1">Crisis Support</h4>
                    <p className="text-sm text-gray-600">Immediate help for urgent situations</p>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateTicket}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Submit First Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}