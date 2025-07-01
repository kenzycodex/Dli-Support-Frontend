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
    try {
      const response = await apiClient.post('/auth/logout')
      return response
    } catch (error) {
      console.error('Logout API error:', error)
      return { success: true, message: 'Logged out locally' }
    } finally {
      this.clearAuthData()
    }
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
    localStorage.setItem('auth_timestamp', Date.now().toString())
  }

  clearAuthData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_timestamp')
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
    const token = this.getStoredToken()
    const user = this.getStoredUser()
    const timestamp = localStorage.getItem('auth_timestamp')
    
    if (!token || !user || !timestamp) return false
    
    // Check if token is older than 24 hours (optional)
    const tokenAge = Date.now() - parseInt(timestamp)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (tokenAge > maxAge) {
      this.clearAuthData()
      return false
    }
    
    return true
  }

  // Method to check if token needs refresh
  shouldRefreshToken(): boolean {
    const timestamp = localStorage.getItem('auth_timestamp')
    if (!timestamp) return false
    
    const tokenAge = Date.now() - parseInt(timestamp)
    const refreshThreshold = 23 * 60 * 60 * 1000 // 23 hours
    
    return tokenAge > refreshThreshold
  }
}

export const authService = new AuthService()