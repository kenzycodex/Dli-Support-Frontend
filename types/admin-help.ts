// types/admin-help.ts - FIXED: Corrected all type definitions

export interface AdminHelpPageProps {
  onNavigate?: (page: string, params?: any) => void
}

export interface AdminStats {
  total_faqs: number
  published_faqs: number
  draft_faqs: number
  featured_faqs: number
  categories_count: number
  active_categories: number
  suggested_faqs: number
}

// FIXED: FAQFormData with proper optional properties
export interface FAQFormData {
  category_id: string
  question: string
  answer: string
  tags: string[]  // Always required array, not optional
  is_published?: boolean  // FIXED: Optional to match usage
  is_featured?: boolean   // FIXED: Optional to match usage
  sort_order?: number     // FIXED: Optional to match usage
}

// FIXED: CategoryFormData with proper optional properties
export interface CategoryFormData {
  name: string
  description?: string  // FIXED: Optional to match usage
  icon?: string         // FIXED: Optional to match usage
  color?: string        // FIXED: Optional to match usage
  is_active?: boolean   // FIXED: Optional to match usage
  sort_order?: number   // FIXED: Optional to match usage
}

export interface DialogStates {
  showCreateFAQDialog: boolean
  showEditFAQDialog: boolean
  showDeleteFAQDialog: boolean
  showCreateCategoryDialog: boolean
  showEditCategoryDialog: boolean
  showDeleteCategoryDialog: boolean
}

export interface FilterOptions {
  search?: string
  category?: string
  status?: 'all' | 'published' | 'unpublished' | 'featured'
  sort_by?: 'newest' | 'featured' | 'helpful' | 'views'
  page?: number
  per_page?: number
}

export type TabType = "faqs" | "categories" | "suggestions" | "analytics"

// Loading states interface
export interface LoadingStates {
  faqs: boolean
  categories: boolean
  suggestions: boolean
  create: boolean
  update: boolean
  delete: boolean
  approve: boolean
  reject: boolean
  stats: boolean
}

// Error states interface
export interface ErrorStates {
  faqs: string | null
  categories: string | null
  suggestions: string | null
  create: string | null
  update: string | null
  delete: string | null
  approve: string | null
  reject: string | null
  stats: string | null
}

// Component prop interfaces
export interface FAQManagementTabProps {
  faqs: any[]
  categories: any[]
  filters: FilterOptions
  hasActiveFilters: boolean  // FIXED: Added missing prop
  loading: LoadingStates
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  onCreateFAQ: () => void
  onEditFAQ: (faq: any) => void
  onDeleteFAQ: (faq: any) => void
  onTogglePublish: (faq: any) => void
  onToggleFeature: (faq: any) => void
  setFilters: (filters: Partial<FilterOptions>, immediate?: boolean) => void  // FIXED: Added missing prop
}

export interface SuggestionsTabProps {
  suggestedFAQs: any[]
  adminStats: AdminStats
  loading: LoadingStates
  isApproving: boolean  // FIXED: Added missing prop
  isRejecting: boolean  // FIXED: Added missing prop
  onEditFAQ: (faq: any) => void
  onApproveSuggestion: (faq: any) => void
  onRejectSuggestion: (faq: any) => void
}

export interface CategoryManagementTabProps {
  categories: any[]
  loading: LoadingStates
  onCreateCategory: () => void
  onEditCategory: (category: any) => void
  onDeleteCategory: (category: any) => void
}

export interface AnalyticsTabProps {
  faqs: any[]
  categories: any[]
  adminStats: AdminStats
}

export interface CreateFAQDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: any[]
  formData: FAQFormData
  setFormData: (data: FAQFormData) => void
  isLoading: boolean
  onSubmit: () => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export interface EditFAQDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: any[]
  formData: FAQFormData
  setFormData: (data: FAQFormData) => void
  isLoading: boolean
  onSubmit: () => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CategoryFormData
  setFormData: (data: CategoryFormData) => void
  isLoading: boolean
  onSubmit: () => void
}

export interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CategoryFormData
  setFormData: (data: CategoryFormData) => void
  isLoading: boolean
  onSubmit: () => void
}

export interface AdminHelpHeaderProps {
  adminStats: AdminStats
  isLoading: boolean
  isInitialized: boolean
  onBackToHelp: () => void
  onRefreshAll: () => void
}

export interface SearchAndFiltersProps {
  searchTerm: string
  filters: FilterOptions
  categories: any[]
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export interface FAQTableProps {
  faqs: any[]
  isLoading: boolean
  hasActiveFilters: boolean
  searchTerm: string
  loadingStates: {
    update: boolean
    delete: boolean
  }
  onEditFAQ: (faq: any) => void
  onDeleteFAQ: (faq: any) => void
  onTogglePublish: (faq: any) => void
  onToggleFeature: (faq: any) => void
  onCreateFAQ: () => void
  onClearFilters: () => void
}

// Utility types
export type ActionType = 'create' | 'update' | 'delete' | 'approve' | 'reject'
export type StatusType = 'draft' | 'published' | 'featured' | 'suggested'
export type SortType = 'newest' | 'oldest' | 'featured' | 'helpful' | 'views'

// Form validation types
export interface FormValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  valid: boolean
  errors: FormValidationError[]
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// Pagination types
export interface PaginationInfo {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Statistics types
export interface HelpStatistics {
  total_faqs: number
  published_faqs: number
  draft_faqs: number
  featured_faqs: number
  categories_count: number
  active_categories: number
  suggested_faqs: number
  total_views: number
  total_helpful_votes: number
  most_helpful_faq?: {
    id: number
    question: string
    helpful_count: number
  }
  most_viewed_faq?: {
    id: number
    question: string
    view_count: number
  }
}

// Export default types for backward compatibility
export type {
  AdminStats as DefaultAdminStats,
  FAQFormData as DefaultFAQFormData,
  CategoryFormData as DefaultCategoryFormData,
  FilterOptions as DefaultFilterOptions,
  LoadingStates as DefaultLoadingStates,
  ErrorStates as DefaultErrorStates
}