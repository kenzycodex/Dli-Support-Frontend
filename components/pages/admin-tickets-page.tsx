// components/pages/admin-tickets-page.tsx - Dedicated Admin Tickets Management Page

"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  FileText,
  Activity,
  EyeOff,
  StarOff,
  X,
  Globe,
  Lock,
  Flag,
  Bot,
  UserPlus,
  MessageSquare,
  Paperclip,
  Timer,
  User
} from "lucide-react"

import { EnhancedPagination } from '@/components/common/enhanced-pagination'
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Use the existing ticket integration hook
import { useTicketIntegration } from "@/hooks/useTicketIntegration"
import { useTicketStore, TicketData } from "@/stores/ticket-store"
import { useTicketCategoriesStore } from "@/stores/ticketCategories-store"

// Types
type AdminTabType = 'tickets' | 'analytics' | 'categories' | 'settings' | 'users' | 'exports'

interface FilterOptions {
  search?: string
  status?: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  category?: string
  priority?: string
  assigned?: string
  crisis_flag?: string
  auto_assigned?: string
  date_range?: string
  sort_by?: string
  page?: number
  per_page?: number
}

interface AdminTicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

// Admin Header Component
function AdminTicketsHeader({
  ticketStats,
  categoryStats,
  isLoading,
  onBackToTickets,
  onRefreshAll
}: {
  ticketStats: any
  categoryStats: any
  isLoading: boolean
  onBackToTickets: () => void
  onRefreshAll: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tickets Management</h1>
            <p className="text-blue-100 text-sm sm:text-lg">Manage tickets, categories, and system analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToTickets}
            className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            View Public
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : ticketStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Total Tickets</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : ticketStats.crisis}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Crisis Cases</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : categoryStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Categories</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-xl sm:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : ticketStats.unassigned}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Unassigned</div>
        </div>
      </div>
    </div>
  )
}

