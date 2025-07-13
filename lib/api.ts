// lib/api.ts - Simplified API Client without rate limiting

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any
  status?: number
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number = 60000 // 60 seconds default

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

  private async handleResponse<T>(response: Response, url: string): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get("content-type")
      
      // Handle non-JSON responses (like file downloads)
      if (!contentType || !contentType.includes("application/json")) {
        if (response.ok) {
          return {
            success: true,
            message: "Request successful",
            data: response as any,
            status: response.status
          }
        } else {
          const text = await response.text()
          return {
            success: false,
            message: `Request failed with status ${response.status}`,
            status: response.status
          }
        }
      }

      const data = await response.json()
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
          }
          
          return {
            success: false,
            message: data?.message || 'Session expired. Please log in again.',
            status: 401,
            errors: data?.errors
          }
        }
        
        if (response.status === 403) {
          return {
            success: false,
            message: data?.message || 'You do not have permission to perform this action.',
            status: 403,
            errors: data?.errors
          }
        }
        
        if (response.status === 404) {
          return {
            success: false,
            message: data?.message || 'The requested resource was not found.',
            status: 404,
            errors: data?.errors
          }
        }
        
        if (response.status === 422) {
          return {
            success: false,
            message: data?.message || 'Validation failed',
            errors: data?.errors,
            status: 422
          }
        }
        
        if (response.status >= 500) {
          return {
            success: false,
            message: data?.message || 'Server error occurred. Please try again later.',
            status: response.status,
            errors: data?.errors
          }
        }
        
        return {
          success: false,
          message: data?.message || `Request failed with status ${response.status}`,
          status: response.status,
          errors: data?.errors
        }
      }
      
      // Handle cases where backend doesn't return success field
      if (data.success === undefined) {
        return {
          success: response.ok,
          message: response.ok ? "Request successful" : data.message || `HTTP ${response.status}`,
          data: response.ok ? data : undefined,
          errors: response.ok ? undefined : data,
          status: response.status
        }
      }
      
      return {
        ...data,
        status: response.status
      }
    } catch (error) {
      return {
        success: false,
        message: "Invalid response format",
        errors: error,
        status: response.status
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
      } else if (data !== undefined) {
        body = JSON.stringify(data)
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      return await this.handleResponse<T>(response, url)
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `Request timeout after ${requestTimeout / 1000} seconds. Please try again.`,
          errors: error,
          status: 408
        }
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          message: "Network connection failed. Please check your connection and try again.",
          errors: error,
          status: 0
        }
      }
      
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
        errors: error,
        status: 0
      }
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, options, 30000)
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    // Use longer timeout for POST requests with files
    const timeout = data instanceof FormData ? 120000 : 50000
    return this.makeRequest<T>(endpoint, "POST", data, options, timeout)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 50000
    return this.makeRequest<T>(endpoint, "PUT", data, options, timeout)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 50000
    return this.makeRequest<T>(endpoint, "PATCH", data, options, timeout)
  }

  async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Standard DELETE request
    return this.makeRequest<T>(endpoint, "DELETE", data, undefined, 50000)
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

  // Retry logic with exponential backoff
  async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>, 
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T> | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await requestFn()
        
        if (result.success) {
          return result
        }
        
        lastError = result
        
        // Don't retry on client errors (4xx)
        if (result.status && result.status >= 400 && result.status < 500) {
          break
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      } catch (error) {
        lastError = {
          success: false,
          message: "Network error occurred",
          errors: error
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      }
    }
    
    return lastError || {
      success: false,
      message: "Max retries exceeded"
    }
  }

  // Helper method to check if we're online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  // Batch request handling
  async batchRequest<T>(
    requests: Array<() => Promise<ApiResponse<T>>>,
    maxConcurrent: number = 3
  ): Promise<Array<ApiResponse<T>>> {
    const results: Array<ApiResponse<T>> = []
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(async (requestFn, index) => {
        try {
          return await requestFn()
        } catch (error) {
          return {
            success: false,
            message: "Batch request failed",
            errors: error
          }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            message: "Promise rejected",
            errors: result.reason
          })
        }
      })
      
      // Small delay between batches
      if (i + maxConcurrent < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  // Upload with progress tracking
  async uploadWithProgress<T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers = this.getAuthHeaders()
    delete headers['Content-Type'] // Let browser set boundary for FormData
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            onProgress(progress)
          }
        })
      }
      
      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
              const [key, value] = line.split(': ')
              if (key && value) headers[key] = value
              return headers
            }, {} as Record<string, string>))
          })
          
          const result = await this.handleResponse<T>(response, url)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })
      
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })
      
      xhr.open('POST', url)
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value)
        }
      })
      
      xhr.timeout = 300000 // 5 minutes for large file uploads
      xhr.send(formData)
    })
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }