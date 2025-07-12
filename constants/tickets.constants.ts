// constants/tickets.constants.ts
import { FilterState } from '@/types/tickets.types'

export const DEFAULT_FILTERS: FilterState = {
  page: 1,
  per_page: 20,
  sort_by: 'updated_at',
  sort_direction: 'desc' as const
}

export const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' }
]

export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'academic', label: 'Academic Help' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'crisis', label: 'Crisis Support' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'other', label: 'Other' }
]

export const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
]

export const ASSIGNMENT_OPTIONS = [
  { value: 'all', label: 'All Tickets' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'my-assigned', label: 'My Assigned' }
]

export const SORT_OPTIONS = [
  { value: 'updated_at-desc', label: 'Latest Updated' },
  { value: 'updated_at-asc', label: 'Oldest Updated' },
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'created_at-asc', label: 'Oldest First' },
  { value: 'priority-desc', label: 'High Priority' },
  { value: 'priority-asc', label: 'Low Priority' }
]

export const TAB_VIEWS = {
  ALL: 'all',
  OPEN: 'open',
  CLOSED: 'closed',
  CRISIS: 'crisis',
  UNASSIGNED: 'unassigned',
  MY_ASSIGNED: 'my_assigned'
} as const

export type TabView = typeof TAB_VIEWS[keyof typeof TAB_VIEWS]