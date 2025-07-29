// services/counselorSpecializations.service.ts - Counselor Specializations Management Service

import { apiClient, StandardizedApiResponse } from '@/lib/api'

// Types and Interfaces
export interface CounselorSpecialization {
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
  
  // Relationships
  user?: {
    id: number
    name: string
    email: string
    role: string
    status: string
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

export interface CreateSpecializationRequest {
  user_id: number
  category_id: number
  priority_level: 'primary' | 'secondary' | 'backup'
  max_workload: number
  expertise_rating?: number
  availability_schedule?: any
  notes?: string
}

export interface UpdateSpecializationRequest {
  priority_level?: 'primary' | 'secondary' | 'backup'
  max_workload?: number
  current_workload?: number
  is_available?: boolean
  availability_schedule?: any
  expertise_rating?: number
  notes?: string
}

export interface BulkAssignRequest {
  assignments: Array<{
    user_id: number
    category_id: number
    priority_level: 'primary' | 'secondary' | 'backup'
    max_workload: number
    expertise_rating?: number
  }>
}

export interface AvailabilityUpdateRequest {
  specializations: Array<{
    id: number
    is_available: boolean
  }>
}

export interface WorkloadStats {
  overview: {
    total_counselors: number
    assigned_counselors: number
    available_counselors: number
    total_capacity: number
    current_utilization: number
  }
  by_category: Array<{
    category_name: string
    total_counselors: number
    available_counselors: number
    total_capacity: number
    current_utilization: number
    utilization_rate: number
  }>
  counselor_workloads: Array<{
    counselor_name: string
    total_capacity: number
    current_workload: number
    utilization_rate: number
    categories: Array<{
      category_name: string
      current_workload: number
      max_workload: number
      priority_level: string
      is_available: boolean
    }>
  }>
}

export interface AvailableCounselorsResponse {
  counselors: Array<{
    id: number
    name: string
    email: string
    role: string
    priority_level: string
    current_workload: number
    max_workload: number
    utilization_rate: number
    expertise_rating: number
    assignment_score: number
    can_take_ticket: boolean
  }>
  best_available: any
  total_available: number
  category: {
    id: number
    name: string
    auto_assign: boolean
  }
}

/**
 * Counselor Specializations Service - Manage counselor assignments to categories
 */
class CounselorSpecializationsService {
  private readonly apiClient = apiClient
  
  // Cache for specializations data
  private specializationsCache: { data: CounselorSpecialization[]; timestamp: number } | null = null
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

  /**
   * Get all counselor specializations
   */
  async getSpecializations(params: {
    category_id?: number
    user_id?: number
    is_available?: boolean
  } = {}): Promise<StandardizedApiResponse<{
    specializations: CounselorSpecialization[]
    grouped_by_category: Record<string, CounselorSpecialization[]>
    summary: {
      total_specializations: number
      available_counselors: number
      categories_covered: number
      total_capacity: number
      current_utilization: number
    }
  }>> {
    console.log('👥 CounselorSpecializationsService: Fetching specializations with params:', params)

    try {
      const queryParams = new URLSearchParams()
      
      if (params.category_id) {
        queryParams.append('category_id', params.category_id.toString())
      }
      if (params.user_id) {
        queryParams.append('user_id', params.user_id.toString())
      }
      if (params.is_available !== undefined) {
        queryParams.append('is_available', params.is_available.toString())
      }

      const response = await this.apiClient.get(`/admin/counselor-specializations?${queryParams.toString()}`)
      
      if (response.success && response.data) {
        // Cache the result
        this.specializationsCache = {
          data: response.data.specializations || [],
          timestamp: Date.now()
        }
        
        console.log('✅ CounselorSpecializationsService: Specializations fetched successfully:', response.data.specializations?.length || 0)
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to fetch specializations:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch counselor specializations. Please try again.',
      }
    }
  }

  /**
   * Create new specialization (assign counselor to category)
   */
  async createSpecialization(data: CreateSpecializationRequest): Promise<StandardizedApiResponse<{
    specialization: CounselorSpecialization
  }>> {
    console.log('👥 CounselorSpecializationsService: Creating specialization:', data)

    try {
      const response = await this.apiClient.post('/admin/counselor-specializations', data)
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Specialization created successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to create specialization:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to assign counselor to category. Please try again.',
      }
    }
  }

  /**
   * Update specialization
   */
  async updateSpecialization(id: number, data: UpdateSpecializationRequest): Promise<StandardizedApiResponse<{
    specialization: CounselorSpecialization
  }>> {
    console.log('👥 CounselorSpecializationsService: Updating specialization:', { id, data })

    try {
      const response = await this.apiClient.put(`/admin/counselor-specializations/${id}`, data)
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Specialization updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to update specialization:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update specialization. Please try again.',
      }
    }
  }

