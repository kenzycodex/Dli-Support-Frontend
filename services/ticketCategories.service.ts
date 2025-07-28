// services/ticketCategories.service.ts - Ticket Categories Management Service

import { apiClient, StandardizedApiResponse } from '@/lib/api'

// Import types from ticket service
export type { TicketCategory } from './ticket.service'

// Category management interfaces
export interface CreateCategoryRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
  auto_assign?: boolean
  crisis_detection_enabled?: boolean
  sla_response_hours?: number
  max_priority_level?: number
  notification_settings?: any
  counselors?: Array<{
    user_id: number
    priority_level: 'primary' | 'secondary' | 'backup'
    max_workload: number
    expertise_rating?: number
  }>
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
  auto_assign?: boolean
  crisis_detection_enabled?: boolean
  sla_response_hours?: number
  max_priority_level?: number
  notification_settings?: any
}

export interface CategoryStats {
  total_tickets: number
  open_tickets: number
  crisis_tickets: number
  avg_resolution_time: number | null
  counselor_workload: Array<{
    counselor_name: string
    current_workload: number
    max_workload: number
    utilization_rate: number
    priority_level: string
    is_available: boolean
  }>
}

export interface CategoriesOverview {
  categories: Array<{
    category_name: string
    total_counselors: number
    available_counselors: number
    total_capacity: number
    current_utilization: number
    utilization_rate: number
  }>
  overview: {
    total_categories: number
    active_categories: number
    categories_with_auto_assign: number
    categories_with_crisis_detection: number
  }
  counselor_distribution: Array<{
    category_name: string
    counselor_count: number
  }>
  workload_analysis: {
    total_capacity: number
    current_utilization: number
    average_utilization_rate: number
    overloaded_counselors: number
    available_capacity: number
  }
}

/**
 * Ticket Categories Service - Manage dynamic categories
 */
class TicketCategoriesService {
  private readonly apiClient = apiClient
  
  // Cache for categories data
  private categoriesCache: { data: any[]; timestamp: number } | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get all categories with counselor counts
   */
  async getCategories(params: {
    include_inactive?: boolean
    with_counselors?: boolean
  } = {}): Promise<StandardizedApiResponse<{
    categories: any[]
  }>> {
    console.log('📁 CategoriesService: Fetching categories with params:', params)

    try {
      const queryParams = new URLSearchParams()
      
      if (params.include_inactive) {
        queryParams.append('include_inactive', 'true')
      }
      if (params.with_counselors) {
        queryParams.append('with_counselors', 'true')
      }

      const response = await this.apiClient.get(`/admin/ticket-categories?${queryParams.toString()}`)
      
      if (response.success && response.data && response.data.categories) {
        // Cache the result
        this.categoriesCache = {
          data: response.data.categories,
          timestamp: Date.now()
        }
        
        console.log('✅ CategoriesService: Categories fetched successfully:', response.data.categories.length)
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to fetch categories:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch categories. Please try again.',
      }
    }
  }

