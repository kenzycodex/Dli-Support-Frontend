// stores/user-store.ts - Complete Zustand Store for User Management

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { userService, type User, type UserListParams, type UserStats, type CreateUserRequest, type UpdateUserRequest, type BulkActionRequest, type BulkCreateRequest } from '@/services/user.service'
import { toast } from 'sonner'

// Interfaces
export interface UserItem extends User {
  display_name: string
  initials: string
}

export interface UserFilters extends UserListParams {
  // Additional filter options can be added here
}

interface PaginationState {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
  has_more_pages?: boolean
}

// Default values
const defaultPagination: PaginationState = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: 0,
  to: 0,
  has_more_pages: false
}

const defaultFilters: UserFilters = {
  page: 1,
  per_page: 15,
  role: 'all',
  status: 'all',
  sort_by: 'created_at',
  sort_direction: 'desc'
}

const defaultStats: UserStats = {
  total_users: 0,
  active_users: 0,
  inactive_users: 0,
  suspended_users: 0,
  students: 0,
  counselors: 0,
  advisors: 0,
  admins: 0,
  recent_registrations: 0,
  recent_logins: 0,
  never_logged_in: 0,
  this_month_registrations: 0
}

// Store State Interface
interface UserState {
  // Core data
  users: UserItem[]
  currentUser: UserItem | null
  userStats: UserStats
  filters: UserFilters
  
  // Loading states
  loading: {
    users: boolean
    create: boolean
    update: boolean
    delete: boolean
    bulkAction: boolean
    bulkCreate: boolean
    export: boolean
    stats: boolean
    toggleStatus: boolean
    resetPassword: boolean
  }
  
  // Error states
  errors: {
    users: string | null
    create: string | null
    update: string | null
    delete: string | null
    bulkAction: string | null
    bulkCreate: string | null
    export: string | null
    stats: string | null
    toggleStatus: string | null
    resetPassword: string | null
  }
  
  // Pagination
  pagination: PaginationState
  
  // Cache management
  lastFetch: {
    users: number
    stats: number
  }
  
  // UI state
  selectedUsers: Set<number>
  
  // Actions
  actions: {
    // Data fetching
    fetchUsers: (params?: Partial<UserFilters>) => Promise<void>
    fetchUserStats: () => Promise<void>
    refreshAll: () => Promise<void>
    
    // User CRUD
    createUser: (data: CreateUserRequest) => Promise<UserItem | null>
    updateUser: (id: number, data: UpdateUserRequest) => Promise<void>
    deleteUser: (id: number) => Promise<void>
    
    // User operations
    toggleUserStatus: (id: number) => Promise<void>
    resetUserPassword: (id: number, newPassword: string, confirmPassword: string) => Promise<void>
    
    // Bulk operations
    bulkAction: (action: string, userIds: number[], reason?: string) => Promise<void>
    bulkCreate: (data: BulkCreateRequest) => Promise<any>
    
    // Export
    exportUsers: (params?: UserFilters) => Promise<void>
    
    // Filter management
    setFilters: (filters: Partial<UserFilters>, autoFetch?: boolean) => void
    clearFilters: (autoFetch?: boolean) => void
    setPage: (page: number) => void
    
    // UI state
    setCurrentUser: (user: UserItem | null) => void
    selectUser: (id: number) => void
    deselectUser: (id: number) => void
    selectAllUsers: () => void
    clearSelection: () => void
    
    // Error handling
    clearError: (type: keyof UserState['errors']) => void
    setError: (type: keyof UserState['errors'], message: string) => void
    
    // Cache management
    invalidateCache: () => void
    clearCache: () => void
  }
}

// Helper functions
const processUser = (user: User): UserItem => ({
  ...user,
  display_name: user.name || 'Unknown User',
  initials: userService.getUserInitials(user)
})

const generateUsersFromResponse = (users: User[]): UserItem[] => {
  return users.map(processUser)
}

