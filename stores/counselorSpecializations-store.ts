// stores/counselorSpecializations-store.ts - FIXED: Stable selectors to prevent infinite loops

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useCallback, useMemo } from 'react'
import { 
  counselorSpecializationsService, 
  CounselorSpecialization, 
  CreateSpecializationRequest, 
  UpdateSpecializationRequest,
  BulkAssignRequest,
  AvailabilityUpdateRequest,
  WorkloadStats,
  AvailableCounselorsResponse
} from '@/services/counselorSpecializations.service'

// Enhanced interfaces with all required properties
export interface CounselorSpecializationWithStats extends CounselorSpecialization {
  utilization_rate: number
  assignment_score: number
  can_take_ticket: boolean
}

export interface StaffMember {
  id: number
  name: string
  email: string
  role: string
  status: string
  current_specializations?: number
  total_workload?: number
  specializations?: CounselorSpecializationWithStats[]
}

export interface SpecializationFilters {
  search?: string
  category_id?: number | 'all'
  user_id?: number | 'all'
  is_available?: boolean | 'all'
  priority_level?: 'primary' | 'secondary' | 'backup' | 'all'
  sort_by?: 'counselor_name' | 'category_name' | 'priority_level' | 'workload' | 'utilization'
  sort_direction?: 'asc' | 'desc'
}

// Loading state interface
interface LoadingState {
  specializations: boolean
  staff: boolean
  create: boolean
  update: boolean
  delete: boolean
  bulkAssign: boolean
  availability: boolean
  workloadStats: boolean
  resetWorkloads: boolean
  availableCounselors: boolean
}

// Error state interface
interface ErrorState {
  specializations: string | null
  staff: string | null
  create: string | null
  update: string | null
  delete: string | null
  bulkAssign: string | null
  availability: string | null
  workloadStats: string | null
  resetWorkloads: string | null
  availableCounselors: string | null
}

// FIXED: Stable utility functions moved outside component
const calculateAssignmentScore = (spec: CounselorSpecialization): number => {
  const utilization_rate = spec.max_workload > 0 ? 
    Math.round((spec.current_workload / spec.max_workload) * 100) : 0
  
  const can_take_ticket = spec.is_available && spec.current_workload < spec.max_workload
  
  if (!can_take_ticket) return 0

  const priorityWeight = {
    'primary': 1.0,
    'secondary': 0.8,
    'backup': 0.6
  }[spec.priority_level] || 0.5

  const expertiseWeight = (spec.expertise_rating || 3) / 5
  const availabilityScore = (100 - utilization_rate) / 100
  
  return Math.round((availabilityScore * priorityWeight * expertiseWeight) * 100)
}

const enhanceSpecializationWithStats = (spec: CounselorSpecialization): CounselorSpecializationWithStats => {
  const utilization_rate = spec.max_workload > 0 ? 
    Math.round((spec.current_workload / spec.max_workload) * 100) : 0
  
  const can_take_ticket = spec.is_available && spec.current_workload < spec.max_workload
  const assignment_score = calculateAssignmentScore(spec)
  
  return {
    ...spec,
    utilization_rate,
    assignment_score,
    can_take_ticket
  }
}

const enhanceStaffSpecializations = (staff: any): StaffMember => {
  return {
    ...staff,
    specializations: staff.specializations ? 
      staff.specializations.map(enhanceSpecializationWithStats) : 
      []
  }
}

// Default filter values
const DEFAULT_FILTERS: SpecializationFilters = {
  search: '',
  category_id: 'all',
  user_id: 'all',
  is_available: 'all',
  priority_level: 'all',
  sort_by: 'counselor_name',
  sort_direction: 'asc'
}

// FIXED: Store interface with stable structure
interface CounselorSpecializationsState {
  // Core data
  specializations: CounselorSpecializationWithStats[]
  availableStaff: StaffMember[]
  workloadStats: WorkloadStats | null
  currentSpecialization: CounselorSpecializationWithStats | null
  filters: SpecializationFilters
  
