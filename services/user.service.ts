// services/user.service.ts - UPDATED with Standardized API Response

import { apiClient, type StandardizedApiResponse } from '@/lib/api'
import { User } from './auth.service'

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  suspended_users: number
  students: number
  counselors: number
  advisors: number
  admins: number
  recent_registrations: number
  recent_logins: number
  never_logged_in: number
  this_month_registrations: number
}

export interface UserListParams {
  page?: number
  per_page?: number
  search?: string
  role?: string
  status?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface UserListResponse {
  users: User[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number
    to?: number
    has_more_pages?: boolean
  }
  stats: UserStats
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: "student" | "counselor" | "advisor" | "admin"
  status?: "active" | "inactive" | "suspended"
  phone?: string
  address?: string
  date_of_birth?: string
  student_id?: string
  employee_id?: string
  specializations?: string[]
  bio?: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  role?: "student" | "counselor" | "advisor" | "admin"
  status?: "active" | "inactive" | "suspended"
  phone?: string
  address?: string
  date_of_birth?: string
  student_id?: string
  employee_id?: string
  specializations?: string[]
  bio?: string
}

export interface BulkActionRequest {
  action: 'activate' | 'deactivate' | 'suspend' | 'delete'
  user_ids: number[]
  reason?: string
}

export interface BulkCreateRequest {
  csv_file?: File
  users_data?: Array<{
    name: string
    email: string
    role: string
    status?: string
    phone?: string
    student_id?: string
    employee_id?: string
  }>
  skip_duplicates?: boolean
  send_welcome_email?: boolean
}

export interface BulkCreateResponse {
  results: {
    successful: number
    failed: number
    skipped: number
    errors: Array<{
      index: number
      email: string
      error: string
    }>
    created_users: Array<{
      id: number
      name: string
      email: string
      role: string
      generated_password: string
    }>
  }
  summary: {
    total_processed: number
    successful: number
    failed: number
    skipped: number
  }
}

interface RequestOptions {
  forceRefresh?: boolean
  timeout?: number
}

/**
 * UPDATED: User Service with Standardized API Response Pattern
 */
class UserService {
  private readonly apiClient = apiClient
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  // Cache management
  private getCacheKey(endpoint: string, params?: any): string {
    const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${endpoint}_${sortedParams}`
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  public clearCache(): void {
    this.cache.clear()
  }

  // BASIC CRUD OPERATIONS

  async getUsers(params: UserListParams = {}, options: RequestOptions = {}): Promise<StandardizedApiResponse<UserListResponse>> {
    try {
      const { forceRefresh = false } = options
      const cacheKey = this.getCacheKey('users', params)

      if (!forceRefresh) {
        const cached = this.getFromCache<UserListResponse>(cacheKey)
        if (cached) {
          console.log('📥 UserService: Users retrieved from cache')
          return {
            success: true,
            status: 200,
            message: 'Users retrieved from cache',
            data: cached,
          }
        }
      }

      const searchParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
      
      const queryString = searchParams.toString()
      const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users'
      
      console.log('🔄 UserService: Fetching users from API:', endpoint)

      const response = await this.apiClient.get<UserListResponse>(endpoint)

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data)
        console.log('✅ UserService: Users fetched successfully')
      }

      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to fetch users:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to fetch users. Please try again.',
      }
    }
  }

  async getUser(id: number): Promise<StandardizedApiResponse<{ user: User }>> {
    try {
      console.log('🔄 UserService: Fetching single user:', id)
      
      const response = await this.apiClient.get<{ user: User }>(`/admin/users/${id}`)
      
      if (response.success) {
        console.log('✅ UserService: User fetched successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to fetch user:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to fetch user. Please try again.',
      }
    }
  }

  async createUser(data: CreateUserRequest): Promise<StandardizedApiResponse<{ user: User }>> {
    try {
      console.log('🔄 UserService: Creating user:', data.email)
      
      const response = await this.apiClient.post<{ user: User }>('/admin/users', data)
      
      if (response.success) {
        this.clearCache() // Clear cache after successful creation
        console.log('✅ UserService: User created successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to create user:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to create user. Please try again.',
      }
    }
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<StandardizedApiResponse<{ user: User }>> {
    try {
      console.log('🔄 UserService: Updating user:', id)
      
      const response = await this.apiClient.put<{ user: User }>(`/admin/users/${id}`, data)
      
      if (response.success) {
        this.clearCache() // Clear cache after successful update
        console.log('✅ UserService: User updated successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to update user:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to update user. Please try again.',
      }
    }
  }

  async deleteUser(id: number): Promise<StandardizedApiResponse<void>> {
    try {
      console.log('🔄 UserService: Deleting user:', id)
      
      const response = await this.apiClient.delete(`/admin/users/${id}`)
      
      if (response.success) {
        this.clearCache() // Clear cache after successful deletion
        console.log('✅ UserService: User deleted successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to delete user:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to delete user. Please try again.',
      }
    }
  }

  // ENHANCED USER OPERATIONS

  async toggleUserStatus(id: number): Promise<StandardizedApiResponse<{ user: User }>> {
    try {
      console.log('🔄 UserService: Toggling user status:', id)
      
      const response = await this.apiClient.post<{ user: User }>(`/admin/users/${id}/toggle-status`)
      
      if (response.success) {
        this.clearCache() // Clear cache after status change
        console.log('✅ UserService: User status toggled successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to toggle user status:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to toggle user status. Please try again.',
      }
    }
  }

  async resetPassword(id: number, newPassword: string, confirmPassword: string): Promise<StandardizedApiResponse<void>> {
    try {
      console.log('🔄 UserService: Resetting password for user:', id)
      
      const response = await this.apiClient.post(`/admin/users/${id}/reset-password`, {
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      })
      
      if (response.success) {
        console.log('✅ UserService: Password reset successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to reset password:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to reset password. Please try again.',
      }
    }
  }

  // BULK OPERATIONS

  async bulkAction(data: BulkActionRequest): Promise<StandardizedApiResponse<{ affected_count: number; action: string }>> {
    try {
      console.log('🔄 UserService: Performing bulk action:', data.action, 'on', data.user_ids.length, 'users')
      
      const response = await this.apiClient.post<{ affected_count: number; action: string }>('/admin/users/bulk-action', data)
      
      if (response.success) {
        this.clearCache() // Clear cache after bulk action
        console.log('✅ UserService: Bulk action completed successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to perform bulk action:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to perform bulk action. Please try again.',
      }
    }
  }

  async bulkCreate(data: BulkCreateRequest): Promise<StandardizedApiResponse<BulkCreateResponse>> {
    try {
      console.log('🔄 UserService: Starting bulk user creation')
      
      // Prepare FormData for file upload
      const formData = new FormData()
      
      if (data.csv_file) {
        formData.append('csv_file', data.csv_file)
      }
      
      if (data.users_data) {
        formData.append('users_data', JSON.stringify(data.users_data))
      }
      
      if (data.skip_duplicates !== undefined) {
        formData.append('skip_duplicates', data.skip_duplicates.toString())
      }
      
      if (data.send_welcome_email !== undefined) {
        formData.append('send_welcome_email', data.send_welcome_email.toString())
      }
      
      const response = await this.apiClient.post<BulkCreateResponse>('/admin/users/bulk-create', formData)
      
      if (response.success) {
        this.clearCache() // Clear cache after bulk creation
        console.log('✅ UserService: Bulk user creation completed')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to perform bulk creation:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to create users in bulk. Please try again.',
      }
    }
  }

  // STATISTICS AND OPTIONS

  async getUserStats(options: RequestOptions = {}): Promise<StandardizedApiResponse<{ stats: UserStats }>> {
    try {
      const { forceRefresh = false } = options
      const cacheKey = this.getCacheKey('user-stats')

      if (!forceRefresh) {
        const cached = this.getFromCache<{ stats: UserStats }>(cacheKey)
        if (cached) {
          console.log('📊 UserService: Stats retrieved from cache')
          return {
            success: true,
            status: 200,
            message: 'User statistics retrieved from cache',
            data: cached,
          }
        }
      }

      console.log('🔄 UserService: Fetching user statistics')
      
      const response = await this.apiClient.get<{ stats: UserStats }>('/admin/users/stats')
      
      if (response.success && response.data) {
        this.setCache(cacheKey, response.data)
        console.log('✅ UserService: User statistics fetched successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to fetch user statistics:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to fetch user statistics. Please try again.',
      }
    }
  }

  async getOptions(): Promise<StandardizedApiResponse<{
    roles: Record<string, string>
    statuses: Record<string, string>
  }>> {
    try {
      console.log('🔄 UserService: Fetching user options')
      
      const response = await this.apiClient.get('/admin/users/options')
      
      if (response.success) {
        console.log('✅ UserService: User options fetched successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to fetch user options:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to fetch user options. Please try again.',
      }
    }
  }

  // EXPORT AND IMPORT

  async exportUsers(params: UserListParams = {}): Promise<StandardizedApiResponse<{ users: User[] }>> {
    try {
      console.log('🔄 UserService: Exporting users')
      
      const searchParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
      
      const queryString = searchParams.toString()
      const endpoint = queryString ? `/admin/users/export?${queryString}` : '/admin/users/export'
      
      const response = await this.apiClient.get<{ users: User[] }>(endpoint)
      
      if (response.success) {
        console.log('✅ UserService: Users exported successfully')
      }
      
      return response
    } catch (error: any) {
      console.error('❌ UserService: Failed to export users:', error)
      return {
        success: false,
        status: 0,
        message: error.message || 'Failed to export users. Please try again.',
      }
    }
  }

  // UTILITY METHODS

  formatUserName(user: User): string {
    return user.name || 'Unknown User'
  }

  getUserInitials(user: User): string {
    const nameParts = (user.name || '').split(' ')
    return nameParts
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  getRoleDisplayName(role: string): string {
    const roleMap: Record<string, string> = {
      student: 'Student',
      counselor: 'Counselor',
      advisor: 'Advisor',
      admin: 'Administrator',
    }
    return roleMap[role] || role
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      inactive: 'bg-amber-100 text-amber-800 border-amber-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  getRoleColor(role: string): string {
    const colorMap: Record<string, string> = {
      student: 'bg-blue-100 text-blue-800 border-blue-200',
      counselor: 'bg-rose-100 text-rose-800 border-rose-200',
      advisor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      admin: 'bg-violet-100 text-violet-800 border-violet-200',
    }
    return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never'
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return { valid: errors.length === 0, errors }
  }

  // CSV Processing Utilities
  generateCSVTemplate(): string {
    const headers = ['name', 'email', 'role', 'status', 'phone', 'student_id', 'employee_id']
    const sampleData = [
      'John Doe,john.doe@university.edu,student,active,+1234567890,STU001,',
      'Jane Smith,jane.smith@university.edu,counselor,active,+1234567891,,EMP001',
    ]
    
    return [headers.join(','), ...sampleData].join('\n')
  }

  downloadCSVTemplate(): void {
    const csvContent = this.generateCSVTemplate()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = 'user-import-template.csv'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    console.log('✅ UserService: CSV template downloaded')
  }

  parseCSVFile(file: File): Promise<Array<Record<string, string>>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string
          const lines = csv.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain at least a header row and one data row'))
            return
          }
          
          const headers = lines[0].split(',').map(header => header.trim().toLowerCase())
          const data: Array<Record<string, string>> = []
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim())
            if (values.length === headers.length) {
              const row: Record<string, string> = {}
              headers.forEach((header, index) => {
                row[header] = values[index]
              })
              data.push(row)
            }
          }
          
          resolve(data)
        } catch (error) {
          reject(new Error('Failed to parse CSV file'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'))
      }
      
      reader.readAsText(file)
    })
  }

  // Cache and Performance
  getCacheStats(): { cacheSize: number; totalItems: number } {
    return {
      cacheSize: this.cache.size,
      totalItems: this.cache.size,
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  // Permissions and Validation
  canManageUsers(userRole?: string): boolean {
    return userRole === 'admin'
  }

  canEditUser(currentUserRole?: string, targetUserRole?: string): boolean {
    if (currentUserRole !== 'admin') return false
    
    // Additional logic can be added here for role hierarchy
    return true
  }

  canDeleteUser(currentUserRole?: string, targetUserRole?: string): boolean {
    if (currentUserRole !== 'admin') return false
    
    // Prevent deleting other admins (can be customized)
    if (targetUserRole === 'admin') return false
    
    return true
  }

  validateUserData(data: Partial<CreateUserRequest>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push('Name is required')
    }

    if (!data.email?.trim()) {
      errors.push('Email is required')
    } else if (!this.validateEmail(data.email)) {
      errors.push('Please enter a valid email address')
    }

    if (!data.role) {
      errors.push('Role is required')
    } else if (!['student', 'counselor', 'advisor', 'admin'].includes(data.role)) {
      errors.push('Invalid role selected')
    }

    if (data.password) {
      const passwordValidation = this.validatePassword(data.password)
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors)
      }
    }

    return { valid: errors.length === 0, errors }
  }
}

// Export singleton instance
export const userService = new UserService()
export default userService