// Zustand Store
export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial state
      users: [],
      currentUser: null,
      userStats: { ...defaultStats },
      filters: { ...defaultFilters },

      loading: {
        users: false,
        create: false,
        update: false,
        delete: false,
        bulkAction: false,
        bulkCreate: false,
        export: false,
        stats: false,
        toggleStatus: false,
        resetPassword: false,
      },

      errors: {
        users: null,
        create: null,
        update: null,
        delete: null,
        bulkAction: null,
        bulkCreate: null,
        export: null,
        stats: null,
        toggleStatus: null,
        resetPassword: null,
      },

      pagination: { ...defaultPagination },

      lastFetch: {
        users: 0,
        stats: 0,
      },

      selectedUsers: new Set<number>(),

      actions: {
        // Data fetching
        fetchUsers: async (params?: Partial<UserFilters>) => {
          const state = get()
          const mergedFilters = params ? { ...state.filters, ...params } : state.filters

          // Prevent rapid calls
          if (Date.now() - state.lastFetch.users < 1000) {
            console.log('🎯 UserStore: Skipping user fetch (too recent)')
            return
          }

          set((state) => ({
            loading: { ...state.loading, users: true },
            errors: { ...state.errors, users: null },
            filters: mergedFilters,
          }))

          try {
            console.log('🎯 UserStore: Fetching users with filters:', mergedFilters)

            const response = await userService.getUsers(mergedFilters)

            if (response.success && response.data) {
              const processedUsers = generateUsersFromResponse(response.data.users || [])

              set(() => ({
                users: processedUsers,
                userStats: response.data!.stats || defaultStats,
                pagination: response.data!.pagination || defaultPagination,
                lastFetch: { ...get().lastFetch, users: Date.now() },
                loading: { ...get().loading, users: false },
              }))

              console.log('✅ UserStore: Users fetched successfully:', processedUsers.length)
            } else {
              throw new Error(response.message || 'Failed to fetch users')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to fetch users:', error)
            set((state) => ({
              loading: { ...state.loading, users: false },
              errors: { ...state.errors, users: error.message || 'Failed to fetch users' },
            }))
          }
        },

        fetchUserStats: async () => {
          const state = get()

          if (Date.now() - state.lastFetch.stats < 5000) {
            return
          }

          set((state) => ({
            loading: { ...state.loading, stats: true },
            errors: { ...state.errors, stats: null },
          }))

          try {
            const response = await userService.getUserStats()

            if (response.success && response.data) {
              set((state) => ({
                userStats: response.data!.stats || defaultStats,
                lastFetch: { ...state.lastFetch, stats: Date.now() },
                loading: { ...state.loading, stats: false },
              }))
            } else {
              throw new Error(response.message || 'Failed to fetch user statistics')
            }
          } catch (error: any) {
            set((state) => ({
              loading: { ...state.loading, stats: false },
              errors: { ...state.errors, stats: error.message || 'Failed to fetch statistics' },
            }))
          }
        },

        refreshAll: async () => {
          set(() => ({
            lastFetch: { users: 0, stats: 0 },
          }))

          const actions = get().actions
          await Promise.all([
            actions.fetchUsers(),
            actions.fetchUserStats(),
          ])
        },

        // User CRUD
        createUser: async (data: CreateUserRequest) => {
          set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
          }))

          try {
            console.log('🎯 UserStore: Creating user:', data.email)

            const response = await userService.createUser(data)

            if (response.success && response.data?.user) {
              const newUser = processUser(response.data.user)

              // Add to the beginning of the list
              set((state) => ({
                users: [newUser, ...state.users],
                currentUser: newUser,
                loading: { ...state.loading, create: false },
              }))

              console.log('✅ UserStore: User created successfully')
              toast.success('User created successfully!')
              return newUser
            } else {
              throw new Error(response.message || 'Failed to create user')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to create user:', error)
            set((state) => ({
              loading: { ...state.loading, create: false },
              errors: { ...state.errors, create: error.message || 'Failed to create user' },
            }))
            toast.error(error.message || 'Failed to create user')
            return null
          }
        },

        updateUser: async (id: number, data: UpdateUserRequest) => {
          set((state) => ({
            loading: { ...state.loading, update: true },
            errors: { ...state.errors, update: null },
          }))

          try {
            console.log('🎯 UserStore: Updating user:', id)

            const response = await userService.updateUser(id, data)

            if (response.success && response.data?.user) {
              const updatedUser = processUser(response.data.user)

              set((state) => ({
                users: state.users.map((u) => (u.id === id ? updatedUser : u)),
                currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
                loading: { ...state.loading, update: false },
              }))

              console.log('✅ UserStore: User updated successfully')
              toast.success('User updated successfully!')
            } else {
              throw new Error(response.message || 'Failed to update user')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to update user:', error)
            set((state) => ({
              loading: { ...state.loading, update: false },
              errors: { ...state.errors, update: error.message || 'Failed to update user' },
            }))
            toast.error(error.message || 'Failed to update user')
            throw error
          }
        },

        deleteUser: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, delete: true },
            errors: { ...state.errors, delete: null },
          }))

          try {
            console.log('🎯 UserStore: Deleting user:', id)

            const response = await userService.deleteUser(id)

            if (response.success) {
              set((state) => {
                const newSelectedUsers = new Set(state.selectedUsers)
                newSelectedUsers.delete(id)

                return {
                  users: state.users.filter((u) => u.id !== id),
                  currentUser: state.currentUser?.id === id ? null : state.currentUser,
                  selectedUsers: newSelectedUsers,
                  loading: { ...state.loading, delete: false },
                }
              })

              console.log('✅ UserStore: User deleted successfully')
              toast.success('User deleted successfully!')
            } else {
              throw new Error(response.message || 'Failed to delete user')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to delete user:', error)
            set((state) => ({
              loading: { ...state.loading, delete: false },
              errors: { ...state.errors, delete: error.message || 'Failed to delete user' },
            }))
            toast.error(error.message || 'Failed to delete user')
          }
        },

        // User operations
        toggleUserStatus: async (id: number) => {
          set((state) => ({
            loading: { ...state.loading, toggleStatus: true },
            errors: { ...state.errors, toggleStatus: null },
          }))

          try {
            console.log('🎯 UserStore: Toggling status for user:', id)

            const response = await userService.toggleUserStatus(id)

            if (response.success && response.data?.user) {
              const updatedUser = processUser(response.data.user)

              set((state) => ({
                users: state.users.map((u) => (u.id === id ? updatedUser : u)),
                currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
                loading: { ...state.loading, toggleStatus: false },
              }))

              console.log('✅ UserStore: User status toggled successfully')
              toast.success(`User ${updatedUser.status === 'active' ? 'activated' : 'deactivated'} successfully!`)
            } else {
              throw new Error(response.message || 'Failed to toggle user status')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to toggle user status:', error)
            set((state) => ({
              loading: { ...state.loading, toggleStatus: false },
              errors: { ...state.errors, toggleStatus: error.message || 'Failed to toggle user status' },
            }))
            toast.error(error.message || 'Failed to toggle user status')
          }
        },

        resetUserPassword: async (id: number, newPassword: string, confirmPassword: string) => {
          set((state) => ({
            loading: { ...state.loading, resetPassword: true },
            errors: { ...state.errors, resetPassword: null },
          }))

          try {
            console.log('🎯 UserStore: Resetting password for user:', id)

            const response = await userService.resetPassword(id, newPassword, confirmPassword)

            if (response.success) {
              set((state) => ({
                loading: { ...state.loading, resetPassword: false },
              }))

              console.log('✅ UserStore: Password reset successfully')
              toast.success('Password reset successfully!')
            } else {
              throw new Error(response.message || 'Failed to reset password')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to reset password:', error)
            set((state) => ({
              loading: { ...state.loading, resetPassword: false },
              errors: { ...state.errors, resetPassword: error.message || 'Failed to reset password' },
            }))
            toast.error(error.message || 'Failed to reset password')
          }
        },

        // Bulk operations
        bulkAction: async (action: string, userIds: number[], reason?: string) => {
          set((state) => ({
            loading: { ...state.loading, bulkAction: true },
            errors: { ...state.errors, bulkAction: null },
          }))

          try {
            console.log('🎯 UserStore: Performing bulk action:', action, 'on', userIds.length, 'users')

            const bulkData: BulkActionRequest = {
              action: action as any,
              user_ids: userIds,
              reason,
            }

            const response = await userService.bulkAction(bulkData)

            if (response.success) {
              // Refresh users to get updated data
              await get().actions.fetchUsers()

              set((state) => ({
                selectedUsers: new Set(), // Clear selection
                loading: { ...state.loading, bulkAction: false },
              }))

              console.log('✅ UserStore: Bulk action completed successfully')
              toast.success(`Bulk ${action} completed successfully!`)
            } else {
              throw new Error(response.message || 'Failed to perform bulk action')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to perform bulk action:', error)
            set((state) => ({
              loading: { ...state.loading, bulkAction: false },
              errors: { ...state.errors, bulkAction: error.message || 'Failed to perform bulk action' },
            }))
            toast.error(error.message || 'Failed to perform bulk action')
          }
        },

        bulkCreate: async (data: BulkCreateRequest) => {
          set((state) => ({
            loading: { ...state.loading, bulkCreate: true },
            errors: { ...state.errors, bulkCreate: null },
          }))

          try {
            console.log('🎯 UserStore: Starting bulk user creation')

            const response = await userService.bulkCreate(data)

            if (response.success) {
              // Refresh users to show new ones
              await get().actions.fetchUsers()

              set((state) => ({
                loading: { ...state.loading, bulkCreate: false },
              }))

              console.log('✅ UserStore: Bulk user creation completed')
              toast.success('Bulk user creation completed!')
              return response.data
            } else {
              throw new Error(response.message || 'Failed to create users in bulk')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to perform bulk creation:', error)
            set((state) => ({
              loading: { ...state.loading, bulkCreate: false },
              errors: { ...state.errors, bulkCreate: error.message || 'Failed to create users in bulk' },
            }))
            toast.error(error.message || 'Failed to create users in bulk')
            return null
          }
        },

        // Export
        exportUsers: async (params?: UserFilters) => {
          set((state) => ({
            loading: { ...state.loading, export: true },
            errors: { ...state.errors, export: null },
          }))

          try {
            console.log('🎯 UserStore: Exporting users')

            const exportParams = params || get().filters
            const response = await userService.exportUsers(exportParams)

            if (response.success && response.data?.users) {
              // Generate and download CSV
              const csvContent = this.generateCSV(response.data.users)
              this.downloadCSV(csvContent, `users-export-${new Date().toISOString().split('T')[0]}.csv`)

              set((state) => ({
                loading: { ...state.loading, export: false },
              }))

              console.log('✅ UserStore: Users exported successfully')
              toast.success('Users exported successfully!')
            } else {
              throw new Error(response.message || 'Failed to export users')
            }
          } catch (error: any) {
            console.error('❌ UserStore: Failed to export users:', error)
            set((state) => ({
              loading: { ...state.loading, export: false },
              errors: { ...state.errors, export: error.message || 'Failed to export users' },
            }))
            toast.error(error.message || 'Failed to export users')
          }
        },

        // Filter management
        setFilters: (newFilters: Partial<UserFilters>, autoFetch = false) => {
          const state = get()
          
          // Reset to page 1 when changing non-pagination filters
          const shouldResetPage = Object.keys(newFilters).some(key => 
            key !== 'page' && key !== 'per_page' && newFilters[key as keyof UserFilters] !== state.filters[key as keyof UserFilters]
          )

          const updatedFilters = { 
            ...state.filters, 
            ...newFilters,
            page: shouldResetPage ? 1 : (newFilters.page || state.filters.page)
          }

          set(() => ({
            filters: updatedFilters,
          }))

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchUsers()
            }, 100)
          }
        },

        clearFilters: (autoFetch = false) => {
          set(() => ({
            filters: { ...defaultFilters },
            pagination: { ...defaultPagination }
          }))

          if (autoFetch) {
            setTimeout(() => {
              get().actions.fetchUsers()
            }, 100)
          }
        },

        setPage: (page: number) => {
          const actions = get().actions
          actions.setFilters({ page }, true)
        },

        // UI state management
        setCurrentUser: (user: UserItem | null) => {
          set(() => ({ currentUser: user }))
        },

        selectUser: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedUsers)
            newSet.add(id)
            return { selectedUsers: newSet }
          })
        },

        deselectUser: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedUsers)
            newSet.delete(id)
            return { selectedUsers: newSet }
          })
        },

        selectAllUsers: () => {
          set((state) => {
            const allUserIds = state.users.map((user) => user.id)
            return { selectedUsers: new Set(allUserIds) }
          })
        },

        clearSelection: () => {
          set(() => ({ selectedUsers: new Set<number>() }))
        },

        // Error handling
        clearError: (type: keyof UserState['errors']) => {
          set((state) => ({
            errors: { ...state.errors, [type]: null },
          }))
        },

        setError: (type: keyof UserState['errors'], message: string) => {
          set((state) => ({
            errors: { ...state.errors, [type]: message },
          }))
        },

        // Cache management
        invalidateCache: () => {
          set(() => ({
            lastFetch: { users: 0, stats: 0 },
          }))
        },

        clearCache: () => {
          set(() => ({
            users: [],
            currentUser: null,
            userStats: { ...defaultStats },
            selectedUsers: new Set(),
            pagination: { ...defaultPagination },
            lastFetch: { users: 0, stats: 0 },
          }))
        },
      },

      // Helper methods (private-like)
      generateCSV: (users: User[]): string => {
        const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Last Login', 'Created At']
        const rows = users.map((user: User) => [
          user.id.toString(),
          `"${user.name}"`,
          user.email,
          user.role,
          user.status,
          user.phone || '',
          user.last_login_at || 'Never',
          user.created_at
        ])
        
        return [headers, ...rows]
          .map((row: string[]) => row.join(','))
          .join('\n')
      },

      downloadCSV: (content: string, filename: string) => {
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
      }
    }),
    { name: 'user-store' }
  )
)

