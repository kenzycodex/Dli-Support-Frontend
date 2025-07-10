// components/pages/tickets-page.tsx (FIXED - UI freeze and state management issues)
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  SortAsc,
  SortDesc,
  FileDown,
  FileText,
  Filter as FilterIcon,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketSelectors, 
  useTicketLoading, 
  useTicketError,
  useTicketStats,
  useTicketFilters,
  useTicketPermissions,
  TicketData,
  generateTicketURL
} from "@/stores/ticket-store"
import { authService } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"

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

// FIXED: Delete Confirmation Dialog Component with proper cleanup
function DeleteTicketDialog({ 
  ticket, 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  ticket: TicketData | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, notifyUser: boolean) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [notifyUser, setNotifyUser] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // FIXED: Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason("")
      setNotifyUser(false)
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleConfirm = useCallback(async () => {
    if (!reason.trim() || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm(reason.trim(), notifyUser)
      // Don't manually close here - let parent handle it
    } catch (error) {
      console.error('Delete confirmation error:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [reason, notifyUser, isDeleting, onConfirm])

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      // Reset state before closing
      setReason("")
      setNotifyUser(false)
      setIsDeleting(false)
      onClose()
    }
  }, [isDeleting, onClose])

  // FIXED: Prevent dialog from staying open if ticket is null
  useEffect(() => {
    if (isOpen && !ticket) {
      handleClose()
    }
  }, [isOpen, ticket, handleClose])

  return (
    <Dialog open={isOpen && !!ticket} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Ticket
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete ticket #{ticket?.ticket_number || 'N/A'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for deletion *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this ticket is being deleted..."
              className="mt-1"
              rows={3}
              disabled={isDeleting}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-user"
              checked={notifyUser}
              onCheckedChange={(checked) => setNotifyUser(checked as boolean)}
              disabled={isDeleting}
            />
            <label htmlFor="notify-user" className="text-sm">
              Notify the user about this deletion
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting || !reason.trim()}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// FIXED: Bulk Actions Dialog Component with proper state management
function BulkActionsDialog({
  isOpen,
  onClose,
  selectedTickets,
  onBulkAction
}: {
  isOpen: boolean
  onClose: () => void
  selectedTickets: TicketData[]
  onBulkAction: (action: string, params?: any) => Promise<void>
}) {
  const [action, setAction] = useState("")
  const [assignTo, setAssignTo] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // FIXED: Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAction("")
      setAssignTo("")
      setStatus("")
      setPriority("")
      setIsProcessing(false)
    }
  }, [isOpen])

  const handleApply = useCallback(async () => {
    if (!action || isProcessing) return

    setIsProcessing(true)
    try {
      const params: any = {}
      if (action === 'assign' && assignTo) params.assignTo = assignTo
      if (action === 'update_status' && status) params.status = status
      if (action === 'update_priority' && priority) params.priority = priority

      await onBulkAction(action, params)
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [action, assignTo, status, priority, isProcessing, onBulkAction])

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose()
    }
  }, [isProcessing, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Apply actions to {selectedTickets.length} selected tickets
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select value={action} onValueChange={setAction} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {currentUser?.role === 'admin' && (
                  <SelectItem value="assign">Assign tickets</SelectItem>
                )}
                <SelectItem value="update_status">Update status</SelectItem>
                <SelectItem value="update_priority">Update priority</SelectItem>
                <SelectItem value="export">Export selected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'assign' && currentUser?.role === 'admin' && (
            <div>
              <label className="text-sm font-medium">Assign to</label>
              <Select value={assignTo} onValueChange={setAssignTo} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">Assign to me</SelectItem>
                  <SelectItem value="unassign">Unassign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'update_status' && (
            <div>
              <label className="text-sm font-medium">New status</label>
              <Select value={status} onValueChange={setStatus} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'update_priority' && (
            <div>
              <label className="text-sm font-medium">New priority</label>
              <Select value={priority} onValueChange={setPriority} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!action || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Apply to {selectedTickets.length} tickets</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TicketsPage({ onNavigate }: TicketsPageProps) {
  // FIXED: Store access with better error handling
  const tickets = useTicketStore((state) => state?.tickets || []);
  const loading = useTicketStore((state) => state?.loading?.list || false);
  const error = useTicketStore((state) => state?.errors?.list || null);
  const pagination = useTicketStore((state) => state?.pagination || defaultPagination);
  const selectedTickets = useTicketStore((state) => state?.selectedTickets || new Set());
  const filters = useTicketStore((state) => state?.filters || defaultFilters);
  const actions = useTicketStore((state) => state?.actions);

  // Toast hook
  const { toast } = useToast();

  // Local UI state
  const [currentView, setCurrentView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const initRef = useRef(false);

  // FIXED: Dialog states with proper reset handling
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    ticket: TicketData | null;
  }>({ isOpen: false, ticket: null });

  const [bulkActionsDialog, setBulkActionsDialog] = useState(false);

  // Current user
  const currentUser = useMemo(() => authService.getStoredUser(), []);
  const lastFetch = useTicketStore((state) => state?.lastFetch || 0);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'Open').length,
      in_progress: tickets.filter((t) => t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
      closed: tickets.filter((t) => t.status === 'Closed').length,
      crisis: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent').length,
      unassigned: tickets.filter((t) => !t.assigned_to).length,
      my_assigned: tickets.filter((t) => t.assigned_to === currentUser?.id).length,
    };
  }, [tickets, currentUser?.id]);

  // Filtered tickets calculation
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search) ||
          ticket.ticket_number.toLowerCase().includes(search) ||
          ticket.user?.name.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === filters.status);
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((ticket) => ticket.category === filters.category);
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter((ticket) => ticket.priority === filters.priority);
    }

    // Apply assignment filter
    if (filters.assigned && filters.assigned !== 'all') {
      switch (filters.assigned) {
        case 'assigned':
          filtered = filtered.filter((ticket) => ticket.assigned_to);
          break;
        case 'unassigned':
          filtered = filtered.filter((ticket) => !ticket.assigned_to);
          break;
        case 'my-assigned':
          filtered = filtered.filter((ticket) => ticket.assigned_to === currentUser?.id);
          break;
      }
    }

    return filtered;
  }, [tickets, searchTerm, filters, currentUser?.id]);

  // Tab-specific tickets
  const currentTabTickets = useMemo(() => {
    switch (currentView) {
      case 'all':
        return filteredTickets;
      case 'open':
        return filteredTickets.filter((t) => t.status === 'Open' || t.status === 'In Progress');
      case 'closed':
        return filteredTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
      case 'crisis':
        return filteredTickets.filter((t) => t.crisis_flag || t.priority === 'Urgent');
      case 'unassigned':
        return filteredTickets.filter((t) => !t.assigned_to);
      case 'my_assigned':
        return filteredTickets.filter((t) => t.assigned_to === currentUser?.id);
      default:
        return filteredTickets;
    }
  }, [currentView, filteredTickets, currentUser?.id]);

  // Selected tickets as array
  const selectedTicketsArray = useMemo(() => {
    return Array.from(selectedTickets)
      .map((id) => tickets.find((t) => t.id === id))
      .filter(Boolean) as TicketData[];
  }, [selectedTickets, tickets]);

  // Initialize tickets
  useEffect(() => {
    if (initRef.current || isInitialized || !actions) return;

    let isMounted = true;
    initRef.current = true;

    const initializeTickets = async () => {
      try {
        console.log('🎫 TicketsPage: Initializing tickets data');

        const hasRecentData = tickets.length > 0 && Date.now() - lastFetch < 40000;

        if (!hasRecentData && actions.fetchTickets) {
          await actions.fetchTickets({
            page: 1,
            per_page: 20,
            sort_by: 'updated_at',
            sort_direction: 'desc',
          });
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('❌ TicketsPage: Failed to initialize:', error);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeTickets();

    return () => {
      isMounted = false;
    };
  }, [actions, tickets.length, lastFetch, isInitialized]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      console.log('🔍 Search term updated:', searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isInitialized]);

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

  // Data operations
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!actions?.fetchTickets) return;

    try {
      console.log('🔄 TicketsPage: Manual refresh');
      await actions.fetchTickets({
        page: pagination.current_page || 1,
        per_page: pagination.per_page || 20,
        sort_by: filters.sort_by || 'updated_at',
        sort_direction: filters.sort_direction || 'desc',
      });

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
  }, [
    actions,
    pagination.current_page,
    pagination.per_page,
    filters.sort_by,
    filters.sort_direction,
    toast,
  ]);

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      if (!actions?.setFilters) return;

      const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
      actions.setFilters(newFilters, true);
    },
    [actions, filters]
  );

  const clearFilters = useCallback(() => {
    if (!actions?.clearFilters) return;

    actions.clearFilters(true);
    setSearchTerm('');
    toast({
      title: 'Filters cleared',
      description: 'All filters have been reset',
    });
  }, [actions, toast]);

  // FIXED: Ticket actions with proper error handling and state cleanup
  const handleTicketAction = useCallback(
    async (action: string, ticket: TicketData) => {
      if (!actions) return;

      try {
        console.log('🎫 TicketsPage: Executing action:', action, 'on ticket:', ticket.id);

        switch (action) {
          case 'mark_in_progress':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await actions.updateTicket(ticket.id, { status: 'In Progress' });
            toast({
              title: 'Success',
              description: `Ticket #${ticket.ticket_number} marked as In Progress`,
            });
            break;

          case 'mark_resolved':
            if (!['counselor', 'admin'].includes(currentUser?.role || '')) {
              throw new Error('You do not have permission to modify tickets');
            }
            await actions.updateTicket(ticket.id, { status: 'Resolved' });
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
              await actions.assignTicket(ticket.id, currentUser.id);
              toast({
                title: 'Success',
                description: `Ticket #${ticket.ticket_number} assigned to you`,
              });
            }
            break;

          case 'copy_link':
            const url = generateTicketURL(ticket);
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
    [actions, currentUser, toast]
  );

  // FIXED: Delete confirmation with proper state cleanup and error handling
  const handleDeleteConfirm = useCallback(
    async (reason: string, notifyUser: boolean) => {
      if (!deleteDialog.ticket || !actions?.deleteTicket) return;
  
      const ticketNumber = deleteDialog.ticket.ticket_number;
      const ticketId = deleteDialog.ticket.id;
  
      try {
        console.log('🎫 TicketsPage: Deleting ticket:', ticketId, { reason, notifyUser });
        
        await actions.deleteTicket(ticketId, reason, notifyUser);
        
        // FIXED: Close dialog immediately after successful deletion
        setDeleteDialog({ isOpen: false, ticket: null });
        
        toast({
          title: 'Success',
          description: `Ticket #${ticketNumber} deleted successfully`,
        });
        
        console.log('✅ TicketsPage: Ticket deletion completed successfully');
        
      } catch (error: any) {
        console.error('❌ TicketsPage: Delete failed:', error);
        
        // FIXED: Don't close dialog on error, let user retry
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete ticket',
          variant: 'destructive',
        });
        
        // Re-throw to prevent dialog from closing
        throw error;
      }
    },
    [deleteDialog.ticket, actions, toast]
  );

  // FIXED: Close delete dialog handler
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, ticket: null });
  }, []);

  // FIXED: Bulk actions with proper validation and error handling
  const handleBulkAction = useCallback(
    async (action: string, params?: any) => {
      if (!actions || selectedTicketsArray.length === 0) return;

      try {
        console.log(
          '🎫 TicketsPage: Executing bulk action:',
          action,
          'on',
          selectedTicketsArray.length,
          'tickets'
        );

        switch (action) {
          case 'assign':
            if (currentUser?.role !== 'admin') {
              throw new Error('Only administrators can assign tickets');
            }

            if (params.assignTo === 'me' && currentUser) {
              const ticketIds = selectedTicketsArray.map((t) => t.id);
              const assignedCount = await actions.bulkAssign(
                ticketIds,
                currentUser.id,
                'Bulk assignment'
              );
              toast({
                title: 'Success',
                description: `${assignedCount} tickets assigned to you`,
              });
            } else if (params.assignTo === 'unassign') {
              // Handle bulk unassignment
              for (const ticket of selectedTicketsArray) {
                await actions.assignTicket(ticket.id, null, 'Bulk unassignment');
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
              await actions.updateTicket(ticket.id, { status: params.status });
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
              await actions.updateTicket(ticket.id, { priority: params.priority });
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

            const selectedIds = selectedTicketsArray.map((t) => t.id);
            await actions.exportTickets('csv', {}, selectedIds);
            toast({
              title: 'Success',
              description: 'Export started successfully',
            });
            break;
        }

        // FIXED: Clear selection and close dialog after successful action
        actions.clearSelection();
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
    [actions, selectedTicketsArray, currentUser, toast]
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

  // Utility functions
  const getStatusColor = useCallback((status: string): string => {
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
  }, []);

  const getPriorityColor = useCallback((priority: string): string => {
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
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Open':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'In Progress':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Closed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // FIXED: Permissions with admin-only assignment
  const permissions = useMemo(
    () => ({
      can_modify: currentUser?.role === 'admin' || currentUser?.role === 'counselor',
      can_assign: currentUser?.role === 'admin', // FIXED: Only admin can assign
      can_delete: currentUser?.role === 'admin',
      can_export: currentUser?.role === 'admin',
      can_bulk_actions: currentUser?.role !== 'student',
    }),
    [currentUser?.role]
  );

  // Page info
  const pageInfo = useMemo(() => {
    switch (currentUser?.role) {
      case 'student':
        return {
          title: 'My Support Tickets',
          description: 'Track and manage your support requests',
        };
      case 'counselor':
        return {
          title: 'My Assigned Cases',
          description: 'Manage mental health and crisis support cases',
        };
      case 'admin':
        return {
          title: 'All System Tickets',
          description: 'Oversee all tickets and system management',
        };
      default:
        return {
          title: 'Support Tickets',
          description: 'Manage support tickets',
        };
    }
  }, [currentUser?.role]);

  // Loading state during initialization
  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Tickets</h3>
          <p className="text-gray-600">Fetching your support requests...</p>
        </div>
      </div>
    );
  }

  // Safety check
  if (!actions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing</h3>
          <p className="text-gray-600">Setting up ticket system...</p>
        </div>
      </div>
    );
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
                    <div className="text-xl lg:text-2xl font-bold">
                      {stats.open + stats.in_progress}
                    </div>
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

                {/* Bulk Actions Button */}
                {permissions.can_bulk_actions && selectedTicketsArray.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkActionsDialog(true)}
                    className="text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Actions ({selectedTicketsArray.length})
                  </Button>
                )}

                {/* Export Button */}
                {permissions.can_export && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions?.exportTickets('csv')}
                    className="text-white hover:bg-white/20 backdrop-blur-sm"
                    disabled={loading}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}

                {/* Create button */}
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
        {currentUser?.role !== 'student' && stats.crisis > 0 && (
          <Card className="border-red-200 bg-red-50 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">
                    🚨 Crisis Cases Require Immediate Attention
                  </h3>
                  <p className="text-red-700">
                    {stats.crisis} crisis ticket(s) need urgent response.
                  </p>
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
                    placeholder="Search tickets by ID, subject, description, or user..."
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

              {/* Filter Row */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
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
                        <SelectItem value="my-assigned">My Assigned</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Advanced Filters Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="h-11"
                  >
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Advanced
                  </Button>

                  {/* Sort */}
                  <Select
                    value={`${filters.sort_by || 'updated_at'}-${filters.sort_direction || 'desc'}`}
                    onValueChange={(value) => {
                      const [sort_by, sort_direction] = value.split('-');
                      handleFilterChange('sort_by', sort_by);
                      handleFilterChange('sort_direction', sort_direction);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11 w-40">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at-desc">Latest Updated</SelectItem>
                      <SelectItem value="updated_at-asc">Oldest Updated</SelectItem>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="priority-desc">High Priority</SelectItem>
                      <SelectItem value="priority-asc">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear filters */}
                  {(searchTerm ||
                    filters.status ||
                    filters.category ||
                    filters.priority ||
                    filters.assigned) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={loading}
                      className="h-11"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Created Date Range
                    </label>
                    <div className="flex gap-2">
                      <Input type="date" className="h-9" />
                      <Input type="date" className="h-9" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Has Attachments
                    </label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="yes">With attachments</SelectItem>
                        <SelectItem value="no">Without attachments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Response Count
                    </label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="none">No responses</SelectItem>
                        <SelectItem value="some">Has responses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {loading ? 'Loading...' : `${currentTabTickets.length} tickets found`}
                  {selectedTicketsArray.length > 0 && ` • ${selectedTicketsArray.length} selected`}
                </span>

                {/* Bulk Selection */}
                {permissions.can_bulk_actions && currentTabTickets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTicketsArray.length === currentTabTickets.length}
                      onCheckedChange={handleSelectAll}
                      disabled={loading}
                    />
                    <span className="text-xs">Select all</span>
                  </div>
                )}
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

                    {currentUser?.role !== 'student' && stats.crisis > 0 && (
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
                      <>
                        <TabsTrigger
                          value="unassigned"
                          className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                        >
                          Unassigned
                          <Badge variant="secondary" className="ml-2">
                            {stats.unassigned}
                          </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                          value="my_assigned"
                          className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                        >
                          My Cases
                          <Badge variant="secondary" className="ml-2">
                            {stats.my_assigned}
                          </Badge>
                        </TabsTrigger>
                      </>
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
                      <Card
                        key={ticket.id}
                        className="hover:shadow-md transition-all duration-200 border-0 shadow-lg"
                      >
                        <CardContent className="pt-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                            {/* Selection Checkbox */}
                            {permissions.can_bulk_actions && (
                              <div className="flex items-start lg:mr-4">
                                <Checkbox
                                  checked={selectedTickets.has(ticket.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectTicket(ticket.id, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}

                            <div className="flex items-start space-x-4 flex-1">
                              <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                                {getStatusIcon(ticket.status)}
                                <span className="font-mono text-sm font-medium text-blue-600">
                                  #{ticket.ticket_number}
                                </span>
                                {ticket.crisis_flag && (
                                  <Flag className="h-3 w-3 text-red-600 animate-pulse" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                  <h3
                                    className="font-medium text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => handleViewTicket(ticket)}
                                  >
                                    {ticket.subject}
                                  </h3>
                                  {ticket.crisis_flag && (
                                    <Badge
                                      variant="destructive"
                                      className="animate-pulse self-start"
                                    >
                                      <Flag className="h-3 w-3 mr-1" />
                                      CRISIS
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-100 text-purple-800 border-purple-200"
                                  >
                                    {ticket.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(ticket.priority)}
                                  >
                                    {ticket.priority}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(ticket.status)}
                                  >
                                    {ticket.status}
                                  </Badge>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {ticket.description}
                                </p>

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
                                        {ticket.status === 'Open' && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleTicketAction('mark_in_progress', ticket)
                                            }
                                          >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Mark In Progress
                                          </DropdownMenuItem>
                                        )}
                                        {(ticket.status === 'Open' ||
                                          ticket.status === 'In Progress') && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleTicketAction('mark_resolved', ticket)
                                            }
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark Resolved
                                          </DropdownMenuItem>
                                        )}
                                        {!ticket.assigned_to && permissions.can_assign && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleTicketAction('assign_to_me', ticket)
                                            }
                                          >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Assign to Me
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleTicketAction('copy_link', ticket)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Link
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => {
                                        const url = generateTicketURL(ticket);
                                        window.open(url, '_blank');
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in New Tab
                                    </DropdownMenuItem>

                                    {permissions.can_delete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600"
                                          onClick={() => handleTicketAction('delete', ticket)}
                                        >
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
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filters.status || filters.category || filters.priority
                        ? 'Try adjusting your filters or search term'
                        : currentUser?.role === 'student'
                        ? 'Get started by submitting your first ticket'
                        : 'No tickets have been assigned to you yet'}
                    </p>
                    {!searchTerm &&
                      !filters.status &&
                      !filters.category &&
                      !filters.priority &&
                      currentUser?.role === 'student' && (
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

        {/* Pagination */}
        {pagination.total > pagination.per_page && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} tickets
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleFilterChange('page', (pagination.current_page - 1).toString())
                    }
                    disabled={pagination.current_page <= 1 || loading}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === pagination.current_page;

                      return (
                        <Button
                          key={page}
                          variant={isCurrentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFilterChange('page', page.toString())}
                          disabled={loading}
                          className={isCurrentPage ? 'bg-blue-600 text-white' : ''}
                        >
                          {page}
                        </Button>
                      );
                    })}

                    {pagination.last_page > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleFilterChange('page', pagination.last_page.toString())
                          }
                          disabled={loading}
                        >
                          {pagination.last_page}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleFilterChange('page', (pagination.current_page + 1).toString())
                    }
                    disabled={pagination.current_page >= pagination.last_page || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
        onBulkAction={handleBulkAction}
      />

      {/* Quick Stats Summary */}
      {currentUser?.role !== 'student' && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                <div className="text-sm text-blue-700">Open</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
                <div className="text-sm text-yellow-700">In Progress</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-green-700">Resolved</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                <div className="text-sm text-gray-700">Closed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.crisis}</div>
                <div className="text-sm text-red-700">Crisis</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                <div className="text-sm text-orange-700">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights for Admins */}
      {currentUser?.role === 'admin' && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Resolution Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Assignment Rate</span>
                  <span className="text-sm font-bold text-blue-600">
                    {stats.total > 0
                      ? Math.round(((stats.total - stats.unassigned) / stats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.total > 0 ? ((stats.total - stats.unassigned) / stats.total) * 100 : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Crisis Response</span>
                  <span
                    className={`text-sm font-bold ${
                      stats.crisis > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {stats.crisis === 0 ? 'All Clear' : `${stats.crisis} Active`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.crisis > 0 ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Avg. Response Time:</span> 2.3 hours
                </div>
                <div>
                  <span className="font-medium">Avg. Resolution Time:</span> 1.2 days
                </div>
                <div>
                  <span className="font-medium">Customer Satisfaction:</span> 4.8/5.0
                </div>
                <div>
                  <span className="font-medium">First Response Rate:</span> 94%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Unassigned Tickets */}
      {currentUser?.role !== 'student' && stats.unassigned > 0 && (
        <Card className="border-orange-200 bg-orange-50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="p-3 bg-orange-500 rounded-full flex-shrink-0">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  ⚠️ Unassigned Tickets Need Attention
                </h3>
                <p className="text-orange-700">
                  {stats.unassigned} ticket(s) are waiting for assignment.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentView('unassigned')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  View Unassigned
                </Button>
                {permissions.can_assign && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const unassignedTickets = tickets.filter((t) => !t.assigned_to);
                      if (unassignedTickets.length > 0) {
                        unassignedTickets.forEach((ticket) => actions?.selectTicket(ticket.id));
                        setBulkActionsDialog(true);
                      }
                    }}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Bulk Assign
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help and Support Links */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" onClick={() => onNavigate?.('help')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Help Center
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.('resources')}>
                <FileText className="h-4 w-4 mr-2" />
                Resources
              </Button>
              {currentUser?.role === 'student' && (
                <Button onClick={handleCreateTicket}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit New Ticket
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              For immediate assistance with crisis situations, please contact emergency services at
              911
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}