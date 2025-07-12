// components/pages/TicketsPage.tsx (FIXED TYPESCRIPT ISSUES)
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"

// Store and services
import { useTicketStore, TicketData } from "@/stores/ticket-store"
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

// Types and constants
import { 
  TicketsPageProps, 
  DeleteDialogState,
  TicketStats 
} from '@/types/tickets.types'
import { DEFAULT_PAGINATION } from '@/constants/tickets.constants'

// Utils and hooks
import { 
  calculateStats, 
  getPageInfo, 
  getPermissions,
  applyTicketFilters,
  filterTicketsByView
} from '@/utils/tickets.utils'
import { useCachedTickets, useCachedTicketActions } from '@/hooks/useCachedTickets'
import { ticketsCache, cacheUtils } from '@/utils/smartCaching.utils'

// Error Boundary
import { ErrorBoundary, withErrorBoundary } from '@/components/common/error-boundary'

// Loading Skeletons
import {
  TicketsHeaderSkeleton,
  TicketsFiltersSkeleton,
  TicketTabsSkeleton,
  TicketsListSkeleton,
  TicketsPaginationSkeleton,
  AlertSkeleton,
  SystemOverviewSkeleton,
  PerformanceInsightsSkeleton
} from '@/components/tickets/TicketsLoadingSkeletons'

// Components
import { TicketsHeader } from '@/components/tickets/TicketsHeader'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketTabs } from '@/components/tickets/TicketTabs'
import { TicketsList } from '@/components/tickets/TicketsList'
import { TicketsPagination } from '@/components/tickets/TicketsPagination'

// Dialogs
import { DeleteTicketDialog } from '@/components/dialogs/DeleteTicketDialog'
import { BulkActionsDialog } from '@/components/dialogs/BulkActionsDialog'

// Alerts
import { CrisisAlert } from '@/components/alerts/CrisisAlert'
import { ErrorAlert } from '@/components/alerts/ErrorAlert'
import { UnassignedAlert } from '@/components/alerts/UnassignedAlert'

// Admin components
import { SystemOverview } from '@/components/admin/SystemOverview'
import { PerformanceInsights } from '@/components/admin/PerformanceInsights'

// Shared components
import { HelpSupportFooter } from '@/components/shared/HelpSupportFooter'

