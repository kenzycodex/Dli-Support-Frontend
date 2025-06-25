// components/pages/admin-users-page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  MoreHorizontal,
  UserCheck,
  UserX,
  Crown,
  Heart,
  Loader2,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useDebounce } from "@/hooks/use-debounce"
import { AddUserModal } from "@/components/features/add-user-modal"
import { userService, UserListParams } from "@/services/user.service"
import { User } from "@/services/auth.service"

interface AdminUsersPageProps {
  onNavigate?: (page: string) => void
}

export function AdminUsersPage({ onNavigate }: AdminUsersPageProps) {
  console.log("🚀 AdminUsersPage: Component rendered")
  
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [exporting, setExporting] = useState(false)

  // Custom hooks
  const {
    users,
    userStats,
    pagination,
    loading,
    error,
    fetchUsers,
    deleteUser,
    toggleUserStatus,
    refreshUsers,
    clearError,
  } = useUsers()

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Effect for search and filters
  useEffect(() => {
    console.log("🔄 AdminUsersPage: Filters changed", {
      search: debouncedSearchTerm,
      role: roleFilter,
      status: statusFilter
    })

    const params: UserListParams = {
      page: 1,
      per_page: pagination.per_page || 15,
    }

    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim()
    }
    if (roleFilter !== 'all') {
      params.role = roleFilter
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter
    }

    fetchUsers(params)
  }, [debouncedSearchTerm, roleFilter, statusFilter, fetchUsers, pagination.per_page])

  // Handlers
  const handlePageChange = (page: number) => {
    console.log("📄 AdminUsersPage: Page change to:", page)
    
    const params: UserListParams = {
      page,
      per_page: pagination.per_page || 15,
    }

    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim()
    }
    if (roleFilter !== 'all') {
      params.role = roleFilter
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter
    }

    fetchUsers(params)
  }

  const handleExport = async () => {
    console.log("📤 AdminUsersPage: Starting export")
    setExporting(true)
    
    try {
      const params: UserListParams = {}
      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim()
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      console.log("📤 AdminUsersPage: Export params:", params)
      const response = await userService.exportUsers(params)
      console.log("📥 AdminUsersPage: Export response:", response)
      
      if (response.success && response.data) {
        const csvContent = convertToCSV(response.data.users)
        downloadCSV(csvContent, `users-export-${new Date().toISOString().split('T')[0]}.csv`)
        console.log("✅ AdminUsersPage: Export completed successfully")
      } else {
        console.log("❌ AdminUsersPage: Export failed:", response.message)
      }
    } catch (err) {
      console.error("💥 AdminUsersPage: Export error:", err)
    } finally {
      setExporting(false)
    }
  }

  const convertToCSV = (users: User[]): string => {
    console.log("📊 AdminUsersPage: Converting users to CSV:", users.length, "users")
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Last Login', 'Created At']
    const rows = users.map((user: User) => [
      user.id.toString(),
      `"${user.name}"`, // Wrap in quotes to handle commas in names
      user.email,
      user.role,
      user.status,
      user.phone || '',
      user.last_login_at || 'Never',
      user.created_at
    ])
    
    const csvContent = [headers, ...rows]
      .map((row: string[]) => row.join(','))
      .join('\n')
      
    console.log("📊 AdminUsersPage: CSV conversion complete")
    return csvContent
  }

  const downloadCSV = (content: string, filename: string) => {
    console.log("⬇️ AdminUsersPage: Downloading CSV:", filename)
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
    console.log("✅ AdminUsersPage: CSV download initiated")
  }

  const handleUserAdded = () => {
    console.log("👤 AdminUsersPage: User added successfully, refreshing list")
    refreshUsers()
    setShowAddUserModal(false)
  }

  const handleSelectUser = (userId: number) => {
    console.log("☑️ AdminUsersPage: Toggling user selection:", userId)
    
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
      
      console.log("☑️ AdminUsersPage: New selection:", newSelection)
      return newSelection
    })
  }

  const handleSelectAll = () => {
    console.log("☑️ AdminUsersPage: Toggle select all")
    
    if (selectedUsers.length === users.length && users.length > 0) {
      console.log("☑️ AdminUsersPage: Deselecting all users")
      setSelectedUsers([])
    } else {
      const allUserIds = users.map((user: User) => user.id)
      console.log("☑️ AdminUsersPage: Selecting all users:", allUserIds)
      setSelectedUsers(allUserIds)
    }
  }

  const handleClearError = () => {
    console.log("🧹 AdminUsersPage: Clearing error")
    clearError()
  }

  // Helper functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <Users className="h-4 w-4 text-blue-600" />
      case "counselor":
        return <Heart className="h-4 w-4 text-rose-600" />
      case "advisor":
        return <Shield className="h-4 w-4 text-emerald-600" />
      case "admin":
        return <Crown className="h-4 w-4 text-violet-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "counselor":
        return "bg-rose-100 text-rose-800 border-rose-200"
      case "advisor":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "admin":
        return "bg-violet-100 text-violet-800 border-violet-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "inactive":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Invalid date"
    }
  }

  const handleSearchChange = (value: string) => {
    console.log("🔍 AdminUsersPage: Search term changed:", value)
    setSearchTerm(value)
  }

  const handleRoleFilterChange = (value: string) => {
    console.log("🏷️ AdminUsersPage: Role filter changed:", value)
    setRoleFilter(value)
    setSelectedUsers([]) // Clear selection when filter changes
  }

  const handleStatusFilterChange = (value: string) => {
    console.log("📊 AdminUsersPage: Status filter changed:", value)
    setStatusFilter(value)
    setSelectedUsers([]) // Clear selection when filter changes
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Users className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-violet-100 text-lg">Manage users, roles, and permissions</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">{userStats.total_users || 0}</div>
              <div className="text-sm text-violet-100">Total Users</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">{userStats.active_users || 0}</div>
              <div className="text-sm text-violet-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">{userStats.students || 0}</div>
              <div className="text-sm text-violet-100">Students</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">{userStats.counselors || 0}</div>
              <div className="text-sm text-violet-100">Counselors</div>
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
              onClick={handleClearError}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-12 h-12 border-slate-200 focus:border-violet-400 focus:ring-violet-400"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={handleRoleFilterChange} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-slate-200 focus:border-violet-400">
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
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-slate-200 focus:border-violet-400">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              className="h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              onClick={() => {
                console.log("➕ AdminUsersPage: Opening add user modal")
                setShowAddUserModal(true)
              }}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Users ({pagination.total || 0})</span>
              {selectedUsers.length > 0 && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-800">
                  {selectedUsers.length} selected
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                disabled={exporting || loading}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log("🔄 AdminUsersPage: Manual refresh triggered")
                  refreshUsers()
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
              <span className="text-lg text-gray-600">Loading users...</span>
              <span className="text-sm text-gray-500 mt-2">This may take a moment</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Users className="h-16 w-16 text-gray-300 mb-4" />
              <span className="text-lg text-gray-600 mb-2">No users found</span>
              <span className="text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? "Try adjusting your filters or search term"
                  : "Get started by adding your first user"
                }
              </span>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                <Button 
                  className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">User</th>
                    <th className="text-left p-4 font-medium text-slate-700">Role</th>
                    <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    <th className="text-left p-4 font-medium text-slate-700">Last Login</th>
                    <th className="text-left p-4 font-medium text-slate-700">Created</th>
                    <th className="text-right p-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {user.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate">{user.name}</div>
                            <div className="text-sm text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status === "active" && <UserCheck className="h-3 w-3 mr-1" />}
                          {user.status === "inactive" && <UserX className="h-3 w-3 mr-1" />}
                          {user.status === "suspended" && <UserX className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{user.status}</span>
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{formatDate(user.last_login_at)}</td>
                      <td className="p-4 text-slate-600 text-sm">{formatDate(user.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => {
                              console.log("🔄 AdminUsersPage: Toggling status for user:", user.id)
                              toggleUserStatus(user.id)
                            }}
                            title={user.status === "active" ? "Deactivate user" : "Activate user"}
                          >
                            {user.status === "active" ? (
                              <UserX className="h-4 w-4 text-orange-600" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-blue-50 hover:border-blue-200"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-200"
                            onClick={() => {
                              console.log("🗑️ AdminUsersPage: Deleting user:", user.id)
                              deleteUser(user.id)
                            }}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            {pagination.total} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.current_page === 1 || loading}
            >
              First
            </Button>
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
                    className={pageNum === pagination.current_page ? "bg-violet-600 hover:bg-violet-700" : ""}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.last_page)}
              disabled={pagination.current_page === pagination.last_page || loading}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-2xl border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-slate-700">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("✅ AdminUsersPage: Bulk activate users:", selectedUsers)
                      // TODO: Implement bulk activate
                    }}
                    className="hover:bg-green-50 hover:border-green-200"
                  >
                    <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("⏸️ AdminUsersPage: Bulk deactivate users:", selectedUsers)
                      // TODO: Implement bulk deactivate
                    }}
                    className="hover:bg-orange-50 hover:border-orange-200"
                  >
                    <UserX className="h-4 w-4 mr-1 text-orange-600" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("🗑️ AdminUsersPage: Bulk delete users:", selectedUsers)
                      if (confirm(`Are you sure you want to delete ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}?`)) {
                        // TODO: Implement bulk delete
                      }
                    }}
                    className="hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("❌ AdminUsersPage: Clearing selection")
                      setSelectedUsers([])
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        open={showAddUserModal}
        onClose={() => {
          console.log("🚪 AdminUsersPage: Closing add user modal")
          setShowAddUserModal(false)
        }}
        onUserAdded={handleUserAdded}
      />
    </div>
  )
}