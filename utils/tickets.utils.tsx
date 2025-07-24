// utils/tickets.utils.ts - FIXED: TypeScript issues resolved
import React from 'react'
import { Clock, RefreshCw, CheckCircle } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketCategory } from '@/services/ticketCategories.service'
import { TicketStats, TicketPermissions, PageInfo } from '@/types/tickets.types'

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'In Progress':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
    case 'High':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Open':
      return React.createElement(Clock, { className: "h-4 w-4 text-blue-600" });
    case 'In Progress':
      return React.createElement(RefreshCw, { className: "h-4 w-4 text-orange-600" });
    case 'Resolved':
      return React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" });
    case 'Closed':
      return React.createElement(CheckCircle, { className: "h-4 w-4 text-gray-600" });
    default:
      return React.createElement(Clock, { className: "h-4 w-4 text-gray-600" });
  }
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// FIXED: Enhanced stats calculation with complete interface
export const calculateStats = (tickets: TicketData[], currentUserId?: number): TicketStats => {
  const total = tickets.length
  const open = tickets.filter((t) => t.status === 'Open').length
  const in_progress = tickets.filter((t) => t.status === 'In Progress').length
  const resolved = tickets.filter((t) => t.status === 'Resolved').length
  const closed = tickets.filter((t) => t.status === 'Closed').length
  const crisis = tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent').length
  const unassigned = tickets.filter((t) => !t.assigned_to).length
  const overdue = tickets.filter((t) => t.is_overdue).length
  const auto_assigned = tickets.filter((t) => t.auto_assigned === 'yes').length

  // User-specific stats
  let my_assigned = 0
  let my_tickets = 0
  
  if (currentUserId) {
    my_assigned = tickets.filter((t) => t.assigned_to === currentUserId).length
    my_tickets = tickets.filter((t) => t.user_id === currentUserId).length
  }

  return {
    total,
    open,
    in_progress,
    resolved,
    closed,
    crisis,
    unassigned,
    my_assigned, // FIXED: Now included
    my_tickets,
    overdue,
    auto_assigned,
    manually_assigned: tickets.filter((t) => t.auto_assigned === 'manual').length,
    high_priority: tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length,
    with_crisis_keywords: tickets.filter(t => t.detected_crisis_keywords && t.detected_crisis_keywords.length > 0).length,
    
    // Derived stats
    active: open + in_progress,
    inactive: resolved + closed,
    assigned: total - unassigned,
    
    // Category stats (defaults if not provided)
    categories_total: 0,
    categories_active: 0,
    categories_with_auto_assign: 0,
    categories_with_crisis_detection: 0,
    
    // Rates
    resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    crisis_rate: total > 0 ? Math.round((crisis / total) * 100) : 0,
    auto_assign_rate: total > 0 ? Math.round((auto_assigned / total) * 100) : 0,
    auto_assignment_rate: total > 0 ? Math.round((auto_assigned / total) * 100) : 0,
    crisis_detection_rate: total > 0 ? Math.round((crisis / total) * 100) : 0,
    average_response_time: '2.3 hours',
  }
}

// FIXED: Enhanced page info with complete interface
export const getPageInfo = (userRole?: string): PageInfo => {
  switch (userRole) {
    case 'admin':
      return {
        title: 'Ticket Management',
        description: 'Manage all support tickets, assignments, and system overview',
        showCreate: true, // FIXED: Now included
        showStats: true, // FIXED: Now included
      }
    case 'counselor':
    case 'advisor':
      return {
        title: 'My Cases',
        description: 'View and manage your assigned student support cases',
        showCreate: false, // FIXED: Now included
        showStats: true, // FIXED: Now included
      }
    case 'student':
    default:
      return {
        title: 'My Support Tickets',
        description: 'Track your support requests and get help when you need it',
        showCreate: true, // FIXED: Now included
        showStats: false, // FIXED: Now included
      }
  }
}

