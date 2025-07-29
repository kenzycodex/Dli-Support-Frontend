// types/form-types.ts - Complete with all required interfaces

// Filter Options for Admin Tickets
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

// Category Form Data
export interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  auto_assign: boolean
  crisis_detection_enabled: boolean
  sla_response_hours: number
  max_priority_level: number
  sort_order: number
}

// Crisis Keyword Form Data
export interface CrisisKeywordFormData {
  keyword: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  severity_weight: number
  is_active: boolean
  category_ids: number[]
}

// Counselor Specialization Form Data - Fixed with notes
export interface CounselorSpecializationFormData {
  user_id: number
  category_id: number
  priority_level: 'primary' | 'secondary' | 'backup'
  max_workload: number
  expertise_rating: number
  is_available: boolean
  notes?: string // Added missing notes property
}

// Enhanced specialization data with computed fields
export interface CounselorSpecializationWithStats {
  id: number
  user_id: number
  category_id: number
  priority_level: 'primary' | 'secondary' | 'backup'
  max_workload: number
  current_workload: number
  is_available: boolean
  availability_schedule?: any
  expertise_rating: number
  notes?: string
  assigned_by: number
  assigned_at: string
  created_at: string
  updated_at: string
  
  // Computed fields to fix store errors
  utilization_rate: number
  assignment_score: number
  can_take_ticket: boolean
  
  // Relationships
  user?: {
    id: number
    name: string
    email: string
    role: string
    status: string
    specializations?: CounselorSpecializationWithStats[]
    total_workload?: number
  }
  category?: {
    id: number
    name: string
    slug: string
    color: string
    icon: string
  }
  assignedBy?: {
    id: number
    name: string
  }
}

// Staff Option for selects
export interface StaffOption {
  value: number
  label: string
  description: string
  role: string
  current_specializations: number
  total_workload: number
}

// Category with stats
export interface CategoryWithStats {
  id: number
  name: string
  slug: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  auto_assign: boolean
  crisis_detection_enabled: boolean
  sla_response_hours: number
  max_priority_level: number
  sort_order: number
  created_at: string
  updated_at: string
  
  // Stats
  ticket_count?: number
  open_tickets?: number
  assigned_counselors?: number
}