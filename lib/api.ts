// lib/api.ts (UPDATED with enhanced timeout and error handling)

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number = 60000 // 60 seconds for file uploads

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
      const contentType = response.headers.get("content-type")
      
      // Handle non-JSON responses (like file downloads)
      if (!contentType || !contentType.includes("application/json")) {
        if (response.ok) {
          return {
            success: true,
            message: "Request successful",
            data: response as any // For blob responses
          }
        } else {
          return {
            success: false,
            message: `Request failed with status ${response.status}`,
          }
        }
      }

      const data = await response.json()
      
      // Handle cases where backend doesn't return success field
      if (data.success === undefined) {
        return {
          success: response.ok,
          message: response.ok ? "Request successful" : data.message || `HTTP ${response.status}`,
          data: response.ok ? data : undefined,
          errors: response.ok ? undefined : data
        }
      }
      
      return data
    } catch (error) {
      console.error("🌐 Response parsing error:", error)
      return {
        success: false,
        message: "Invalid response format",
        errors: error
      }
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: string, 
    data?: any, 
    options?: RequestInit,
    timeout?: number
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const requestTimeout = timeout || this.defaultTimeout
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`🌐 Request timeout after ${requestTimeout}ms:`, url)
      controller.abort()
    }, requestTimeout)

    try {
      const headers = this.getAuthHeaders()
      
      // Handle FormData (for file uploads)
      let body: string | FormData | undefined
      if (data instanceof FormData) {
        body = data
        // Remove Content-Type header for FormData to let browser set boundary
        delete headers['Content-Type']
        console.log("🌐 FormData detected, removed Content-Type header")
      } else if (data !== undefined) {
        body = JSON.stringify(data)
      }

      console.log(`🌐 ${method} ${url}`)
      console.log("🌐 Headers:", headers)
      if (data instanceof FormData) {
        console.log("🌐 FormData keys:", Array.from(data.keys()))
      } else {
        console.log("🌐 Body:", data)
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      console.log(`🌐 Response status: ${response.status}`)
      console.log("🌐 Response headers:", Object.fromEntries(response.headers.entries()))
      
      const result = await this.handleResponse<T>(response)
      console.log("🌐 Parsed response:", result)
      
      return result
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        console.error("🌐 Request timeout:", url)
        return {
          success: false,
          message: `Request timeout after ${requestTimeout / 1000} seconds. Please try again.`,
          errors: error
        }
      }
      
      console.error("🌐 Network error:", error)
      return {
        success: false,
        message: "Network error. Please check your connection and try again.",
        errors: error
      }
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, options, 120000) // 90s for GET
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    // Use longer timeout for POST requests with files
    const timeout = data instanceof FormData ? 120000 : 60000 // 2 min for files, 1 min for others
    return this.makeRequest<T>(endpoint, "POST", data, options, timeout)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PUT", data, options, timeout)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PATCH", data, options, timeout)
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "DELETE", undefined, options, 120000)
  }

  // Helper method for file downloads
  async downloadFile(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    return response.blob()
  }

  // Helper method for checking connection
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  // Helper method to retry failed requests
  async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>, 
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T> | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Attempt ${attempt}/${maxRetries}`)
        const result = await requestFn()
        
        if (result.success) {
          return result
        }
        
        lastError = result
        
        // Don't retry on validation errors (4xx)
        if (result.message?.includes('Validation') || result.message?.includes('Unauthorized')) {
          break
        }
        
        if (attempt < maxRetries) {
          console.log(`🌐 Retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        }
      } catch (error) {
        lastError = {
          success: false,
          message: "Network error occurred",
          errors: error
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        }
      }
    }
    
    return lastError || {
      success: false,
      message: "Max retries exceeded"
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }