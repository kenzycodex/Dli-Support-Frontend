// services/user.service.ts
import { apiClient, ApiResponse } from '@/lib/api'
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
}

class UserService {
  async getUsers(params: UserListParams = {}): Promise<ApiResponse<UserListResponse>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users'
    
    return apiClient.get<UserListResponse>(endpoint)
  }

  async getUser(id: number): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>(`/admin/users/${id}`)
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post<{ user: User }>('/admin/users', data)
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/admin/users/${id}`, data)
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    return apiClient.delete(`/admin/users/${id}`)
  }

  async toggleUserStatus(id: number): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post<{ user: User }>(`/admin/users/${id}/toggle-status`)
  }

  async resetPassword(id: number, newPassword: string): Promise<ApiResponse> {
    return apiClient.post(`/admin/users/${id}/reset-password`, {
      new_password: newPassword
    })
  }

  async bulkAction(data: BulkActionRequest): Promise<ApiResponse> {
    return apiClient.post('/admin/users/bulk-action', data)
  }

  async getUserStats(): Promise<ApiResponse<{ stats: UserStats }>> {
    return apiClient.get<{ stats: UserStats }>('/admin/users/stats')
  }

  async getOptions(): Promise<ApiResponse<{
    roles: Record<string, string>
    statuses: Record<string, string>
  }>> {
    return apiClient.get('/admin/users/options')
  }

  async exportUsers(params: UserListParams = {}): Promise<ApiResponse<{ users: User[] }>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/admin/users/export?${queryString}` : '/admin/users/export'
    
    return apiClient.get<{ users: User[] }>(endpoint)
  }
}

export const userService = new UserService()