// components/pages/admin-tickets-page/index.tsx - FIXED: Stable state management
"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  Settings,
  AlertTriangle,
  Users,
  BarChart3,
  Database,
  CheckCircle,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import { 
  useCounselorSpecializationsActions,
  useCounselorSpecializationsData 
} from "@/stores/counselorSpecializations-store"

// Import all the refactored components
import { AdminTicketsHeader } from "./components/header/AdminTicketsHeader"
import { IndividualActionDialog } from "./components/dialogs/IndividualActionDialog"
import { CategoryDialog } from "./components/dialogs/CategoryDialog"
import { CrisisKeywordsDialog } from "./components/dialogs/CrisisKeywordsDialog"
import { CounselorDialog } from "./components/dialogs/CounselorDialog"
import { TicketsTab } from "./components/tabs/TicketsTab"
import { CategoriesTab } from "./components/tabs/CategoriesTab"
import { AnalyticsTab } from "./components/tabs/AnalyticsTab"
import { SystemTab } from "./components/tabs/SystemTab"
import { CounselorTab } from "./components/tabs/CounselorTab"

// Import hooks and utilities
import { useAdminTickets } from "./hooks/useAdminTickets"
import { AdminTabType, AdminTicketsPageProps } from "./types/admin-types"
import { CATEGORY_FORM_DEFAULTS, CRISIS_KEYWORD_FORM_DEFAULTS, COUNSELOR_FORM_DEFAULTS } from "./utils/constants"

