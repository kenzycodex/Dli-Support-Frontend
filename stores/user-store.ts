// stores/user-store.ts - FIXED TypeScript Errors

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  userService, 
  type User, 
  type UserListParams, 
  type UserStats, 
  type CreateUserRequest, 
  type UpdateUserRequest, 
  type BulkActionRequest, 
  type BulkCreateRequest 
} from '@/services/user.service'
import { toast } from 'sonner'

// FIXED: Enhanced interfaces with proper typing
export interface UserItem extends User {
  display_name: string
  initials: string
}

export interface UserFilters extends UserListParams {
  // FIXED: Properly typed filter options
  search?: string
  role?: string
  status?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc' // FIXED: Proper typing instead of generic string
  page?: number
  per_page?: number
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

// FIXED: Default values with proper typing
const defaultPagination: PaginationState = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
  from: 0,
  to: 0,
  has_more_pages: false
}

const defaultFilters: UserFilters = {
  page: 1,
  per_page: 25,
  role: 'all',
  status: 'all',
  sort_by: 'created_at',
  sort_direction: 'desc' as 'desc' // FIXED: Explicit typing
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
  allUsers: UserItem[]
  filteredUsers: UserItem[]
  displayedUsers: UserItem[]
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
  cache: {
    lastFetch: {
      users: number
      stats: number
    }
    isInitialized: boolean
    needsRefresh: boolean
  }
  
  // UI state
  selectedUsers: Set<number>
  
  // Actions
  actions: {
    // Data fetching
    fetchUsers: (params?: Partial<UserFilters>, forceRefresh?: boolean) => Promise<void>
    fetchUserStats: (forceRefresh?: boolean) => Promise<void>
    refreshAll: () => Promise<void>
    
    // User CRUD
    createUser: (data: CreateUserRequest) => Promise<UserItem | null>
    updateUser: (id: number, data: UpdateUserRequest) => Promise<void>
    deleteUser: (id: number) => Promise<void>
    
    // User operations
    toggleUserStatus: (id: number) => Promise<void>
    resetUserPassword: (id: number, newPassword?: string, confirmPassword?: string, generatePassword?: boolean, notifyUser?: boolean) => Promise<void>
    
    // Bulk operations
    bulkAction: (action: string, userIds: number[], reason?: string) => Promise<void>
    bulkCreate: (data: BulkCreateRequest) => Promise<any>
    
    // Export
    exportUsers: (params?: UserFilters) => Promise<void>
    
    // Local filtering management
    setFilters: (filters: Partial<UserFilters>, autoApply?: boolean) => void
    clearFilters: (autoApply?: boolean) => void
    setPage: (page: number) => void
    applyFilters: () => void
    
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
    markNeedsRefresh: () => void
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

// FIXED: Local filtering function with proper typing
const applyLocalFilters = (
  users: UserItem[], 
  filters: UserFilters
): { filtered: UserItem[], pagination: PaginationState } => {
  let filtered = [...users]

  // Search filter
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.student_id?.toLowerCase().includes(searchLower) ||
      user.employee_id?.toLowerCase().includes(searchLower)
    )
  }

  // Role filter
  if (filters.role && filters.role !== 'all') {
    filtered = filtered.filter(user => user.role === filters.role)
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(user => user.status === filters.status)
  }

  // FIXED: Sorting with proper typing
  const sortBy = filters.sort_by || 'created_at'
  const sortDirection: 'asc' | 'desc' = filters.sort_direction || 'desc' // FIXED: Explicit typing
  
  filtered.sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'email':
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        break
      case 'role':
        aValue = a.role
        bValue = b.role
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'last_login_at':
        aValue = new Date(a.last_login_at || 0).getTime()
        bValue = new Date(b.last_login_at || 0).getTime()
        break
      default: // created_at
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })

  // Pagination
  const page = filters.page || 1
  const perPage = filters.per_page || 25
  const totalPages = Math.ceil(filtered.length / perPage)
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage

  const pagination: PaginationState = {
    current_page: page,
    last_page: Math.max(1, totalPages),
    per_page: perPage,
    total: filtered.length,
    from: filtered.length > 0 ? startIndex + 1 : 0,
    to: Math.min(endIndex, filtered.length),
    has_more_pages: page < totalPages
  }

  return { 
    filtered: filtered.slice(startIndex, endIndex), 
    pagination 
  }
}

