// components/pages/admin-users-page.tsx - FINAL: Local filtering & Mobile responsive

"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Heart,
  Loader2,
  RefreshCw,
  Download,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Key,
  Mail,
  Settings,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'
import { EnhancedPagination } from "@/components/common/enhanced-pagination"

// UPDATED: Using enhanced store with local filtering
import {
  useUserSelectors,
  useUserActions,
  useUserLoading,
  useUserErrors,
  useUserFilters,
  type UserItem,
} from "@/stores/user-store"

import { userService } from "@/services/user.service"

// Components
import { AddUserModal } from "@/components/features/add-user-modal"
import { EditUserModal } from "@/components/features/edit-user-modal"
import { BulkCreateModal } from "@/components/features/bulk-create-modal"
import { ResetPasswordModal } from "@/components/features/reset-password-modal"

interface AdminUsersPageProps {
  onNavigate?: (page: string) => void
}

// User Card component for mobile view
function UserCard({ 
  user, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onResetPassword,
  onSelect,
  isSelected,
  isLoading 
}: {
  user: UserItem
  onEdit: (user: UserItem) => void
  onDelete: (user: UserItem) => void
  onToggleStatus: (user: UserItem) => void
  onResetPassword: (user: UserItem) => void
  onSelect: (userId: number) => void
  isSelected: boolean
  isLoading: boolean
}) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student": return <Users className="h-4 w-4 text-blue-600" />
      case "counselor": return <Heart className="h-4 w-4 text-rose-600" />
      case "advisor": return <Shield className="h-4 w-4 text-emerald-600" />
      case "admin": return <Crown className="h-4 w-4 text-violet-600" />
      default: return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(user.id)}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 flex-shrink-0"
              />
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0">
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate text-sm sm:text-base">{user.display_name}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${userService.getRoleColor(user.role)} text-xs`}>
              {getRoleIcon(user.role)}
              <span className="ml-1 capitalize">{user.role}</span>
            </Badge>
            <Badge variant="outline" className={`${userService.getStatusColor(user.status)} text-xs`}>
              {user.status === "active" && <UserCheck className="h-3 w-3 mr-1" />}
              {user.status !== "active" && <UserX className="h-3 w-3 mr-1" />}
              <span className="capitalize">{user.status}</span>
            </Badge>
          </div>

          {/* Metadata - Compact for mobile */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Last login:</span>
              <span>{userService.formatDate(user.last_login_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{userService.formatDate(user.created_at)}</span>
            </div>
          </div>

          {/* Actions - Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleStatus(user)}
              disabled={isLoading}
              className="text-xs h-8"
            >
              {user.status === "active" ? (
                <>
                  <UserX className="h-3 w-3 mr-1 text-orange-600" />
                  <span className="hidden sm:inline">Deactivate</span>
                  <span className="sm:hidden">Deact</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3 w-3 mr-1 text-green-600" />
                  <span className="hidden sm:inline">Activate</span>
                  <span className="sm:hidden">Act</span>
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(user)}
              disabled={isLoading}
              className="text-xs h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onResetPassword(user)}
              disabled={isLoading}
              className="text-xs h-8"
            >
              <Key className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(user)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 text-xs h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Bulk Action Bar
function BulkActionBar({ 
  selectedCount, 
  onAction, 
  onClear, 
  isLoading 
}: {
  selectedCount: number
  onAction: (action: string) => void
  onClear: () => void
  isLoading: boolean
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="shadow-2xl border-violet-200 bg-white mx-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-medium text-slate-700 text-center sm:text-left">
              {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('activate')}
                disabled={isLoading}
                className="hover:bg-green-50 hover:border-green-200 text-xs h-8"
              >
                <UserCheck className="h-3 w-3 mr-1 text-green-600" />
                <span className="hidden sm:inline">Activate</span>
                <span className="sm:hidden">Act</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('deactivate')}
                disabled={isLoading}
                className="hover:bg-orange-50 hover:border-orange-200 text-xs h-8"
              >
                <UserX className="h-3 w-3 mr-1 text-orange-600" />
                <span className="hidden sm:inline">Deactivate</span>
                <span className="sm:hidden">Deact</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('suspend')}
                disabled={isLoading}
                className="hover:bg-yellow-50 hover:border-yellow-200 text-xs h-8"
              >
                <AlertTriangle className="h-3 w-3 mr-1 text-yellow-600" />
                Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('delete')}
                disabled={isLoading}
                className="hover:bg-red-50 hover:border-red-200 text-xs h-8"
              >
                <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
                className="text-xs h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  const { user: currentUser } = useAuth()
  
  // UPDATED: Using enhanced store with local filtering
  const { 
    users, 
    allUsers,
    userStats, 
    pagination,
    selectedUsersArray,
    hasNextPage,
    hasPrevPage,
    pageInfo
  } = useUserSelectors()
  
  const { 
    fetchUsers, 
    fetchUserStats,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    bulkAction,
    bulkCreate,
    exportUsers,
    selectUser,
    deselectUser,
    selectAllUsers,
    clearSelection,
    refreshAll,
    applyFilters
  } = useUserActions()
  
  const loading = useUserLoading()
  const errors = useUserErrors()
  const { filters, setFilters, clearFilters, hasActiveFilters } = useUserFilters()

  // Local state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [bulkActionType, setBulkActionType] = useState('')
  const [bulkActionReason, setBulkActionReason] = useState('')
  
  // UPDATED: Local search state for immediate feedback
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [isInitialized, setIsInitialized] = useState(false)

  // Responsive detection
  const [isMobile, setIsMobile] = useState(false)

  // UPDATED: Smart initialization like resources store
  useEffect(() => {
    if (!currentUser || isInitialized) return

    const initializeData = async () => {
      try {
        console.log('👥 AdminUsersPage: Initializing data...')
        
        // Single API call to fetch all users for local filtering
        await Promise.all([
          fetchUsers({ per_page: 1000 }, true), // Force fresh fetch with high limit
          fetchUserStats(true)
        ])
        
        setIsInitialized(true)
        console.log('✅ AdminUsersPage: Data initialized successfully')
      } catch (error) {
        console.error('❌ AdminUsersPage: Initialization failed:', error)
      }
    }

    initializeData()
  }, [currentUser, isInitialized, fetchUsers, fetchUserStats])

  // Responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // UPDATED: Immediate search with local filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm, page: 1 }, true) // Auto-apply local filters
      }
    }, 300) // Faster response for local filtering

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters.search, setFilters])

  // Handlers
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 AdminUsersPage: Manual refresh triggered')
      await refreshAll()
      toast.success('Users refreshed successfully')
    } catch (error) {
      console.error('❌ AdminUsersPage: Refresh failed:', error)
      toast.error('Failed to refresh users')
    }
  }, [refreshAll])

  // UPDATED: Instant filter changes with local filtering
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters({ [key]: value, page: 1 }, true) // Auto-apply
  }, [setFilters])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    clearFilters(true) // Auto-apply
  }, [clearFilters])

  const handleSelectAll = useCallback(() => {
    if (selectedUsersArray.length === users.length && users.length > 0) {
      clearSelection()
    } else {
      selectAllUsers()
    }
  }, [selectedUsersArray.length, users.length, clearSelection, selectAllUsers])

  const handleUserSelect = useCallback((userId: number) => {
    if (selectedUsersArray.some(u => u.id === userId)) {
      deselectUser(userId)
    } else {
      selectUser(userId)
    }
  }, [selectedUsersArray, selectUser, deselectUser])

  // User operations
  const handleEditUser = useCallback((user: UserItem) => {
    setSelectedUser(user)
    setShowEditUserModal(true)
  }, [])

  const handleDeleteUser = useCallback((user: UserItem) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete) return

    try {
      await deleteUser(userToDelete.id)
      setShowDeleteDialog(false)
      setUserToDelete(null)
      toast.success(`User ${userToDelete.display_name} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    }
  }, [userToDelete, deleteUser])

  const handleToggleStatus = useCallback(async (user: UserItem) => {
    try {
      await toggleUserStatus(user.id)
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }, [toggleUserStatus])

  const handleResetPassword = useCallback((user: UserItem) => {
    setSelectedUser(user)
    setShowResetPasswordModal(true)
  }, [])

  // Bulk operations
  const handleBulkAction = useCallback((action: string) => {
    setBulkActionType(action)
    setBulkActionReason('')
    setShowBulkActionDialog(true)
  }, [])

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkActionType || selectedUsersArray.length === 0) return

    if (bulkActionType === 'delete' && !bulkActionReason.trim()) {
      toast.error('Please provide a reason for bulk deletion')
      return
    }

    try {
      const userIds = selectedUsersArray.map(u => u.id)
      await bulkAction(bulkActionType, userIds, bulkActionReason.trim() || undefined)
      
      setShowBulkActionDialog(false)
      setBulkActionType('')
      setBulkActionReason('')
      clearSelection()
      
      toast.success(`Bulk ${bulkActionType} completed successfully`)
    } catch (error: any) {
      console.error('Failed to perform bulk action:', error)
      toast.error(error.message || 'Failed to perform bulk action')
    }
  }, [bulkActionType, selectedUsersArray, bulkActionReason, bulkAction, clearSelection])

  // Export
  const handleExport = useCallback(async () => {
    try {
      await exportUsers(filters)
    } catch (error) {
      console.error('Failed to export users:', error)
    }
  }, [exportUsers, filters])

  // Modal handlers
  const handleUserAdded = useCallback(() => {
    setShowAddUserModal(false)
    // No need to fetchUsers, store handles it automatically
  }, [])

  const handleUserUpdated = useCallback(() => {
    setShowEditUserModal(false)
    setSelectedUser(null)
    // No need to fetchUsers, store handles it automatically
  }, [])

  const handlePasswordReset = useCallback(() => {
    setShowResetPasswordModal(false)
    setSelectedUser(null)
  }, [])

  const handleBulkCreateComplete = useCallback(() => {
    setShowBulkCreateModal(false)
    // Store handles refresh automatically
  }, [])

  // UPDATED: Page change handler for local pagination
  const handlePageChange = useCallback((page: number) => {
    setFilters({ page }, true) // Auto-apply local filters
  }, [setFilters])

  const handlePerPageChange = useCallback((perPage: number) => {
    setFilters({ per_page: perPage, page: 1 }, true) // Auto-apply local filters
  }, [setFilters])

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student": return <Users className="h-4 w-4 text-blue-600" />
      case "counselor": return <Heart className="h-4 w-4 text-rose-600" />
      case "advisor": return <Shield className="h-4 w-4 text-emerald-600" />
      case "admin": return <Crown className="h-4 w-4 text-violet-600" />
      default: return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  // Loading state for initial load only
  if (!isInitialized && (loading.users || loading.stats)) {
    return (
      <div className="space-y-6 p-4 sm:p-0">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-6 sm:p-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/30 rounded"></div>
              </div>
              <div>
                <div className="h-6 sm:h-8 w-32 sm:w-48 bg-white/30 rounded mb-2"></div>
                <div className="h-4 sm:h-5 w-48 sm:w-64 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-xl sm:rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">User Management</h1>
                <p className="text-violet-100 text-xs sm:text-sm lg:text-base">
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkCreateModal(true)}
                className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading.users}
                className="text-white hover:bg-white/20"
              >
                {loading.users ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{userStats.total_users}</div>
              <div className="text-xs sm:text-sm text-violet-100">Total Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{userStats.active_users}</div>
              <div className="text-xs sm:text-sm text-violet-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{userStats.students}</div>
              <div className="text-xs sm:text-sm text-violet-100">Students</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{userStats.counselors + userStats.advisors}</div>
              <div className="text-xs sm:text-sm text-violet-100">Staff</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {(errors.users || errors.stats) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>{errors.users || errors.stats}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Clear all errors
                Object.keys(errors).forEach(key => {
                  if (errors[key as keyof typeof errors]) {
                    // Clear error logic would go here
                  }
                })
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* UPDATED: Highly responsive filters section */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-12 h-9 sm:h-10 lg:h-12 border-slate-200 focus:border-violet-400 focus:ring-violet-400 text-sm sm:text-base"
                disabled={loading.users}
              />
            </div>
            
            {/* UPDATED: Mobile-first responsive filters */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
              <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)} disabled={loading.users}>
                <SelectTrigger className="h-9 sm:h-10 lg:h-12 border-slate-200 focus:border-violet-400">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Filter by role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="counselor">Counselors</SelectItem>
                  <SelectItem value="advisor">Advisors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)} disabled={loading.users}>
                <SelectTrigger className="h-9 sm:h-10 lg:h-12 border-slate-200 focus:border-violet-400">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sort_by || 'created_at'} onValueChange={(value) => handleFilterChange('sort_by', value)} disabled={loading.users}>
                <SelectTrigger className="h-9 sm:h-10 lg:h-12 border-slate-200 focus:border-violet-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="last_login_at">Last Login</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Action buttons - Mobile responsive */}
              <div className="flex space-x-2">
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters} 
                    size="sm" 
                    className="h-9 sm:h-10 lg:h-12 flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-1 sm:mr-2" />
                    Clear
                  </Button>
                )}
                
                <Button 
                  className="h-9 sm:h-10 lg:h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 flex-1 sm:flex-none"
                  onClick={() => setShowAddUserModal(true)}
                  disabled={loading.users}
                >
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
            
            {/* View Mode & Additional Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg w-fit">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-l-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Cards
                </Button>
              </div>
              
              {/* Export & Template buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  disabled={loading.export || loading.users}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                >
                  {loading.export ? (
                    <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  )}
                  Export
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => userService.downloadCSVTemplate()}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1 sm:mr-2" />
                  Template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Content */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-base sm:text-lg lg:text-xl">
                Users ({pagination.total})
              </span>
              {selectedUsersArray.length > 0 && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-800 text-xs sm:text-sm">
                  {selectedUsersArray.length} selected
                </Badge>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {pageInfo}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading.users && !users.length ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-violet-600 mb-4" />
              <span className="text-sm sm:text-base lg:text-lg text-gray-600">Loading users...</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-2">This may take a moment</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
              <span className="text-sm sm:text-base lg:text-lg text-gray-600 mb-2">No users found</span>
              <span className="text-xs sm:text-sm text-gray-500 text-center">
                {hasActiveFilters 
                  ? "Try adjusting your filters or search term"
                  : "Get started by adding your first user"
                }
              </span>
              {!hasActiveFilters && (
                <Button 
                  className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            // UPDATED: Responsive table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-2 sm:p-3 lg:p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsersArray.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base">User</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base">Role</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base">Status</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base hidden md:table-cell">Last Login</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base hidden lg:table-cell">Created</th>
                    <th className="text-right p-2 sm:p-3 lg:p-4 font-medium text-slate-700 text-xs sm:text-sm lg:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: UserItem) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-2 sm:p-3 lg:p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsersArray.some(u => u.id === user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                            {user.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate text-xs sm:text-sm lg:text-base">{user.display_name}</div>
                            <div className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <Badge variant="outline" className={`${userService.getRoleColor(user.role)} text-xs`}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <Badge variant="outline" className={`${userService.getStatusColor(user.status)} text-xs`}>
                          {user.status === "active" && <UserCheck className="h-3 w-3 mr-1" />}
                          {user.status !== "active" && <UserX className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{user.status}</span>
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 text-slate-600 text-xs sm:text-sm hidden md:table-cell">
                        {userService.formatDate(user.last_login_at)}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 text-slate-600 text-xs sm:text-sm hidden lg:table-cell">
                        {userService.formatDate(user.created_at)}
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === "active" ? "Deactivate user" : "Activate user"}
                            disabled={loading.toggleStatus}
                          >
                            {user.status === "active" ? (
                              <UserX className="h-3 w-3 text-orange-600" />
                            ) : (
                              <UserCheck className="h-3 w-3 text-green-600" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-yellow-50 hover:border-yellow-200 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleResetPassword(user)}
                            title="Reset password"
                          >
                            <Key className="h-3 w-3 text-yellow-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-200 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete user"
                            disabled={loading.delete}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Cards View - Mobile optimized
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {users.map((user: UserItem) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleStatus}
                    onResetPassword={handleResetPassword}
                    onSelect={handleUserSelect}
                    isSelected={selectedUsersArray.some(u => u.id === user.id)}
                    isLoading={loading.toggleStatus || loading.delete}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* UPDATED: Responsive Pagination */}
      {pagination.last_page > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <EnhancedPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              isLoading={loading.users}
              showPerPageSelector={true}
              showResultsInfo={true}
              perPageOptions={[10, 25, 50, 100]}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedUsersArray.length}
        onAction={handleBulkAction}
        onClear={clearSelection}
        isLoading={loading.bulkAction}
      />

      {/* Modals */}
      <AddUserModal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={handleUserAdded}
      />

      {selectedUser && (
        <EditUserModal
          open={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <BulkCreateModal
        open={showBulkCreateModal}
        onClose={() => setShowBulkCreateModal(false)}
        onComplete={handleBulkCreateComplete}
      />

      {selectedUser && (
        <ResetPasswordModal
          open={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onPasswordReset={handlePasswordReset}
        />
      )}

      {/* ENHANCED: Custom Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Confirm User Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {userToDelete?.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-red-900 truncate">{userToDelete?.display_name}</div>
                  <div className="text-sm text-red-700 truncate">{userToDelete?.email}</div>
                  <Badge variant="outline" className={userToDelete ? userService.getRoleColor(userToDelete.role) : ''}>
                    {userToDelete?.role}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <ul className="text-xs text-gray-600 space-y-1 pl-4">
                <li>• All user data will be permanently removed</li>
                <li>• User sessions will be terminated</li>
                <li>• Associated records may be affected</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setUserToDelete(null)
              }}
              disabled={loading.delete}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={loading.delete}
              className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
            >
              {loading.delete ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ENHANCED: Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <DialogContent className="sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Confirm Bulk Action</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900 font-medium mb-2">
                Action: <span className="capitalize font-bold">{bulkActionType}</span>
              </div>
              <div className="text-sm text-blue-800">
                <strong>{selectedUsersArray.length}</strong> user{selectedUsersArray.length > 1 ? 's' : ''} selected
              </div>
              <div className="mt-2 text-xs text-blue-700">
                {selectedUsersArray.slice(0, 3).map(u => u.display_name).join(', ')}
                {selectedUsersArray.length > 3 && ` and ${selectedUsersArray.length - 3} more`}
              </div>
            </div>
            
            {bulkActionType === 'delete' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. All selected user data will be permanently deleted.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="bulk-reason" className="text-sm font-medium text-gray-700">
                Reason {bulkActionType === 'delete' ? '(required)' : '(optional)'}
              </Label>
              <Textarea
                id="bulk-reason"
                placeholder={`Enter a reason for this ${bulkActionType} action...`}
                value={bulkActionReason}
                onChange={(e) => setBulkActionReason(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              {bulkActionType === 'delete' && !bulkActionReason.trim() && (
                <p className="text-xs text-red-600">A reason is required for bulk deletion</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkActionDialog(false)
                setBulkActionType('')
                setBulkActionReason('')
              }}
              disabled={loading.bulkAction}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBulkAction}
              disabled={loading.bulkAction || (bulkActionType === 'delete' && !bulkActionReason.trim())}
              className={cn(
                "flex-1 sm:flex-none",
                bulkActionType === 'delete' 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-violet-600 hover:bg-violet-700"
              )}
            >
              {loading.bulkAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {bulkActionType === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                  {bulkActionType === 'activate' && <UserCheck className="h-4 w-4 mr-2" />}
                  {bulkActionType === 'deactivate' && <UserX className="h-4 w-4 mr-2" />}
                  {bulkActionType === 'suspend' && <AlertTriangle className="h-4 w-4 mr-2" />}
                  Confirm {bulkActionType}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}