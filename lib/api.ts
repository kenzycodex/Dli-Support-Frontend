// lib/api.ts (UPDATED with enhanced timeout, error handling, and rate limiting)

import { apiRateLimiter } from './api-rate-limiter'

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
    timeout?: number,
    useRateLimit: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const requestTimeout = timeout || this.defaultTimeout
    
    // Generate rate limiting key
    const rateLimitKey = apiRateLimiter.generateKey(method, endpoint, data)
    
    const makeActualRequest = async (): Promise<ApiResponse<T>> => {
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

    // Use rate limiting for GET requests and read operations
    if (useRateLimit && (method === 'GET' || endpoint.includes('/health'))) {
      return apiRateLimiter.deduplicateRequest(rateLimitKey, makeActualRequest, 2000)
    }

    return makeActualRequest()
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, options, 120000, true) // 2 min for GET with rate limiting
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    // Use longer timeout for POST requests with files
    const timeout = data instanceof FormData ? 120000 : 60000 // 2 min for files, 1 min for others
    // Don't rate limit POST requests as they modify data
    return this.makeRequest<T>(endpoint, "POST", data, options, timeout, false)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PUT", data, options, timeout, false)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PATCH", data, options, timeout, false)
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "DELETE", undefined, options, 120000, false)
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

  // Helper method to retry failed requests with enhanced logic
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
          console.log(`✅ Request succeeded on attempt ${attempt}`)
          return result
        }
        
        lastError = result
        
        // Don't retry on validation errors (4xx) or authentication errors
        if (result.message?.includes('Validation') || 
            result.message?.includes('Unauthorized') ||
            result.message?.includes('Forbidden') ||
            result.message?.includes('Not Found')) {
          console.log(`🚫 Not retrying due to client error: ${result.message}`)
          break
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1) // Exponential backoff
          console.log(`🌐 Retrying in ${backoffDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed with error:`, error)
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
    
    console.error(`💥 All ${maxRetries} attempts failed`)
    return lastError || {
      success: false,
      message: "Max retries exceeded"
    }
  }

  // Helper method to clear rate limiter cache (useful for logout)
  clearCache(): void {
    apiRateLimiter.clearPending()
    console.log("🧹 API cache cleared")
  }

  // Helper method to check if we're online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  // Helper method for batch requests with proper error handling
  async batchRequest<T>(
    requests: Array<() => Promise<ApiResponse<T>>>,
    maxConcurrent: number = 5
  ): Promise<Array<ApiResponse<T>>> {
    const results: Array<ApiResponse<T>> = []
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(async (requestFn, index) => {
        try {
          return await requestFn()
        } catch (error) {
          console.error(`Batch request ${i + index} failed:`, error)
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
    }
    
    return results
  }

  // Helper method for uploading files with progress tracking
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
          
          const result = await this.handleResponse<T>(response)
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
        if (key !== 'Content-Type') { // Skip Content-Type for FormData
          xhr.setRequestHeader(key, value)
        }
      })
      
      xhr.timeout = 300000 // 5 minutes for large file uploads
      xhr.send(formData)
    })
  }

  // Helper method to get current request stats
  getRequestStats(): { pending: number; lastRequestTime: number } {
    return {
      pending: apiRateLimiter.getPendingCount(),
      lastRequestTime: apiRateLimiter.getLastRequestTime()
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }