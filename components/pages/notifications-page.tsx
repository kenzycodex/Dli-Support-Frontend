// components/pages/notifications-page.tsx (Updated with backend integration)
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Bell, 
  Check, 
  X, 
  Search,
  Filter,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trash2,
  Settings,
  Archive,
} from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useDebounce } from "@/hooks/use-debounce"
import { NotificationData } from "@/services/notification.service"

export function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    pagination,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkAction,
    clearError,
    refreshNotifications,
  } = useNotifications()

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [currentTab, setCurrentTab] = useState("all")

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Fetch notifications when filters change
  useEffect(() => {
    const params = {
      page: 1,
      per_page: 20,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(typeFilter !== 'all' && { type: typeFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(currentTab !== 'all' && { read_status: currentTab as "read" | "unread" }),
    }
    fetchNotifications(params)
  }, [debouncedSearchTerm, typeFilter, priorityFilter, currentTab, fetchNotifications])

  const handlePageChange = (page: number) => {
    const params = {
      page,
      per_page: 20,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(typeFilter !== 'all' && { type: typeFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(currentTab !== 'all' && { read_status: currentTab as "read" | "unread" }),
    }
    fetchNotifications(params)
  }

  const handleSelectNotification = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n.id))
    }
  }

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.length > 0) {
      await bulkAction('read', selectedIds)
      setSelectedIds([])
    }
  }

  const handleBulkMarkAsUnread = async () => {
    if (selectedIds.length > 0) {
      await bulkAction('unread', selectedIds)
      setSelectedIds([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length > 0 && confirm(`Are you sure you want to delete ${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''}?`)) {
      await bulkAction('delete', selectedIds)
      setSelectedIds([])
    }
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

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Bell className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-purple-100 text-lg">Stay updated with your activities</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{unreadCount}</div>
              <div className="text-sm text-purple-100">Unread</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{notifications.length}</div>
              <div className="text-sm text-purple-100">Total</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">
                {notifications.filter(n => n.priority === 'high').length}
              </div>
              <div className="text-sm text-purple-100">High Priority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="reminder">Reminders</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="hover:bg-green-50 hover:border-green-200"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="outline"
                onClick={refreshNotifications}
                disabled={loading}
                className="hover:bg-blue-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">
                {selectedIds.length} notification{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsRead}
                  disabled={loading}
                  className="hover:bg-green-50 hover:border-green-200"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMarkAsUnread}
                  disabled={loading}
                  className="hover:bg-amber-50 hover:border-amber-200"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Mark Unread
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="hover:bg-red-50 hover:border-red-200 text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={loading}
                  />
                  <span>All Notifications</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                  <span className="text-lg text-gray-600">Loading notifications...</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.read ? 'opacity-75' : ''
                      } ${notification.priority === 'high' ? getPriorityColor(notification.priority) : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          disabled={loading}
                        />
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  High Priority
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.read ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="hover:bg-green-50 text-green-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsUnread(notification.id)}
                              className="hover:bg-blue-50 text-blue-600"
                              title="Mark as unread"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="hover:bg-red-50 text-red-600"
                            title="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">
                    {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all'
                      ? "Try adjusting your filters"
                      : "You're all caught up!"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} notifications
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1 || loading}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    let pageNum: number
                    const totalPages = pagination.last_page
                    const currentPage = pagination.current_page

                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.current_page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={pageNum === pagination.current_page ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
              <CardTitle>Unread Notifications ({unreadCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {unreadNotifications.length > 0 ? (
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.priority === 'high' ? getPriorityColor(notification.priority) : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          disabled={loading}
                        />
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
                                  High Priority
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="hover:bg-green-50 text-green-600"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="hover:bg-red-50 text-red-600"
                            title="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No unread notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg border-b">
              <CardTitle>Read Notifications ({notifications.length - unreadCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {readNotifications.length > 0 ? (
                <div className="divide-y">
                  {readNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors opacity-75">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          disabled={loading}
                        />
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-700">
                                {notification.title}
                              </h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsUnread(notification.id)}
                            className="hover:bg-blue-50 text-blue-600"
                            title="Mark as unread"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="hover:bg-red-50 text-red-600"
                            title="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No read notifications</h3>
                  <p className="text-gray-500">Read notifications will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}