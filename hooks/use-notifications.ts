// hooks/use-notifications.ts (Optimized version with smart refresh)

import { useState, useCallback, useEffect, useRef } from 'react'
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

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
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
  })

  // Smart refresh management
  const [isVisible, setIsVisible] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track user activity for smart refresh
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
      setIsVisible(true)
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
      if (!document.hidden) {
        setLastActivity(Date.now())
        // Fetch notifications when tab becomes visible
        fetchUnreadCount()
      }
    }

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Smart refresh logic
  useEffect(() => {
    const startSmartRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const timeSinceActivity = now - lastActivity
        const isRecentActivity = timeSinceActivity < 5 * 60 * 1000 // 5 minutes
        
        // Only refresh if:
        // 1. Tab is visible
        // 2. User was active recently
        // 3. Not currently loading
        if (isVisible && isRecentActivity && !state.loading) {
          console.log("🔔 Smart refresh: Fetching unread count")
          fetchUnreadCount()
        } else {
          console.log("🔔 Smart refresh: Skipping (inactive or hidden)")
        }
      }, 60000) // Check every 60 seconds instead of 30
    }

    startSmartRefresh()

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [isVisible, lastActivity, state.loading])

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (params: NotificationListParams = {}) => {
    console.log("🔔 useNotifications: Fetching notifications with params:", params)
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Type-safe parameter building
      const apiParams: NotificationListParams = {
        page: params.page || 1,
        per_page: params.per_page || 20,
      }

      // Only add optional params if they have valid values
      if (params.type && params.type !== 'all') {
        apiParams.type = params.type
      }
      if (params.read_status && params.read_status !== 'all') {
        apiParams.read_status = params.read_status as 'read' | 'unread'
      }
      if (params.priority && params.priority !== 'all') {
        apiParams.priority = params.priority
      }

      const response = await notificationService.getNotifications(apiParams)
      
      if (response.success && response.data) {
        console.log("✅ useNotifications: Notifications fetched successfully")
        setState(prev => ({
          ...prev,
          notifications: response.data!.notifications,
          pagination: response.data!.pagination,
          unreadCount: response.data!.counts.unread,
          loading: false,
          error: null,
        }))
        
        // Update activity timestamp on successful fetch
        setLastActivity(Date.now())
      } else {
        console.error("❌ useNotifications: Failed to fetch notifications:", response.message)
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.message || 'Failed to fetch notifications',
        }))
      }
    } catch (error) {
      console.error("💥 useNotifications: Error fetching notifications:", error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred',
      }))
    }
  }, [])

  /**
   * Fetch unread count only (lightweight)
   */
  const fetchUnreadCount = useCallback(async () => {
    console.log("🔔 useNotifications: Fetching unread count")
    
    try {
      const response = await notificationService.getUnreadCount()
      
      if (response.success && response.data) {
        console.log("✅ useNotifications: Unread count fetched:", response.data.unread_count)
        setState(prev => ({
          ...prev,
          unreadCount: response.data!.unread_count,
        }))
      }
    } catch (error) {
      console.error("💥 useNotifications: Error fetching unread count:", error)
      // Don't show error for background refresh failures
    }
  }, [])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    console.log("🔔 useNotifications: Marking as read:", notificationId)
    
    try {
      const response = await notificationService.markAsRead(notificationId)
      
      if (response.success) {
        console.log("✅ useNotifications: Marked as read successfully")
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
        console.error("❌ useNotifications: Failed to mark as read:", response.message)
      }
    } catch (error) {
      console.error("💥 useNotifications: Error marking as read:", error)
    }
  }, [])

  /**
   * Mark notification as unread
   */
  const markAsUnread = useCallback(async (notificationId: number) => {
    console.log("🔔 useNotifications: Marking as unread:", notificationId)
    
    try {
      const response = await notificationService.markAsUnread(notificationId)
      
      if (response.success) {
        console.log("✅ useNotifications: Marked as unread successfully")
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
        console.error("❌ useNotifications: Failed to mark as unread:", response.message)
      }
    } catch (error) {
      console.error("💥 useNotifications: Error marking as unread:", error)
    }
  }, [])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    console.log("🔔 useNotifications: Marking all as read")
    
    try {
      const response = await notificationService.markAllAsRead()
      
      if (response.success) {
        console.log("✅ useNotifications: Marked all as read successfully")
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
        console.error("❌ useNotifications: Failed to mark all as read:", response.message)
      }
    } catch (error) {
      console.error("💥 useNotifications: Error marking all as read:", error)
    }
  }, [])

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: number) => {
    console.log("🔔 useNotifications: Deleting notification:", notificationId)
    
    try {
      const response = await notificationService.deleteNotification(notificationId)
      
      if (response.success) {
        console.log("✅ useNotifications: Notification deleted successfully")
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
        console.error("❌ useNotifications: Failed to delete notification:", response.message)
      }
    } catch (error) {
      console.error("💥 useNotifications: Error deleting notification:", error)
    }
  }, [])

  /**
   * Bulk actions
   */
  const bulkAction = useCallback(async (action: 'read' | 'unread' | 'delete', notificationIds: number[]) => {
    console.log("🔔 useNotifications: Bulk action:", { action, notificationIds })
    
    try {
      const response = await notificationService.bulkAction(action, notificationIds)
      
      if (response.success) {
        console.log("✅ useNotifications: Bulk action completed successfully")
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
        console.error("❌ useNotifications: Failed bulk action:", response.message)
      }
    } catch (error) {
      console.error("💥 useNotifications: Error in bulk action:", error)
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    console.log("🔔 useNotifications: Clearing error")
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Refresh notifications manually
   */
  const refreshNotifications = useCallback(() => {
    console.log("🔔 useNotifications: Manual refresh triggered")
    setLastActivity(Date.now()) // Update activity to ensure refresh works
    fetchNotifications()
  }, [fetchNotifications])

  /**
   * Force refresh (for manual user action)
   */
  const forceRefresh = useCallback(() => {
    console.log("🔔 useNotifications: Force refresh")
    setLastActivity(Date.now())
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [])

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
    forceRefresh,
    
    // Smart refresh status
    isVisible,
    lastActivity,
  }
}