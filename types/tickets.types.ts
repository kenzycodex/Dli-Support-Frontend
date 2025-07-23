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
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  crisis: number
  unassigned: number
  high_priority: number
  auto_assigned: number
  manually_assigned: number
  overdue: number
  with_crisis_keywords: number
  
  // Additional stats
  assigned_to_me?: number // For counselors/admins - tickets assigned to current user
  categories_total: number
  categories_active: number
  categories_with_auto_assign: number
  categories_with_crisis_detection: number
  
  // Performance metrics
  average_response_time: string
  resolution_rate: number
  auto_assignment_rate: number
  crisis_detection_rate: number
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