// Zustand Store
export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial state
      allUsers: [],
      filteredUsers: [],
      displayedUsers: [],
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

      cache: {
        lastFetch: {
          users: 0,
          stats: 0,
        },
        isInitialized: false,
        needsRefresh: false,
      },

      selectedUsers: new Set<number>(),

      actions: {
        // FIXED: Smart data fetching with proper API limits
        fetchUsers: async (params?: Partial<UserFilters>, forceRefresh = false) => {
          const state = get()
          
          // Smart caching
          const timeSinceLastFetch = Date.now() - state.cache.lastFetch.users
          const shouldUseCache = !forceRefresh && 
                               state.cache.isInitialized && 
                               timeSinceLastFetch < 30000 &&
                               state.allUsers.length > 0 &&
                               !state.cache.needsRefresh

          if (shouldUseCache) {
            console.log('🎯 UserStore: Using cached data, applying filters locally')
            
            if (params) {
              const mergedFilters = { ...state.filters, ...params }
              set(() => ({ filters: mergedFilters }))
              get().actions.applyFilters()
            }
            return
          }

          const mergedFilters = params ? { ...state.filters, ...params } : state.filters

          set((state) => ({
            loading: { ...state.loading, users: true },
            errors: { ...state.errors, users: null },
            filters: mergedFilters,
          }))

          try {
            console.log('🎯 UserStore: Fetching users from API:', mergedFilters)

            // FIXED: Respect API limits - use per_page: 100 instead of 1000
            const apiFilters: UserListParams = { 
              per_page: 100, // FIXED: Changed from 1000 to 100 to respect API limits
              sort_by: 'created_at',
              sort_direction: 'desc' as 'desc' // FIXED: Explicit typing
            }

            const response = await userService.getUsers(apiFilters)

            if (response.success && response.data) {
              const rawUsers = response.data.users || []
              const processedUsers = generateUsersFromResponse(rawUsers)

              set(() => ({
                allUsers: processedUsers,
                cache: {
                  ...get().cache,
                  lastFetch: { ...get().cache.lastFetch, users: Date.now() },
                  isInitialized: true,
                  needsRefresh: false,
                },
                loading: { ...get().loading, users: false },
              }))

              // Apply filters locally
              get().actions.applyFilters()

              console.log('✅ UserStore: Users fetched and cached successfully:', processedUsers.length)
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

        // Apply filters locally
        applyFilters: () => {
          const state = get()
          
          try {
            const { filtered, pagination } = applyLocalFilters(state.allUsers, state.filters)
            
            set(() => ({
              filteredUsers: filtered,
              displayedUsers: filtered,
              pagination: pagination,
            }))

            console.log('✅ UserStore: Local filters applied:', {
              totalUsers: state.allUsers.length,
              filteredUsers: filtered.length,
              currentPage: pagination.current_page,
              filters: state.filters
            })
          } catch (error: any) {
            console.error('❌ UserStore: Failed to apply local filters:', error)
          }
        },

        fetchUserStats: async (forceRefresh = false) => {
          const state = get()

          if (!forceRefresh && Date.now() - state.cache.lastFetch.stats < 10000) {
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
                cache: {
                  ...state.cache,
                  lastFetch: { ...state.cache.lastFetch, stats: Date.now() },
                },
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
          set((state) => ({
            cache: {
              ...state.cache,
              lastFetch: { users: 0, stats: 0 },
              needsRefresh: true,
            },
          }))

          const actions = get().actions
          await Promise.all([
            actions.fetchUsers({}, true),
            actions.fetchUserStats(true),
          ])
        },

        // User CRUD with local state updates
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

              // IMMEDIATE local state update
              set((state) => ({
                allUsers: [newUser, ...state.allUsers],
                currentUser: newUser,
                loading: { ...state.loading, create: false },
              }))

              // Reapply filters
              get().actions.applyFilters()

              console.log('✅ UserStore: User created successfully')
              
              if (response.data.email_sent) {
                toast.success('User created successfully! Welcome email sent.')
              } else {
                toast.success('User created successfully!')
              }
              
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

              // IMMEDIATE local state update
              set((state) => ({
                allUsers: state.allUsers.map((u) => (u.id === id ? updatedUser : u)),
                currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
                loading: { ...state.loading, update: false },
              }))

              // Reapply filters
              get().actions.applyFilters()

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
              // IMMEDIATE local state cleanup
              set((state) => {
                const newSelectedUsers = new Set(state.selectedUsers)
                newSelectedUsers.delete(id)

                return {
                  allUsers: state.allUsers.filter((u) => u.id !== id),
                  currentUser: state.currentUser?.id === id ? null : state.currentUser,
                  selectedUsers: newSelectedUsers,
                  loading: { ...state.loading, delete: false },
                }
              })

              // Reapply filters
              get().actions.applyFilters()

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

              // IMMEDIATE local state update
              set((state) => ({
                allUsers: state.allUsers.map((u) => (u.id === id ? updatedUser : u)),
                currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
                loading: { ...state.loading, toggleStatus: false },
              }))

              // Reapply filters
              get().actions.applyFilters()

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

        resetUserPassword: async (
          id: number, 
          newPassword?: string, 
          confirmPassword?: string, 
          generatePassword: boolean = true, 
          notifyUser: boolean = true
        ) => {
          set((state) => ({
            loading: { ...state.loading, resetPassword: true },
            errors: { ...state.errors, resetPassword: null },
          }))

          try {
            console.log('🎯 UserStore: Resetting password for user:', id)

            const response = await userService.resetPassword(id, newPassword, confirmPassword, generatePassword, notifyUser)

            if (response.success) {
              set((state) => ({
                loading: { ...state.loading, resetPassword: false },
              }))

              console.log('✅ UserStore: Password reset successfully')
              
              if (response.data?.email_sent) {
                toast.success('Password reset successfully! Notification email sent to user.')
              } else {
                toast.success('Password reset successfully!')
              }
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
              // IMMEDIATE local state update
              set((state) => {
                let updatedUsers = [...state.allUsers]
                const newSelectedUsers = new Set<number>()

                if (action === 'delete') {
                  // Remove deleted users
                  updatedUsers = updatedUsers.filter(user => !userIds.includes(user.id))
                } else {
                  // Update status for other actions
                  const newStatus = action === 'activate' ? 'active' : 
                                   action === 'deactivate' ? 'inactive' : 
                                   action === 'suspend' ? 'suspended' : 
                                   'active' // FIXED: Default fallback instead of referencing undefined 'user'

                  updatedUsers = updatedUsers.map(user => {
                    if (userIds.includes(user.id)) {
                      return { ...user, status: newStatus as any }
                    }
                    return user
                  })
                }

                return {
                  allUsers: updatedUsers,
                  selectedUsers: newSelectedUsers,
                  loading: { ...state.loading, bulkAction: false },
                }
              })

              // Reapply filters
              get().actions.applyFilters()

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
              // Mark cache as needing refresh
              set((state) => ({
                loading: { ...state.loading, bulkCreate: false },
                cache: { ...state.cache, needsRefresh: true },
              }))

              // Refresh users
              await get().actions.fetchUsers({}, true)

              console.log('✅ UserStore: Bulk user creation completed')
              
              if (response.data?.summary) {
                const { successful, failed, skipped, emails_queued } = response.data.summary
                let message = `Bulk creation completed: ${successful} created`
                if (failed > 0) message += `, ${failed} failed`
                if (skipped > 0) message += `, ${skipped} skipped`
                if (emails_queued && emails_queued > 0) message += `. ${emails_queued} welcome emails queued.`
                toast.success(message)
              } else {
                toast.success('Bulk user creation completed!')
              }
              
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
            
            let errorMessage = error.message || 'Failed to create users in bulk'
            
            if (error.response?.data?.errors || error.errors) {
              const errors = error.response?.data?.errors || error.errors
              if (typeof errors === 'object') {
                const errorDetails = Object.entries(errors).map(([field, messages]) => {
                  if (Array.isArray(messages)) {
                    return `${field}: ${messages.join(', ')}`
                  }
                  return `${field}: ${messages}`
                }).join('; ')
                
                errorMessage = `Validation failed: ${errorDetails}`
              }
            }
            
            toast.error(errorMessage)
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
              const csvContent = generateCSV(response.data.users)
              downloadCSV(csvContent, `users-export-${new Date().toISOString().split('T')[0]}.csv`)

              set((state) => ({
                loading: { ...state.loading, export: false },
              }))

              console.log('✅ UserStore: Users exported successfully')
              toast.success(`${response.data.total_exported} users exported successfully!`)
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

        // Local filter management
        setFilters: (newFilters: Partial<UserFilters>, autoApply = true) => {
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

          if (autoApply) {
            setTimeout(() => {
              get().actions.applyFilters()
            }, 50)
          }
        },

        clearFilters: (autoApply = true) => {
          set(() => ({
            filters: { ...defaultFilters },
          }))

          if (autoApply) {
            setTimeout(() => {
              get().actions.applyFilters()
            }, 50)
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
            const allUserIds = state.displayedUsers.map((user) => user.id)
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
          set((state) => ({
            cache: {
              ...state.cache,
              lastFetch: { users: 0, stats: 0 },
              needsRefresh: true,
            },
          }))
        },

        clearCache: () => {
          set(() => ({
            allUsers: [],
            filteredUsers: [],
            displayedUsers: [],
            currentUser: null,
            userStats: { ...defaultStats },
            selectedUsers: new Set(),
            pagination: { ...defaultPagination },
            cache: {
              lastFetch: { users: 0, stats: 0 },
              isInitialized: false,
              needsRefresh: false,
            },
          }))
        },

        markNeedsRefresh: () => {
          set((state) => ({
            cache: { ...state.cache, needsRefresh: true },
          }))
        },
      },
    }),
    { name: 'user-store' }
  )
)

// Helper functions for CSV export
function generateCSV(users: User[]): string {
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
}

function downloadCSV(content: string, filename: string) {
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

// Export selectors and hooks
export const useUserSelectors = () => {
  const allUsers = useUserStore((state) => state.allUsers)
  const displayedUsers = useUserStore((state) => state.displayedUsers)
  const userStats = useUserStore((state) => state.userStats)
  const selectedUsers = useUserStore((state) => state.selectedUsers)
  const pagination = useUserStore((state) => state.pagination)

  return {
    // Use displayedUsers for current page, allUsers for stats
    users: displayedUsers,
    allUsers: allUsers,
    userStats,
    pagination,
    selectedUsersArray: Array.from(selectedUsers)
      .map((id) => allUsers.find((u) => u.id === id))
      .filter(Boolean) as UserItem[],

    // Computed data from all users
    activeUsers: allUsers.filter((u) => u.status === 'active'),
    inactiveUsers: allUsers.filter((u) => u.status === 'inactive'),
    suspendedUsers: allUsers.filter((u) => u.status === 'suspended'),
    studentUsers: allUsers.filter((u) => u.role === 'student'),
    counselorUsers: allUsers.filter((u) => u.role === 'counselor'),
    advisorUsers: allUsers.filter((u) => u.role === 'advisor'),
    adminUsers: allUsers.filter((u) => u.role === 'admin'),

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
      if (['page', 'per_page'].includes(key)) return false
      return value !== undefined && value !== null && value !== '' && value !== 'all'
    }),
  }
}

export const useUserStats = () => {
  const userStats = useUserStore((state) => state.userStats)
  const allUsers = useUserStore((state) => state.allUsers)

  return {
    stats: userStats,
    // Real-time computed stats from current data
    computed: {
      total_users: allUsers.length,
      active_users: allUsers.filter((u) => u.status === 'active').length,
      inactive_users: allUsers.filter((u) => u.status === 'inactive').length,
      suspended_users: allUsers.filter((u) => u.status === 'suspended').length,
      students: allUsers.filter((u) => u.role === 'student').length,
      counselors: allUsers.filter((u) => u.role === 'counselor').length,
      advisors: allUsers.filter((u) => u.role === 'advisor').length,
      admins: allUsers.filter((u) => u.role === 'admin').length,
    },
  }
}

export default useUserStore