// Export selectors and hooks
export const useUserSelectors = () => {
  const users = useUserStore((state) => state.users)
  const userStats = useUserStore((state) => state.userStats)
  const selectedUsers = useUserStore((state) => state.selectedUsers)
  const pagination = useUserStore((state) => state.pagination)

  return {
    users,
    userStats,
    pagination,
    selectedUsersArray: Array.from(selectedUsers)
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as UserItem[],

    // Computed data
    activeUsers: users.filter((u) => u.status === 'active'),
    inactiveUsers: users.filter((u) => u.status === 'inactive'),
    suspendedUsers: users.filter((u) => u.status === 'suspended'),
    
    studentUsers: users.filter((u) => u.role === 'student'),
    counselorUsers: users.filter((u) => u.role === 'counselor'),
    advisorUsers: users.filter((u) => u.role === 'advisor'),
    adminUsers: users.filter((u) => u.role === 'admin'),

    // Pagination helpers
    hasNextPage: pagination.current_page < pagination.last_page,
    hasPrevPage: pagination.current_page > 1,
    isFirstPage: pagination.current_page === 1,
    isLastPage: pagination.current_page === pagination.last_page,
    pageInfo: `${pagination.from || 0}-${pagination.to || 0} of ${pagination.total}`,
  }
}

