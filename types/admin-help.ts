// types/admin-help.ts
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

export interface FAQFormData {
  category_id: string
  question: string
  answer: string
  tags: string[]
  is_published: boolean
  is_featured: boolean
  sort_order: number
}

export interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  sort_order: number
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
}

export type TabType = "faqs" | "categories" | "suggestions" | "analytics"