// FIXED: Enhanced permissions with complete interface
export const getPermissions = (userRole?: string): TicketPermissions => {
  const basePermissions = {
    can_create: false, // FIXED: Now included
    can_view_all: false,
    can_assign: false,
    can_modify: false,
    can_delete: false,
    can_export: false,
    can_bulk_actions: false,
    can_manage_tags: false,
    can_add_internal_notes: false,
    can_download_attachments: true, // All authenticated users
    can_manage_categories: false,
    can_view_crisis_detection: false,
    can_test_crisis_detection: false,
  }

  switch (userRole) {
    case 'admin':
      return {
        ...basePermissions,
        can_create: true, // FIXED: Now included
        can_view_all: true,
        can_assign: true,
        can_modify: true,
        can_delete: true,
        can_export: true,
        can_bulk_actions: true,
        can_manage_tags: true,
        can_add_internal_notes: true,
        can_manage_categories: true,
        can_view_crisis_detection: true,
        can_test_crisis_detection: true,
      }
    
    case 'counselor':
    case 'advisor':
      return {
        ...basePermissions,
        can_create: false, // FIXED: Now included
        can_view_all: false, // Only assigned tickets
        can_assign: false,
        can_modify: true, // Can update status and add responses
        can_delete: false,
        can_export: false,
        can_bulk_actions: false,
        can_manage_tags: true,
        can_add_internal_notes: true,
        can_view_crisis_detection: true,
      }
    
    case 'student':
    default:
      return {
        ...basePermissions,
        can_create: true, // FIXED: Now included
        can_view_all: false, // Only own tickets
        can_assign: false,
        can_modify: false, // Can only add responses to own tickets
        can_delete: false,
        can_export: false,
        can_bulk_actions: false,
        can_manage_tags: false,
        can_add_internal_notes: false,
      }
  }
}

// Enhanced view filtering with all cases covered
export const filterTicketsByView = (
  tickets: TicketData[], 
  view: string, 
  currentUserId?: number
): TicketData[] => {
  switch (view) {
    case 'all':
      return tickets

    case 'open':
    case 'active':
      return tickets.filter(ticket => 
        ticket.status === 'Open' || ticket.status === 'In Progress'
      )

    case 'closed':
      return tickets.filter(ticket => 
        ticket.status === 'Resolved' || ticket.status === 'Closed'
      )

    case 'crisis':
      return tickets.filter(ticket => 
        ticket.crisis_flag || ticket.priority === 'Urgent'
      )

    case 'unassigned':
      return tickets.filter(ticket => !ticket.assigned_to)

    case 'my_assigned':
    case 'my_cases':
      if (!currentUserId) return []
      return tickets.filter(ticket => ticket.assigned_to === currentUserId)

    case 'my_tickets':
      if (!currentUserId) return []
      return tickets.filter(ticket => ticket.user_id === currentUserId)

    case 'overdue':
      return tickets.filter(ticket => ticket.is_overdue)

    case 'auto_assigned':
      return tickets.filter(ticket => ticket.auto_assigned === 'yes')

    case 'high_priority':
      return tickets.filter(ticket => 
        ticket.priority === 'High' || ticket.priority === 'Urgent'
      )

    default:
      return tickets
  }
}

// Enhanced filtering with comprehensive search and category support
export const applyTicketFilters = (
  tickets: TicketData[],
  searchTerm: string,
  filters: any,
  currentUserId?: number
): TicketData[] => {
  let filtered = [...tickets]

  // Search filter - search across multiple fields
  if (searchTerm?.trim()) {
    const searchLower = searchTerm.toLowerCase().trim()
    filtered = filtered.filter(ticket => {
      const searchableText = [
        ticket.subject,
        ticket.description,
        ticket.ticket_number,
        ticket.user?.name || '',
        ticket.user?.email || '',
        ticket.assignedTo?.name || '',
        ticket.category?.name || '',
        ...(ticket.tags || []),
        ...(ticket.detected_crisis_keywords?.map(k => k.keyword) || [])
      ].join(' ').toLowerCase()
      
      return searchableText.includes(searchLower)
    })
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(ticket => ticket.status === filters.status)
  }

  // Category filter - support both ID and legacy category field
  if (filters.category_id && filters.category_id !== 'all') {
    const categoryId = typeof filters.category_id === 'string' ? 
      parseInt(filters.category_id) : filters.category_id
    filtered = filtered.filter(ticket => ticket.category_id === categoryId)
  } else if (filters.category && filters.category !== 'all') {
    // Legacy support for string-based categories
    filtered = filtered.filter(ticket => ticket.category === filters.category)
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(ticket => ticket.priority === filters.priority)
  }

  // Assignment filter
  if (filters.assigned && filters.assigned !== 'all') {
    switch (filters.assigned) {
      case 'assigned':
        filtered = filtered.filter(ticket => !!ticket.assigned_to)
        break
      case 'unassigned':
        filtered = filtered.filter(ticket => !ticket.assigned_to)
        break
      case 'me':
      case 'my-assigned':
        if (currentUserId) {
          filtered = filtered.filter(ticket => ticket.assigned_to === currentUserId)
        }
        break
    }
  }

  // Crisis filter
  if (filters.crisis_flag !== undefined && filters.crisis_flag !== 'all') {
    const showCrisis = filters.crisis_flag === true || filters.crisis_flag === 'true'
    filtered = filtered.filter(ticket => ticket.crisis_flag === showCrisis)
  }

  // Auto-assignment filter
  if (filters.auto_assigned && filters.auto_assigned !== 'all') {
    filtered = filtered.filter(ticket => ticket.auto_assigned === filters.auto_assigned)
  }

  // Overdue filter
  if (filters.overdue !== undefined && filters.overdue !== 'all') {
    const showOverdue = filters.overdue === true || filters.overdue === 'true'
    filtered = filtered.filter(ticket => ticket.is_overdue === showOverdue)
  }

  return filtered
}