  /**
   * Get single category with details
   */
  async getCategory(categoryId: number): Promise<StandardizedApiResponse<{
    category: any
    stats: CategoryStats
  }>> {
    console.log('📁 CategoriesService: Fetching category details:', categoryId)

    try {
      const response = await this.apiClient.get(`/admin/ticket-categories/${categoryId}`)
      
      if (response.success) {
        console.log('✅ CategoriesService: Category details fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to fetch category details:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch category details.',
      }
    }
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<StandardizedApiResponse<{
    category: any
  }>> {
    console.log('📁 CategoriesService: Creating category:', data)

    try {
      const response = await this.apiClient.post('/admin/ticket-categories', data)
      
      if (response.success) {
        // Invalidate cache
        this.categoriesCache = null
        
        console.log('✅ CategoriesService: Category created successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to create category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to create category. Please try again.',
      }
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: number, data: UpdateCategoryRequest): Promise<StandardizedApiResponse<{
    category: any
  }>> {
    console.log('📁 CategoriesService: Updating category:', { categoryId, data })

    try {
      const response = await this.apiClient.put(`/admin/ticket-categories/${categoryId}`, data)
      
      if (response.success) {
        // Invalidate cache
        this.categoriesCache = null
        
        console.log('✅ CategoriesService: Category updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to update category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update category. Please try again.',
      }
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: number): Promise<StandardizedApiResponse<any>> {
    console.log('📁 CategoriesService: Deleting category:', categoryId)

    try {
      const response = await this.apiClient.delete(`/admin/ticket-categories/${categoryId}`)
      
      if (response.success) {
        // Invalidate cache
        this.categoriesCache = null
        
        console.log('✅ CategoriesService: Category deleted successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to delete category:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to delete category. Please try again.',
      }
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categories: Array<{
    id: number
    sort_order: number
  }>): Promise<StandardizedApiResponse<any>> {
    console.log('📁 CategoriesService: Reordering categories')

    try {
      const response = await this.apiClient.post('/admin/ticket-categories/reorder', {
        categories
      })
      
      if (response.success) {
        // Invalidate cache
        this.categoriesCache = null
        
        console.log('✅ CategoriesService: Categories reordered successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to reorder categories:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to reorder categories. Please try again.',
      }
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<StandardizedApiResponse<CategoriesOverview>> {
    console.log('📁 CategoriesService: Fetching category statistics')

    try {
      const response = await this.apiClient.get('/admin/ticket-categories/stats/overview')
      
      if (response.success) {
        console.log('✅ CategoriesService: Statistics fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to fetch statistics:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch category statistics.',
      }
    }
  }

  /**
   * Get available counselors for category
   */
  async getAvailableCounselors(categoryId: number): Promise<StandardizedApiResponse<{
    counselors: any[]
    best_available: any
    total_available: number
    category: any
  }>> {
    console.log('📁 CategoriesService: Fetching available counselors for category:', categoryId)

    try {
      const response = await this.apiClient.get(`/admin/counselor-specializations/category/${categoryId}/available`)
      
      if (response.success) {
        console.log('✅ CategoriesService: Available counselors fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CategoriesService: Failed to fetch available counselors:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch available counselors.',
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Validate category data
   */
  validateCategoryData(data: CreateCategoryRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push('Category name is required')
    } else if (data.name.length > 255) {
      errors.push('Category name must not exceed 255 characters')
    } else if (data.name.length < 3) {
      errors.push('Category name must be at least 3 characters long')
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must not exceed 1000 characters')
    }

    if (data.color && !/^#[A-Fa-f0-9]{6}$/.test(data.color)) {
      errors.push('Color must be a valid hex color code (e.g., #FF0000)')
    }

    if (data.sla_response_hours && (data.sla_response_hours < 1 || data.sla_response_hours > 168)) {
      errors.push('SLA response time must be between 1 and 168 hours (1 week)')
    }

    if (data.max_priority_level && (data.max_priority_level < 1 || data.max_priority_level > 4)) {
      errors.push('Maximum priority level must be between 1 and 4')
    }

    if (data.sort_order && data.sort_order < 0) {
      errors.push('Sort order must be a positive number')
    }

    // Validate counselors if provided
    if (data.counselors && Array.isArray(data.counselors)) {
      data.counselors.forEach((counselor, index) => {
        if (!counselor.user_id) {
          errors.push(`Counselor ${index + 1}: User ID is required`)
        }
        
        if (!['primary', 'secondary', 'backup'].includes(counselor.priority_level)) {
          errors.push(`Counselor ${index + 1}: Invalid priority level`)
        }
        
        if (!counselor.max_workload || counselor.max_workload < 1 || counselor.max_workload > 50) {
          errors.push(`Counselor ${index + 1}: Max workload must be between 1 and 50`)
        }
        
        if (counselor.expertise_rating && (counselor.expertise_rating < 1 || counselor.expertise_rating > 5)) {
          errors.push(`Counselor ${index + 1}: Expertise rating must be between 1 and 5`)
        }
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Get default category settings
   */
  getDefaultCategorySettings(): Partial<CreateCategoryRequest> {
    return {
      icon: 'MessageSquare',
      color: '#3B82F6',
      sort_order: 0,
      is_active: true,
      auto_assign: true,
      crisis_detection_enabled: false,
      sla_response_hours: 24,
      max_priority_level: 3,
      notification_settings: {
        notify_admins: true,
        notify_counselors: true,
        email_alerts: true,
        auto_escalate: false
      }
    }
  }

  /**
   * Get available icons for categories
   */
  getAvailableIcons(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'MessageSquare', label: 'General', icon: 'MessageSquare' },
      { value: 'GraduationCap', label: 'Academic', icon: 'GraduationCap' },
      { value: 'Heart', label: 'Mental Health', icon: 'Heart' },
      { value: 'AlertTriangle', label: 'Crisis', icon: 'AlertTriangle' },
      { value: 'Settings', label: 'Technical', icon: 'Settings' },
      { value: 'HelpCircle', label: 'Support', icon: 'HelpCircle' },
      { value: 'Users', label: 'Community', icon: 'Users' },
      { value: 'BookOpen', label: 'Learning', icon: 'BookOpen' },
      { value: 'Shield', label: 'Safety', icon: 'Shield' },
      { value: 'Phone', label: 'Contact', icon: 'Phone' },
      { value: 'Mail', label: 'Communication', icon: 'Mail' },
      { value: 'Calendar', label: 'Scheduling', icon: 'Calendar' },
      { value: 'FileText', label: 'Documentation', icon: 'FileText' },
      { value: 'Star', label: 'Featured', icon: 'Star' },
      { value: 'Zap', label: 'Urgent', icon: 'Zap' }
    ]
  }

  /**
   * Get available colors for categories
   */
  getAvailableColors(): Array<{ value: string; label: string; preview: string }> {
    return [
      { value: '#3B82F6', label: 'Blue', preview: 'bg-blue-500' },
      { value: '#10B981', label: 'Green', preview: 'bg-green-500' },
      { value: '#F59E0B', label: 'Yellow', preview: 'bg-yellow-500' },
      { value: '#EF4444', label: 'Red', preview: 'bg-red-500' },
      { value: '#8B5CF6', label: 'Purple', preview: 'bg-purple-500' },
      { value: '#F97316', label: 'Orange', preview: 'bg-orange-500' },
      { value: '#06B6D4', label: 'Cyan', preview: 'bg-cyan-500' },
      { value: '#84CC16', label: 'Lime', preview: 'bg-lime-500' },
      { value: '#EC4899', label: 'Pink', preview: 'bg-pink-500' },
      { value: '#6B7280', label: 'Gray', preview: 'bg-gray-500' },
      { value: '#14B8A6', label: 'Teal', preview: 'bg-teal-500' },
      { value: '#F43F5E', label: 'Rose', preview: 'bg-rose-500' }
    ]
  }

  /**
   * Generate category slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  /**
   * Get category color styles
   */
  getCategoryColorStyles(color: string): {
    background: string
    border: string
    text: string
    badge: string
  } {
    // Convert hex to RGB for transparency
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const rgb = hexToRgb(color)
    
    if (!rgb) {
      return {
        background: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        badge: 'bg-gray-100 text-gray-800'
      }
    }

    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      text: color,
      badge: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    }
  }

  /**
   * Calculate category utilization
   */
  calculateCategoryUtilization(category: any): {
    totalCapacity: number
    currentUtilization: number
    utilizationRate: number
    availableSlots: number
    isOverloaded: boolean
  } {
    const specializations = category.counselorSpecializations || []
    
    const totalCapacity = specializations.reduce((sum: number, spec: any) => 
      sum + (spec.max_workload || 0), 0)
    
    const currentUtilization = specializations.reduce((sum: number, spec: any) => 
      sum + (spec.current_workload || 0), 0)
    
    const utilizationRate = totalCapacity > 0 ? (currentUtilization / totalCapacity) * 100 : 0
    const availableSlots = Math.max(0, totalCapacity - currentUtilization)
    const isOverloaded = currentUtilization > totalCapacity

    return {
      totalCapacity,
      currentUtilization,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      availableSlots,
      isOverloaded
    }
  }

  /**
   * Get category performance metrics
   */
  calculateCategoryPerformance(category: any): {
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    resolutionRate: number
    avgResolutionTime: number | null
    crisisTickets: number
    overdueTickets: number
  } {
    const tickets = category.tickets || []
    
    const totalTickets = tickets.length
    const openTickets = tickets.filter((t: any) => ['Open', 'In Progress'].includes(t.status)).length
    const resolvedTickets = tickets.filter((t: any) => t.status === 'Resolved').length
    const crisisTickets = tickets.filter((t: any) => t.crisis_flag).length
    
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0
    
    // Calculate average resolution time
    const resolvedWithTime = tickets.filter((t: any) => t.resolved_at && t.created_at)
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((acc: number, ticket: any) => {
          const created = new Date(ticket.created_at).getTime()
          const resolved = new Date(ticket.resolved_at).getTime()
          return acc + (resolved - created)
        }, 0) / resolvedWithTime.length / (1000 * 60 * 60) // Convert to hours
      : null
    
    // Calculate overdue tickets
    const slaHours = category.sla_response_hours || 24
    const overdueTickets = tickets.filter((t: any) => {
      if (['Resolved', 'Closed'].includes(t.status)) return false
      const deadline = new Date(t.created_at).getTime() + (slaHours * 60 * 60 * 1000)
      return new Date().getTime() > deadline
    }).length

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      avgResolutionTime: avgResolutionTime ? Math.round(avgResolutionTime * 10) / 10 : null,
      crisisTickets,
      overdueTickets
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    console.log('📁 CategoriesService: Clearing cache')
    this.categoriesCache = null
  }

  /**
   * Get cached categories
   */
  getCachedCategories(): any[] | null {
    if (this.categoriesCache) {
      const age = Date.now() - this.categoriesCache.timestamp
      if (age < this.CACHE_DURATION) {
        return this.categoriesCache.data
      }
    }
    return null
  }

  /**
   * Health check for categories service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/admin/ticket-categories')
      return response.success
    } catch {
      return false
    }
  }

  /**
   * Export categories data - FIXED: Proper return type handling
   */
  async exportCategories(format: 'csv' | 'json' = 'csv'): Promise<StandardizedApiResponse<{
    categories: any[]
    filename: string
    count: number
    exported_at: string
  }>> {
    console.log('📁 CategoriesService: Exporting categories:', format)

    try {
      const response = await this.getCategories({ include_inactive: true })
      
      if (response.success && response.data && response.data.categories) {
        const categories = response.data.categories
        const filename = `ticket-categories-export-${new Date().toISOString().split('T')[0]}.${format}`
        
        const exportData = categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          icon: category.icon,
          color: category.color,
          is_active: category.is_active ? 'Yes' : 'No',
          auto_assign: category.auto_assign ? 'Yes' : 'No',
          crisis_detection_enabled: category.crisis_detection_enabled ? 'Yes' : 'No',
          sla_response_hours: category.sla_response_hours,
          max_priority_level: category.max_priority_level,
          sort_order: category.sort_order,
          counselor_count: category.counselor_count || 0,
          tickets_count: category.tickets_count || 0,
          created_at: category.created_at,
          updated_at: category.updated_at
        }))

        if (format === 'csv') {
          const headers = Object.keys(exportData[0] || {})
          const csvContent = [
            headers.join(','),
            ...exportData.map((row: any) =>
              headers
                .map((header) => {
                  const value = row[header] || ''
                  return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"`
                    : value
                })
                .join(',')
            ),
          ].join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 1000)
        } else {
          const jsonContent = JSON.stringify(exportData, null, 2)
          const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 1000)
        }

        console.log('✅ CategoriesService: Categories exported successfully')
        
        return {
          success: true,
          status: 200,
          message: 'Categories exported successfully',
          data: {
            categories: exportData,
            filename,
            count: exportData.length,
            exported_at: new Date().toISOString()
          }
        }
      } else {
        // FIXED: Return proper structure when categories fetch fails
        return {
          success: false,
          status: response.status || 0,
          message: response.message || 'Failed to fetch categories for export',
          data: {
            categories: [],
            filename: '',
            count: 0,
            exported_at: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error('❌ CategoriesService: Export error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to export categories.',
        data: {
          categories: [],
          filename: '',
          count: 0,
          exported_at: new Date().toISOString()
        }
      }
    }
  }
}

// Export singleton instance
export const ticketCategoriesService = new TicketCategoriesService()
export default ticketCategoriesService