  // Loading and error states
  loading: LoadingState
  errors: ErrorState
  
  // Cache management
  lastFetch: number
  cacheTtl: number
  
  // UI state
  selectedSpecializations: Set<number>
}

// FIXED: Actions interface with stable methods
interface StoreActions {
  // Data fetching
  fetchSpecializations: (params?: { category_id?: number; user_id?: number; is_available?: boolean }, forceRefresh?: boolean) => Promise<void>
  fetchAvailableStaff: (forceRefresh?: boolean) => Promise<void>
  fetchWorkloadStats: (forceRefresh?: boolean) => Promise<void>
  refreshAll: () => Promise<void>
  
  // CRUD operations
  createSpecialization: (data: CreateSpecializationRequest) => Promise<CounselorSpecializationWithStats | null>
  updateSpecialization: (id: number, data: UpdateSpecializationRequest) => Promise<void>
  deleteSpecialization: (id: number) => Promise<void>
  
  // Bulk operations
  bulkAssign: (data: BulkAssignRequest) => Promise<void>
  updateAvailability: (data: AvailabilityUpdateRequest) => Promise<void>
  resetWorkloads: () => Promise<void>
  
  // Utilities
  getSpecializationById: (id: number) => CounselorSpecializationWithStats | null
  getSpecializationsByCategory: (categoryId: number) => CounselorSpecializationWithStats[]
  getSpecializationsByCounselor: (userId: number) => CounselorSpecializationWithStats[]
  getAvailableCounselorsForCategory: (categoryId: number) => Promise<AvailableCounselorsResponse | null>
  
  // Filter management
  setFilters: (filters: Partial<SpecializationFilters>) => void
  clearFilters: () => void
  
  // UI state management
  setCurrentSpecialization: (specialization: CounselorSpecializationWithStats | null) => void
  selectSpecialization: (id: number) => void
  deselectSpecialization: (id: number) => void
  clearSelection: () => void
  
  // Error handling
  clearError: (type: keyof ErrorState) => void
  setError: (type: keyof ErrorState, message: string) => void
  
  // Cache management
  invalidateCache: () => void
  
  // Export
  exportSpecializations: (format: 'csv' | 'json') => Promise<void>
}

// Complete store interface
interface CounselorSpecializationsStoreState extends CounselorSpecializationsState {
  actions: StoreActions
}

