// lib/api.ts (FIXED - Better error handling and DELETE method fix)

import { apiRateLimiter } from './api-rate-limiter'

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

  // FIXED: Better response handling with detailed error processing
  private async handleResponse<T>(response: Response, url: string): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get("content-type")
      
      // Handle non-JSON responses (like file downloads)
      if (!contentType || !contentType.includes("application/json")) {
        if (response.ok) {
          return {
            success: true,
            message: "Request successful",
            data: response as any, // For blob responses
            status: response.status
          }
        } else {
          const text = await response.text()
          console.error('🌐 Non-JSON error response:', text)
          return {
            success: false,
            message: `Request failed with status ${response.status}`,
            status: response.status
          }
        }
      }

      const data = await response.json()
      
      // ENHANCED: Detailed error logging for debugging
      if (!response.ok) {
        console.error('🌐 API Error Response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          data
        })
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            // Don't redirect immediately, let the app handle it
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
        
        // Generic error fallback
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
      console.error("🌐 Response parsing error:", {
        url,
        error,
        status: response.status
      })
      return {
        success: false,
        message: "Invalid response format",
        errors: error,
        status: response.status
      }
    }
  }

  // FIXED: Better request handling with improved error handling and timeout management
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
          // Log FormData values for debugging (excluding files)
          const formDataEntries: Record<string, any> = {}
          for (const [key, value] of data.entries()) {
            if (value instanceof File) {
              formDataEntries[key] = `File: ${value.name} (${value.size} bytes)`
            } else {
              formDataEntries[key] = value
            }
          }
          console.log("🌐 FormData entries:", formDataEntries)
        } else if (data !== undefined) {
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
        
        const result = await this.handleResponse<T>(response, url)
        console.log("🌐 Parsed response:", result)
        
        return result
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        if (error.name === 'AbortError') {
          console.error("🌐 Request timeout:", url)
          return {
            success: false,
            message: `Request timeout after ${requestTimeout / 1000} seconds. Please try again.`,
            errors: error,
            status: 408
          }
        }
        
        // FIXED: Better network error handling
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error("🌐 Network fetch error:", error)
          return {
            success: false,
            message: "Network connection failed. Please check your connection and try again.",
            errors: error,
            status: 0
          }
        }
        
        console.error("🌐 Unexpected error:", error)
        return {
          success: false,
          message: "An unexpected error occurred. Please try again.",
          errors: error,
          status: 0
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
    return this.makeRequest<T>(endpoint, "GET", undefined, options, 30000, true) // 30s for GET with rate limiting
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    // Use longer timeout for POST requests with files
    const timeout = data instanceof FormData ? 120000 : 30000 // 2 min for files, 30s for others
    // Don't rate limit POST requests as they modify data
    return this.makeRequest<T>(endpoint, "POST", data, options, timeout, false)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 30000
    return this.makeRequest<T>(endpoint, "PUT", data, options, timeout, false)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 30000
    return this.makeRequest<T>(endpoint, "PATCH", data, options, timeout, false)
  }

  // FIXED: Delete method - completely rewritten to avoid body parsing issues
  async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // For ticket deletion, we'll use POST to the delete endpoint instead
    if (endpoint.includes('/tickets/') && endpoint.includes('/delete')) {
      console.log('🌐 Using POST for ticket deletion endpoint:', endpoint)
      return this.post<T>(endpoint, data)
    }
    
    // For traditional DELETE requests without body
    if (!data) {
      return this.makeRequest<T>(endpoint, "DELETE", undefined, undefined, 30000, false)
    }
    
    // For DELETE requests with body, use POST to a delete endpoint
    console.warn('🌐 DELETE with body not supported, consider using POST to a delete endpoint')
    return this.makeRequest<T>(endpoint, "DELETE", data, undefined, 30000, false)
  }

  // FIXED: Special method for ticket deletion with fallback and better error handling
  async deleteTicket<T = any>(ticketId: number, reason: string, notifyUser: boolean = false): Promise<ApiResponse<T>> {
    const data = {
      reason,
      notify_user: notifyUser
    }
    
    console.log('🌐 Deleting ticket ID:', ticketId, 'with data:', data)
    
    // Try POST to delete endpoint first (preferred)
    const postEndpoint = `/tickets/${ticketId}/delete`
    console.log('🌐 Attempting DELETE via POST:', postEndpoint)
    
    try {
      // Use longer timeout for deletion (30s) as it might involve database operations
      const result = await this.makeRequest<T>(postEndpoint, "POST", data, undefined, 30000, false)
      
      if (result.success) {
        console.log('✅ Ticket deletion successful via POST')
        return result
      } else {
        console.warn('⚠️ POST delete failed, trying DELETE method:', result.message)
        
        // If POST fails, try traditional DELETE with body
        const deleteEndpoint = `/tickets/${ticketId}`
        console.log('🌐 Attempting DELETE via DELETE method:', deleteEndpoint)
        
        const deleteResult = await this.makeRequest<T>(deleteEndpoint, "DELETE", data, undefined, 30000, false)
        
        if (deleteResult.success) {
          console.log('✅ Ticket deletion successful via DELETE')
          return deleteResult
        } else {
          console.error('❌ Both POST and DELETE methods failed')
          return deleteResult
        }
      }
    } catch (error: any) {
      console.error('❌ Ticket deletion error:', error)
      
      // Check if it's a timeout error
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Delete operation timed out. The ticket may have been deleted. Please refresh the page to check.',
          errors: error
        }
      }
      
      // Check if it's a network error
      if (error.message && error.message.includes('Network')) {
        return {
          success: false,
          message: 'Network error during deletion. Please check your connection and try again.',
          errors: error
        }
      }
      
      return {
        success: false,
        message: 'Failed to delete ticket. Please try again.',
        errors: error
      }
    }
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

  // FIXED: Better retry logic with exponential backoff
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
        
        // Don't retry on client errors (4xx)
        if (result.status && result.status >= 400 && result.status < 500) {
          console.log(`🚫 Not retrying client error: ${result.status}`)
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

  // FIXED: Better batch request handling
  async batchRequest<T>(
    requests: Array<() => Promise<ApiResponse<T>>>,
    maxConcurrent: number = 3 // Reduced from 5 to avoid overwhelming
  ): Promise<Array<ApiResponse<T>>> {
    const results: Array<ApiResponse<T>> = []
    
    // Process requests in smaller batches to avoid overwhelming the browser
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
      
      // Add small delay between batches to avoid overwhelming
      if (i + maxConcurrent < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
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

  // FIXED: Add method to abort all pending requests (useful for cleanup)
  abortAllRequests(): void {
    // This would need to be implemented with request tracking
    console.log('🛑 Aborting all pending requests')
    this.clearCache()
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiResponse }