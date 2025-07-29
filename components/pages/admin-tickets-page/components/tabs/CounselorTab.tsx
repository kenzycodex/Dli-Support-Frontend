// components/tabs/CounselorTab.tsx - FIXED with stable state management
"use client"

import React, { useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Edit, Trash2, RefreshCw, BarChart3, AlertCircle, CheckCircle, TrendingUp } from "lucide-react"
import { 
  useCounselorSpecializationsData,
  useCounselorSpecializationsActions,
  useCounselorSpecializationsStats,
  useCounselorSpecializationsSelectors,
  CounselorSpecializationWithStats
} from "@/stores/counselorSpecializations-store"
import { toast } from "sonner"

interface CounselorTabProps {
  onCreateSpecialization: () => void
  onEditSpecialization: (specialization: CounselorSpecializationWithStats) => void
  onDeleteSpecialization: (specialization: CounselorSpecializationWithStats) => void
}

export function CounselorTab({
  onCreateSpecialization,
  onEditSpecialization,
  onDeleteSpecialization
}: CounselorTabProps) {
  // FIXED: Use stable hooks without excessive destructuring
  const counselorData = useCounselorSpecializationsData()
  const counselorActions = useCounselorSpecializationsActions()
  const stats = useCounselorSpecializationsStats()
  const selectors = useCounselorSpecializationsSelectors()

  // FIXED: Stable initialization with useCallback
  const initializeData = useCallback(async () => {
    console.log('👥 CounselorTab: Initializing data')
    try {
      await Promise.all([
        counselorActions.fetchSpecializations(),
        counselorActions.fetchAvailableStaff(),
        counselorActions.fetchWorkloadStats()
      ])
    } catch (error) {
      console.error('❌ CounselorTab: Failed to initialize data:', error)
    }
  }, [
    counselorActions.fetchSpecializations,
    counselorActions.fetchAvailableStaff,
    counselorActions.fetchWorkloadStats
  ])

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // FIXED: Stable refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await counselorActions.refreshAll()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('❌ CounselorTab: Refresh failed:', error)
      toast.error('Failed to refresh data')
    }
  }, [counselorActions.refreshAll])

  // FIXED: Stable delete handler
  const handleDeleteSpecialization = useCallback(async (specialization: CounselorSpecializationWithStats) => {
    try {
      await counselorActions.deleteSpecialization(specialization.id)
      toast.success(`Removed ${specialization.user?.name} from ${specialization.category?.name}`)
    } catch (error: any) {
      console.error('❌ CounselorTab: Delete failed:', error)
      toast.error(error.message || 'Failed to remove counselor from category')
    }
  }, [counselorActions.deleteSpecialization])

  // FIXED: Stable reset workloads handler
  const handleResetWorkloads = useCallback(async () => {
    try {
      await counselorActions.resetWorkloads()
      toast.success('Workload counters reset successfully')
    } catch (error) {
      console.error('❌ CounselorTab: Reset workloads failed:', error)
      toast.error('Failed to reset workload counters')
    }
  }, [counselorActions.resetWorkloads])

  // FIXED: Stable utility functions
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'primary':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'secondary':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'backup':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getUtilizationColor = useCallback((rate: number) => {
    if (rate >= 100) return 'text-red-600'
    if (rate >= 80) return 'text-orange-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }, [])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Counselor Specializations</span>
            </CardTitle>
            <CardDescription>Assign counselors to categories and manage their workloads</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={counselorData.loading.specializations}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${counselorData.loading.specializations ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={onCreateSpecialization}
              disabled={counselorData.loading.specializations} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Assign Counselor</span>
              <span className="sm:hidden">Assign</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Error Display */}
        {counselorData.errors.specializations && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{counselorData.errors.specializations}</span>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {counselorData.loading.specializations ? '...' : stats.total}
                </div>
                <div className="text-sm text-blue-700">Total Assignments</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {counselorData.loading.specializations ? '...' : stats.available}
                </div>
                <div className="text-sm text-green-700">Available</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {counselorData.loading.specializations ? '...' : stats.totalCapacity}
                </div>
                <div className="text-sm text-yellow-700">Total Capacity</div>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {counselorData.loading.specializations ? '...' : `${stats.avgUtilization}%`}
                </div>
                <div className="text-sm text-purple-700">Avg Utilization</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetWorkloads}
            disabled={counselorData.loading.resetWorkloads}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${counselorData.loading.resetWorkloads ? 'animate-spin' : ''}`} />
            Reset Workloads
          </Button>
          
          {selectors.overloadedCounselors.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {selectors.overloadedCounselors.length} Overloaded
            </Badge>
          )}
          
          {selectors.availableCounselors.length > 0 && (
            <Badge variant="default" className="bg-green-600">
              {selectors.availableCounselors.length} Available
            </Badge>
          )}
        </div>

        {/* Specializations List */}
        {counselorData.loading.specializations && counselorData.specializations.length === 0 ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : counselorData.specializations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {counselorData.specializations.map((specialization) => (
              <Card
                key={specialization.id}
                className="border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    {/* Counselor Info */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {specialization.user?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {specialization.user?.name || 'Unknown Counselor'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {specialization.user?.email || 'No email'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {specialization.user?.role || 'Unknown Role'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Category Info */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: specialization.category?.color || '#gray' }}
                          />
                          <h4 className="font-medium text-gray-900 truncate">
                            {specialization.category?.name || 'Unknown Category'}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(specialization.priority_level)}`}
                          >
                            {specialization.priority_level}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <span>★</span>
                            <span>{specialization.expertise_rating || 3}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workload Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {specialization.current_workload}/{specialization.max_workload}
                        </div>
                        <div className="text-xs text-gray-500">Workload</div>
                        <div className={`text-xs font-medium ${getUtilizationColor(specialization.utilization_rate || 0)}`}>
                          {specialization.utilization_rate || 0}%
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {specialization.is_available ? (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                        
                        {specialization.can_take_ticket && (
                          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                            Can Take Tickets
                          </Badge>
                        )}
                        
                        {(specialization.utilization_rate || 0) >= 100 && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Overloaded
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditSpecialization(specialization)}
                        className="h-8 w-8 p-0"
                        title="Edit Specialization"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSpecialization(specialization)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Remove from Category"
                        disabled={counselorData.loading.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  {specialization.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">
                        "{specialization.notes}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No counselor assignments found</h3>
            <p className="text-gray-600 mb-4">
              Assign counselors to categories to manage their workloads and specializations
            </p>
            <Button onClick={onCreateSpecialization}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Counselor to Category
            </Button>
          </div>
        )}

        {/* Workload Statistics */}
        {counselorData.workloadStats && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Workload Overview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Total Capacity</div>
                <div className="text-lg font-bold text-blue-600">
                  {counselorData.workloadStats.overview.total_capacity}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Current Utilization</div>
                <div className="text-lg font-bold text-orange-600">
                  {counselorData.workloadStats.overview.current_utilization}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Available Counselors</div>
                <div className="text-lg font-bold text-green-600">
                  {counselorData.workloadStats.overview.available_counselors}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Assigned Counselors</div>
                <div className="text-lg font-bold text-purple-600">
                  {counselorData.workloadStats.overview.assigned_counselors}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}