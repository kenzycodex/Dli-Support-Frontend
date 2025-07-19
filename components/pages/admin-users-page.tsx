// components/pages/admin-users-page.tsx - UPDATED with Zustand Store & Enhanced Features

"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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

// UPDATED: Using Zustand store instead of hooks
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

// ENHANCED: User Card component for mobile view
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(user.id)}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{user.display_name}</div>
              <div className="text-sm text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-2">
            <Badge variant="outline" className={userService.getRoleColor(user.role)}>
              {getRoleIcon(user.role)}
              <span className="ml-1 capitalize">{user.role}</span>
            </Badge>
            <Badge variant="outline" className={userService.getStatusColor(user.status)}>
              {user.status === "active" && <UserCheck className="h-3 w-3 mr-1" />}
              {user.status !== "active" && <UserX className="h-3 w-3 mr-1" />}
              <span className="capitalize">{user.status}</span>
            </Badge>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          <div>Last login: {userService.formatDate(user.last_login_at)}</div>
          <div>Created: {userService.formatDate(user.created_at)}</div>
        </div>

        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onToggleStatus(user)}
            disabled={isLoading}
            className="flex-1"
          >
            {user.status === "active" ? (
              <UserX className="h-3 w-3 mr-1 text-orange-600" />
            ) : (
              <UserCheck className="h-3 w-3 mr-1 text-green-600" />
            )}
            {user.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(user)}
            disabled={isLoading}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onResetPassword(user)}
            disabled={isLoading}
          >
            <Key className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(user)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ENHANCED: Bulk Action Bar
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
      <Card className="shadow-2xl border-violet-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-700">
              {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('activate')}
                disabled={isLoading}
                className="hover:bg-green-50 hover:border-green-200"
              >
                <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('deactivate')}
                disabled={isLoading}
                className="hover:bg-orange-50 hover:border-orange-200"
              >
                <UserX className="h-4 w-4 mr-1 text-orange-600" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('suspend')}
                disabled={isLoading}
                className="hover:bg-yellow-50 hover:border-yellow-200"
              >
                <AlertTriangle className="h-4 w-4 mr-1 text-yellow-600" />
                Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('delete')}
                disabled={isLoading}
                className="hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
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
  
  // UPDATED: Using Zustand store selectors
  const { 
    users, 
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
    setPage
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
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [bulkActionType, setBulkActionType] = useState('')
  const [bulkActionReason, setBulkActionReason] = useState('')
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs for responsive design
  const [isMobile, setIsMobile] = useState(false)

  // ENHANCED: Initialize data - single call like resources page
  useEffect(() => {
    if (!currentUser || isInitialized) return

    const initializeData = async () => {
      try {
        console.log('👥 AdminUsersPage: Initializing data...')
        
        await Promise.all([
          fetchUsers({ per_page: 25 }),
          fetchUserStats()
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

  // ENHANCED: Search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm, page: 1 }, true)
      }
    }, 500)

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

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters({ [key]: value, page: 1 }, true)
  }, [setFilters])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    clearFilters(true)
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

  const handleDeleteUser = useCallback(async (user: UserItem) => {
    if (!confirm(`Are you sure you want to delete ${user.display_name}?`)) return

    try {
      await deleteUser(user.id)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }, [deleteUser])

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
    setShowBulkActionDialog(true)
  }, [])

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkActionType || selectedUsersArray.length === 0) return

    try {
      const userIds = selectedUsersArray.map(u => u.id)
      await bulkAction(bulkActionType, userIds, bulkActionReason)
      
      setShowBulkActionDialog(false)
      setBulkActionType('')
      setBulkActionReason('')
      clearSelection()
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
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
    fetchUsers()
  }, [fetchUsers])

  const handleUserUpdated = useCallback(() => {
    setShowEditUserModal(false)
    setSelectedUser(null)
    fetchUsers()
  }, [fetchUsers])

  const handlePasswordReset = useCallback(() => {
    setShowResetPasswordModal(false)
    setSelectedUser(null)
  }, [])

  const handleBulkCreateComplete = useCallback(() => {
    setShowBulkCreateModal(false)
    fetchUsers()
  }, [fetchUsers])

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

  // Loading state for initial load
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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-xl sm:rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Users className="h-16 w-16 sm:h-24 sm:w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
                <p className="text-violet-100 text-sm sm:text-lg">Manage users, roles, and permissions</p>
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
                Bulk Import
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
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">{userStats.total_users}</div>
              <div className="text-xs sm:text-sm text-violet-100">Total Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">{userStats.active_users}</div>
              <div className="text-xs sm:text-sm text-violet-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">{userStats.students}</div>
              <div className="text-xs sm:text-sm text-violet-100">Students</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm border border-white/10">
              <div className="text-xl sm:text-2xl font-bold">{userStats.counselors + userStats.advisors}</div>
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

      {/* Filters and Search */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 h-10 sm:h-12 border-slate-200 focus:border-violet-400 focus:ring-violet-400 text-sm sm:text-base"
                disabled={loading.users}
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)} disabled={loading.users}>
                <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12 border-slate-200 focus:border-violet-400">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
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
                <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12 border-slate-200 focus:border-violet-400">
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
                <SelectTrigger className="w-full sm:w-48 h-10 sm:h-12 border-slate-200 focus:border-violet-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="last_login_at">Last Login</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2 sm:ml-auto">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearFilters} size="sm" className="h-10 sm:h-12">
                    <X className="h-4 w-4 mr-1 sm:mr-2" />
                    Clear
                  </Button>
                )}
                
                <Button 
                  className="h-10 sm:h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  onClick={() => setShowAddUserModal(true)}
                  disabled={loading.users}
                >
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  Add User
                </Button>
              </div>
            </div>
            
            {/* View Mode & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg w-fit">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none text-xs sm:text-sm"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-l-none text-xs sm:text-sm"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Cards
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  disabled={loading.export || loading.users}
                  className="text-xs sm:text-sm"
                >
                  {loading.export ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => userService.downloadCSVTemplate()}
                  className="text-xs sm:text-sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Content */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-lg sm:text-xl">Users ({pagination.total})</span>
              {selectedUsersArray.length > 0 && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-800">
                  {selectedUsersArray.length} selected
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {pageInfo}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading.users ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-violet-600 mb-4" />
              <span className="text-base sm:text-lg text-gray-600">Loading users...</span>
              <span className="text-xs sm:text-sm text-gray-500 mt-2">This may take a moment</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
              <span className="text-base sm:text-lg text-gray-600 mb-2">No users found</span>
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
            // Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 sm:p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsersArray.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="text-left p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base">User</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base">Role</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base">Status</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base hidden sm:table-cell">Last Login</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base hidden lg:table-cell">Created</th>
                    <th className="text-right p-3 sm:p-4 font-medium text-slate-700 text-sm sm:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: UserItem) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3 sm:p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsersArray.some(u => u.id === user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                            {user.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate text-sm sm:text-base">{user.display_name}</div>
                            <div className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <Badge variant="outline" className={`${userService.getRoleColor(user.role)} text-xs sm:text-sm`}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </td>
                      <td className="p-3 sm:p-4">
                        <Badge variant="outline" className={`${userService.getStatusColor(user.status)} text-xs sm:text-sm`}>
                          {user.status === "active" && <UserCheck className="h-3 w-3 mr-1" />}
                          {user.status !== "active" && <UserX className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{user.status}</span>
                        </Badge>
                      </td>
                      <td className="p-3 sm:p-4 text-slate-600 text-xs sm:text-sm hidden sm:table-cell">
                        {userService.formatDate(user.last_login_at)}
                      </td>
                      <td className="p-3 sm:p-4 text-slate-600 text-xs sm:text-sm hidden lg:table-cell">
                        {userService.formatDate(user.created_at)}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200 h-8 w-8 p-0"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === "active" ? "Deactivate user" : "Activate user"}
                            disabled={loading.toggleStatus}
                          >
                            {user.status === "active" ? (
                              <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                            ) : (
                              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200 h-8 w-8 p-0"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-yellow-50 hover:border-yellow-200 h-8 w-8 p-0"
                            onClick={() => handleResetPassword(user)}
                            title="Reset password"
                          >
                            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-200 h-8 w-8 p-0"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete user"
                            disabled={loading.delete}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Cards View
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <EnhancedPagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setFilters({ per_page: newPerPage, page: 1 }, true)
              }}
              isLoading={loading.users}
              showPerPageSelector={true}
              showResultsInfo={true}
              perPageOptions={[10, 15, 25, 50]}
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

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Confirm Bulk Action</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to <strong>{bulkActionType}</strong> {selectedUsersArray.length} user{selectedUsersArray.length > 1 ? 's' : ''}?
            </p>
            
            {bulkActionType === 'delete' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  This action cannot be undone. All user data will be permanently deleted.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reason (optional)
              </label>
              <Textarea
                placeholder="Enter a reason for this action..."
                value={bulkActionReason}
                onChange={(e) => setBulkActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkActionDialog(false)
                setBulkActionType('')
                setBulkActionReason('')
              }}
              disabled={loading.bulkAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBulkAction}
              disabled={loading.bulkAction}
              className={cn(
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
                `Confirm ${bulkActionType}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}