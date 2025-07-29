// services/crisisKeywords.service.ts - ENHANCED: Crisis Keywords Management

import { apiClient, StandardizedApiResponse } from '@/lib/api'

// ENHANCED: Interfaces for crisis keywords
export interface CrisisKeyword {
  id: number
  keyword: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  severity_weight: number
  is_active: boolean
  category_ids: number[]
  trigger_count: number
  last_triggered_at: string | null
  created_at: string
  updated_at: string
  
  // Relationships
  categories?: Array<{
    id: number
    name: string
    slug: string
    color: string
  }>
}

export interface CreateCrisisKeywordRequest {
  keyword: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  severity_weight: number
  is_active: boolean
  category_ids: number[]
}

export interface UpdateCrisisKeywordRequest {
  keyword?: string
  severity_level?: 'low' | 'medium' | 'high' | 'critical'
  severity_weight?: number
  is_active?: boolean
  category_ids?: number[]
}

export interface BulkActionRequest {
  action: 'activate' | 'deactivate' | 'delete' | 'update_severity'
  keyword_ids: number[]
  data?: {
    severity_level?: 'low' | 'medium' | 'high' | 'critical'
    severity_weight?: number
  }
}

export interface TestDetectionRequest {
  text: string
  category_id?: number
}

export interface TestDetectionResult {
  is_crisis: boolean
  crisis_score: number
  detected_keywords: Array<{
    keyword: string
    severity_level: string
    severity_weight: number
    position: number
  }>
  recommendation: string
  total_weight: number
  threshold: number
}

export interface ImportRequest {
  keywords: Array<{
    keyword: string
    severity_level: 'low' | 'medium' | 'high' | 'critical'
    severity_weight: number
    is_active: boolean
    category_ids: number[]
  }>
  replace_existing: boolean
}

export interface CrisisKeywordStats {
  total_keywords: number
  active_keywords: number
  inactive_keywords: number
  by_severity: Record<string, number>
  by_category: Array<{
    category_id: number
    category_name: string
    keyword_count: number
  }>
  recent_triggers: Array<{
    keyword: string
    trigger_count: number
    last_triggered: string
  }>
  detection_metrics: {
    total_detections: number
    detection_rate: number
    avg_crisis_score: number
    most_triggered_keywords: Array<{
      keyword: string
      severity_level: string
      trigger_count: number
    }>
  }
}

/**
 * Enhanced Crisis Keywords Service
 */
class CrisisKeywordsService {
  private readonly apiClient = apiClient

