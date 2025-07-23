// components/pages/tickets-page.tsx - ENHANCED: Modern UI with Infinite Scroll

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

// Utils and hooks
import { 
  calculateStats, 
  getPageInfo, 
  getPermissions,
  applyTicketFilters,
  filterTicketsByView
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

// ENHANCED: Simple Components without complex hooks
import { TicketsHeader } from '@/components/tickets/TicketsHeader'
import { ModernTicketsFilters } from '@/components/tickets/ModernTicketsFilters'
import { TicketTabs } from '@/components/tickets/TicketTabs'
import { TicketsList } from '@/components/tickets/TicketsList'

// SIMPLIFIED: Essential Dialogs Only
import { EnhancedDeleteTicketDialog } from '@/components/dialogs/EnhancedDeleteTicketDialog'

// ENHANCED: Modern Alerts
import { ModernCrisisAlert } from '@/components/alerts/ModernCrisisAlert'
import { ModernUnassignedAlert } from '@/components/alerts/ModernUnassignedAlert'
import { ErrorAlert } from '@/components/alerts/ErrorAlert'

// Shared components
import { HelpSupportFooter } from '@/components/shared/HelpSupportFooter'

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
  // ENHANCED: Use ticket integration hook for unified management
  const {
    data: { tickets, categories, currentTicketWithCategory },
    state: { loading, errors },
    ticketOperations,
    refreshAll,
    clearAllCaches,
    stores
  } = useTicketIntegration({
    autoLoadCategories: true,
    autoLoadTickets: true,
    enableRealTimeUpdates: true
  })

  // Store access for selections
  const selectedTickets = useTicketStore((state) => state?.selectedTickets || new Set());
  const filters = useTicketStore((state) => state?.filters || {});
  const storeActions = useTicketStore((state) => state?.actions);

  // SIMPLIFIED: Infinite scroll state - No complex hooks
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // SIMPLIFIED: Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('all');

  // SIMPLIFIED: Essential dialog state only
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    ticket: null,
  });

  // Current user and derived data
  const currentUser = useMemo(() => authService.getStoredUser(), []);
  const { toast } = useToast();

  // Apply client-side filtering with category support
  const filteredTickets = useMemo(() => {
    return applyTicketFilters(tickets, searchTerm, filters, currentUser?.id);
  }, [tickets, searchTerm, filters, currentUser?.id]);

  // Apply view-specific filtering with category awareness
  const currentTabTickets = useMemo(() => {
    return filterTicketsByView(filteredTickets, currentView, currentUser?.id);
  }, [filteredTickets, currentView, currentUser?.id]);

  // Stats calculation with category support
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

  // REMOVED: Complex intersection observer - using simple scroll in component instead

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [filters, searchTerm, currentView]);

  // Navigation handlers with category slug support
  const handleViewTicket = useCallback(
    (ticket: TicketData): void => {
      try {
        console.log('🎫 TicketsPage: Navigating to ticket details:', ticket.id);
        if (onNavigate) {
          const slug = ticket.slug || 
            `${ticket.id}-${ticket.category?.slug || 'general'}-${ticket.ticket_number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          onNavigate('ticket-details', { ticketId: ticket.id, slug });
        }
      } catch (error) {
        console.error('❌ TicketsPage: Navigation error:', error);
      }
    },
    [onNavigate]
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

  // ENHANCED: Smart refresh with category updates
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 TicketsPage: Enhanced refresh triggered');
      setPage(1);
      setHasMore(true);
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

  // Filter change with category support
  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      if (!storeActions?.setFilters) return;

      const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
      storeActions.setFilters(newFilters, true);

      // Reset pagination
      setPage(1);
      setHasMore(true);

      // Provide feedback for category filtering
      if (key === 'category_id' && value !== 'all') {
        const category = categories.find(c => c.id.toString() === value);
        if (category) {
          toast({
            title: 'Filter Applied',
            description: `Showing tickets in ${category.name} category`,
          });
        }
      }
    },
    [storeActions, filters, categories, toast]
  );

  const clearFilters = useCallback(() => {
    if (!storeActions?.clearFilters) return;

    storeActions.clearFilters(true);
    setSearchTerm('');
    setPage(1);
    setHasMore(true);

    toast({
      title: 'Filters cleared',
      description: 'All filters have been reset',
    });
  }, [storeActions, toast]);

  // SIMPLIFIED: Basic ticket actions only
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
        // Error handling is managed by ticketOperations
      }
    },
    [ticketOperations, currentUser]
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

  // SIMPLIFIED: Selection handlers
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
        currentTabTickets.forEach((ticket) => storeActions.selectTicket(ticket.id));
      } else {
        storeActions.clearSelection();
      }
    },
    [storeActions, currentTabTickets]
  );

  // SIMPLIFIED: Quick actions
  const handleViewCrisis = useCallback(() => {
    setCurrentView('crisis');
    toast({
      title: 'Crisis View',
      description: 'Showing all crisis tickets',
    });
  }, [toast]);

  const handleViewUnassigned = useCallback(() => {
    handleFilterChange('assigned', 'unassigned');
  }, [handleFilterChange]);

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

  const hasActiveFilters = Boolean(
    searchTerm || filters.status || filters.category_id || filters.priority || filters.assigned
  );

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
                <span className="text-sm font-medium text-amber-700">
                  Refreshing tickets...
                </span>
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

        {/* REVERTED: Original Header - No mobile padding */}
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
              activeCategoriesCount={categories.filter(c => c.is_active).length}
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
              error={errors.any ? ((Object.values(errors.tickets).find(Boolean) || Object.values(errors.categories).find(Boolean)) ?? null) : null}
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
              searchTerm={searchTerm}
              filters={filters}
              loading={loading.any}
              userRole={currentUser?.role}
              selectedCount={selectedTicketsArray.length}
              totalCount={currentTabTickets.length}
              canBulkActions={false} // Simplified: No bulk actions
              categories={categories}
              onSearchChange={setSearchTerm}
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
                <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
                  <TicketTabs
                    currentView={currentView}
                    stats={stats}
                    userRole={currentUser?.role}
                    onViewChange={setCurrentView}
                  />

                  <TabsContent value={currentView} className="p-4 sm:p-6 space-y-4 mt-0">
                    <TicketsList
                      tickets={currentTabTickets}
                      loading={loading.any}
                      loadingMore={loadingMore}
                      hasMore={hasMore}
                      selectedTickets={selectedTickets}
                      permissions={permissions}
                      userRole={currentUser?.role}
                      searchTerm={searchTerm}
                      hasFilters={hasActiveFilters}
                      onSelectTicket={handleSelectTicket}
                      onViewTicket={handleViewTicket}
                      onTicketAction={handleTicketAction}
                      onCreateTicket={handleCreateTicket}
                    />
                  </TabsContent>
                </Tabs>
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* REVERTED: Original Help and Support Links */}
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