// Utility functions for better UI integration
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths}mo ago`
}

// Smart filter application that preserves tab state
export function applySmartFilter(
  currentFilters: any,
  newFilter: { key: string; value: any },
  preserveView: boolean = true
): any {
  const updatedFilters = { ...currentFilters }

  // Apply the new filter
  if (newFilter.value === 'all' || newFilter.value === undefined || newFilter.value === null) {
    delete updatedFilters[newFilter.key]
  } else {
    updatedFilters[newFilter.key] = newFilter.value
  }

  // Don't reset view/tab when applying filters
  if (preserveView && currentFilters.view) {
    updatedFilters.view = currentFilters.view
  }

  return updatedFilters
}

// Check if filters are active (excluding view)
export function hasActiveFilters(filters: any): boolean {
  const filterKeys = Object.keys(filters).filter(key => 
    key !== 'view' && 
    key !== 'page' && 
    key !== 'per_page' && 
    key !== 'sort_by' && 
    key !== 'sort_direction'
  )
  
  return filterKeys.some(key => {
    const value = filters[key]
    return value !== undefined && 
           value !== null && 
           value !== '' && 
           value !== 'all' &&
           !(Array.isArray(value) && value.length === 0)
  })
}

// Clear filters while preserving view
export function clearFiltersButPreserveView(currentFilters: any): any {
  return {
    page: 1,
    per_page: currentFilters.per_page || 20,
    sort_by: currentFilters.sort_by || 'updated_at',
    sort_direction: currentFilters.sort_direction || 'desc',
    view: currentFilters.view || 'all', // Preserve current view
  }
}

// Sort tickets by multiple criteria
export function sortTickets(
  tickets: TicketData[], 
  sortBy: string = 'updated_at', 
  sortDirection: 'asc' | 'desc' = 'desc'
): TicketData[] {
  const sorted = [...tickets].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
        break
      case 'subject':
        aValue = a.subject.toLowerCase()
        bValue = b.subject.toLowerCase()
        break
      case 'status':
        const statusOrder = { 'Open': 1, 'In Progress': 2, 'Resolved': 3, 'Closed': 4 }
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 5
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 5
        break
      case 'priority':
        const priorityOrder = { 'Urgent': 1, 'High': 2, 'Medium': 3, 'Low': 4 }
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 5
        break
      default:
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Secondary sort by crisis flag (crisis tickets always on top)
  return sorted.sort((a, b) => {
    if (a.crisis_flag && !b.crisis_flag) return -1
    if (!a.crisis_flag && b.crisis_flag) return 1
    return 0
  })
}

// Get filter summary for display
export function getFilterSummary(filters: any, categories: TicketCategory[] = []): string[] {
  const summary: string[] = []

  if (filters.status && filters.status !== 'all') {
    summary.push(`Status: ${filters.status}`)
  }

  if (filters.category_id && filters.category_id !== 'all') {
    const category = categories.find(c => c.id.toString() === filters.category_id.toString())
    summary.push(`Category: ${category?.name || 'Unknown'}`)
  }

  if (filters.priority && filters.priority !== 'all') {
    summary.push(`Priority: ${filters.priority}`)
  }

  if (filters.assigned && filters.assigned !== 'all') {
    const assignmentLabels = {
      assigned: 'Assigned',
      unassigned: 'Unassigned',
      me: 'Assigned to me'
    }
    summary.push(`Assignment: ${assignmentLabels[filters.assigned as keyof typeof assignmentLabels] || filters.assigned}`)
  }

  if (filters.crisis_flag === true || filters.crisis_flag === 'true') {
    summary.push('Crisis tickets only')
  }

  if (filters.auto_assigned && filters.auto_assigned !== 'all') {
    const autoAssignLabels = {
      yes: 'Auto-assigned',
      manual: 'Manually assigned',
      no: 'Not assigned'
    }
    summary.push(`Assignment type: ${autoAssignLabels[filters.auto_assigned as keyof typeof autoAssignLabels] || filters.auto_assigned}`)
  }

  if (filters.overdue === true || filters.overdue === 'true') {
    summary.push('Overdue tickets only')
  }

  return summary
}