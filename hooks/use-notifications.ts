// hooks/use-notifications.ts (ZERO POLLING VERSION)

import { useState, useCallback } from 'react'
import { notificationService, NotificationData, NotificationListParams } from '@/services/notification.service'

interface NotificationState {
  notifications: NotificationData[]
  loading: boolean
  error: string | null
  unreadCount: number
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  },
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>(initialState)

  /**
   * Fetch notifications - ONLY when explicitly called
   */
  const fetchNotifications = useCallback(async (params: NotificationListParams = {}) => {
    console.log("🔔 Fetching notifications with params:", params)
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await notificationService.getNotifications(params)
      
      if (response.success && response.data) {
        console.log("✅ Notifications fetched successfully")
        setState(prev => ({
          ...prev,
          notifications: response.data!.notifications,
          pagination: response.data!.pagination,
          unreadCount: response.data!.counts.unread,
          loading: false,
          error: null,
        }))
      } else {
        console.error("❌ Failed to fetch notifications:", response.message)
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.message || 'Failed to fetch notifications',
        }))
      }
    } catch (error) {
      console.error("💥 Error fetching notifications:", error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred',
      }))
    }
  }, [])

  /**
   * Fetch unread count - ONLY when explicitly called
   */
  const fetchUnreadCount = useCallback(async () => {
    console.log("🔔 Fetching unread count")
    
    try {
      const response = await notificationService.getUnreadCount()
      
      if (response.success && response.data) {
        console.log("✅ Unread count fetched:", response.data.unread_count)
        setState(prev => ({
          ...prev,
          unreadCount: response.data!.unread_count,
        }))
      }
    } catch (error) {
      console.error("💥 Error fetching unread count:", error)
    }
  }, [])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    console.log("🔔 Marking as read:", notificationId)
    
    try {
      const response = await notificationService.markAsRead(notificationId)
      
      if (response.success) {
        console.log("✅ Marked as read successfully")
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true, read_at: new Date().toISOString() }
              : notification
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }))
      } else {
        console.error("❌ Failed to mark as read:", response.message)
      }
    } catch (error) {
      console.error("💥 Error marking as read:", error)
    }
  }, [])

  /**
   * Mark notification as unread
   */
  const markAsUnread = useCallback(async (notificationId: number) => {
    console.log("🔔 Marking as unread:", notificationId)
    
    try {
      const response = await notificationService.markAsUnread(notificationId)
      
      if (response.success) {
        console.log("✅ Marked as unread successfully")
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: false, read_at: undefined }
              : notification
          ),
          unreadCount: prev.unreadCount + 1,
        }))
      } else {
        console.error("❌ Failed to mark as unread:", response.message)
      }
    } catch (error) {
      console.error("💥 Error marking as unread:", error)
    }
  }, [])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    console.log("🔔 Marking all as read")
    
    try {
      const response = await notificationService.markAllAsRead()
      
      if (response.success) {
        console.log("✅ Marked all as read successfully")
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification => ({
            ...notification,
            read: true,
            read_at: new Date().toISOString(),
          })),
          unreadCount: 0,
        }))
      } else {
        console.error("❌ Failed to mark all as read:", response.message)
      }
    } catch (error) {
      console.error("💥 Error marking all as read:", error)
    }
  }, [])

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: number) => {
    console.log("🔔 Deleting notification:", notificationId)
    
    try {
      const response = await notificationService.deleteNotification(notificationId)
      
      if (response.success) {
        console.log("✅ Notification deleted successfully")
        setState(prev => {
          const deletedNotification = prev.notifications.find(n => n.id === notificationId)
          const wasUnread = deletedNotification && !deletedNotification.read
          
          return {
            ...prev,
            notifications: prev.notifications.filter(notification => notification.id !== notificationId),
            unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
          }
        })
      } else {
        console.error("❌ Failed to delete notification:", response.message)
      }
    } catch (error) {
      console.error("💥 Error deleting notification:", error)
    }
  }, [])

  /**
   * Bulk actions
   */
  const bulkAction = useCallback(async (action: 'read' | 'unread' | 'delete', notificationIds: number[]) => {
    console.log("🔔 Bulk action:", { action, notificationIds })
    
    try {
      const response = await notificationService.bulkAction(action, notificationIds)
      
      if (response.success) {
        console.log("✅ Bulk action completed successfully")
        setState(prev => {
          let newNotifications = [...prev.notifications]
          let newUnreadCount = prev.unreadCount
          
          switch (action) {
            case 'read':
              newNotifications = newNotifications.map(notification =>
                notificationIds.includes(notification.id)
                  ? { ...notification, read: true, read_at: new Date().toISOString() }
                  : notification
              )
              const unreadMarked = prev.notifications.filter(n => 
                notificationIds.includes(n.id) && !n.read
              ).length
              newUnreadCount = Math.max(0, prev.unreadCount - unreadMarked)
              break
              
            case 'unread':
              newNotifications = newNotifications.map(notification =>
                notificationIds.includes(notification.id)
                  ? { ...notification, read: false, read_at: undefined }
                  : notification
              )
              const readMarked = prev.notifications.filter(n => 
                notificationIds.includes(n.id) && n.read
              ).length
              newUnreadCount = prev.unreadCount + readMarked
              break
              
            case 'delete':
              const deletedUnreadCount = prev.notifications.filter(n => 
                notificationIds.includes(n.id) && !n.read
              ).length
              newNotifications = newNotifications.filter(notification => 
                !notificationIds.includes(notification.id)
              )
              newUnreadCount = Math.max(0, prev.unreadCount - deletedUnreadCount)
              break
          }
          
          return {
            ...prev,
            notifications: newNotifications,
            unreadCount: newUnreadCount,
          }
        })
      } else {
        console.error("❌ Failed bulk action:", response.message)
      }
    } catch (error) {
      console.error("💥 Error in bulk action:", error)
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    console.log("🔔 Clearing error")
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Refresh notifications manually
   */
  const refreshNotifications = useCallback(() => {
    console.log("🔔 Manual refresh triggered")
    fetchNotifications()
  }, [fetchNotifications])

  /**
   * Manual refresh for unread count only
   */
  const refreshUnreadCount = useCallback(() => {
    console.log("🔔 Manual unread count refresh")
    fetchUnreadCount()
  }, [fetchUnreadCount])

  return {
    // State
    notifications: state.notifications,
    loading: state.loading,
    error: state.error,
    unreadCount: state.unreadCount,
    pagination: state.pagination,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkAction,
    clearError,
    refreshNotifications,
    refreshUnreadCount,
  }
}