// FIXED: Create store with stable state management
export const useCounselorSpecializationsStore = create<CounselorSpecializationsStoreState>()(
  devtools(
    (set, get) => {
      const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

      // FIXED: Actions object with stable implementations
      const actions: StoreActions = {
        fetchSpecializations: async (params = {}, forceRefresh = false) => {
          const state = get()
          
          const cacheAge = Date.now() - state.lastFetch
          if (!forceRefresh && cacheAge < state.cacheTtl && state.specializations.length > 0) {
            console.log('👥 Using cached specializations data')
            return
          }

          if (state.loading.specializations) {
            console.log('🔄 Specializations fetch already in progress')
            return
          }

          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              specializations: true
            },
            errors: {
              ...state.errors,
              specializations: null
            }
          }))

          try {
            console.log('👥 Fetching specializations with params:', params)

            const response = await counselorSpecializationsService.getSpecializations(params)

            if (response.success && response.data?.specializations) {
              const enhancedSpecializations = response.data.specializations.map(enhanceSpecializationWithStats)

              set((state) => ({
                ...state,
                specializations: enhancedSpecializations,
                lastFetch: Date.now(),
                loading: {
                  ...state.loading,
                  specializations: false
                },
                errors: {
                  ...state.errors,
                  specializations: null
                }
              }))

              console.log('✅ Specializations fetched successfully:', enhancedSpecializations.length)
            } else {
              throw new Error(response.message || 'Failed to fetch specializations')
            }
          } catch (error: any) {
            console.error('❌ Failed to fetch specializations:', error)
            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                specializations: false
              },
              errors: {
                ...state.errors,
                specializations: error.message || 'Failed to fetch specializations'
              }
            }))
          }
        },

        fetchAvailableStaff: async (forceRefresh = false) => {
          const state = get()
          
          if (!forceRefresh && state.availableStaff.length > 0) {
            return
          }

          if (state.loading.staff) {
            console.log('🔄 Staff fetch already in progress')
            return
          }

          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              staff: true
            },
            errors: {
              ...state.errors,
              staff: null
            }
          }))

          try {
            console.log('👥 Fetching available staff')

            const response = await counselorSpecializationsService.getAvailableStaff()

            if (response.success && response.data?.staff) {
              const enhancedStaff = response.data.staff.map(enhanceStaffSpecializations)

              set((state) => ({
                ...state,
                availableStaff: enhancedStaff,
                loading: {
                  ...state.loading,
                  staff: false
                },
                errors: {
                  ...state.errors,
                  staff: null
                }
              }))

              console.log('✅ Available staff fetched successfully:', enhancedStaff.length)
            } else {
              throw new Error(response.message || 'Failed to fetch available staff')
            }
          } catch (error: any) {
            console.error('❌ Failed to fetch available staff:', error)
            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                staff: false
              },
              errors: {
                ...state.errors,
                staff: error.message || 'Failed to fetch available staff'
              }
            }))
          }
        },

        fetchWorkloadStats: async (forceRefresh = false) => {
          const state = get()
          
          if (!forceRefresh && state.workloadStats) {
            return
          }

          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              workloadStats: true
            },
            errors: {
              ...state.errors,
              workloadStats: null
            }
          }))

          try {
            console.log('👥 Fetching workload statistics')

            const response = await counselorSpecializationsService.getWorkloadStats()

            if (response.success && response.data) {
              set((state) => ({
                ...state,
                workloadStats: response.data!,
                loading: {
                  ...state.loading,
                  workloadStats: false
                },
                errors: {
                  ...state.errors,
                  workloadStats: null
                }
              }))

              console.log('✅ Workload statistics fetched successfully')
            } else {
              throw new Error(response.message || 'Failed to fetch workload statistics')
            }
          } catch (error: any) {
            console.error('❌ Failed to fetch workload statistics:', error)
            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                workloadStats: false
              },
              errors: {
                ...state.errors,
                workloadStats: error.message || 'Failed to fetch workload statistics'
              }
            }))
          }
        },

        refreshAll: async () => {
          console.log('🔄 Refreshing all data')
          
          set((state) => ({ 
            ...state,
            lastFetch: 0
          }))
          
          await Promise.all([
            actions.fetchSpecializations({}, true),
            actions.fetchAvailableStaff(true),
            actions.fetchWorkloadStats(true),
          ])
        },

        createSpecialization: async (data: CreateSpecializationRequest) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              create: true
            },
            errors: {
              ...state.errors,
              create: null
            }
          }))

          try {
            console.log('👥 Creating specialization')

            const response = await counselorSpecializationsService.createSpecialization(data)

            if (response.success && response.data?.specialization) {
              const enhancedSpecialization = enhanceSpecializationWithStats(response.data.specialization)

              set((state) => ({
                ...state,
                specializations: [enhancedSpecialization, ...state.specializations],
                currentSpecialization: enhancedSpecialization,
                loading: {
                  ...state.loading,
                  create: false
                },
                errors: {
                  ...state.errors,
                  create: null
                },
                lastFetch: 0
              }))

              console.log('✅ Specialization created successfully')
              return enhancedSpecialization
            } else {
              throw new Error(response.message || 'Failed to create specialization')
            }
          } catch (error: any) {
            console.error('❌ Failed to create specialization:', error)
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create specialization'

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                create: false
              },
              errors: {
                ...state.errors,
                create: errorMessage
              }
            }))
            
            throw new Error(errorMessage)
          }
        },

        updateSpecialization: async (id: number, data: UpdateSpecializationRequest) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              update: true
            },
            errors: {
              ...state.errors,
              update: null
            }
          }))

          try {
            console.log('👥 Updating specialization:', id)

            const response = await counselorSpecializationsService.updateSpecialization(id, data)

            if (response.success && response.data?.specialization) {
              const enhancedSpecialization = enhanceSpecializationWithStats(response.data.specialization)

              set((state) => ({
                ...state,
                specializations: state.specializations.map((s) => 
                  s.id === id ? enhancedSpecialization : s
                ),
                currentSpecialization: state.currentSpecialization?.id === id ? enhancedSpecialization : state.currentSpecialization,
                loading: {
                  ...state.loading,
                  update: false
                },
                errors: {
                  ...state.errors,
                  update: null
                },
                lastFetch: 0
              }))

              console.log('✅ Specialization updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update specialization')
            }
          } catch (error: any) {
            console.error('❌ Failed to update specialization:', error)

            const errorMessage = error.response?.data?.message || error.message || 'Failed to update specialization'

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                update: false
              },
              errors: {
                ...state.errors,
                update: errorMessage
              }
            }))
            
            throw new Error(errorMessage)
          }
        },

        deleteSpecialization: async (id: number) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              delete: true
            },
            errors: {
              ...state.errors,
              delete: null
            }
          }))

          try {
            console.log('👥 Deleting specialization:', id)

            const response = await counselorSpecializationsService.deleteSpecialization(id)

            if (response.success) {
              set((state) => {
                const newSelectedSpecializations = new Set(state.selectedSpecializations)
                newSelectedSpecializations.delete(id)

                return {
                  ...state,
                  specializations: state.specializations.filter((s) => s.id !== id),
                  currentSpecialization: state.currentSpecialization?.id === id ? null : state.currentSpecialization,
                  selectedSpecializations: newSelectedSpecializations,
                  loading: {
                    ...state.loading,
                    delete: false
                  },
                  errors: {
                    ...state.errors,
                    delete: null
                  },
                  lastFetch: 0
                }
              })

              console.log('✅ Specialization deleted successfully')
            } else {
              throw new Error(response.message || 'Failed to delete specialization')
            }
          } catch (error: any) {
            console.error('❌ Failed to delete specialization:', error)

            const errorMessage = error.message?.includes('tickets') 
              ? 'Cannot remove counselor from category with active tickets. Please reassign tickets first.'
              : error.message || 'Failed to delete specialization'

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                delete: false
              },
              errors: {
                ...state.errors,
                delete: errorMessage
              }
            }))

            throw new Error(errorMessage)
          }
        },

        bulkAssign: async (data: BulkAssignRequest) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              bulkAssign: true
            },
            errors: {
              ...state.errors,
              bulkAssign: null
            }
          }))

          try {
            console.log('👥 Bulk assigning counselors')

            const response = await counselorSpecializationsService.bulkAssign(data)

            if (response.success) {
              await actions.fetchSpecializations({}, true)

              set((state) => ({
                ...state,
                loading: {
                  ...state.loading,
                  bulkAssign: false
                },
                errors: {
                  ...state.errors,
                  bulkAssign: null
                }
              }))

              console.log('✅ Bulk assignment successful')
            } else {
              throw new Error(response.message || 'Failed to bulk assign counselors')
            }
          } catch (error: any) {
            console.error('❌ Failed to bulk assign counselors:', error)

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                bulkAssign: false
              },
              errors: {
                ...state.errors,
                bulkAssign: error.message || 'Failed to bulk assign counselors'
              }
            }))
          }
        },

        updateAvailability: async (data: AvailabilityUpdateRequest) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              availability: true
            },
            errors: {
              ...state.errors,
              availability: null
            }
          }))

          try {
            console.log('👥 Updating availability')

            const response = await counselorSpecializationsService.updateAvailability(data)

            if (response.success) {
              set((state) => {
                const updatedSpecializations = state.specializations.map((spec) => {
                  const update = data.specializations.find(u => u.id === spec.id)
                  if (update) {
                    const updated = { ...spec, is_available: update.is_available }
                    return enhanceSpecializationWithStats(updated)
                  }
                  return spec
                })

                return {
                  ...state,
                  specializations: updatedSpecializations,
                  loading: {
                    ...state.loading,
                    availability: false
                  },
                  errors: {
                    ...state.errors,
                    availability: null
                  }
                }
              })

              console.log('✅ Availability updated successfully')
            } else {
              throw new Error(response.message || 'Failed to update availability')
            }
          } catch (error: any) {
            console.error('❌ Failed to update availability:', error)

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                availability: false
              },
              errors: {
                ...state.errors,
                availability: error.message || 'Failed to update availability'
              }
            }))
          }
        },

        resetWorkloads: async () => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              resetWorkloads: true
            },
            errors: {
              ...state.errors,
              resetWorkloads: null
            }
          }))

          try {
            console.log('👥 Resetting workload counters')

            const response = await counselorSpecializationsService.resetWorkloads()

            if (response.success) {
              await actions.refreshAll()

              set((state) => ({
                ...state,
                loading: {
                  ...state.loading,
                  resetWorkloads: false
                },
                errors: {
                  ...state.errors,
                  resetWorkloads: null
                }
              }))

              console.log('✅ Workload counters reset successfully')
            } else {
              throw new Error(response.message || 'Failed to reset workload counters')
            }
          } catch (error: any) {
            console.error('❌ Failed to reset workloads:', error)

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                resetWorkloads: false
              },
              errors: {
                ...state.errors,
                resetWorkloads: error.message || 'Failed to reset workload counters'
              }
            }))
          }
        },

        getSpecializationById: (id: number) => {
          const state = get()
          return state.specializations.find(s => s.id === id) || null
        },

        getSpecializationsByCategory: (categoryId: number) => {
          const state = get()
          return state.specializations.filter(s => s.category_id === categoryId)
        },

        getSpecializationsByCounselor: (userId: number) => {
          const state = get()
          return state.specializations.filter(s => s.user_id === userId)
        },

        getAvailableCounselorsForCategory: async (categoryId: number) => {
          set((state) => ({
            ...state,
            loading: {
              ...state.loading,
              availableCounselors: true
            },
            errors: {
              ...state.errors,
              availableCounselors: null
            }
          }))

          try {
            console.log('👥 Fetching available counselors for category:', categoryId)

            const response = await counselorSpecializationsService.getAvailableCounselors(categoryId)

            if (response.success && response.data) {
              set((state) => ({
                ...state,
                loading: {
                  ...state.loading,
                  availableCounselors: false
                },
                errors: {
                  ...state.errors,
                  availableCounselors: null
                }
              }))

              console.log('✅ Available counselors fetched successfully')
              return response.data
            } else {
              throw new Error(response.message || 'Failed to fetch available counselors')
            }
          } catch (error: any) {
            console.error('❌ Failed to fetch available counselors:', error)

            set((state) => ({
              ...state,
              loading: {
                ...state.loading,
                availableCounselors: false
              },
              errors: {
                ...state.errors,
                availableCounselors: error.message || 'Failed to fetch available counselors'
              }
            }))

            return null
          }
        },

        setFilters: (newFilters: Partial<SpecializationFilters>) => {
          set((state) => ({
            ...state,
            filters: { ...state.filters, ...newFilters }
          }))
        },

        clearFilters: () => {
          set((state) => ({
            ...state,
            filters: { ...DEFAULT_FILTERS }
          }))
        },

        setCurrentSpecialization: (specialization: CounselorSpecializationWithStats | null) => {
          set((state) => ({ 
            ...state,
            currentSpecialization: specialization 
          }))
        },

        selectSpecialization: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedSpecializations)
            newSet.add(id)
            return { 
              ...state,
              selectedSpecializations: newSet 
            }
          })
        },

        deselectSpecialization: (id: number) => {
          set((state) => {
            const newSet = new Set(state.selectedSpecializations)
            newSet.delete(id)
            return { 
              ...state,
              selectedSpecializations: newSet 
            }
          })
        },

        clearSelection: () => {
          set((state) => ({ 
            ...state,
            selectedSpecializations: new Set<number>() 
          }))
        },

        clearError: (type: keyof ErrorState) => {
          set((state) => ({
            ...state,
            errors: { ...state.errors, [type]: null }
          }))
        },

        setError: (type: keyof ErrorState, message: string) => {
          set((state) => ({
            ...state,
            errors: { ...state.errors, [type]: message }
          }))
        },

        invalidateCache: () => {
          set((state) => ({ 
            ...state,
            lastFetch: 0
          }))
          console.log('🗑️ Cache invalidated')
        },

        exportSpecializations: async (format: 'csv' | 'json' = 'csv') => {
          try {
            console.log('👥 Exporting specializations:', format)

            const response = await counselorSpecializationsService.exportSpecializations(format)

            if (response.success) {
              console.log('✅ Specializations exported successfully')
            } else {
              throw new Error(response.message || 'Failed to export specializations')
            }
          } catch (error: any) {
            console.error('❌ Failed to export specializations:', error)
            set((state) => ({
              ...state,
              errors: { ...state.errors, specializations: error.message || 'Failed to export specializations' }
            }))
          }
        },
      }

      // Return initial state with actions
      return {
        // Initial state
        specializations: [],
        availableStaff: [],
        workloadStats: null,
        currentSpecialization: null,
        filters: { ...DEFAULT_FILTERS },
        
        loading: {
          specializations: false,
          staff: false,
          create: false,
          update: false,
          delete: false,
          bulkAssign: false,
          availability: false,
          workloadStats: false,
          resetWorkloads: false,
          availableCounselors: false,
        },
        
        errors: {
          specializations: null,
          staff: null,
          create: null,
          update: null,
          delete: null,
          bulkAssign: null,
          availability: null,
          workloadStats: null,
          resetWorkloads: null,
          availableCounselors: null,
        },
        
        lastFetch: 0,
        cacheTtl: CACHE_TTL,
        
        selectedSpecializations: new Set<number>(),
        
        // Actions
        actions,
      }
    },
    { name: 'counselor-specializations-store' }
  )
)

