// components/pages/tickets-page.tsx - FIXED: Localized filtering without tab clearing

"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Settings, Plus, RefreshCw, Loader2 } from "lucide-react"

// Enhanced imports for dynamic categories
import { useTicketIntegration } from '@/hooks/useTicketIntegration'
import { useTicketStore, TicketData } from "@/stores/ticket-store"
import { useTicketCategoriesStore } from "@/stores/ticketCategories-store"
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

// Types and constants
import { 
  TicketsPageProps, 
  DeleteDialogState,
  TicketStats 
} from '@/types/tickets.types'

// FIXED: Utils with localized filtering
import { 
  calculateStats, 
  getPageInfo, 
  getPermissions,
  applyTicketFilters,
  filterTicketsByView,
  applySmartFilter,
  hasActiveFilters,
  clearFiltersButPreserveView,
  sortTickets
} from '@/utils/tickets.utils'

// Error Boundary
import { ErrorBoundary, withErrorBoundary } from '@/components/common/error-boundary'

// Loading Skeletons
import {
  TicketsHeaderSkeleton,
  TicketsFiltersSkeleton,
  TicketTabsSkeleton,
  TicketsListSkeleton,
  AlertSkeleton,
} from '@/components/tickets/TicketsLoadingSkeletons'

// Components
import { TicketsHeader } from '@/components/tickets/TicketsHeader'
import { ModernTicketsFilters } from '@/components/tickets/ModernTicketsFilters'
import { TicketTabs } from '@/components/tickets/TicketTabs'
import { TicketsList } from '@/components/tickets/TicketsList'

// Dialogs
import { EnhancedDeleteTicketDialog } from '@/components/dialogs/EnhancedDeleteTicketDialog'

// Alerts
import { ModernCrisisAlert } from '@/components/alerts/ModernCrisisAlert'
import { ModernUnassignedAlert } from '@/components/alerts/ModernUnassignedAlert'
import { ErrorAlert } from '@/components/alerts/ErrorAlert'

// Shared components
import { HelpSupportFooter } from '@/components/shared/HelpSupportFooter'
import { EnhancedPagination } from '@/components/common/enhanced-pagination'

