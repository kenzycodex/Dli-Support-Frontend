// components/features/notification-center.tsx (Updated to use backend)
"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, MessageSquare, AlertTriangle, CheckCircle, Clock, X, Settings, Loader2 } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationData } from "@/services/notification.service"

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotifications()

  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Fetch notifications when component opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  const handleMarkAsRead = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const handleMarkAsUnread = (notification: NotificationData) => {
    if (notification.read) {
      markAsUnread(notification.id)
    }
  }

  const handleDelete = (notificationId: number) => {
    deleteNotification(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "ticket":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "system":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "reminder":
        return <Clock className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-amber-200 bg-amber-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="hover:bg-blue-50"
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="hover:bg-gray-50">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-800">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="text-red-600">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="all" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading notifications...</span>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          notification.read 
                            ? "bg-gray-50 border-gray-200" 
                            : `bg-white ${getPriorityColor(notification.priority)}`
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4
                                  className={`text-sm font-medium ${
                                    notification.read ? "text-gray-700" : "text-gray-900"
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">
                                    High
                                  </Badge>
                                )}
                              </div>
                              <p
                                className={`text-sm ${
                                  notification.read ? "text-gray-500" : "text-gray-700"
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimestamp(notification.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification)}
                                className="hover:bg-green-50"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsUnread(notification)}
                                className="hover:bg-blue-50"
                                title="Mark as unread"
                              >
                                <Bell className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="hover:bg-red-50"
                              title="Delete notification"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No notifications</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading notifications...</span>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3">
                  {unreadNotifications.length > 0 ? (
                    unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg bg-white ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-xs">
                                    High
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimestamp(notification.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification)}
                              className="hover:bg-green-50"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              className="hover:bg-red-50"
                              title="Delete notification"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No unread notifications</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}