// FIXED: Individual property selectors to prevent object recreation
export const useCounselorSpecializationsData = () => {
  // FIXED: Use individual selectors instead of object selector
  const specializations = useCounselorSpecializationsStore(useCallback((state) => state.specializations, []))
  const availableStaff = useCounselorSpecializationsStore(useCallback((state) => state.availableStaff, []))
  const workloadStats = useCounselorSpecializationsStore(useCallback((state) => state.workloadStats, []))
  const currentSpecialization = useCounselorSpecializationsStore(useCallback((state) => state.currentSpecialization, []))
  const filters = useCounselorSpecializationsStore(useCallback((state) => state.filters, []))
  const loading = useCounselorSpecializationsStore(useCallback((state) => state.loading, []))
  const errors = useCounselorSpecializationsStore(useCallback((state) => state.errors, []))
  const lastFetch = useCounselorSpecializationsStore(useCallback((state) => state.lastFetch, []))

  // FIXED: Return memoized object to prevent recreation
  return useMemo(() => ({
    specializations,
    availableStaff,
    workloadStats,
    currentSpecialization,
    filters,
    loading,
    errors,
    lastFetch
  }), [specializations, availableStaff, workloadStats, currentSpecialization, filters, loading, errors, lastFetch])
}

export const useCounselorSpecializationsActions = () => {
  return useCounselorSpecializationsStore(useCallback((state) => state.actions, []))
}