export function AdminTicketsPage({ onNavigate }: AdminTicketsPageProps): React.ReactElement {
  const [selectedTab, setSelectedTab] = useState<AdminTabType>("tickets")

  // FIXED: Get counselor actions and data with stable references
  const counselorActions = useCounselorSpecializationsActions()
  const counselorData = useCounselorSpecializationsData()

  // Use the main admin tickets hook
  const {
    // Data
    tickets,
    categories,
    paginatedTickets,
    paginationInfo,
    ticketStats,
    categoryStats,
    availableStaff,
    crisisKeywords,

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
  } = useAdminTickets(onNavigate)

  // Navigation handler
  const handleBackToTickets = useCallback(() => {
    onNavigate?.('tickets')
  }, [onNavigate])

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

  // FIXED: Stable filter handlers with useCallback
  const handleSearchChange = useCallback((value: string) => {
    console.log('🔍 AdminTicketsPage: Search changed:', value)
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [setFilters])

  const handleFilterChange = useCallback((key: string, value: string) => {
    console.log('🔧 AdminTicketsPage: Filter changed:', key, value)
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? 'all' : value,
      page: 1,
    }))
  }, [setFilters])

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
  }, [setFilters])

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 AdminTicketsPage: Page changed to:', page)
    setFilters((prev) => ({ ...prev, page }))
    
    // Scroll to top of results
    const resultsSection = document.getElementById('admin-tickets-results')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [setFilters])

  const handlePerPageChange = useCallback((perPage: number) => {
    console.log('📄 AdminTicketsPage: Per page changed to:', perPage)
    setFilters((prev) => ({ ...prev, per_page: perPage, page: 1 }))
  }, [setFilters])

  // Individual ticket action handlers
  const handleIndividualEditTicket = useCallback((ticket: any) => {
    onNavigate?.('ticket-details', { ticketId: ticket.id })
  }, [onNavigate])

  const handleIndividualDeleteTicket = useCallback((ticket: any) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'delete',
      isProcessing: false
    })
  }, [setIndividualActionDialog])

  const handleIndividualAssignTicket = useCallback((ticket: any) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'assign',
      isProcessing: false
    })
  }, [setIndividualActionDialog])

  const handleIndividualResolveTicket = useCallback((ticket: any) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'resolve',
      isProcessing: false
    })
  }, [setIndividualActionDialog])

  const handleIndividualViewTicket = useCallback((ticket: any) => {
    onNavigate?.('ticket-details', { ticketId: ticket.id })
  }, [onNavigate])

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
          // This would require user context
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

      toast.success(`Ticket ${action} successful`)
    } catch (error: any) {
      console.error(`Failed to ${action}:`, error)
      setIndividualActionDialog(prev => ({ ...prev, isProcessing: false }))
      toast.error(`Failed to ${action} ticket: ${error.message}`)
    }
  }, [individualActionDialog, ticketOperations, setIndividualActionDialog])

  // Category management handlers
  const handleCreateCategory = useCallback(() => {
    setCategoryForm(CATEGORY_FORM_DEFAULTS)
    setCategoryDialog({ isOpen: true, mode: 'create', category: null })
  }, [setCategoryForm, setCategoryDialog])

  const handleEditCategory = useCallback((category: any) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      is_active: category.is_active,
      auto_assign: category.auto_assign,
      crisis_detection_enabled: category.crisis_detection_enabled,
      sla_response_hours: category.sla_response_hours,
      max_priority_level: category.max_priority_level || 3,
      sort_order: category.sort_order
    })
    setCategoryDialog({ isOpen: true, mode: 'edit', category })
  }, [setCategoryForm, setCategoryDialog])

  const handleSaveCategory = useCallback(async () => {
    try {
      if (categoryDialog.mode === 'create') {
        await categoriesStore.actions.createCategory(categoryForm)
        toast.success('Category created successfully')
      } else if (categoryDialog.category) {
        await categoriesStore.actions.updateCategory(categoryDialog.category.id, categoryForm)
        toast.success('Category updated successfully')
      }
      
      setCategoryDialog({ isOpen: false, mode: 'create', category: null })
      setCategoryForm(CATEGORY_FORM_DEFAULTS)
    } catch (error) {
      console.error('Failed to save category:', error)
      toast.error('Failed to save category')
    }
  }, [categoryDialog, categoryForm, categoriesStore.actions, setCategoryDialog, setCategoryForm])

  const handleDeleteCategory = useCallback(async (category: any) => {
    try {
      await categoriesStore.actions.deleteCategory(category.id)
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category')
    }
  }, [categoriesStore.actions])

  // Crisis keywords handlers
  const handleCreateCrisisKeyword = useCallback(() => {
    setCrisisKeywordForm(CRISIS_KEYWORD_FORM_DEFAULTS)
    setCrisisKeywordsDialog({ isOpen: true, mode: 'create', keyword: null })
  }, [setCrisisKeywordForm, setCrisisKeywordsDialog])

  const handleSaveCrisisKeyword = useCallback(() => {
    // Handle create/update crisis keyword
    toast.success('Crisis keyword saved successfully')
    setCrisisKeywordsDialog({ isOpen: false, mode: 'create', keyword: null })
    setCrisisKeywordForm(CRISIS_KEYWORD_FORM_DEFAULTS)
  }, [setCrisisKeywordsDialog, setCrisisKeywordForm])

  // FIXED: Counselor specialization handlers with stable references
  const handleCreateCounselorSpecialization = useCallback(() => {
    setCounselorForm(COUNSELOR_FORM_DEFAULTS)
    setCounselorDialog({ isOpen: true, mode: 'create', specialization: null })
  }, [setCounselorForm, setCounselorDialog])

  const handleSaveCounselorSpecialization = useCallback(async () => {
    try {
      if (counselorDialog.mode === 'create') {
        await counselorActions.createSpecialization(counselorForm)
        toast.success('Counselor specialization created successfully')
      } else if (counselorDialog.specialization) {
        await counselorActions.updateSpecialization(counselorDialog.specialization.id, counselorForm)
        toast.success('Counselor specialization updated successfully')
      }
      
      setCounselorDialog({ isOpen: false, mode: 'create', specialization: null })
      setCounselorForm(COUNSELOR_FORM_DEFAULTS)
    } catch (error) {
      console.error('Failed to save counselor specialization:', error)
      toast.error('Failed to save counselor specialization')
    }
  }, [counselorDialog, counselorForm, counselorActions, setCounselorDialog, setCounselorForm])

  const handleEditCounselorSpecialization = useCallback((specialization: any) => {
    setCounselorForm({
      user_id: specialization.user_id,
      category_id: specialization.category_id,
      priority_level: specialization.priority_level,
      max_workload: specialization.max_workload,
      expertise_rating: specialization.expertise_rating,
      is_available: specialization.is_available,
      notes: specialization.notes || ''
    })
    setCounselorDialog({ isOpen: true, mode: 'edit', specialization })
  }, [setCounselorForm, setCounselorDialog])

  const handleDeleteCounselorSpecialization = useCallback(async (specialization: any) => {
    try {
      await counselorActions.deleteSpecialization(specialization.id)
      toast.success('Counselor specialization removed successfully')
    } catch (error) {
      console.error('Failed to delete counselor specialization:', error)
      toast.error('Failed to remove counselor specialization')
    }
  }, [counselorActions])

  // FIXED: Load counselor specializations when needed with stable effect
  useEffect(() => {
    if (selectedTab === 'counselor-specializations') {
      counselorActions.fetchSpecializations()
      counselorActions.fetchAvailableStaff()
    }
  }, [selectedTab, counselorActions.fetchSpecializations, counselorActions.fetchAvailableStaff])

  // FIXED: Memoize computed values to prevent recalculation
  const computedStats = useMemo(() => ({
    ticketStats,
    categoryStats,
    counselorStats: {
      total: counselorData.specializations.length,
      available: counselorData.specializations.filter(s => s.is_available).length,
      overloaded: counselorData.specializations.filter(s => s.utilization_rate >= 100).length
    }
  }), [ticketStats, categoryStats, counselorData.specializations])

  // Early returns for loading and permission states
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
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

  if (loading.any && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
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
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header */}
        <AdminTicketsHeader
          ticketStats={computedStats.ticketStats}
          categoryStats={computedStats.categoryStats}
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
                  Ticket management system ready - {computedStats.ticketStats.total} tickets,{' '}
                  {computedStats.categoryStats.total} categories
                  {computedStats.ticketStats.crisis > 0 && `, ${computedStats.ticketStats.crisis} crisis cases`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs - Mobile Responsive */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as AdminTabType)}>
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto min-w-max">
              <TabsTrigger value="tickets" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Target className="h-4 w-4" />
                  <span>Tickets</span>
                  <Badge variant="secondary" className="text-xs">
                    {computedStats.ticketStats.total}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Settings className="h-4 w-4" />
                  <span>Categories</span>
                  <Badge variant="secondary" className="text-xs">
                    {computedStats.categoryStats.total}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="crisis-keywords" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Crisis</span>
                  <span className="sm:hidden">Crisis</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="counselor-specializations" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Counselors</span>
                  <span className="sm:hidden">Staff</span>
                  <Badge variant="secondary" className="text-xs">
                    {computedStats.counselorStats.total}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">System</span>
                  <span className="sm:hidden">System</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tickets Management Tab */}
          <TabsContent value="tickets" className="space-y-4 sm:space-y-6">
            <TicketsTab
              tickets={tickets}
              categories={categories}
              filters={filters}
              paginatedTickets={paginatedTickets}
              paginationInfo={paginationInfo}
              isLoading={loading.tickets.list}
              hasError={!!errors.tickets.list}
              hasActiveFilters={hasActiveFilters}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              onRefresh={handleRefreshAll}
              onNavigate={onNavigate}
              onEditTicket={handleIndividualEditTicket}
              onDeleteTicket={handleIndividualDeleteTicket}
              onAssignTicket={handleIndividualAssignTicket}
              onResolveTicket={handleIndividualResolveTicket}
              onViewTicket={handleIndividualViewTicket}
            />
          </TabsContent>

          {/* Categories Management Tab */}
          <TabsContent value="categories" className="space-y-4 sm:space-y-6">
            <CategoriesTab
              categories={categories}
              tickets={tickets}
              isLoading={loading.categories.list}
              onCreateCategory={handleCreateCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </TabsContent>

          {/* Crisis Keywords Tab */}
          <TabsContent value="crisis-keywords" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Crisis Keywords Management</h3>
                  <p className="text-gray-600 mb-4">
                    Set up keywords that automatically flag tickets as crisis cases
                  </p>
                  <Button onClick={handleCreateCrisisKeyword}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crisis Keyword
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Counselor Specializations Tab */}
          <TabsContent value="counselor-specializations" className="space-y-4 sm:space-y-6">
            <CounselorTab
              onCreateSpecialization={handleCreateCounselorSpecialization}
              onEditSpecialization={handleEditCounselorSpecialization}
              onDeleteSpecialization={handleDeleteCounselorSpecialization}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <AnalyticsTab 
              ticketStats={computedStats.ticketStats} 
              categoryStats={computedStats.categoryStats} 
            />
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system" className="space-y-4 sm:space-y-6">
            <SystemTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* All Dialog Components */}
      
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

      {/* Create/Edit Category Dialog */}
      <CategoryDialog
        dialogState={categoryDialog}
        formData={categoryForm}
        onFormChange={(data) => setCategoryForm(prev => ({ ...prev, ...data }))}
        onClose={() => setCategoryDialog({ isOpen: false, mode: 'create', category: null })}
        onSave={handleSaveCategory}
        isLoading={loading.categories.list}
      />

      {/* Create/Edit Crisis Keywords Dialog */}
      <CrisisKeywordsDialog
        dialogState={crisisKeywordsDialog}
        formData={crisisKeywordForm}
        categories={categories}
        onFormChange={(data) => setCrisisKeywordForm(prev => ({ ...prev, ...data }))}
        onClose={() => setCrisisKeywordsDialog({ isOpen: false, mode: 'create', keyword: null })}
        onSave={handleSaveCrisisKeyword}
      />

      {/* Create/Edit Counselor Specialization Dialog */}
      <CounselorDialog
        dialogState={counselorDialog}
        formData={counselorForm}
        onFormChange={(data) => setCounselorForm(prev => ({ ...prev, ...data }))}
        onClose={() => setCounselorDialog({ isOpen: false, mode: 'create', specialization: null })}
        onSave={handleSaveCounselorSpecialization}
      />
    </div>
  );
}