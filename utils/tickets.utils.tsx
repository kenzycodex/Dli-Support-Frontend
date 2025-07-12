// utils/tickets.utils.ts
import { Clock, RefreshCw, CheckCircle } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
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

export const calculateStats = (tickets: TicketData[], currentUserId?: number): TicketStats => {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    in_progress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
    crisis: tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent').length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    my_assigned: tickets.filter((t) => t.assigned_to === currentUserId).length,
  };
}

export const getPageInfo = (userRole?: string): PageInfo => {
  switch (userRole) {
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
}

export const getPermissions = (userRole?: string): TicketPermissions => ({
  can_modify: userRole === 'admin' || userRole === 'counselor',
  can_assign: userRole === 'admin',
  can_delete: userRole === 'admin',
  can_export: userRole === 'admin',
  can_bulk_actions: userRole !== 'student',
})

export const filterTicketsByView = (
  tickets: TicketData[], 
  view: string, 
  currentUserId?: number
): TicketData[] => {
  switch (view) {
    case 'all':
      return tickets;
    case 'open':
      return tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress');
    case 'closed':
      return tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
    case 'crisis':
      return tickets.filter((t) => t.crisis_flag || t.priority === 'Urgent');
    case 'unassigned':
      return tickets.filter((t) => !t.assigned_to);
    case 'my_assigned':
      return tickets.filter((t) => t.assigned_to === currentUserId);
    default:
      return tickets;
  }
}

export const applyTicketFilters = (
  tickets: TicketData[],
  searchTerm: string,
  filters: any,
  currentUserId?: number
): TicketData[] => {
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
        filtered = filtered.filter((ticket) => ticket.assigned_to === currentUserId);
        break;
    }
  }

  return filtered;
}