// FIXED: Stable utilities hook with memoized functions
export const useCounselorSpecializationsUtilities = () => {
  const availableStaff = useCounselorSpecializationsStore(useCallback((state) => state.availableStaff, []))
  const specializations = useCounselorSpecializationsStore(useCallback((state) => state.specializations, []))
  
  // FIXED: Return memoized utility functions to prevent recreation
  return useMemo(() => {
    const getStaffOptions = () => {
      return availableStaff.map(staff => ({
        value: staff.id,
        label: staff.name,
        description: `${staff.role} - ${staff.email}`,
        role: staff.role,
        status: staff.status
      }))
    }
    
    return {
      getStaffOptions,
      
      getSpecializationById: (id: number) => 
        specializations.find(s => s.id === id) || null,
      
      getSpecializationsByCategory: (categoryId: number) => 
        specializations.filter(s => s.category_id === categoryId),
      
      getSpecializationsByCounselor: (userId: number) => 
        specializations.filter(s => s.user_id === userId),
      
      getAvailableSpecializations: () => 
        specializations.filter(s => s.is_available),
      
      getOverloadedCounselors: () => 
        specializations.filter(s => s.current_workload >= s.max_workload),

      getCounselorWorkload: (userId: number) => {
        const counselorSpecs = specializations.filter(s => s.user_id === userId)
        return {
          totalCapacity: counselorSpecs.reduce((sum, s) => sum + s.max_workload, 0),
          currentWorkload: counselorSpecs.reduce((sum, s) => sum + s.current_workload, 0),
          specializations: counselorSpecs.length,
          avgUtilization: counselorSpecs.length > 0 
            ? Math.round((counselorSpecs.reduce((sum, s) => sum + s.utilization_rate, 0) / counselorSpecs.length) * 10) / 10
            : 0
        }
      }
    }
  }, [availableStaff, specializations])
}

