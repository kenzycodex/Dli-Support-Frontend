// types/admin-types.ts
export type AdminTabType = 'tickets' | 'categories' | 'crisis-keywords' | 'counselor-specializations' | 'analytics' | 'system'

export interface FilterOptions {
  search?: string
  status?: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  category?: string
  priority?: string
  assigned?: string
  crisis_flag?: string
  auto_assigned?: string
  date_range?: string
  sort_by?: string
  page?: number
  per_page?: number
}

export interface AdminTicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  crisis: number
  unassigned: number
  auto_assigned: number
}

export interface CategoryStats {
  total: number
  active: number
  with_auto_assign: number
  with_crisis_detection: number
}

export interface IndividualActionDialogState {
  isOpen: boolean
  ticket?: any | null
  action: 'edit' | 'delete' | 'assign' | 'resolve'
  isProcessing: boolean
}

export interface CategoryDialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  category: any | null
}

export interface CrisisKeywordsDialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  keyword: any | null
}

export interface CounselorDialogState {
  isOpen: boolean
  mode: 'create' | 'edit'
  specialization: any | null
}