  /**
   * Get all crisis keywords with filtering
   */
  async getKeywords(params: {
    severity_level?: string
    is_active?: boolean
    category_id?: number
    search?: string
    page?: number
    per_page?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
    with_categories?: boolean
  } = {}): Promise<StandardizedApiResponse<{
    keywords: CrisisKeyword[]
    pagination?: any
    stats?: any
  }>> {
    console.log('🚨 CrisisKeywordsService: Fetching keywords with params:', params)

    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await this.apiClient.get(`/admin/crisis-keywords?${queryParams.toString()}`)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keywords fetched successfully:', 
          response.data?.keywords?.length || 0)
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Failed to fetch keywords:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch crisis keywords. Please try again.',
      }
    }
  }

  /**
   * Create new crisis keyword
   */
  async createKeyword(data: CreateCrisisKeywordRequest): Promise<StandardizedApiResponse<{
    keyword: CrisisKeyword
  }>> {
    console.log('🚨 CrisisKeywordsService: Creating keyword:', data)

    try {
      // Validate required fields
      const validation = this.validateKeywordData(data)
      if (!validation.valid) {
        return {
          success: false,
          status: 422,
          message: validation.errors.join(', '),
        }
      }

      const response = await this.apiClient.post('/admin/crisis-keywords', data)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keyword created successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Create keyword error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to create crisis keyword. Please try again.',
      }
    }
  }

  /**
   * Update crisis keyword
   */
  async updateKeyword(
    id: number, 
    data: UpdateCrisisKeywordRequest
  ): Promise<StandardizedApiResponse<{
    keyword: CrisisKeyword
  }>> {
    console.log('🚨 CrisisKeywordsService: Updating keyword:', { id, data })

    try {
      // Validate fields if provided
      if (data.keyword && (data.keyword.trim().length < 2 || data.keyword.trim().length > 100)) {
        return {
          success: false,
          status: 422,
          message: 'Keyword must be between 2 and 100 characters',
        }
      }

      if (data.severity_weight !== undefined && (data.severity_weight < 1 || data.severity_weight > 100)) {
        return {
          success: false,
          status: 422,
          message: 'Severity weight must be between 1 and 100',
        }
      }

      const response = await this.apiClient.put(`/admin/crisis-keywords/${id}`, data)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keyword updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Update keyword error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to update crisis keyword. Please try again.',
      }
    }
  }

  /**
   * Delete crisis keyword
   */
  async deleteKeyword(id: number): Promise<StandardizedApiResponse<{
    deleted_keyword: any
  }>> {
    console.log('🚨 CrisisKeywordsService: Deleting keyword:', id)

    try {
      const response = await this.apiClient.delete(`/admin/crisis-keywords/${id}`)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keyword deleted successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Delete keyword error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to delete crisis keyword. Please try again.',
      }
    }
  }

  /**
   * Bulk action on crisis keywords
   */
  async bulkAction(data: BulkActionRequest): Promise<StandardizedApiResponse<{
    affected_count: number
    processed_keywords: CrisisKeyword[]
  }>> {
    console.log('🚨 CrisisKeywordsService: Bulk action:', data)

    try {
      if (!data.keyword_ids || data.keyword_ids.length === 0) {
        return {
          success: false,
          status: 422,
          message: 'At least one keyword must be selected',
        }
      }

      const response = await this.apiClient.post('/admin/crisis-keywords/bulk-action', data)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Bulk action completed successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Bulk action error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to perform bulk action. Please try again.',
      }
    }
  }

  /**
   * Test crisis detection
   */
  async testDetection(data: TestDetectionRequest): Promise<StandardizedApiResponse<TestDetectionResult>> {
    console.log('🚨 CrisisKeywordsService: Testing crisis detection')

    try {
      if (!data.text || data.text.trim().length < 5) {
        return {
          success: false,
          status: 422,
          message: 'Text must be at least 5 characters long for testing',
        }
      }

      const response = await this.apiClient.post('/admin/crisis-keywords/test-detection', data)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Crisis detection test completed')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Test detection error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to test crisis detection. Please try again.',
      }
    }
  }

  /**
   * Import crisis keywords
   */
  async importKeywords(data: ImportRequest): Promise<StandardizedApiResponse<{
    imported_count: number
    updated_count: number
    skipped_count: number
    keywords: CrisisKeyword[]
  }>> {
    console.log('🚨 CrisisKeywordsService: Importing keywords:', data.keywords.length)

    try {
      if (!data.keywords || data.keywords.length === 0) {
        return {
          success: false,
          status: 422,
          message: 'At least one keyword is required for import',
        }
      }

      // Validate each keyword
      for (const keyword of data.keywords) {
        const validation = this.validateKeywordData(keyword)
        if (!validation.valid) {
          return {
            success: false,
            status: 422,
            message: `Invalid keyword "${keyword.keyword}": ${validation.errors.join(', ')}`,
          }
        }
      }

      const response = await this.apiClient.post('/admin/crisis-keywords/import', data)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keywords imported successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Import keywords error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to import crisis keywords. Please try again.',
      }
    }
  }

  /**
   * Export crisis keywords
   */
  async exportKeywords(format: 'csv' | 'json' = 'csv', filters: {
    severity_level?: string
    is_active?: boolean
    category_id?: number
  } = {}): Promise<StandardizedApiResponse<{
    keywords: CrisisKeyword[]
    filename: string
    count: number
    exported_at: string
  }>> {
    console.log('🚨 CrisisKeywordsService: Exporting keywords:', { format, filters })

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', format)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await this.apiClient.get(`/admin/crisis-keywords/export?${queryParams.toString()}`)
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Keywords exported successfully')
        
        if (response.data?.keywords && format === 'csv') {
          const exportData = response.data.keywords
          const filename = response.data.filename || `crisis-keywords-export-${new Date().toISOString().split('T')[0]}.csv`
          
          const headers = ['keyword', 'severity_level', 'severity_weight', 'is_active', 'trigger_count', 'categories']
          const csvContent = [
            headers.join(','),
            ...exportData.map((keyword: CrisisKeyword) =>
              [
                `"${keyword.keyword}"`,
                keyword.severity_level,
                keyword.severity_weight,
                keyword.is_active,
                keyword.trigger_count || 0,
                `"${keyword.categories?.map(c => c.name).join('; ') || ''}"`
              ].join(',')
            ),
          ].join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          this.triggerDownload(blob, filename)
        }
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Export error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to export crisis keywords. Please try again.',
      }
    }
  }

  /**
   * Get crisis keywords statistics
   */
  async getStats(): Promise<StandardizedApiResponse<CrisisKeywordStats>> {
    console.log('🚨 CrisisKeywordsService: Fetching statistics')

    try {
      const response = await this.apiClient.get('/admin/crisis-keywords/stats')
      
      if (response.success) {
        console.log('✅ CrisisKeywordsService: Statistics fetched successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ CrisisKeywordsService: Get stats error:', error)
      return {
        success: false,
        status: 0,
        message: 'Failed to fetch crisis keywords statistics. Please try again.',
      }
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Get severity level display
   */
  getSeverityLevelDisplay(level: string): { 
    label: string
    color: string
    description: string
    icon: string
  } {
    switch (level) {
      case 'critical':
        return {
          label: 'Critical',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Immediate intervention required',
          icon: '🚨'
        }
      case 'high':
        return {
          label: 'High',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'High risk situation',
          icon: '⚠️'
        }
      case 'medium':
        return {
          label: 'Medium',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Moderate concern',
          icon: '⚡'
        }
      case 'low':
        return {
          label: 'Low',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Low level concern',
          icon: 'ℹ️'
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Unknown severity level',
          icon: '❓'
        }
    }
  }

  /**
   * Get severity weight color
   */
  getSeverityWeightColor(weight: number): string {
    if (weight >= 80) return 'text-red-600 font-bold'
    if (weight >= 60) return 'text-orange-600 font-semibold'
    if (weight >= 40) return 'text-yellow-600'
    if (weight >= 20) return 'text-blue-600'
    return 'text-gray-600'
  }

  /**
   * Calculate crisis score
   */
  calculateCrisisScore(detectedKeywords: Array<{ severity_weight: number }>): number {
    if (!detectedKeywords || detectedKeywords.length === 0) return 0
    
    const totalWeight = detectedKeywords.reduce((sum, keyword) => sum + keyword.severity_weight, 0)
    return Math.min(100, totalWeight) // Cap at 100
  }

  /**
   * Get crisis score status
   */
  getCrisisScoreStatus(score: number): {
    status: string
    color: string
    recommendation: string
  } {
    if (score >= 80) {
      return {
        status: 'Critical',
        color: 'bg-red-100 text-red-800',
        recommendation: 'Immediate intervention required'
      }
    } else if (score >= 60) {
      return {
        status: 'High Risk',
        color: 'bg-orange-100 text-orange-800',
        recommendation: 'Priority assignment needed'
      }
    } else if (score >= 40) {
      return {
        status: 'Moderate Risk',
        color: 'bg-yellow-100 text-yellow-800',
        recommendation: 'Monitor closely'
      }
    } else if (score >= 20) {
      return {
        status: 'Low Risk',
        color: 'bg-blue-100 text-blue-800',
        recommendation: 'Standard processing'
      }
    } else {
      return {
        status: 'Minimal Risk',
        color: 'bg-green-100 text-green-800',
        recommendation: 'Normal handling'
      }
    }
  }

  /**
   * Validate keyword data
   */
  validateKeywordData(data: CreateCrisisKeywordRequest): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.keyword || data.keyword.trim().length < 2) {
      errors.push('Keyword must be at least 2 characters long')
    }

    if (data.keyword && data.keyword.trim().length > 100) {
      errors.push('Keyword must not exceed 100 characters')
    }

    if (!['low', 'medium', 'high', 'critical'].includes(data.severity_level)) {
      errors.push('Valid severity level is required')
    }

    if (!data.severity_weight || data.severity_weight < 1 || data.severity_weight > 100) {
      errors.push('Severity weight must be between 1 and 100')
    }

    if (!Array.isArray(data.category_ids)) {
      errors.push('Category IDs must be an array')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Trigger file download
   */
  private triggerDownload(blob: Blob, filename: string): void {
    try {
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
      }, 1000)
      
      console.log(`✅ CrisisKeywordsService: Download triggered: ${filename}`)
      
    } catch (error) {
      console.error(`❌ CrisisKeywordsService: Failed to trigger download:`, error)
      throw new Error(`Failed to start download: ${error}`)
    }
  }

  /**
   * Format trigger count display
   */
  formatTriggerCount(count: number): string {
    if (count === 0) return 'Never triggered'
    if (count === 1) return '1 trigger'
    if (count < 1000) return `${count} triggers`
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K triggers`
    return `${(count / 1000000).toFixed(1)}M triggers`
  }

  /**
   * Get time since last trigger
   */
  getTimeSinceLastTrigger(lastTriggeredAt: string | null): string {
    if (!lastTriggeredAt) return 'Never'
    
    const date = new Date(lastTriggeredAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  /**
   * Create sample keywords for import
   */
  createSampleKeywords(): CreateCrisisKeywordRequest[] {
    return [
      {
        keyword: 'suicide',
        severity_level: 'critical',
        severity_weight: 100,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'kill myself',
        severity_level: 'critical',
        severity_weight: 95,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'self harm',
        severity_level: 'high',
        severity_weight: 80,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'want to die',
        severity_level: 'critical',
        severity_weight: 90,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'overwhelmed',
        severity_level: 'medium',
        severity_weight: 40,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'hopeless',
        severity_level: 'high',
        severity_weight: 70,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'crisis',
        severity_level: 'high',
        severity_weight: 75,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'emergency',
        severity_level: 'high',
        severity_weight: 65,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'can\'t cope',
        severity_level: 'medium',
        severity_weight: 50,
        is_active: true,
        category_ids: []
      },
      {
        keyword: 'breakdown',
        severity_level: 'medium',
        severity_weight: 55,
        is_active: true,
        category_ids: []
      }
    ]
  }

  /**
   * Health check for service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const crisisKeywordsService = new CrisisKeywordsService()
export default crisisKeywordsService