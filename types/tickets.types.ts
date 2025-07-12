// types/tickets.types.ts
import { TicketData } from '@/stores/ticket-store'

export interface TicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export interface DeleteDialogState {
  isOpen: boolean;
  ticket: TicketData | null;
}

export interface FilterState {
  page: number;
  per_page: number;
  sort_by: string;
  sort_direction: 'asc' | 'desc';
  status?: string;
  category?: string;
  priority?: string;
  assigned?: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  crisis: number;
  unassigned: number;
  my_assigned: number;
}

export interface TicketPermissions {
  can_modify: boolean;
  can_assign: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_bulk_actions: boolean;
}

export interface PageInfo {
  title: string;
  description: string;
}

export interface BulkActionParams {
  assignTo?: string;
  status?: string;
  priority?: string;
}