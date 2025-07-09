// components/pages/tickets-page.tsx (FIXED - No more infinite loops)
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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

// Default values for safety
const defaultFilters = {
  page: 1,
  per_page: 20,
  sort_by: 'updated_at',
  sort_direction: 'desc' as const
}

const defaultPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
}

interface TicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export function TicketsPage({ onNavigate }: TicketsPageProps) {
  // FIXED: Safe store access with fallbacks
  const tickets = useTicketStore(state => state?.tickets || [])
  const loading = useTicketStore(state => state?.loading?.list || false)
  const error = useTicketStore(state => state?.errors?.list || null)
  const pagination = useTicketStore(state => state?.pagination || defaultPagination)
  const selectedTickets = useTicketStore(state => state?.selectedTickets || new Set())
  const filters = useTicketStore(state => state?.filters || defaultFilters)
  
  // FIXED: Safe actions access
  const actions = useTicketStore(state => state?.actions)
  
  // Local UI state only
  const [currentView, setCurrentView] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const initRef = useRef(false)
  
  // FIXED: Memoized current user to prevent re-renders
  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // FIXED: Safe store access for lastFetch
  const lastFetch = useTicketStore(state => state?.lastFetch || 0)

  // FIXED: Stable stats calculation
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      in_progress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length,
      crisis: tickets.filter(t => t.crisis_flag || t.priority === 'Urgent').length,
    }
  }, [tickets])

  // FIXED: Stable filtered tickets calculation
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets]
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(search) ||
        ticket.description.toLowerCase().includes(search) ||
        ticket.ticket_number.toLowerCase().includes(search) ||
        ticket.user?.name.toLowerCase().includes(search)
      )
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filters.category)
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority)
    }
    
    // Apply assignment filter
    if (filters.assigned && filters.assigned !== 'all') {
      switch (filters.assigned) {
        case 'assigned':
          filtered = filtered.filter(ticket => ticket.assigned_to)
          break
        case 'unassigned':
          filtered = filtered.filter(ticket => !ticket.assigned_to)
          break
        case 'my-assigned':
          filtered = filtered.filter(ticket => ticket.assigned_to === currentUser?.id)
          break
      }
    }
    
    return filtered
  }, [tickets, searchTerm, filters, currentUser?.id])

  // FIXED: Stable tab-specific tickets
  const currentTabTickets = useMemo(() => {
    switch (currentView) {
      case 'all':
        return filteredTickets
      case 'open':
        return filteredTickets.filter(t => t.status === 'Open' || t.status === 'In Progress')
      case 'closed':
        return filteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
      case 'crisis':
        return filteredTickets.filter(t => t.crisis_flag || t.priority === 'Urgent')
      case 'unassigned':
        return filteredTickets.filter(t => !t.assigned_to)
      case 'my_assigned':
        return filteredTickets.filter(t => t.assigned_to === currentUser?.id)
      default:
        return filteredTickets
    }
  }, [currentView, filteredTickets, currentUser?.id])

  // FIXED: Initialize tickets ONLY ONCE with safety checks
  useEffect(() => {
    if (initRef.current || isInitialized || !actions) return
    
    let isMounted = true
    initRef.current = true

    const initializeTickets = async () => {
      try {
        console.log("🎫 TicketsPage: Initializing tickets data")
        
        // Only fetch if we don't have recent data
        const hasRecentData = tickets.length > 0 && 
          Date.now() - lastFetch < 30000 // 30 seconds cache
        
        if (!hasRecentData && actions.fetchTickets) {
          await actions.fetchTickets({
            page: 1,
            per_page: 20,
            sort_by: 'updated_at',
            sort_direction: 'desc'
          })
        }
        
        if (isMounted) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("❌ TicketsPage: Failed to initialize:", error)
        if (isMounted) {
          setIsInitialized(true) // Still mark as initialized to prevent retry loop
        }
      }
    }

    initializeTickets()

    return () => {
      isMounted = false
    }
  }, [actions, tickets.length, lastFetch, isInitialized]) // Added safety dependencies

  // FIXED: Debounced search with proper cleanup
  useEffect(() => {
    if (!isInitialized) return

    const timeoutId = setTimeout(() => {
      console.log("🔍 Search term updated:", searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, isInitialized])

  // FIXED: Stable callback functions
  const handleViewTicket = useCallback((ticket: TicketData): void => {
    try {
      console.log("🎫 TicketsPage: Navigating to ticket details:", ticket.id)
      if (onNavigate) {
        onNavigate('ticket-details', { ticketId: ticket.id })
      }
    } catch (error) {
      console.error("❌ TicketsPage: Navigation error:", error)
    }
  }, [onNavigate])

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

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!actions?.fetchTickets) return
    
    try {
      console.log("🔄 TicketsPage: Manual refresh")
      await actions.fetchTickets({
        page: pagination.current_page || 1,
        per_page: pagination.per_page || 20,
        sort_by: filters.sort_by || 'updated_at',
        sort_direction: filters.sort_direction || 'desc'
      })
    } catch (error) {
      console.error("❌ TicketsPage: Refresh error:", error)
    }
  }, [actions, pagination.current_page, pagination.per_page, filters.sort_by, filters.sort_direction])

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    if (!actions?.setFilters) return
    
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value }
    actions.setFilters(newFilters, true) // Auto-fetch with new filters
  }, [actions, filters])

  const clearFilters = useCallback(() => {
    if (!actions?.clearFilters) return
    
    actions.clearFilters(true) // Auto-fetch after clearing
    setSearchTerm("")
  }, [actions])

  // FIXED: Stable utility functions
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

  // FIXED: Memoized permissions
  const permissions = useMemo(() => ({
    can_modify: currentUser?.role === 'admin' || currentUser?.role === 'counselor' || currentUser?.role === 'advisor',
    can_assign: currentUser?.role === 'admin',
    can_delete: currentUser?.role === 'admin',
    can_export: currentUser?.role === 'admin'
  }), [currentUser?.role])

  // FIXED: Memoized page title and description
  const pageInfo = useMemo(() => {
    switch (currentUser?.role) {
      case 'student':
        return {
          title: 'My Support Tickets',
          description: 'Track and manage your support requests'
        }
      case 'counselor':
        return {
          title: 'My Assigned Cases (Mental Health & Crisis)',
          description: 'Manage mental health and crisis support cases'
        }
      case 'advisor':
        return {
          title: 'My Assigned Cases (Academic & General)',
          description: 'Handle academic and general support requests'
        }
      case 'admin':
        return {
          title: 'All System Tickets',
          description: 'Oversee all tickets and system management'
        }
      default:
        return {
          title: 'Support Tickets',
          description: 'Manage support tickets'
        }
    }
  }, [currentUser?.role])

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

  // Safety check - if actions not available, show loading
  if (!actions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing</h3>
          <p className="text-gray-600">Setting up ticket system...</p>
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
                    <h1 className="text-2xl lg:text-3xl font-bold">{pageInfo.title}</h1>
                    <p className="text-blue-100 text-sm lg:text-lg">{pageInfo.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Total Tickets</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.open + stats.in_progress}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Active</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.resolved}</div>
                    <div className="text-xs lg:text-sm text-blue-100">Resolved</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                    <div className="text-xl lg:text-2xl font-bold">{stats.crisis}</div>
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
        {(currentUser?.role !== 'student' && stats.crisis > 0) && (
          <Card className="border-red-200 bg-red-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">🚨 Crisis Cases Require Immediate Attention</h3>
                  <p className="text-red-700">{stats.crisis} crisis ticket(s) need urgent response.</p>
                </div>
                <Button
                  onClick={() => setCurrentView('crisis')}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  View Crisis Cases
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
                onClick={() => actions.clearError('list')}
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
                  onValueChange={(value) => handleFilterChange('status', value)} 
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
                  onValueChange={(value) => handleFilterChange('category', value)} 
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
                  onValueChange={(value) => handleFilterChange('priority', value)} 
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
                    onValueChange={(value) => handleFilterChange('assigned', value)} 
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

                {/* Clear filters */}
                {(searchTerm || filters.status || filters.category || filters.priority || filters.assigned) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    disabled={loading}
                    className="h-11"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${currentTabTickets.length} tickets found`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Tabs */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
              {/* Mobile-friendly tabs */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                  <div className="flex min-w-max space-x-0">
                    <TabsTrigger 
                      value="all" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                    >
                      All Tickets
                      <Badge variant="secondary" className="ml-2">
                        {filteredTickets.length}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="open" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                    >
                      Active
                      <Badge variant="secondary" className="ml-2">
                        {stats.open + stats.in_progress}
                      </Badge>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="closed" 
                      className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                    >
                      Closed
                      <Badge variant="secondary" className="ml-2">
                        {stats.resolved + stats.closed}
                      </Badge>
                    </TabsTrigger>
                    
                    {(currentUser?.role !== 'student' && stats.crisis > 0) && (
                      <TabsTrigger 
                        value="crisis" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium text-red-600"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Crisis
                        <Badge variant="destructive" className="ml-2">
                          {stats.crisis}
                        </Badge>
                      </TabsTrigger>
                    )}
                    
                    {currentUser?.role !== 'student' && (
                      <TabsTrigger 
                        value="my_assigned" 
                        className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                      >
                        My Cases
                        <Badge variant="secondary" className="ml-2">
                          {filteredTickets.filter(t => t.assigned_to === currentUser?.id).length}
                        </Badge>
                      </TabsTrigger>
                    )}
                  </div>
                </TabsList>
              </div>

              {/* Tickets Display */}
              <TabsContent value={currentView} className="p-6 space-y-4 mt-0">
                {loading && !isInitialized ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <span className="text-lg text-gray-600">Loading tickets...</span>
                  </div>
                ) : currentTabTickets.length > 0 ? (
                  <div className="space-y-3">
                    {currentTabTickets.map((ticket: TicketData) => (
                      <Card key={ticket.id} className="hover:shadow-md transition-all duration-200 border-0 shadow-lg">
                        <CardContent className="pt-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex items-start space-x-4 flex-1">
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

                              {/* Actions */}
                              <div className="flex items-center space-x-2">
                                {!ticket.assigned_to && permissions.can_assign && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-orange-600 border-orange-200"
                                    onClick={() => console.log('Assign ticket:', ticket.id)}
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
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

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
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
                                        <DropdownMenuItem>
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Mark In Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Mark Resolved
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tickets/${ticket.id}`)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Link
                                    </DropdownMenuItem>

                                    {permissions.can_delete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Ticket
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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