// FIXED: Individual selectors with proper memoization (like ticket store)
export const useCounselorSpecializationById = (id: number) => {
  return useCounselorSpecializationsStore(
    useCallback((state) => {
      return state.specializations.find((s) => s.id === id) || null
    }, [id])
  )
}

export const useCounselorSpecializationsLoading = (type: keyof LoadingState = 'specializations') => {
  return useCounselorSpecializationsStore(useCallback((state) => state.loading[type], [type]))
}

export const useCounselorSpecializationsError = (type: keyof ErrorState = 'specializations') => {
  return useCounselorSpecializationsStore(useCallback((state) => state.errors[type], [type]))
}

// FIXED: Stats selector with stable calculation (like ticket store pattern)
export const useCounselorSpecializationsStats = () => {
  const specializations = useCounselorSpecializationsStore(useCallback((state) => state.specializations, []))
  
  return useMemo(() => {
    const total = specializations.length
    const available = specializations.filter(s => s.is_available).length
    const totalCapacity = specializations.reduce((sum, s) => sum + s.max_workload, 0)
    const currentWorkload = specializations.reduce((sum, s) => sum + s.current_workload, 0)
    const avgUtilization = total > 0 ? 
      Math.round(specializations.reduce((sum, s) => sum + s.utilization_rate, 0) / total) : 0

    return {
      total,
      available,
      totalCapacity,
      currentWorkload,
      avgUtilization
    }
  }, [specializations])
}

// FIXED: Selectors with stable references (like ticket store pattern)
export const useCounselorSpecializationsSelectors = () => {
  const specializations = useCounselorSpecializationsStore(useCallback((state) => state.specializations, []))
  
  return useMemo(() => {
    return {
      overloadedCounselors: specializations.filter(s => s.utilization_rate >= 100),
      availableCounselors: specializations.filter(s => s.can_take_ticket),
      byCategory: specializations.reduce((acc, spec) => {
        const categoryName = spec.category?.name || 'Unknown'
        if (!acc[categoryName]) acc[categoryName] = []
        acc[categoryName].push(spec)
        return acc
      }, {} as Record<string, CounselorSpecializationWithStats[]>)
    }
  }, [specializations])
}

// Export the store for direct access when needed
export default useCounselorSpecializationsStore