// hooks/useAdminTickets.ts
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { useTicketIntegration } from "@/hooks/useTicketIntegration"
import { useTicketCategoriesStore } from "@/stores/ticketCategories-store"
import { useAuth } from "@/contexts/AuthContext"
import { TicketData } from "@/stores/ticket-store"
import { TicketCategory } from "@/services/ticketCategories.service"
import {
  FilterOptions,
  TicketStats,
  CategoryStats,
  IndividualActionDialogState,
  CategoryDialogState,
  CrisisKeywordsDialogState,
  CounselorDialogState
} from "../types/admin-types"
import {
  CategoryFormData,
  CrisisKeywordFormData,
  CounselorSpecializationFormData
} from "../types/form-types"
import {
  FILTER_DEFAULTS,
  CATEGORY_FORM_DEFAULTS,
  CRISIS_KEYWORD_FORM_DEFAULTS,
  COUNSELOR_FORM_DEFAULTS
} from "../utils/constants"

export function useAdminTickets(onNavigate?: (page: string, params?: any) => void) {
  const { user } = useAuth()
  const categoriesStore = useTicketCategoriesStore()

  // Main data integration
  const {
    data: { tickets, categories },
    state: { loading, errors },
    ticketOperations,
    refreshAll,
    clearAllCaches,
  } = useTicketIntegration({
    autoLoadCategories: true,
    autoLoadTickets: true,
    enableRealTimeUpdates: true
  })

  // Local state
  const [filters, setFilters] = useState<FilterOptions>(FILTER_DEFAULTS)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [crisisKeywords, setCrisisKeywords] = useState<any[]>([])
  const [counselorSpecializations, setCounselorSpecializations] = useState<any[]>([])

  // Dialog states
  const [individualActionDialog, setIndividualActionDialog] = useState<IndividualActionDialogState>({
    isOpen: false,
    ticket: null,
    action: 'edit',
    isProcessing: false
  })

  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogState>({
    isOpen: false,
    mode: 'create',
    category: null
  })

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(CATEGORY_FORM_DEFAULTS)

  const [crisisKeywordsDialog, setCrisisKeywordsDialog] = useState<CrisisKeywordsDialogState>({
    isOpen: false,
    mode: 'create',
    keyword: null
  })

  const [crisisKeywordForm, setCrisisKeywordForm] = useState<CrisisKeywordFormData>(CRISIS_KEYWORD_FORM_DEFAULTS)

  const [counselorDialog, setCounselorDialog] = useState<CounselorDialogState>({
    isOpen: false,
    mode: 'create',
    specialization: null
  })

  const [counselorForm, setCounselorForm] = useState<CounselorSpecializationFormData>(COUNSELOR_FORM_DEFAULTS)

  // Permission check
  const isAdmin = user?.role === 'admin'

  // Load additional data
  useEffect(() => {
    if (isAdmin) {
      loadAdditionalData()
    }
  }, [isAdmin])

  const loadAdditionalData = async () => {
    try {
      // Load available staff, crisis keywords, counselor specializations
      // These would typically come from API calls
      setAvailableStaff([])
      setCrisisKeywords([])
      setCounselorSpecializations([])
    } catch (error) {
      console.error('Failed to load additional data:', error)
    }
  }

  // Filtered and paginated tickets
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

  // Pagination info
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
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          ticket.ticket_number.toLowerCase().includes(searchLower) ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.user?.name?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
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

      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && ticket.category_id !== category.id) return false
      }

      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false
      }

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

      if (filters.crisis_flag && filters.crisis_flag !== 'all') {
        if (filters.crisis_flag === 'true' && !ticket.crisis_flag) return false
        if (filters.crisis_flag === 'false' && ticket.crisis_flag) return false
      }

      if (filters.auto_assigned && filters.auto_assigned !== 'all') {
        if (filters.auto_assigned === 'yes' && ticket.auto_assigned !== 'yes') return false
        if (filters.auto_assigned === 'no' && ticket.auto_assigned === 'yes') return false
      }
      
      return true
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
  }, [tickets, filters, categories])

  // Calculate stats
  const ticketStats: TicketStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    in_progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    crisis: tickets.filter(t => t.crisis_flag).length,
    unassigned: tickets.filter(t => !t.assigned_to).length,
    auto_assigned: tickets.filter(t => t.auto_assigned === 'yes').length,
  }), [tickets])

  const categoryStats: CategoryStats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    with_auto_assign: categories.filter(c => c.auto_assign).length,
    with_crisis_detection: categories.filter(c => c.crisis_detection_enabled).length,
  }), [categories])

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

  return {
    // Data
    tickets,
    categories,
    paginatedTickets,
    paginationInfo,
    ticketStats,
    categoryStats,
    availableStaff,
    crisisKeywords,
    counselorSpecializations,

    // State
    filters,
    isAdmin,
    loading,
    errors,
    hasActiveFilters,

    // Dialog states
    individualActionDialog,
    categoryDialog,
    categoryForm,
    crisisKeywordsDialog,
    crisisKeywordForm,
    counselorDialog,
    counselorForm,

    // State setters
    setFilters,
    setIndividualActionDialog,
    setCategoryDialog,
    setCategoryForm,
    setCrisisKeywordsDialog,
    setCrisisKeywordForm,
    setCounselorDialog,
    setCounselorForm,

    // Operations
    ticketOperations,
    categoriesStore,
    refreshAll,
    clearAllCaches,
  }
}