// Error Fallback for Tickets Section
function TicketsErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Failed to Load Tickets</h3>
          <p className="text-gray-600">
            {error.message.includes('network') || error.message.includes('fetch')
              ? 'Network connection problem. Please check your internet connection.'
              : 'There was an error loading your tickets. Please try again.'}
          </p>
          <button
            onClick={retry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function TicketsPageContent({ onNavigate }: TicketsPageProps) {
  // Store access for pagination and selections
  const pagination = useTicketStore((state) => state?.pagination || DEFAULT_PAGINATION);
  const selectedTickets = useTicketStore((state) => state?.selectedTickets || new Set());
  const filters = useTicketStore((state) => state?.filters || {});
  const actions = useTicketStore((state) => state?.actions);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('all');

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    ticket: null,
  });
  const [bulkActionsDialog, setBulkActionsDialog] = useState(false);

  // Current user and derived data
  const currentUser = useMemo(() => authService.getStoredUser(), []);

  // Smart cached tickets with background refresh
  const {
    tickets: cachedTickets,
    loading: ticketsLoading,
    error: ticketsError,
    isStale,
    refresh: refreshTickets,
    invalidateCache,
    hasCachedData,
  } = useCachedTickets({
    filters: { ...filters, search: searchTerm },
    autoRefresh: true,
    refreshInterval: 60000, // 60 seconds
  });

  // Cached ticket actions
  const {
    updateTicket,
    deleteTicket: cachedDeleteTicket,
    assignTicket,
    bulkAction,
  } = useCachedTicketActions();

  const { toast } = useToast();

  // Apply client-side filtering to cached tickets
  const filteredTickets = useMemo(() => {
    return applyTicketFilters(cachedTickets, searchTerm, filters, currentUser?.id);
  }, [cachedTickets, searchTerm, filters, currentUser?.id]);

  // Apply view-specific filtering
  const currentTabTickets = useMemo(() => {
    return filterTicketsByView(filteredTickets, currentView, currentUser?.id);
  }, [filteredTickets, currentView, currentUser?.id]);

  // Stats calculation
  const stats: TicketStats = useMemo(() => {
    return calculateStats(cachedTickets, currentUser?.id);
  }, [cachedTickets, currentUser?.id]);

  // Page info and permissions
  const pageInfo = useMemo(() => getPageInfo(currentUser?.role), [currentUser?.role]);
  const permissions = useMemo(() => getPermissions(currentUser?.role), [currentUser?.role]);

  // Selected tickets as array
  const selectedTicketsArray = useMemo(() => {
    return Array.from(selectedTickets)
      .map((id) => cachedTickets.find((t) => t.id === id))
      .filter(Boolean) as TicketData[];
  }, [selectedTickets, cachedTickets]);

  // Navigation handlers
  const handleViewTicket = useCallback(
    (ticket: TicketData): void => {
      try {
        console.log('🎫 TicketsPage: Navigating to ticket details:', ticket.id);
        if (onNavigate) {
          const slug =
            ticket.slug ||
            `${ticket.id}-${ticket.ticket_number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
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

  // Smart refresh that uses cache
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 TicketsPage: Smart refresh triggered');
      await refreshTickets();

      toast({
        title: 'Success',
        description: 'Tickets refreshed successfully',
      });
    } catch (error) {
      console.error('❌ TicketsPage: Refresh error:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh tickets',
        variant: 'destructive',
      });
    }
  }, [refreshTickets, toast]);

  // Filter change with cache invalidation
  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      if (!actions?.setFilters) return;

      const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
      actions.setFilters(newFilters, true);

      // Invalidate cache when filters change significantly
      if (['status', 'category', 'priority'].includes(key)) {
        invalidateCache();
      }
    },
    [actions, filters, invalidateCache]
  );

  const clearFilters = useCallback(() => {
    if (!actions?.clearFilters) return;

    actions.clearFilters(true);
    setSearchTerm('');
    invalidateCache(); // Clear cache when clearing filters

    toast({
      title: 'Filters cleared',
      description: 'All filters have been reset',
    });
  }, [actions, toast, invalidateCache]);

  // Enhanced ticket action handler with caching
  const handleTicketAction = useCallback(
    async (action: string, ticket: TicketData) => {
      try {
        console.log('🎯 TicketsPage: Executing action:', action, 'on ticket:', ticket.id);

        switch (action) {
          case 'mark_in_progress':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await updateTicket(ticket.id, { status: 'In Progress' });
            toast({
              title: 'Success',
              description: `Ticket #${ticket.ticket_number} marked as In Progress`,
            });
            break;

          case 'mark_resolved':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await updateTicket(ticket.id, { status: 'Resolved' });
            toast({
              title: 'Success',
              description: `Ticket #${ticket.ticket_number} marked as Resolved`,
            });
            break;

          case 'assign_to_me':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets');
            }
            if (currentUser) {
              await assignTicket(ticket.id, currentUser.id);
              toast({
                title: 'Success',
                description: `Ticket #${ticket.ticket_number} assigned to you`,
              });
            }
            break;

          case 'copy_link':
            const url = `${window.location.origin}/tickets/${ticket.id}`;
            await navigator.clipboard.writeText(url);
            toast({
              title: 'Success',
              description: 'Ticket link copied to clipboard',
            });
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
    [updateTicket, assignTicket, currentUser, toast]
  );

  // FIXED: Delete confirmation with proper cached delete method
  const handleDeleteConfirm = useCallback(
    async (reason: string, notifyUser: boolean) => {
      if (!deleteDialog.ticket) {
        console.error('❌ No ticket found in delete dialog');
        return;
      }

      const ticketNumber = deleteDialog.ticket.ticket_number;
      const ticketId = deleteDialog.ticket.id;

      console.log('🗑️ TicketsPage: Processing delete confirmation:', {
        ticketId,
        ticketNumber,
        reason,
        notifyUser,
      });

      try {
        // FIXED: Use the correct cached delete ticket method
        await cachedDeleteTicket(ticketId, reason, notifyUser);

        console.log('✅ TicketsPage: Delete successful, closing dialog');

        // FIXED: Close dialog immediately after successful deletion
        setDeleteDialog({ isOpen: false, ticket: null });

        // Show success toast
        toast({
          title: 'Success',
          description: `Ticket #${ticketNumber} deleted successfully`,
        });

        console.log('✅ TicketsPage: Ticket deletion completed successfully');
      } catch (error: any) {
        console.error('❌ TicketsPage: Delete failed:', error);

        // FIXED: Don't close dialog on error, let user see the error and retry
        // The error will be shown in the dialog itself

        // Still show toast for user feedback
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete ticket',
          variant: 'destructive',
        });

        // Re-throw error so dialog can handle it
        throw error;
      }
    },
    [deleteDialog.ticket, cachedDeleteTicket, toast]
  );

  // Close delete dialog handler
  const handleCloseDeleteDialog = useCallback(() => {
    console.log('🚪 TicketsPage: Closing delete dialog');
    setDeleteDialog({ isOpen: false, ticket: null });
  }, []);

  // Enhanced bulk actions with caching
  // Enhanced bulk actions with delete support
  const handleBulkActionWithDialog = useCallback(
    async (action: string, params?: any) => {
      try {
        const ticketIds = selectedTicketsArray.map((t) => t.id);

        switch (action) {
          case 'assign':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets');
            }

            if (params.assignTo === 'me' && currentUser) {
              await bulkAction('assign', ticketIds, {
                userId: currentUser.id,
                reason: 'Bulk assignment',
              });
              toast({
                title: 'Success',
                description: `${selectedTicketsArray.length} tickets assigned to you`,
              });
            } else if (params.assignTo === 'unassign') {
              for (const ticket of selectedTicketsArray) {
                await assignTicket(ticket.id, null);
              }
              toast({
                title: 'Success',
                description: `${selectedTicketsArray.length} tickets unassigned`,
              });
            }
            break;

          case 'update_status':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }

            for (const ticket of selectedTicketsArray) {
              await updateTicket(ticket.id, { status: params.status });
            }
            toast({
              title: 'Success',
              description: `${selectedTicketsArray.length} tickets updated to ${params.status}`,
            });
            break;

          case 'update_priority':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }

            for (const ticket of selectedTicketsArray) {
              await updateTicket(ticket.id, { priority: params.priority });
            }
            toast({
              title: 'Success',
              description: `${selectedTicketsArray.length} tickets priority updated to ${params.priority}`,
            });
            break;

          case 'export':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can export tickets');
            }
            if (actions?.exportTickets) {
              await actions.exportTickets('csv', {}, ticketIds);
              toast({
                title: 'Success',
                description: 'Export started successfully',
              });
            }
            break;
        }

        // Clear selection after successful action
        actions?.clearSelection();
        setBulkActionsDialog(false);
      } catch (error: any) {
        console.error(`Bulk ${action} failed:`, error);
        toast({
          title: 'Error',
          description: error.message || `Failed to ${action} tickets`,
          variant: 'destructive',
        });
      }
    },
    [selectedTicketsArray, currentUser, bulkAction, updateTicket, assignTicket, actions, toast]
  );

  // FIXED: New bulk delete handler - use cachedDeleteTicket instead of deleteTicket
  const handleBulkDelete = useCallback(
    async (reason: string, notifyUsers: boolean) => {
      if (currentUser?.role !== 'admin') {
        throw new Error('Only administrators can delete tickets');
      }

      try {
        console.log('🗑️ TicketsPage: Processing bulk delete:', {
          count: selectedTicketsArray.length,
          reason,
          notifyUsers,
        });

        // Delete each ticket individually for now
        // TODO: Implement proper bulk delete API endpoint
        const deletePromises = selectedTicketsArray.map((ticket) =>
          cachedDeleteTicket(ticket.id, reason, notifyUsers)
        );

        await Promise.all(deletePromises);

        toast({
          title: 'Success',
          description: `${selectedTicketsArray.length} tickets deleted successfully`,
        });

        // Clear selection
        actions?.clearSelection();
        setBulkActionsDialog(false);
      } catch (error: any) {
        console.error('❌ TicketsPage: Bulk delete failed:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete tickets',
          variant: 'destructive',
        });
        throw error; // Re-throw to keep dialog open
      }
    },
    [selectedTicketsArray, currentUser, cachedDeleteTicket, actions, toast]
  );

  // Selection handlers
  const handleSelectTicket = useCallback(
    (ticketId: number, selected: boolean) => {
      if (!actions) return;

      if (selected) {
        actions.selectTicket(ticketId);
      } else {
        actions.deselectTicket(ticketId);
      }
    },
    [actions]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (!actions) return;

      if (selected) {
        currentTabTickets.forEach((ticket) => actions.selectTicket(ticket.id));
      } else {
        actions.clearSelection();
      }
    },
    [actions, currentTabTickets]
  );

  // Special action handlers
  const handleViewCrisis = useCallback(() => {
    setCurrentView('crisis');
  }, []);

  const handleViewUnassigned = useCallback(() => {
    setCurrentView('unassigned');
  }, []);

  const handleBulkAssignUnassigned = useCallback(() => {
    const unassignedTickets = cachedTickets.filter((t) => !t.assigned_to);
    if (unassignedTickets.length > 0 && actions) {
      unassignedTickets.forEach((ticket) => actions.selectTicket(ticket.id));
      setBulkActionsDialog(true);
    }
  }, [cachedTickets, actions]);

  const handleExport = useCallback(() => {
    if (actions?.exportTickets) {
      actions.exportTickets('csv');
    }
  }, [actions]);

  const handlePageChange = useCallback(
    (page: number) => {
      handleFilterChange('page', page.toString());
    },
    [handleFilterChange]
  );

  // FIXED: Clear cache on component unmount or when needed
  useEffect(() => {
    // Cleanup cache every 10 minutes to prevent memory leaks
    const cleanup = setInterval(() => {
      ticketsCache.cleanup();
    }, 10 * 60 * 1000);

    return () => clearInterval(cleanup);
  }, []);

  // Determine loading states
  const showSkeletonLoading = ticketsLoading && !hasCachedData;
  const showStaleIndicator = isStale && hasCachedData;

  // Safety check for actions
  if (!actions) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    searchTerm || filters.status || filters.category || filters.priority || filters.assigned
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Stale Data Indicator */}
        {showStaleIndicator && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-700">
                  Showing cached data. Refreshing in background...
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="text-sm text-amber-600 hover:text-amber-800 underline"
              >
                Refresh now
              </button>
            </div>
          </div>
        )}

        {/* Header - Smart loading */}
        {showSkeletonLoading ? (
          <TicketsHeaderSkeleton />
        ) : (
          <TicketsHeader
            pageInfo={pageInfo}
            stats={stats}
            loading={ticketsLoading}
            selectedCount={selectedTicketsArray.length}
            permissions={permissions}
            userRole={currentUser?.role}
            onRefresh={handleRefresh}
            onBulkActions={() => setBulkActionsDialog(true)}
            onExport={handleExport}
            onCreate={handleCreateTicket}
          />
        )}

        {/* Crisis Alert */}
        {showSkeletonLoading ? (
          <AlertSkeleton />
        ) : (
          <CrisisAlert
            crisisCount={stats.crisis}
            userRole={currentUser?.role}
            onViewCrisis={handleViewCrisis}
          />
        )}

        {/* Error Alert */}
        {!showSkeletonLoading && (
          <ErrorAlert
            error={ticketsError}
            onDismiss={() => {
              // Clear error and try refresh
              invalidateCache();
            }}
          />
        )}

        {/* Filters */}
        {showSkeletonLoading ? (
          <TicketsFiltersSkeleton />
        ) : (
          <TicketsFilters
            searchTerm={searchTerm}
            filters={filters}
            loading={ticketsLoading}
            userRole={currentUser?.role}
            selectedCount={selectedTicketsArray.length}
            totalCount={currentTabTickets.length}
            canBulkActions={permissions.can_bulk_actions}
            onSearchChange={setSearchTerm}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onSelectAll={handleSelectAll}
          />
        )}

        {/* Tickets Tabs and Content with Error Boundary */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-0">
            {showSkeletonLoading ? (
              <>
                <TicketTabsSkeleton />
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

                  <TabsContent value={currentView} className="p-6 space-y-4 mt-0">
                    <TicketsList
                      tickets={currentTabTickets}
                      loading={ticketsLoading && !hasCachedData}
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
          </CardContent>
        </Card>

        {/* Pagination */}
        {showSkeletonLoading ? (
          <TicketsPaginationSkeleton />
        ) : (
          <TicketsPagination
            pagination={pagination}
            loading={ticketsLoading}
            onPageChange={handlePageChange}
          />
        )}

        {/* Unassigned Alert */}
        {showSkeletonLoading ? (
          <AlertSkeleton />
        ) : (
          <UnassignedAlert
            unassignedCount={stats.unassigned}
            userRole={currentUser?.role}
            permissions={permissions}
            onViewUnassigned={handleViewUnassigned}
            onBulkAssign={handleBulkAssignUnassigned}
          />
        )}

        {/* Admin Components */}
        {showSkeletonLoading ? (
          <>
            <SystemOverviewSkeleton />
            <PerformanceInsightsSkeleton />
          </>
        ) : (
          <>
            <SystemOverview stats={stats} userRole={currentUser?.role} />

            <PerformanceInsights stats={stats} userRole={currentUser?.role} />
          </>
        )}

        {/* Help and Support Links */}
        {!showSkeletonLoading && (
          <HelpSupportFooter
            userRole={currentUser?.role}
            onNavigate={onNavigate}
            onCreateTicket={handleCreateTicket}
          />
        )}
      </div>

      {/* Dialogs - Only show when not in skeleton loading state */}
      {!showSkeletonLoading && (
        <>
          {/* Delete Confirmation Dialog */}
          <DeleteTicketDialog
            key={deleteDialog.ticket?.id || 'empty'}
            ticket={deleteDialog.ticket}
            isOpen={deleteDialog.isOpen}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDeleteConfirm}
          />

          {/* Bulk Actions Dialog */}
          <BulkActionsDialog
            key={selectedTicketsArray.length}
            isOpen={bulkActionsDialog}
            onClose={() => setBulkActionsDialog(false)}
            selectedTickets={selectedTicketsArray}
            onBulkAction={handleBulkActionWithDialog}
            onBulkDelete={handleBulkDelete}
          />
        </>
      )}

      {/* Debug Cache Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
          <div>Cache Entries: {ticketsCache.getStats().cacheSize}</div>
          <div>Has Cached Data: {hasCachedData ? 'Yes' : 'No'}</div>
          <div>Is Stale: {isStale ? 'Yes' : 'No'}</div>
          <div>Loading: {ticketsLoading ? 'Yes' : 'No'}</div>
        </div>
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
      cacheUtils.invalidateTicketCache();
    }
  }
});

// Main export with error boundary wrapper
export function TicketsPage(props: TicketsPageProps) {
  return <TicketsPageWithErrorBoundary {...props} />;
}
