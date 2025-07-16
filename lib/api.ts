// lib/api-client.ts - UPDATED with Enhanced Error Handling & File Downloads

interface StandardizedApiResponse<T = any> {
  success: boolean
  status: number
  message: string
  data?: T
  errors?: Record<string, ValidationError>
  timestamp?: string
  error_count?: number
}

interface ValidationError {
  messages: string[]
  first: string
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number = 60000

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    this.defaultHeaders = {
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
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

  // ENHANCED: Better Laravel standardized response handling with file download support
  private async handleResponse<T>(response: Response, url: string): Promise<StandardizedApiResponse<T>> {
    const contentType = response.headers.get("content-type")
    
    // FIXED: Enhanced file download detection for attachment downloads
    const isFileDownload = (
      contentType && (
        contentType.includes("application/pdf") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/download") ||
        contentType.includes("image/") ||
        contentType.includes("text/csv") ||
        contentType.includes("application/msword") ||
        contentType.includes("application/vnd.")
      )
    ) || response.headers.get("content-disposition")?.includes("attachment")

    // Handle file downloads with proper blob creation
    if (isFileDownload && response.ok) {
      console.log('📁 ApiClient: Processing file download response')
      try {
        const blob = await response.blob()
        return {
          success: true,
          status: response.status,
          message: "File download ready",
          data: blob as any
        }
      } catch (blobError) {
        console.error('❌ Failed to create blob from response:', blobError)
        return {
          success: false,
          status: response.status,
          message: "Failed to process download file"
        }
      }
    }

    // Handle non-JSON responses
    if (!contentType || !contentType.includes("application/json")) {
      if (response.ok) {
        try {
          const text = await response.text()
          return {
            success: true,
            status: response.status,
            message: "Request successful",
            data: text as any
          }
        } catch (textError) {
          console.error('❌ Failed to read text response:', textError)
          return {
            success: false,
            status: response.status,
            message: "Failed to read response"
          }
        }
      } else {
        // FIXED: Handle backend PHP errors gracefully
        try {
          const errorText = await response.text()
          console.error('❌ Backend Error Response:', errorText)
          
          // Check for specific PHP errors
          if (errorText.includes('Cannot modify header information')) {
            return {
              success: false,
              status: response.status,
              message: "Server configuration error. Please try again or contact support."
            }
          } else if (errorText.includes('Fatal error')) {
            return {
              success: false,
              status: response.status,
              message: "Server error occurred. Please try again later."
            }
          }
          
          return {
            success: false,
            status: response.status,
            message: `Request failed with status ${response.status}`
          }
        } catch {
          return {
            success: false,
            status: response.status,
            message: `Request failed with status ${response.status}`
          }
        }
      }
    }

    // Handle JSON responses
    let data: any
    try {
      data = await response.json()
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      
      // FIXED: If JSON parsing fails, try to read as text for better error info
      try {
        const text = await response.text()
        console.error('❌ Raw response text:', text.substring(0, 500))
        
        if (text.includes('Fatal error') || text.includes('Cannot modify header')) {
          return {
            success: false,
            status: response.status,
            message: "Server error detected. Please try again or contact support."
          }
        }
      } catch {
        // Ignore text read errors
      }
      
      return {
        success: false,
        status: response.status,
        message: "Invalid response format from server",
      }
    }

    // ENHANCED: Handle Laravel's standardized response format
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          // Don't auto-redirect - let the app handle it
        }
        
        return {
          success: false,
          status: 401,
          message: data?.message || 'Session expired. Please log in again.',
          errors: data?.errors
        }
      }
      
      // Handle permission errors
      if (response.status === 403) {
        return {
          success: false,
          status: 403,
          message: data?.message || 'You do not have permission to perform this action.',
          errors: data?.errors
        }
      }
      
      // Handle not found errors
      if (response.status === 404) {
        return {
          success: false,
          status: 404,
          message: data?.message || 'The requested resource was not found.',
          errors: data?.errors
        }
      }
      
      // ENHANCED: Handle Laravel validation errors (422) with new format
      if (response.status === 422) {
        console.warn('⚠️ Validation Error:', data?.errors)
        return {
          success: false,
          status: 422,
          message: data?.message || 'Validation failed',
          errors: data?.errors || {},
          error_count: data?.error_count || 0
        }
      }
      
      // Handle server errors with better messaging
      if (response.status >= 500) {
        console.error('🚨 Server Error:', data)
        
        let errorMessage = 'Server error occurred. Please try again later.'
        
        // Provide more specific error messages for common server issues
        if (data?.message) {
          if (data.message.includes('header') || data.message.includes('output')) {
            errorMessage = 'Server configuration issue detected. Please contact support.'
          } else {
            errorMessage = data.message
          }
        }
        
        return {
          success: false,
          status: response.status,
          message: errorMessage,
          errors: data?.errors
        }
      }
      
      // Handle other client errors
      return {
        success: false,
        status: response.status,
        message: data?.message || `Request failed with status ${response.status}`,
        errors: data?.errors
      }
    }
    
    // SUCCESS: Return Laravel's standardized response - handle both old and new formats
    if (data && typeof data === 'object' && 'success' in data) {
      // New standardized format
      return {
        success: data.success !== undefined ? data.success : true,
        status: data.status || response.status,
        message: data.message || "Request successful",
        data: data.data,
        errors: data.errors,
        timestamp: data.timestamp
      }
    } else {
      // Legacy format compatibility
      return {
        success: true,
        status: response.status,
        message: "Request successful",
        data: data,
        timestamp: new Date().toISOString()
      }
    }
  }

  // ENHANCED: Better request handling with improved error resilience
  private async makeRequest<T>(
    endpoint: string, 
    method: string, 
    data?: any, 
    options?: RequestInit,
    timeout?: number
  ): Promise<StandardizedApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const requestTimeout = timeout || this.defaultTimeout
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Request timeout after ${requestTimeout / 1000}s: ${method} ${endpoint}`)
      controller.abort()
    }, requestTimeout)

    try {
      const headers = this.getAuthHeaders()
      
      // Handle different data types properly
      let body: string | FormData | undefined
      
      if (data instanceof FormData) {
        body = data
        // Don't set Content-Type for FormData - let browser set boundary
      } else if (data !== undefined) {
        body = JSON.stringify(data)
        headers['Content-Type'] = 'application/json'
      }

      // Laravel method spoofing support
      if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
        if (data instanceof FormData) {
          data.append('_method', method)
        }
      }

      console.log(`🌐 API Request: ${method} ${endpoint}`, {
        hasAuth: !!this.getAuthToken(),
        dataType: data instanceof FormData ? 'FormData' : typeof data,
        timeout: requestTimeout / 1000 + 's'
      })

      const response = await fetch(url, {
        method: method === 'PUT' || method === 'PATCH' || method === 'DELETE' ? 
          (data instanceof FormData ? 'POST' : method) : method,
        headers,
        body,
        signal: controller.signal,
        credentials: 'include',
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      const result = await this.handleResponse<T>(response, url)
      
      // Log response for debugging
      if (result.success) {
        console.log(`✅ API Success: ${method} ${endpoint}`, {
          status: result.status,
          message: result.message,
          hasData: !!result.data
        })
      } else {
        console.warn(`❌ API Error: ${method} ${endpoint}`, {
          status: result.status,
          message: result.message,
          errors: result.errors
        })
      }
      
      return result
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        console.error(`⏰ Request timeout: ${method} ${endpoint}`)
        return {
          success: false,
          status: 408,
          message: `Request timeout after ${requestTimeout / 1000} seconds. Please try again.`,
        }
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error(`🌐 Network error: ${method} ${endpoint}`, error)
        return {
          success: false,
          status: 0,
          message: "Network connection failed. Please check your connection and try again.",
        }
      }
      
      console.error(`🚨 Unexpected error: ${method} ${endpoint}`, error)
      return {
        success: false,
        status: 0,
        message: "An unexpected error occurred. Please try again.",
      }
    }
  }

  // STANDARD HTTP METHODS - Keep your existing methods

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<StandardizedApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, options, 60000)
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<StandardizedApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "POST", data, options, timeout)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<StandardizedApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PUT", data, options, timeout)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<StandardizedApiResponse<T>> {
    const timeout = data instanceof FormData ? 120000 : 60000
    return this.makeRequest<T>(endpoint, "PATCH", data, options, timeout)
  }

  async delete<T = any>(endpoint: string, data?: any): Promise<StandardizedApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "DELETE", data, undefined, 60000)
  }

  // FIXED: Enhanced file download with better error handling and fallbacks
  async downloadFile(endpoint: string, filename?: string): Promise<Blob> {
    console.log(`📁 Downloading file: ${endpoint}`)
    
    try {
      // First attempt: Use the regular API call
      const response = await this.get(endpoint)
      
      if (!response.success) {
        console.warn(`⚠️ Regular API call failed, trying direct fetch fallback`)
        // Fallback: Direct fetch for problematic backends
        return await this.directDownloadFallback(endpoint, filename)
      }
      
      if (response.data instanceof Blob) {
        const blob = response.data
        
        // Automatically trigger download if in browser
        if (typeof window !== 'undefined' && filename) {
          this.triggerDownload(blob, filename)
        }
        
        return blob
      } else {
        throw new Error('Invalid response format for file download')
      }
    } catch (error: any) {
      console.error(`❌ Download failed: ${endpoint}`, error)
      
      // FIXED: Try fallback method for backend issues
      if (error.message.includes('Server') || error.message.includes('header') || error.message.includes('Fatal')) {
        console.log(`🔄 Attempting download fallback for: ${endpoint}`)
        try {
          return await this.directDownloadFallback(endpoint, filename)
        } catch (fallbackError) {
          console.error(`❌ Fallback download also failed:`, fallbackError)
        }
      }
      
      throw new Error(error.message || 'Download failed')
    }
  }

  // FIXED: Direct download fallback for problematic backends
  private async directDownloadFallback(endpoint: string, filename?: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Accept": "application/octet-stream, application/pdf, image/*, */*",
        },
        credentials: 'include',
      })

      if (!response.ok) {
        let errorMessage = `Download failed: ${response.status} ${response.statusText}`
        
        // Try to get more specific error info
        try {
          const errorText = await response.text()
          if (errorText.includes('permission') || errorText.includes('access')) {
            errorMessage = "You don't have permission to download this file"
          } else if (errorText.includes('not found') || response.status === 404) {
            errorMessage = "File not found or no longer available"
          }
        } catch {
          // Ignore text parsing errors
        }
        
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      
      // Auto-trigger download
      if (typeof window !== 'undefined' && filename) {
        this.triggerDownload(blob, filename)
      }

      console.log(`✅ Fallback download successful: ${filename}`)
      return blob
      
    } catch (error: any) {
      console.error(`❌ Direct download fallback failed:`, error)
      throw new Error(`Download failed: ${error.message}`)
    }
  }

  // FIXED: Improved download trigger with better filename handling
  private triggerDownload(blob: Blob, filename: string): void {
    try {
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.style.display = 'none'
      
      // Add to DOM temporarily
      document.body.appendChild(link)
      link.click()
      
      // Clean up immediately
      document.body.removeChild(link)
      
      // Clean up URL after delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
      }, 1000)
      
      console.log(`✅ Download triggered: ${filename}`)
    } catch (error) {
      console.error(`❌ Failed to trigger download:`, error)
      // Don't throw here - the blob is still returned for manual handling
    }
  }

  // Keep all your existing helper methods unchanged...

  // Helper to format validation errors for display
  formatValidationErrors(errors: Record<string, ValidationError>): string[] {
    const messages: string[] = []
    
    Object.entries(errors).forEach(([field, error]) => {
      if (error.first) {
        messages.push(error.first)
      } else if (error.messages && error.messages.length > 0) {
        messages.push(error.messages[0])
      }
    })
    
    return messages
  }

  // Check if we're online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  // Get current auth status
  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  // Clear auth data
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }

  // Check if API is healthy
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health')
      return response.success
    } catch {
      return false
    }
  }

  // Keep your existing retry, batch, and upload methods unchanged...
  // [All your existing methods from retryRequest through uploadWithProgress]

  async retryRequest<T>(
    requestFn: () => Promise<StandardizedApiResponse<T>>, 
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<StandardizedApiResponse<T>> {
    let lastError: StandardizedApiResponse<T> | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`)
        const result = await requestFn()
        
        if (result.success) {
          if (attempt > 1) {
            console.log(`✅ Retry successful on attempt ${attempt}`)
          }
          return result
        }
        
        lastError = result
        
        // Don't retry on client errors (4xx) except 408 timeout
        if (result.status && result.status >= 400 && result.status < 500 && result.status !== 408) {
          console.log(`❌ Client error ${result.status}, not retrying`)
          break
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1)
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      } catch (error) {
        console.error(`🚨 Retry attempt ${attempt} failed:`, error)
        lastError = {
          success: false,
          status: 0,
          message: "Network error occurred"
        }
        
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        }
      }
    }
    
    console.error(`❌ All retry attempts failed`)
    return lastError || {
      success: false,
      status: 0,
      message: "Max retries exceeded"
    }
  }

  async batchRequest<T>(
    requests: Array<() => Promise<StandardizedApiResponse<T>>>,
    maxConcurrent: number = 3
  ): Promise<Array<StandardizedApiResponse<T>>> {
    const results: Array<StandardizedApiResponse<T>> = []
    
    console.log(`📦 Processing ${requests.length} requests in batches of ${maxConcurrent}`)
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent)
      const batchNumber = Math.floor(i / maxConcurrent) + 1
      const totalBatches = Math.ceil(requests.length / maxConcurrent)
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches}`)
      
      const batchPromises = batch.map(async (requestFn, index) => {
        try {
          return await requestFn()
        } catch (error) {
          console.error(`❌ Batch request ${i + index + 1} failed:`, error)
          return {
            success: false,
            status: 0,
            message: "Batch request failed"
          }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('❌ Promise rejected:', result.reason)
          results.push({
            success: false,
            status: 0,
            message: "Promise rejected"
          })
        }
      })
      
      // Small delay between batches to be nice to the server
      if (i + maxConcurrent < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`✅ Batch completed: ${successCount}/${results.length} successful`)
    
    return results
  }

  async uploadWithProgress<T>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<StandardizedApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers = this.getAuthHeaders()
    delete headers['Content-Type'] // Let browser set boundary for FormData
    
    console.log(`📤 Starting upload to: ${endpoint}`)
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            onProgress(progress)
            console.log(`📤 Upload progress: ${progress}%`)
          }
        })
      }
      
      xhr.addEventListener('load', async () => {
        try {
          let responseData
          
          try {
            responseData = JSON.parse(xhr.response)
          } catch {
            responseData = xhr.response
          }
          
          const result: StandardizedApiResponse<T> = {
            success: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            message: responseData?.message || (xhr.status >= 200 && xhr.status < 300 ? 'Upload successful' : 'Upload failed'),
            data: responseData?.data || responseData,
            errors: responseData?.errors,
            timestamp: responseData?.timestamp || new Date().toISOString()
          }
          
          if (result.success) {
            console.log(`✅ Upload completed successfully`)
          } else {
            console.error(`❌ Upload failed:`, result.message)
          }
          
          resolve(result)
        } catch (error) {
          console.error('❌ Upload response parsing failed:', error)
          reject(new Error('Upload response parsing failed'))
        }
      })
      
      xhr.addEventListener('error', () => {
        console.error('❌ Upload network error')
        reject(new Error('Upload failed due to network error'))
      })
      
      xhr.addEventListener('timeout', () => {
        console.error('❌ Upload timeout')
        reject(new Error('Upload timeout'))
      })
      
      xhr.open('POST', url)
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value)
        }
      })
      
      xhr.timeout = 300000 // 5 minutes for large uploads
      xhr.send(formData)
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export types
export type { StandardizedApiResponse, ValidationError }

// Utility function for handling API responses in components
export function handleApiResponse<T>(
  response: StandardizedApiResponse<T>, 
  onSuccess?: (data: T) => void,
  onError?: (message: string, errors?: Record<string, ValidationError>) => void
): boolean {
  if (response.success && response.data) {
    onSuccess?.(response.data)
    return true
  } else {
    const message = response.message || 'An error occurred'
    onError?.(message, response.errors)
    return false
  }
}

// Utility for displaying validation errors
export function getValidationErrorMessage(
  errors: Record<string, ValidationError> | undefined,
  field: string
): string | undefined {
  if (!errors || !errors[field]) return undefined
  return errors[field].first || errors[field].messages?.[0]
}