// Error Fallback for Tickets Section
function TicketsErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to Load Tickets</h3>
            <p className="text-gray-600 text-sm">
              {error.message.includes('network') || error.message.includes('fetch')
                ? 'Network connection problem. Please check your internet connection.'
                : 'There was an error loading your tickets. Please try again.'}
            </p>
            <Button
              onClick={retry}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TicketsPageContent({ onNavigate }: TicketsPageProps) {
  // FIXED: Use ticket integration hook properly
  const {
    data: { tickets, categories, currentTicketWithCategory },
    state: { loading, errors },
    ticketOperations,
    refreshAll,
    clearAllCaches,
    stores,
  } = useTicketIntegration({
    autoLoadCategories: true,
    autoLoadTickets: true,
    enableRealTimeUpdates: false,
  });

  // Store access for selections
  const selectedTickets = useTicketStore((state) => state?.selectedTickets || new Set());
  const storeActions = useTicketStore((state) => state?.actions);

  // FIXED: Local state for UI without triggering API calls
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    category_id: 'all',
    priority: 'all',
    assigned: 'all',
    crisis_flag: 'all',
    auto_assigned: 'all',
    overdue: 'all',
  });

  // FIXED: Separate view state to prevent tab clearing
  const [currentView, setCurrentView] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    ticket: null,
  });

  // Current user and derived data
  const currentUser = useMemo(() => authService.getStoredUser(), []);
  const { toast } = useToast();

  // FIXED: Apply filters locally without API calls
  const filteredTickets = useMemo(() => {
    console.log('🔍 Applying local filters to tickets:', {
      totalTickets: tickets.length,
      filters: localFilters,
      view: currentView,
    });

    // First apply search and filters
    let filtered = applyTicketFilters(tickets, localFilters.search, localFilters, currentUser?.id);

    // Then apply view-specific filtering
    filtered = filterTicketsByView(filtered, currentView, currentUser?.id);

    // Sort tickets
    filtered = sortTickets(filtered, 'updated_at', 'desc');

    console.log('✅ Local filtering complete:', {
      originalCount: tickets.length,
      filteredCount: filtered.length,
      view: currentView,
    });

    return filtered;
  }, [tickets, localFilters, currentView, currentUser?.id]);

  // FIXED: Pagination that works with local filtering
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, perPage]);

  // Pagination info
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(filteredTickets.length / perPage);
    const startIndex = (currentPage - 1) * perPage;

    return {
      current_page: currentPage,
      last_page: totalPages,
      per_page: perPage,
      total: filteredTickets.length,
      from: filteredTickets.length > 0 ? startIndex + 1 : 0,
      to: Math.min(startIndex + perPage, filteredTickets.length),
      has_more_pages: currentPage < totalPages,
    };
  }, [filteredTickets.length, currentPage, perPage]);

  // Stats calculation with all tickets (not filtered)
  const stats: TicketStats = useMemo(() => {
    return calculateStats(tickets, currentUser?.id);
  }, [tickets, currentUser?.id]);

  // Page info and permissions
  const pageInfo = useMemo(() => getPageInfo(currentUser?.role), [currentUser?.role]);
  const permissions = useMemo(() => getPermissions(currentUser?.role), [currentUser?.role]);

  // Selected tickets as array with category data
  const selectedTicketsArray = useMemo(() => {
    return Array.from(selectedTickets)
      .map((id) => tickets.find((t) => t.id === id))
      .filter(Boolean) as TicketData[];
  }, [selectedTickets, tickets]);

  // FIXED: Reset pagination when filters or view change
  useEffect(() => {
    setCurrentPage(1);
  }, [localFilters, currentView]);

  // Navigation handlers with category slug support
  // FIXED: Navigation handlers with category slug support
  const handleViewTicket = useCallback(
    (ticket: TicketData): void => {
      try {
        console.log('🎫 TicketsPage: Navigating to ticket details:', ticket.id);
        if (onNavigate) {
          // Generate proper slug with category information
          const category = categories.find((c) => c.id === ticket.category_id);

          // Create a proper slug: id-category-title-ticketnumber
          const sanitizedSubject = ticket.subject
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

          const categorySlug = category?.slug || 'general';
          const ticketNumber = ticket.ticket_number.toLowerCase().replace(/[^a-z0-9]/g, '-');

          const slug = `${ticket.id}-${categorySlug}-${sanitizedSubject}-${ticketNumber}`;

          console.log('🎫 TicketsPage: Generated slug:', slug);

          onNavigate('ticket-details', {
            ticketId: ticket.id,
            slug: slug,
          });
        }
      } catch (error) {
        console.error('❌ TicketsPage: Navigation error:', error);
        // Fallback to just ticket ID
        if (onNavigate) {
          onNavigate('ticket-details', { ticketId: ticket.id });
        }
      }
    },
    [onNavigate, categories]
  );

  const handleCreateTicket = useCallback((): void => {
    try {
      console.log('🎫 TicketsPage: Navigating to create ticket');
      if (onNavigate) {
        onNavigate('submit-ticket');
      }
    } catch (error) {
      console.error('❌ TicketsPage: Navigation error:', error);
    }
  }, [onNavigate]);

  // FIXED: Smart refresh that doesn't clear UI state
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 TicketsPage: Smart refresh triggered');
      await refreshAll();

      toast({
        title: 'Success',
        description: 'Tickets refreshed successfully',
      });
    } catch (error) {
      console.error('❌ TicketsPage: Refresh error:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    }
  }, [refreshAll, toast]);

  // FIXED: Local filter change that doesn't trigger API calls
  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      console.log('🔧 TicketsPage: Local filter change:', { key, value });

      setLocalFilters((prev) => ({
        ...prev,
        [key]: value === 'all' ? 'all' : value,
      }));

      // Reset pagination when filters change
      setCurrentPage(1);

      // Provide feedback for category filtering
      if (key === 'category_id' && value !== 'all') {
        const category = categories.find((c) => c.id.toString() === value);
        if (category) {
          toast({
            title: 'Filter Applied',
            description: `Showing tickets in ${category.name} category`,
          });
        }
      }
    },
    [categories, toast]
  );

  // FIXED: Clear filters while preserving view
  const clearFilters = useCallback(() => {
    console.log('🧹 TicketsPage: Clearing filters, preserving view:', currentView);

    setLocalFilters({
      search: '',
      status: 'all',
      category_id: 'all',
      priority: 'all',
      assigned: 'all',
      crisis_flag: 'all',
      auto_assigned: 'all',
      overdue: 'all',
    });
    setCurrentPage(1);

    toast({
      title: 'Filters cleared',
      description: 'All filters have been reset',
    });
  }, [currentView, toast]);

  // FIXED: View change that doesn't affect filters
  const handleViewChange = useCallback(
    (newView: string) => {
      console.log('📑 TicketsPage: Changing view from', currentView, 'to', newView);
      setCurrentView(newView);
      setCurrentPage(1); // Reset pagination when view changes
    },
    [currentView]
  );

  // FIXED: Alert handlers that don't clear other tabs
  const handleViewCrisis = useCallback(() => {
    console.log('🚨 TicketsPage: Switching to crisis view');
    setCurrentView('crisis');
    toast({
      title: 'Crisis View',
      description: 'Showing all crisis tickets',
    });
  }, [toast]);

  const handleViewUnassigned = useCallback(() => {
    console.log('👤 TicketsPage: Switching to unassigned view');
    setCurrentView('unassigned');
    toast({
      title: 'Unassigned View',
      description: 'Showing all unassigned tickets',
    });
  }, [toast]);

  // Ticket actions
  const handleTicketAction = useCallback(
    async (action: string, ticket: TicketData) => {
      try {
        console.log('🎯 TicketsPage: Executing action:', action, 'on ticket:', ticket.id);

        switch (action) {
          case 'mark_in_progress':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await ticketOperations.updateTicket(ticket.id, { status: 'In Progress' });
            break;

          case 'mark_resolved':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await ticketOperations.updateTicket(ticket.id, { status: 'Resolved' });
            break;

          case 'assign_to_me':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets');
            }
            if (currentUser) {
              await ticketOperations.assignTicket(ticket.id, currentUser.id);
            }
            break;

          case 'delete':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can delete tickets');
            }
            setDeleteDialog({ isOpen: true, ticket });
            break;

          default:
            console.warn('Unknown action:', action);
        }
      } catch (error: any) {
        console.error(`Failed to ${action}:`, error);
        toast({
          title: 'Error',
          description: error.message || `Failed to ${action.replace('_', ' ')}`,
          variant: 'destructive',
        });
      }
    },
    [ticketOperations, currentUser, toast]
  );

  // Delete confirmation with category context
  const handleDeleteConfirm = useCallback(
    async (reason: string, notifyUser: boolean) => {
      if (!deleteDialog.ticket) {
        console.error('❌ No ticket found in delete dialog');
        return;
      }

      const ticketNumber = deleteDialog.ticket.ticket_number;
      const ticketId = deleteDialog.ticket.id;
      const categoryName = deleteDialog.ticket.category?.name || 'Unknown';

      console.log('🗑️ TicketsPage: Processing delete confirmation:', {
        ticketId,
        ticketNumber,
        categoryName,
        reason,
        notifyUser,
      });

      try {
        await ticketOperations.deleteTicket(ticketId, reason, notifyUser);

        console.log('✅ TicketsPage: Delete successful, closing dialog');
        setDeleteDialog({ isOpen: false, ticket: null });

        toast({
          title: 'Success',
          description: `Ticket #${ticketNumber} (${categoryName}) deleted successfully`,
        });
      } catch (error: any) {
        console.error('❌ TicketsPage: Delete failed:', error);
        // Keep dialog open on error for retry
      }
    },
    [deleteDialog.ticket, ticketOperations, toast]
  );

  // Close delete dialog handler
  const handleCloseDeleteDialog = useCallback(() => {
    console.log('🚪 TicketsPage: Closing delete dialog');
    setDeleteDialog({ isOpen: false, ticket: null });
  }, []);

  // Selection handlers
  const handleSelectTicket = useCallback(
    (ticketId: number, selected: boolean) => {
      if (!storeActions) return;

      if (selected) {
        storeActions.selectTicket(ticketId);
      } else {
        storeActions.deselectTicket(ticketId);
      }
    },
    [storeActions]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (!storeActions) return;

      if (selected) {
        paginatedTickets.forEach((ticket) => storeActions.selectTicket(ticket.id));
      } else {
        storeActions.clearSelection();
      }
    },
    [storeActions, paginatedTickets]
  );

  const handleExport = useCallback(() => {
    if (storeActions?.exportTickets) {
      storeActions.exportTickets('csv');
    }
  }, [storeActions]);

  // Cache cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      clearAllCaches();
    }, 10 * 60 * 1000);

    return () => clearInterval(cleanup);
  }, [clearAllCaches]);

  // Determine loading states
  const showSkeletonLoading = loading.any && (tickets.length === 0 || categories.length === 0);
  const showStaleIndicator = loading.tickets.refresh && tickets.length > 0;

  // Safety check for actions
  if (!storeActions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
          <TicketsHeaderSkeleton />
          <TicketsFiltersSkeleton />
          <Card className="border-0 shadow-xl">
            <CardContent className="p-0">
              <TicketTabsSkeleton />
              <div className="p-6">
                <TicketsListSkeleton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // FIXED: Check for active filters
  const activeFilters = hasActiveFilters(localFilters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile: Edge-to-edge layout, Desktop: Container with padding */}
      <div className="sm:container sm:mx-auto sm:px-4 sm:py-6 space-y-4 sm:space-y-6 sm:max-w-7xl">
        {/* ENHANCED: Stale Data Indicator */}
        {showStaleIndicator && (
          <div className="mx-4 sm:mx-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-amber-700">Refreshing tickets...</span>
              </div>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="ghost"
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
              >
                Refresh now
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        {showSkeletonLoading ? (
          <div className="mx-4 sm:mx-0">
            <TicketsHeaderSkeleton />
          </div>
        ) : (
          <div className="relative">
            <TicketsHeader
              pageInfo={pageInfo}
              stats={stats}
              loading={loading.any}
              selectedCount={selectedTicketsArray.length}
              permissions={permissions}
              userRole={currentUser?.role}
              onRefresh={handleRefresh}
              onBulkActions={() => {}} // Simplified: No bulk actions in main page
              onExport={handleExport}
              onCreate={handleCreateTicket}
              categoriesCount={categories.length}
              activeCategoriesCount={categories.filter((c) => c.is_active).length}
            />

            {/* ENHANCED: Floating Admin Access */}
            {currentUser?.role === 'admin' && (
              <div className="absolute top-4 right-4 hidden sm:block">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate?.('admin-tickets')}
                  className="bg-white/80 hover:bg-white/90 border-white/30 backdrop-blur-sm shadow-lg"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ENHANCED: Modern Crisis Alert for Counselors/Admins */}
        {!showSkeletonLoading && ['counselor', 'admin'].includes(currentUser?.role || '') && (
          <div className="mx-4 sm:mx-0">
            <ModernCrisisAlert
              crisisCount={stats.crisis}
              userRole={currentUser?.role}
              categories={categories}
              tickets={tickets}
              onViewCrisis={handleViewCrisis}
            />
          </div>
        )}

        {/* ENHANCED: Modern Unassigned Alert for Admins Only */}
        {!showSkeletonLoading && currentUser?.role === 'admin' && (
          <div className="mx-4 sm:mx-0">
            <ModernUnassignedAlert
              unassignedCount={stats.unassigned}
              userRole={currentUser?.role}
              permissions={permissions}
              categories={categories}
              tickets={tickets}
              onViewUnassigned={handleViewUnassigned}
              onBulkAssign={() => {}} // TODO: Implement bulk assign
            />
          </div>
        )}

        {/* Error Alert */}
        {!showSkeletonLoading && (
          <div className="mx-4 sm:mx-0">
            <ErrorAlert
              error={
                errors.any
                  ? (Object.values(errors.tickets).find(Boolean) ||
                      Object.values(errors.categories).find(Boolean)) ??
                    null
                  : null
              }
              onDismiss={() => {
                stores.tickets.actions.clearError('list');
                stores.categories.actions.clearError('list');
              }}
            />
          </div>
        )}

        {/* ENHANCED: Modern Filters */}
        {showSkeletonLoading ? (
          <div className="mx-4 sm:mx-0">
            <TicketsFiltersSkeleton />
          </div>
        ) : (
          <div className="mx-4 sm:mx-0">
            <ModernTicketsFilters
              searchTerm={localFilters.search}
              filters={localFilters}
              loading={loading.any}
              userRole={currentUser?.role}
              selectedCount={selectedTicketsArray.length}
              totalCount={paginatedTickets.length}
              canBulkActions={false} // Simplified: No bulk actions
              categories={categories}
              onSearchChange={(value) => handleFilterChange('search', value)}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              onSelectAll={handleSelectAll}
            />
          </div>
        )}

        {/* ENHANCED: Modern Tickets Tabs and Content - Edge to edge on mobile */}
        <div className="bg-white shadow-xl sm:rounded-xl sm:border-0 border-t border-gray-200">
          <div className="p-0">
            {showSkeletonLoading ? (
              <>
                <div className="mx-4 sm:mx-0">
                  <TicketTabsSkeleton />
                </div>
                <div className="p-6">
                  <TicketsListSkeleton />
                </div>
              </>
            ) : (
              <ErrorBoundary
                fallback={TicketsErrorFallback}
                onError={(error) => {
                  console.error('Tickets section error:', error);
                }}
              >
                <Tabs value={currentView} onValueChange={handleViewChange} className="w-full">
                  <TicketTabs
                    currentView={currentView}
                    stats={stats}
                    userRole={currentUser?.role}
                    onViewChange={handleViewChange}
                  />

                  <TabsContent value={currentView} className="p-4 sm:p-6 space-y-4 mt-0">
                    {/* Results Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {currentView === 'all'
                            ? 'All Tickets'
                            : currentView === 'crisis'
                            ? 'Crisis Tickets'
                            : currentView === 'unassigned'
                            ? 'Unassigned Tickets'
                            : currentView === 'my_assigned'
                            ? 'My Cases'
                            : currentView === 'open'
                            ? 'Active Tickets'
                            : currentView === 'closed'
                            ? 'Closed Tickets'
                            : 'Tickets'}
                        </h2>

                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {filteredTickets.length} results
                        </Badge>

                        {activeFilters && (
                          <Badge
                            variant="outline"
                            className="text-sm px-3 py-1 border-blue-200 text-blue-700"
                          >
                            Filtered
                          </Badge>
                        )}
                      </div>

                      {paginationInfo.total > paginationInfo.per_page && (
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          Page {paginationInfo.current_page} of {paginationInfo.last_page}
                        </Badge>
                      )}
                    </div>

                    <TicketsList
                      tickets={paginatedTickets}
                      loading={loading.any}
                      loadingMore={false}
                      hasMore={false}
                      selectedTickets={selectedTickets}
                      permissions={permissions}
                      userRole={currentUser?.role}
                      searchTerm={localFilters.search}
                      hasFilters={activeFilters}
                      onSelectTicket={handleSelectTicket}
                      onViewTicket={handleViewTicket}
                      onTicketAction={handleTicketAction}
                      onCreateTicket={handleCreateTicket}
                    />

                    {/* ENHANCED: Pagination */}
                    {paginationInfo.total > paginationInfo.per_page && (
                      <div className="mt-6">
                        <EnhancedPagination
                          pagination={paginationInfo}
                          onPageChange={setCurrentPage}
                          onPerPageChange={(newPerPage) => {
                            setPerPage(newPerPage);
                            setCurrentPage(1);
                          }}
                          isLoading={loading.any}
                          showPerPageSelector={true}
                          showResultsInfo={true}
                          perPageOptions={[10, 20, 50, 100]}
                          className="w-full"
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Help and Support Links */}
        {!showSkeletonLoading && (
          <div className="mx-4 sm:mx-0">
            <HelpSupportFooter
              userRole={currentUser?.role}
              onNavigate={onNavigate}
              onCreateTicket={handleCreateTicket}
            />
          </div>
        )}
      </div>

      {/* SIMPLIFIED: Essential Dialog Only */}
      {!showSkeletonLoading && (
        <EnhancedDeleteTicketDialog
          key={deleteDialog.ticket?.id || 'empty'}
          ticket={deleteDialog.ticket}
          isOpen={deleteDialog.isOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

// Wrap the main component with error boundary
const TicketsPageWithErrorBoundary = withErrorBoundary(TicketsPageContent, {
  onError: (error, errorInfo) => {
    console.error('TicketsPage Error:', error, errorInfo);
    
    // Clear problematic cache on critical errors
    if (error.message.includes('cache') || error.message.includes('fetch')) {
      const { clearAllCaches } = useTicketIntegration();
      clearAllCaches();
    }
  }
});

// Main export with error boundary wrapper
export function TicketsPage(props: TicketsPageProps) {
  return <TicketsPageWithErrorBoundary {...props} />;
}