  /**
   * Delete specialization (remove counselor from category)
   */
  async deleteSpecialization(id: number): Promise<StandardizedApiResponse<any>> {
    console.log('👥 CounselorSpecializationsService: Deleting specialization:', id)

    try {
      const response = await this.apiClient.delete(`/admin/counselor-specializations/${id}`)
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Specialization deleted successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to delete specialization:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to remove counselor from category. Please try again.',
      }
    }
  }

  /**
   * Bulk assign counselors to categories
   */
  async bulkAssign(data: BulkAssignRequest): Promise<StandardizedApiResponse<{
    success_count: number
    total_count: number
    errors: string[]
  }>> {
    console.log('👥 CounselorSpecializationsService: Bulk assigning counselors')

    try {
      const response = await this.apiClient.post('/admin/counselor-specializations/bulk-assign', data)
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Bulk assignment completed')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to bulk assign:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to bulk assign counselors. Please try again.',
      }
    }
  }

  /**
   * Update counselor availability
   */
  async updateAvailability(data: AvailabilityUpdateRequest): Promise<StandardizedApiResponse<{
    updated_count: number
  }>> {
    console.log('👥 CounselorSpecializationsService: Updating availability')

    try {
      const response = await this.apiClient.post('/admin/counselor-specializations/update-availability', data)
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Availability updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to update availability:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update availability. Please try again.',
      }
    }
  }

  /**
   * Get available counselors for a category
   */
  async getAvailableCounselors(categoryId: number): Promise<StandardizedApiResponse<AvailableCounselorsResponse>> {
    console.log('👥 CounselorSpecializationsService: Fetching available counselors for category:', categoryId)

    try {
      const response = await this.apiClient.get(`/admin/counselor-specializations/category/${categoryId}/available`)
      
      if (response.success) {
        console.log('✅ CounselorSpecializationsService: Available counselors fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to fetch available counselors:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch available counselors.',
      }
    }
  }

  /**
   * Get workload statistics
   */
  async getWorkloadStats(): Promise<StandardizedApiResponse<WorkloadStats>> {
    console.log('👥 CounselorSpecializationsService: Fetching workload statistics')

    try {
      const response = await this.apiClient.get('/admin/counselor-specializations/workload-stats')
      
      if (response.success) {
        console.log('✅ CounselorSpecializationsService: Workload statistics fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to fetch workload statistics:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch workload statistics.',
      }
    }
  }

  /**
   * Reset workload counters
   */
  async resetWorkloads(): Promise<StandardizedApiResponse<any>> {
    console.log('👥 CounselorSpecializationsService: Resetting workload counters')

    try {
      const response = await this.apiClient.post('/admin/counselor-specializations/reset-workloads')
      
      if (response.success) {
        // Invalidate cache
        this.specializationsCache = null
        
        console.log('✅ CounselorSpecializationsService: Workload counters reset successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to reset workloads:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to reset workload counters.',
      }
    }
  }

  /**
   * Get all available staff (counselors and advisors)
   */
  async getAvailableStaff(): Promise<StandardizedApiResponse<{
    staff: Array<{
      id: number
      name: string
      email: string
      role: string
      status: string
      current_specializations?: number
      total_workload?: number
    }>
  }>> {
    console.log('👥 CounselorSpecializationsService: Fetching available staff')

    try {
      // Get all users with counselor or advisor roles
      const response = await this.apiClient.get('/admin/users?role=counselor,advisor&status=active&per_page=100')
      
      if (response.success && response.data?.users) {
        const staff = response.data.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          current_specializations: 0, // This would be calculated from specializations
          total_workload: 0 // This would be calculated from specializations
        }))

        console.log('✅ CounselorSpecializationsService: Available staff fetched successfully:', staff.length)
        
        return {
          success: true,
          status: 200,
          message: 'Available staff fetched successfully',
          data: { staff }
        }
      } else {
        throw new Error(response.message || 'Failed to fetch staff')
      }
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Failed to fetch available staff:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch available staff.',
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Validate specialization data
   */
  validateSpecializationData(data: CreateSpecializationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.user_id) {
      errors.push('Counselor selection is required')
    }

    if (!data.category_id) {
      errors.push('Category selection is required')
    }

    if (!['primary', 'secondary', 'backup'].includes(data.priority_level)) {
      errors.push('Valid priority level is required')
    }

    if (!data.max_workload || data.max_workload < 1 || data.max_workload > 50) {
      errors.push('Max workload must be between 1 and 50')
    }

    if (data.expertise_rating && (data.expertise_rating < 1 || data.expertise_rating > 5)) {
      errors.push('Expertise rating must be between 1 and 5')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Get default specialization settings
   */
  getDefaultSpecializationSettings(): Partial<CreateSpecializationRequest> {
    return {
      priority_level: 'primary',
      max_workload: 10,
      expertise_rating: 3
    }
  }

  /**
   * Calculate utilization rate
   */
  calculateUtilizationRate(currentWorkload: number, maxWorkload: number): number {
    if (maxWorkload === 0) return 0
    return Math.round((currentWorkload / maxWorkload) * 100 * 10) / 10
  }

  /**
   * Check if counselor can take more tickets
   */
  canTakeTicket(specialization: CounselorSpecialization): boolean {
    return specialization.is_available && 
           specialization.current_workload < specialization.max_workload
  }

  /**
   * Get assignment score for counselor
   */
  getAssignmentScore(specialization: CounselorSpecialization): number {
    if (!this.canTakeTicket(specialization)) return 0

    const utilizationRate = this.calculateUtilizationRate(
      specialization.current_workload, 
      specialization.max_workload
    )
    
    const priorityWeight = {
      'primary': 1.0,
      'secondary': 0.8,
      'backup': 0.6
    }[specialization.priority_level] || 0.5

    const expertiseWeight = (specialization.expertise_rating || 3) / 5

    // Lower utilization and higher priority/expertise = higher score
    const availabilityScore = (100 - utilizationRate) / 100
    
    return Math.round((availabilityScore * priorityWeight * expertiseWeight) * 100)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    console.log('👥 CounselorSpecializationsService: Clearing cache')
    this.specializationsCache = null
  }

  /**
   * Get cached specializations
   */
  getCachedSpecializations(): CounselorSpecialization[] | null {
    if (this.specializationsCache) {
      const age = Date.now() - this.specializationsCache.timestamp
      if (age < this.CACHE_DURATION) {
        return this.specializationsCache.data
      }
    }
    return null
  }

  /**
   * Health check for specializations service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/admin/counselor-specializations')
      return response.success
    } catch {
      return false
    }
  }

  /**
   * Export specializations data
   */
  async exportSpecializations(format: 'csv' | 'json' = 'csv'): Promise<StandardizedApiResponse<{
    specializations: any[]
    filename: string
    count: number
    exported_at: string
  }>> {
    console.log('👥 CounselorSpecializationsService: Exporting specializations:', format)

    try {
      const response = await this.getSpecializations()
      
      if (response.success && response.data?.specializations) {
        const specializations = response.data.specializations
        const filename = `counselor-specializations-export-${new Date().toISOString().split('T')[0]}.${format}`
        
        const exportData = specializations.map((spec: CounselorSpecialization) => ({
          id: spec.id,
          counselor_name: spec.user?.name || 'Unknown',
          counselor_email: spec.user?.email || 'Unknown',
          counselor_role: spec.user?.role || 'Unknown',
          category_name: spec.category?.name || 'Unknown',
          priority_level: spec.priority_level,
          max_workload: spec.max_workload,
          current_workload: spec.current_workload,
          utilization_rate: this.calculateUtilizationRate(spec.current_workload, spec.max_workload) + '%',
          is_available: spec.is_available ? 'Yes' : 'No',
          expertise_rating: spec.expertise_rating,
          assignment_score: this.getAssignmentScore(spec),
          can_take_ticket: this.canTakeTicket(spec) ? 'Yes' : 'No',
          assigned_at: spec.assigned_at,
          notes: spec.notes || ''
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

        console.log('✅ CounselorSpecializationsService: Specializations exported successfully')
        
        return {
          success: true,
          status: 200,
          message: 'Specializations exported successfully',
          data: {
            specializations: exportData,
            filename,
            count: exportData.length,
            exported_at: new Date().toISOString()
          }
        }
      } else {
        return {
          success: false,
          status: response.status || 0,
          message: response.message || 'Failed to fetch specializations for export',
          data: {
            specializations: [],
            filename: '',
            count: 0,
            exported_at: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error('❌ CounselorSpecializationsService: Export error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to export specializations.',
        data: {
          specializations: [],
          filename: '',
          count: 0,
          exported_at: new Date().toISOString()
        }
      }
    }
  }
}

// Export singleton instance
export const counselorSpecializationsService = new CounselorSpecializationsService()
export default counselorSpecializationsService