export const useUserActions = () => {
  return useUserStore((state) => state.actions)
}

export const useUserLoading = () => {
  return useUserStore((state) => state.loading)
}

export const useUserErrors = () => {
  return useUserStore((state) => state.errors)
}

export const useUserFilters = () => {
  const filters = useUserStore((state) => state.filters)
  const { setFilters, clearFilters } = useUserStore((state) => state.actions)

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters: Object.entries(filters).some(([key, value]) => {
      if (['page', 'per_page'].includes(key)) return false;
      return value !== undefined && value !== null && value !== '' && value !== 'all';
    }),
  }
}

export const useUserStats = () => {
  const userStats = useUserStore((state) => state.userStats)
  const users = useUserStore((state) => state.users)

  return {
    stats: userStats,
    // Real-time computed stats from current data
    computed: {
      total_users: users.length,
      active_users: users.filter((u) => u.status === 'active').length,
      inactive_users: users.filter((u) => u.status === 'inactive').length,
      suspended_users: users.filter((u) => u.status === 'suspended').length,
      students: users.filter((u) => u.role === 'student').length,
      counselors: users.filter((u) => u.role === 'counselor').length,
      advisors: users.filter((u) => u.role === 'advisor').length,
      admins: users.filter((u) => u.role === 'admin').length,
    },
  }
}

export default useUserStore