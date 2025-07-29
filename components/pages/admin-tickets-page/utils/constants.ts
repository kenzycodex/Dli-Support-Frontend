// utils/constants.ts
import { FilterOptions, CategoryFormData, CrisisKeywordFormData, CounselorSpecializationFormData } from '../types/form-types'

export const FILTER_DEFAULTS: FilterOptions = {
  search: '',
  status: 'all',
  category: 'all',
  priority: 'all',
  assigned: 'all',
  crisis_flag: 'all',
  auto_assigned: 'all',
  sort_by: 'newest',
  page: 1,
  per_page: 25,
}

export const CATEGORY_FORM_DEFAULTS: CategoryFormData = {
  name: '',
  description: '',
  icon: 'MessageSquare',
  color: '#3B82F6',
  is_active: true,
  auto_assign: true,
  crisis_detection_enabled: false,
  sla_response_hours: 24,
  max_priority_level: 3,
  sort_order: 0
}

export const CRISIS_KEYWORD_FORM_DEFAULTS: CrisisKeywordFormData = {
  keyword: '',
  severity_level: 'medium',
  severity_weight: 50,
  is_active: true,
  category_ids: []
}

export const COUNSELOR_FORM_DEFAULTS: CounselorSpecializationFormData = {
  user_id: 0,
  category_id: 0,
  priority_level: 'primary',
  max_workload: 10,
  expertise_rating: 3,
  is_available: true,
  notes: ''
}

// Additional constants for priority levels and expertise ratings
export const PRIORITY_LEVELS = [
  { value: 'primary', label: 'Primary', color: 'bg-green-100 text-green-800' },
  { value: 'secondary', label: 'Secondary', color: 'bg-blue-100 text-blue-800' },
  { value: 'backup', label: 'Backup', color: 'bg-gray-100 text-gray-800' },
] as const

export const EXPERTISE_RATINGS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Novice' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
] as const

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
] as const