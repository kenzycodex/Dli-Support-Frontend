// types/tickets.types.ts - FIXED: Complete type definitions
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

// FIXED: Complete TicketStats interface
export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  crisis: number
  unassigned: number
  my_assigned: number // FIXED: Added missing property
  my_tickets: number
  high_priority: number
  auto_assigned: number
  manually_assigned: number
  overdue: number
  with_crisis_keywords: number
  
  // Additional stats
  categories_total: number
  categories_active: number
  categories_with_auto_assign: number
  categories_with_crisis_detection: number
  
  // Derived stats
  active: number
  inactive: number
  assigned: number
  
  // Performance metrics
  average_response_time: string
  resolution_rate: number
  auto_assignment_rate: number
  crisis_detection_rate: number
  crisis_rate: number
  auto_assign_rate: number
}

// FIXED: Complete TicketPermissions interface
export interface TicketPermissions {
  can_create: boolean // FIXED: Added missing property
  can_view_all: boolean
  can_assign: boolean
  can_modify: boolean
  can_delete: boolean
  can_export: boolean
  can_bulk_actions: boolean
  can_manage_tags: boolean
  can_add_internal_notes: boolean
  can_download_attachments: boolean
  can_manage_categories: boolean
  can_view_crisis_detection: boolean
  can_test_crisis_detection: boolean
}

// FIXED: Complete PageInfo interface
export interface PageInfo {
  title: string
  description: string
  showCreate: boolean // FIXED: Added missing property
  showStats: boolean // FIXED: Added missing property
}

export interface BulkActionParams {
  assignTo?: string;
  status?: string;
  priority?: string;
}