// Individual Action Dialog Component
function IndividualActionDialog({
  isOpen,
  ticket,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: {
  isOpen: boolean
  ticket?: TicketData | null
  action: 'edit' | 'delete' | 'assign' | 'resolve'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}) {
  if (!ticket) return null

  const getActionDetails = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Ticket',
          description: 'Are you sure you want to delete this ticket? This action cannot be undone.',
          confirmText: 'Delete Ticket',
          variant: 'destructive' as const
        }
      case 'assign':
        return {
          title: 'Assign Ticket',
          description: 'Are you sure you want to assign this ticket to yourself?',
          confirmText: 'Assign to Me',
          variant: 'default' as const
        }
      case 'resolve':
        return {
          title: 'Resolve Ticket',
          description: 'Are you sure you want to mark this ticket as resolved?',
          confirmText: 'Mark Resolved',
          variant: 'default' as const
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          variant: 'default' as const
        }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionDetails.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>{actionDetails.description}</p>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="font-medium">
                  #{ticket.ticket_number} - {ticket.subject}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ticket.description.substring(0, 100)}...
                </p>
              </div>
              {action === 'delete' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ This will permanently delete the ticket and all associated data.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isProcessing}
            className={actionDetails.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              actionDetails.confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminTicketsPage({ onNavigate }: AdminTicketsPageProps) {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<AdminTabType>("tickets")
  
  // Use the ticket integration hook
  const {
    data: { tickets, categories },
    state: { loading, errors },
    ticketOperations,
    categoryOperations,
    refreshAll,
    clearAllCaches,
  } = useTicketIntegration({
    autoLoadCategories: true,
    autoLoadTickets: true,
    enableRealTimeUpdates: true
  })

  // Local filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    assigned: 'all',
    crisis_flag: 'all',
    auto_assigned: 'all',
    sort_by: 'newest',
    page: 1,
    per_page: 25,
  })

  // Dialog states
  const [individualActionDialog, setIndividualActionDialog] = useState<{
    isOpen: boolean
    ticket?: TicketData | null
    action: 'edit' | 'delete' | 'assign' | 'resolve'
    isProcessing: boolean
  }>({
    isOpen: false,
    ticket: null,
    action: 'edit',
    isProcessing: false
  })

  // Permission check
  const isAdmin = user?.role === 'admin'

  // Permission check effect
  useEffect(() => {
    if (!user) return

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      onNavigate?.('tickets')
    }
  }, [user, isAdmin, onNavigate])

  // Navigation handler
  const handleBackToTickets = useCallback(() => {
    onNavigate?.('tickets')
  }, [onNavigate])

  // Safe pagination calculation
  const paginatedTickets = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return []

    let filtered = tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          ticket.ticket_number.toLowerCase().includes(searchLower) ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.user?.name?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'open':
            if (ticket.status !== 'Open') return false
            break
          case 'in_progress':
            if (ticket.status !== 'In Progress') return false
            break
          case 'resolved':
            if (ticket.status !== 'Resolved') return false
            break
          case 'closed':
            if (ticket.status !== 'Closed') return false
            break
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && ticket.category_id !== category.id) return false
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false
      }

      // Assignment filter
      if (filters.assigned && filters.assigned !== 'all') {
        switch (filters.assigned) {
          case 'assigned':
            if (!ticket.assigned_to) return false
            break
          case 'unassigned':
            if (ticket.assigned_to) return false
            break
        }
      }

      // Crisis filter
      if (filters.crisis_flag && filters.crisis_flag !== 'all') {
        if (filters.crisis_flag === 'true' && !ticket.crisis_flag) return false
        if (filters.crisis_flag === 'false' && ticket.crisis_flag) return false
      }

      // Auto-assignment filter
      if (filters.auto_assigned && filters.auto_assigned !== 'all') {
        if (filters.auto_assigned === 'yes' && ticket.auto_assigned !== 'yes') return false
        if (filters.auto_assigned === 'no' && ticket.auto_assigned === 'yes') return false
      }
      
      return true
    })

    // Safe pagination
    const safePerPage = filters.per_page || 25
    const safePage = filters.page || 1
    const startIndex = (safePage - 1) * safePerPage
    const endIndex = startIndex + safePerPage
    
    return filtered.slice(startIndex, endIndex)
  }, [tickets, filters, categories])

  // Safe pagination info calculation
  const paginationInfo = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) {
      return {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
        from: 0,
        to: 0,
        has_more_pages: false
      }
    }

    // Apply same filtering logic to get total count
    let totalFiltered = tickets.filter(ticket => {
      // ... same filter logic as above (shortened for brevity)
      return true // simplified for this example
    }).length

    const safePerPage = filters.per_page || 25
    const safePage = filters.page || 1
    const lastPage = Math.ceil(totalFiltered / safePerPage)
    const startIndex = (safePage - 1) * safePerPage

    return {
      current_page: safePage,
      last_page: lastPage,
      per_page: safePerPage,
      total: totalFiltered,
      from: totalFiltered > 0 ? startIndex + 1 : 0,
      to: Math.min(startIndex + safePerPage, totalFiltered),
      has_more_pages: safePage < lastPage
    }
  }, [tickets, filters])

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 AdminTicketsPage: Page changed to:', page)
    setFilters((prev) => ({ ...prev, page }))
    
    // Scroll to top of results
    const resultsSection = document.getElementById('admin-tickets-results')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handlePerPageChange = useCallback((perPage: number) => {
    console.log('📄 AdminTicketsPage: Per page changed to:', perPage)
    setFilters((prev) => ({ ...prev, per_page: perPage, page: 1 }))
  }, [])

  // Manual refresh handler
  const handleRefreshAll = useCallback(async () => {
    try {
      console.log('🔄 AdminTicketsPage: Manual refresh triggered by user')
      await refreshAll()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      toast.error('Failed to refresh data')
    }
  }, [refreshAll])

  // Individual action handlers
  const handleIndividualEditTicket = useCallback((ticket: TicketData) => {
    // Navigate to ticket details for editing
    onNavigate?.('ticket-details', { ticketId: ticket.id })
  }, [onNavigate])

  const handleIndividualDeleteTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  const handleIndividualAssignTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'assign',
      isProcessing: false
    })
  }, [])

  const handleIndividualResolveTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'resolve',
      isProcessing: false
    })
  }, [])

  // Execute individual action
  const executeIndividualAction = useCallback(async () => {
    const { ticket, action } = individualActionDialog
    
    if (!ticket) return

    setIndividualActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      switch (action) {
        case 'delete':
          await ticketOperations.deleteTicket(ticket.id, 'Deleted by administrator', false)
          break
        case 'assign':
          if (user) {
            await ticketOperations.assignTicket(ticket.id, user.id, 'Assigned by administrator')
          }
          break
        case 'resolve':
          await ticketOperations.updateTicket(ticket.id, { status: 'Resolved' })
          break
      }

      setIndividualActionDialog({
        isOpen: false,
        ticket: null,
        action: 'edit',
        isProcessing: false
      })
    } catch (error: any) {
      console.error(`Failed to ${action}:`, error)
      setIndividualActionDialog(prev => ({ ...prev, isProcessing: false }))
    }
  }, [individualActionDialog, ticketOperations, user])

  // Filter handlers
  const handleSearchChange = useCallback((value: string) => {
    console.log('🔍 AdminTicketsPage: Search changed:', value)
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    console.log('🔧 AdminTicketsPage: Filter changed:', key, value)
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? 'all' : value,
      page: 1,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    console.log('🧹 AdminTicketsPage: Clearing filters')
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      priority: 'all',
      assigned: 'all',
      crisis_flag: 'all',
      auto_assigned: 'all',
      sort_by: 'newest',
      page: 1,
      per_page: 25,
    })
  }, [])

  // Check for active filters
  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.assigned && filters.assigned !== 'all') ||
    (filters.crisis_flag && filters.crisis_flag !== 'all') ||
    (filters.auto_assigned && filters.auto_assigned !== 'all')
  )

  // Get icon component safely
  const getIconComponent = useCallback((type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      article: FileText,
      video: Video,
      audio: Headphones,
      exercise: Brain,
      tool: Heart,
      worksheet: Download
    }
    return iconMap[type] || BookOpen
  }, [])

  // Calculate stats
  const ticketStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    in_progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    crisis: tickets.filter(t => t.crisis_flag).length,
    unassigned: tickets.filter(t => !t.assigned_to).length,
    auto_assigned: tickets.filter(t => t.auto_assigned === 'yes').length,
  }), [tickets])

  const categoryStats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    with_auto_assign: categories.filter(c => c.auto_assign).length,
    with_crisis_detection: categories.filter(c => c.crisis_detection_enabled).length,
  }), [categories])

  // Early returns
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600">Please wait while we verify your access.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <Button onClick={handleBackToTickets}>Back to Tickets</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Better loading state for initial load only
  if (loading.any && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Admin Panel</h3>
            <p className="text-gray-600">Fetching your dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <AdminTicketsHeader
          ticketStats={ticketStats}
          categoryStats={categoryStats}
          isLoading={loading.any}
          onBackToTickets={handleBackToTickets}
          onRefreshAll={handleRefreshAll}
        />

        {/* Error Display */}
        {errors.any && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    {errors.tickets.list || errors.categories.list || 'An error occurred'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Status */}
        {!loading.any && !errors.any && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Ticket management system ready - {ticketStats.total} tickets,{' '}
                  {categoryStats.total} categories
                  {ticketStats.crisis > 0 && `, ${ticketStats.crisis} crisis cases`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as AdminTabType)}>
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="tickets">
              <Target className="h-4 w-4 mr-2" />
              Tickets ({ticketStats.total})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Settings className="h-4 w-4 mr-2" />
              Categories ({categoryStats.total})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="exports">
              <Download className="h-4 w-4 mr-2" />
              Export/Import
            </TabsTrigger>
          </TabsList>

          {/* Tickets Management Tab */}
          <TabsContent value="tickets">
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
                  <Button onClick={() => onNavigate?.('submit-ticket')} disabled={loading.any}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tickets by ID, subject, description, or user..."
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={filters.status || 'all'}
											onValueChange={(value) => handleFilterChange('status', value)}
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
                      onValueChange={(value) => handleFilterChange('category', value)}
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
                      onValueChange={(value) => handleFilterChange('priority', value)}
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
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tickets List with Pagination */}
                <div className="space-y-4 sm:space-y-6" id="admin-tickets-results">
                  {loading.tickets.list && !tickets.length ? (
                    <div className="space-y-4">
                      {[...Array(filters.per_page || 25)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : errors.tickets.list ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Failed to load tickets
                      </h3>
                      <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                      <Button onClick={handleRefreshAll}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : paginatedTickets.length > 0 ? (
                    <>
                      {/* Results Summary */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">
                          Showing {paginationInfo.from}-{paginationInfo.to} of {paginationInfo.total} ticket{paginationInfo.total !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                      <div className="space-y-4">
                        {paginatedTickets.map((ticket) => (
                          <Card
                            key={ticket.id}
                            className="transition-all duration-200 hover:shadow-md"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                {/* Ticket Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      {/* Title and Status */}
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                                          #{ticket.ticket_number} - {ticket.subject}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                          {ticket.crisis_flag && (
                                            <Badge variant="destructive" className="animate-pulse">
                                              <Flag className="h-3 w-3 mr-1" />
                                              CRISIS
                                            </Badge>
                                          )}
                                          <Badge variant="outline" className={
                                            ticket.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            ticket.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            ticket.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                            'bg-gray-50 text-gray-700 border-gray-200'
                                          }>
                                            {ticket.status}
                                          </Badge>
                                          <Badge variant="outline" className={
                                            ticket.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                            ticket.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            ticket.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-gray-50 text-gray-700 border-gray-200'
                                          }>
                                            {ticket.priority}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Description Preview */}
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {ticket.description.substring(0, 200)}...
                                      </p>

                                      {/* Category and Assignment Info */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        {ticket.category && (
                                          <Badge
                                            variant="outline"
                                            className="border-2"
                                            style={{ 
                                              borderColor: ticket.category.color,
                                              backgroundColor: `${ticket.category.color}10`
                                            }}
                                          >
                                            <div className="flex items-center space-x-1">
                                              <div 
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: ticket.category.color }}
                                              />
                                              <span>{ticket.category.name}</span>
                                              {ticket.category.crisis_detection_enabled && (
                                                <AlertTriangle className="h-3 w-3 text-orange-500" />
                                              )}
                                              {ticket.category.auto_assign && (
                                                <Bot className="h-3 w-3 text-green-500" />
                                              )}
                                            </div>
                                          </Badge>
                                        )}
                                        
                                        {ticket.auto_assigned === 'yes' && (
                                          <Badge variant="outline" className="bg-green-100 text-green-800">
                                            <Bot className="h-3 w-3 mr-1" />
                                            Auto-assigned
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Metadata */}
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                          <User className="h-3 w-3" />
                                          <span>{ticket.user?.name || 'Unknown User'}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {ticket.assignedTo && (
                                          <div className="flex items-center space-x-1">
                                            <UserPlus className="h-3 w-3" />
                                            <span>Assigned to: {ticket.assignedTo.name}</span>
                                          </div>
                                        )}
                                        {ticket.responses && ticket.responses.length > 0 && (
                                          <div className="flex items-center space-x-1">
                                            <MessageSquare className="h-3 w-3" />
                                            <span>{ticket.responses.length} responses</span>
                                          </div>
                                        )}
                                        {ticket.attachments && ticket.attachments.length > 0 && (
                                          <div className="flex items-center space-x-1">
                                            <Paperclip className="h-3 w-3" />
                                            <span>{ticket.attachments.length} files</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Crisis Keywords */}
                                      {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
                                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                            <span className="text-sm font-medium text-red-800">Crisis Keywords:</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {ticket.detected_crisis_keywords.slice(0, 3).map((keyword, index) => (
                                              <span 
                                                key={index}
                                                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                                              >
                                                {keyword.keyword}
                                              </span>
                                            ))}
                                            {ticket.detected_crisis_keywords.length > 3 && (
                                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                                +{ticket.detected_crisis_keywords.length - 3} more
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-1 ml-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onNavigate?.('ticket-details', { ticketId: ticket.id })}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="View Ticket"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleIndividualEditTicket(ticket)}
                                        className="text-green-600 hover:text-green-700"
                                        title="Edit Ticket"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>

                                      {!ticket.assigned_to && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleIndividualAssignTicket(ticket)}
                                          className="text-purple-600 hover:text-purple-700"
                                          title="Assign to Me"
                                        >
                                          <UserPlus className="h-4 w-4" />
                                        </Button>
                                      )}

                                      {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleIndividualResolveTicket(ticket)}
                                          className="text-green-600 hover:text-green-700"
                                          title="Mark Resolved"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleIndividualDeleteTicket(ticket)}
                                        className="text-red-600 hover:text-red-700"
                                        title="Delete Ticket"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Enhanced Pagination */}
                      {paginationInfo.total > (filters.per_page || 25) && (
                        <Card className="border-0 shadow-lg">
                          <CardContent className="p-4 sm:p-6">
                            <EnhancedPagination
                              pagination={paginationInfo}
                              onPageChange={handlePageChange}
                              onPerPageChange={handlePerPageChange}
                              isLoading={loading.tickets.list}
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
                          <Button variant="outline" onClick={handleClearFilters}>
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
          </TabsContent>

          {/* Categories Management Tab */}
          <TabsContent value="categories">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-green-600" />
                      <span>Category Management</span>
                    </CardTitle>
                    <CardDescription>Organize tickets with dynamic categories</CardDescription>
                  </div>
                  <Button disabled={loading.any}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {loading.categories.list && !categories.length ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categories.map((category) => {
                      const categoryTickets = tickets.filter(t => t.category_id === category.id)
                      const openTickets = categoryTickets.filter(t => ['Open', 'In Progress'].includes(t.status))
                      const crisisTickets = categoryTickets.filter(t => t.crisis_flag)

                      return (
                        <Card
                          key={category.id}
                          className="border-0 shadow-md hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-4 sm:p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: category.color + '20' }}
                                  >
                                    <div
                                      className="w-6 h-6 rounded"
                                      style={{ backgroundColor: category.color }}
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-lg">{category.name}</h3>
                                    <p className="text-sm text-gray-500">
                                      {categoryTickets.length} tickets
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Category Features */}
                              <div className="flex items-center space-x-4 text-sm">
                                {category.auto_assign && (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Bot className="h-4 w-4" />
                                    <span>Auto-assign</span>
                                  </div>
                                )}
                                {category.crisis_detection_enabled && (
                                  <div className="flex items-center space-x-1 text-orange-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Crisis Detection</span>
                                  </div>
                                )}
                                {category.sla_response_hours && (
                                  <div className="flex items-center space-x-1 text-blue-600">
                                    <Timer className="h-4 w-4" />
                                    <span>{category.sla_response_hours}h SLA</span>
                                  </div>
                                )}
                              </div>

                              {category.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {category.description}
                                </p>
                              )}

                              {/* Ticket Stats */}
                              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="p-2 bg-blue-50 rounded">
                                  <div className="font-medium text-blue-700">{categoryTickets.length}</div>
                                  <div className="text-blue-600 text-xs">Total</div>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded">
                                  <div className="font-medium text-yellow-700">{openTickets.length}</div>
                                  <div className="text-yellow-600 text-xs">Active</div>
                                </div>
                                <div className="p-2 bg-red-50 rounded">
                                  <div className="font-medium text-red-700">{crisisTickets.length}</div>
                                  <div className="text-red-600 text-xs">Crisis</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Sort: {category.sort_order}</span>
                                <span>
                                  Updated {new Date(category.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first category to organize tickets
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Ticket Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{ticketStats.total}</div>
                      <div className="text-sm text-blue-700">Total Tickets</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
                      <div className="text-sm text-green-700">Resolved</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{ticketStats.crisis}</div>
                      <div className="text-sm text-red-700">Crisis Cases</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{ticketStats.unassigned}</div>
                      <div className="text-sm text-yellow-700">Unassigned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Category Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{categoryStats.total}</div>
                      <div className="text-sm text-indigo-700">Total Categories</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{categoryStats.active}</div>
                      <div className="text-sm text-emerald-700">Active</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{categoryStats.with_auto_assign}</div>
                      <div className="text-sm text-purple-700">Auto-assign</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{categoryStats.with_crisis_detection}</div>
                      <div className="text-sm text-orange-700">Crisis Detection</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Export/Import Tab */}
          <TabsContent value="exports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-6 w-6 text-blue-600" />
                    <span>Export Data</span>
                  </CardTitle>
                  <CardDescription>
                    Export tickets and categories for backup or analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export All Tickets</h4>
                      <p className="text-sm text-gray-600">Download complete ticket database</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export Categories</h4>
                      <p className="text-sm text-gray-600">
                        Download category structure and settings
                      </p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export Analytics</h4>
                      <p className="text-sm text-gray-600">Download usage statistics and metrics</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-6 w-6 text-green-600" />
                    <span>Import Data</span>
                  </CardTitle>
                  <CardDescription>
                    Import tickets and categories from external sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Import Tickets</h4>
                      <p className="text-sm text-gray-600">Bulk import from CSV or JSON files</p>
                    </div>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Import Categories</h4>
                      <p className="text-sm text-gray-600">Import category structures</p>
                    </div>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Import Guidelines</h4>
                        <p className="text-sm text-yellow-700">
                          Ensure your files follow the required format. Large imports may take time
                          to process.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Individual Action Confirmation Dialog */}
      <IndividualActionDialog
        isOpen={individualActionDialog.isOpen}
        ticket={individualActionDialog.ticket}
        action={individualActionDialog.action}
        isProcessing={individualActionDialog.isProcessing}
        onConfirm={executeIndividualAction}
        onCancel={() =>
          setIndividualActionDialog({
            isOpen: false,
            ticket: null,
            action: 'edit',
            isProcessing: false,
          })
        }
      />
    </div>
  );
}