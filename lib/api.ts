// lib/api.ts (Fixed with PATCH method)

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("auth_token")
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken()
    const headers = { ...this.defaultHeaders }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        message: "Invalid response format",
        errors: error
      }
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        ...options,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: error
      }
    }
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    console.log("🌐 ApiClient.post called")
    console.log("🌐 Endpoint:", `${this.baseURL}${endpoint}`)
    console.log("🌐 Headers:", this.getAuthHeaders())
    console.log("🌐 Data:", data)
    
    try {
      const headers = this.getAuthHeaders()
      
      // Handle FormData (for file uploads)
      let body: string | FormData | undefined
      if (data instanceof FormData) {
        body = data
        // Remove Content-Type header for FormData to let browser set it with boundary
        delete headers['Content-Type']
      } else {
        body = data ? JSON.stringify(data) : undefined
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body,
        ...options,
      })
      
      console.log("🌐 Response status:", response.status)
      console.log("🌐 Response headers:", Object.fromEntries(response.headers.entries()))
      
      const result = await this.handleResponse<T>(response)
      console.log("🌐 Parsed response:", result)
      
      return result
    } catch (error) {
      console.error("🌐 ApiClient.post error:", error)
      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: error
      }
    }
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const headers = this.getAuthHeaders()
      
      // Handle FormData (for file uploads)
      let body: string | FormData | undefined
      if (data instanceof FormData) {
        body = data
        // Remove Content-Type header for FormData
        delete headers['Content-Type']
      } else {
        body = data ? JSON.stringify(data) : undefined
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers,
        body,
        ...options,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: error
      }
    }
  }

  // ADD MISSING PATCH METHOD
  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const headers = this.getAuthHeaders()
      
      // Handle FormData (for file uploads)
      let body: string | FormData | undefined
      if (data instanceof FormData) {
        body = data
        // Remove Content-Type header for FormData
        delete headers['Content-Type']
      } else {
        body = data ? JSON.stringify(data) : undefined
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PATCH",
        headers,
        body,
        ...options,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: error
      }
    }
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        ...options,
      })
      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        errors: error
      }
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }