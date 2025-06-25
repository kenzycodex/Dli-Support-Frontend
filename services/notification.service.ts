// services/notification.service.ts (Fixed with proper types)

import { apiClient, ApiResponse } from '@/lib/api'

export interface NotificationData {
  id: number
  user_id: number
  type: 'appointment' | 'ticket' | 'system' | 'reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
  data?: any
  read_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationListParams {
  page?: number
  per_page?: number
  type?: string
  read_status?: 'all' | 'read' | 'unread' // Fixed: strict typing
  priority?: string
  search?: string // Added search parameter
}

export interface NotificationStats {
  unread: number
  total: number
}

export interface CreateNotificationRequest {
  user_ids: number[]
  type: 'appointment' | 'ticket' | 'system' | 'reminder'
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high'
  data?: any
}

class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(params: NotificationListParams = {}): Promise<ApiResponse<{
    notifications: NotificationData[]
    pagination: any
    counts: NotificationStats
  }>> {
    console.log("📢 NotificationService: Fetching notifications with params:", params)
    
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.type && params.type !== 'all') queryParams.append('type', params.type)
    if (params.read_status && params.read_status !== 'all') queryParams.append('read_status', params.read_status)
    if (params.priority && params.priority !== 'all') queryParams.append('priority', params.priority)
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim())

    const response = await apiClient.get(`/notifications?${queryParams.toString()}`)
    console.log("📢 NotificationService: Notifications response:", response)
    
    return response
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    console.log("📢 NotificationService: Fetching unread count")
    
    const response = await apiClient.get('/notifications/unread-count')
    console.log("📢 NotificationService: Unread count response:", response)
    
    return response
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<ApiResponse<{ notification: NotificationData }>> {
    console.log("📢 NotificationService: Marking notification as read:", notificationId)
    
    const response = await apiClient.patch(`/notifications/${notificationId}/read`) // Now using patch method
    console.log("📢 NotificationService: Mark as read response:", response)
    
    return response
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: number): Promise<ApiResponse<{ notification: NotificationData }>> {
    console.log("📢 NotificationService: Marking notification as unread:", notificationId)
    
    const response = await apiClient.patch(`/notifications/${notificationId}/unread`) // Now using patch method
    console.log("📢 NotificationService: Mark as unread response:", response)
    
    return response
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse> {
    console.log("📢 NotificationService: Marking all notifications as read")
    
    const response = await apiClient.post('/notifications/mark-all-read')
    console.log("📢 NotificationService: Mark all as read response:", response)
    
    return response
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<ApiResponse> {
    console.log("📢 NotificationService: Deleting notification:", notificationId)
    
    const response = await apiClient.delete(`/notifications/${notificationId}`)
    console.log("📢 NotificationService: Delete response:", response)
    
    return response
  }

  /**
   * Bulk actions on notifications
   */
  async bulkAction(action: 'read' | 'unread' | 'delete', notificationIds: number[]): Promise<ApiResponse> {
    console.log("📢 NotificationService: Bulk action:", { action, notificationIds })
    
    const response = await apiClient.post('/notifications/bulk-action', {
      action,
      notification_ids: notificationIds
    })
    console.log("📢 NotificationService: Bulk action response:", response)
    
    return response
  }

  /**
   * Create notification (admin only)
   */
  async createNotification(data: CreateNotificationRequest): Promise<ApiResponse> {
    console.log("📢 NotificationService: Creating notification:", data)
    
    const response = await apiClient.post('/notifications', data)
    console.log("📢 NotificationService: Create response:", response)
    
    return response
  }

  /**
   * Get notification options
   */
  async getOptions(): Promise<ApiResponse<{
    types: Record<string, string>
    priorities: Record<string, string>
  }>> {
    console.log("📢 NotificationService: Fetching options")
    
    const response = await apiClient.get('/notifications/options')
    console.log("📢 NotificationService: Options response:", response)
    
    return response
  }

  /**
   * Get notification statistics (admin only)
   */
  async getStats(): Promise<ApiResponse<{ stats: any }>> {
    console.log("📢 NotificationService: Fetching stats")
    
    const response = await apiClient.get('/notifications/stats')
    console.log("📢 NotificationService: Stats response:", response)
    
    return response
  }
}

export const notificationService = new NotificationService()