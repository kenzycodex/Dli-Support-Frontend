// services/auth.service.ts
import { apiClient, ApiResponse } from '@/lib/api'

export interface User {
  id: number
  name: string
  email: string
  role: "student" | "counselor" | "advisor" | "admin"
  status: "active" | "inactive" | "suspended"
  last_login_at: string
  created_at: string
  phone?: string
  profile_photo?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface DemoLoginRequest {
  role: "student" | "counselor" | "advisor" | "admin"
}

export interface LoginResponse {
  user: User
  token: string
  token_type: string
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.storeAuthData(response.data)
    }
    
    return response
  }

  async demoLogin(request: DemoLoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/auth/demo-login', request)
    
    if (response.success && response.data) {
      this.storeAuthData(response.data)
    }
    
    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    this.clearAuthData()
    return response
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>('/auth/user')
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; token_type: string }>> {
    const response = await apiClient.post<{ token: string; token_type: string }>('/auth/refresh')
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token)
    }
    
    return response
  }

  private storeAuthData(data: LoginResponse): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken()
  }
}

export const authService = new AuthService()