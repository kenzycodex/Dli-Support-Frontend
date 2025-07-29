// components/dialogs/CounselorDialog.tsx - FIXED: Using user store for counselor dropdown
"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, Loader2, AlertCircle, UserCheck, Star } from "lucide-react"
import { toast } from "sonner"
import { 
  useCounselorSpecializationsData,
  useCounselorSpecializationsActions,
  CounselorSpecializationWithStats
} from "@/stores/counselorSpecializations-store"
import { useCategoriesData } from "@/stores/ticketCategories-store"
import { useUserStore, useUserActions, useUserLoading } from "@/stores/user-store"
import { CounselorDialogState } from "../../types/admin-types"
import { CounselorSpecializationFormData } from "../../types/form-types"

interface CounselorDialogProps {
  dialogState: CounselorDialogState
  formData: CounselorSpecializationFormData
  onFormChange: (data: Partial<CounselorSpecializationFormData>) => void
  onClose: () => void
  onSave: () => void
}

export function CounselorDialog({
  dialogState,
  formData,
  onFormChange,
  onClose,
  onSave
}: CounselorDialogProps) {
  // FIXED: Use user store for counselors instead of the complex counselor service
  const allUsers = useUserStore((state) => state.allUsers)
  const userActions = useUserActions()
  const userLoading = useUserLoading()
  
  // Keep counselor specializations data for existing specializations
  const counselorData = useCounselorSpecializationsData()
  const counselorActions = useCounselorSpecializationsActions()
  const categoriesData = useCategoriesData()

  // FIXED: Local state with stable initialization
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [existingSpecializations, setExistingSpecializations] = useState<CounselorSpecializationWithStats[]>([])
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  // FIXED: Get counselors and advisors from user store - much simpler!
  const counselors = useMemo(() => {
    return allUsers.filter(user => 
      ['counselor', 'advisor'].includes(user.role) && 
      user.status === 'active'
    )
  }, [allUsers])

  // FIXED: Simple staff options from user store
  const staffOptions = useMemo(() => {
    return counselors.map(user => ({
      value: user.id,
      label: user.name,
      description: `${user.role} - ${user.email}`,
      role: user.role,
      status: user.status
    }))
  }, [counselors])

  // FIXED: Available categories logic
  const availableCategories = useMemo(() => {
    const { categories = [] } = categoriesData
    
    if (!categories.length) return []
    
    if (!formData.user_id || dialogState.mode === 'edit') {
      return categories.filter(c => c.is_active)
    }

    // For create mode, filter out categories the user is already assigned to
    const assignedCategoryIds = existingSpecializations.map(spec => spec.category_id)
    return categories.filter(c => c.is_active && !assignedCategoryIds.includes(c.id))
  }, [formData.user_id, dialogState.mode, categoriesData.categories, existingSpecializations])

  // FIXED: Load users when dialog opens - much simpler than the complex counselor service
  const loadUsersWhenNeeded = useCallback(() => {
    if (dialogState.isOpen && allUsers.length === 0 && !userLoading.users) {
      console.log('🔄 Loading users for counselor dropdown')
      userActions.fetchUsers({}, true)
    }
  }, [dialogState.isOpen, allUsers.length, userLoading.users, userActions.fetchUsers])

  // Load users when dialog opens
  useEffect(() => {
    loadUsersWhenNeeded()
  }, [loadUsersWhenNeeded])

  // FIXED: Update selected staff info when user_id changes
  useEffect(() => {
    if (formData.user_id && counselors.length > 0) {
      const staff = counselors.find(u => u.id === formData.user_id)
      
      if (staff && (!selectedStaff || staff.id !== selectedStaff.id)) {
        console.log('👤 Updating selected staff:', staff.name)
        setSelectedStaff(staff)
        
        // Get existing specializations for this user from counselor data
        const userSpecializations = counselorData.specializations.filter(
          spec => spec.user_id === staff.id
        )
        setExistingSpecializations(userSpecializations)
      }
    } else if (!formData.user_id && selectedStaff) {
      setSelectedStaff(null)
      setExistingSpecializations([])
    }
  }, [formData.user_id, counselors, selectedStaff?.id, counselorData.specializations])

  // FIXED: Check for conflicts when category changes
  useEffect(() => {
    if (formData.user_id && formData.category_id && existingSpecializations.length > 0) {
      const existingInCategory = existingSpecializations.find(
        spec => spec.category_id === formData.category_id
      )
      
      const isEditingSameSpecialization = dialogState.specialization && 
        existingInCategory && 
        existingInCategory.id === dialogState.specialization.id

      if (existingInCategory && !isEditingSameSpecialization) {
        const warningMessage = `This counselor is already assigned to this category with ${existingInCategory.priority_level} priority level`
        setConflictWarning(warningMessage)
      } else {
        setConflictWarning(null)
      }
    } else {
      setConflictWarning(null)
    }
  }, [
    formData.user_id, 
    formData.category_id, 
    existingSpecializations, 
    dialogState.specialization?.id
  ])

  // FIXED: Stable form change handler
  const handleFormChange = useCallback((field: string, value: any) => {
    if (field === 'user_id') {
      onFormChange({
        [field]: value,
        category_id: 0, // Reset category selection
      })
    } else {
      onFormChange({ [field]: value })
    }
  }, [onFormChange])

  // FIXED: Enhanced save with validation
  const handleSave = useCallback(() => {
    // Validation
    if (!formData.user_id) {
      toast.error('Please select a counselor')
      return
    }

    if (!formData.category_id) {
      toast.error('Please select a category')
      return
    }

    if (conflictWarning && dialogState.mode === 'create') {
      toast.error('Cannot assign counselor to the same category twice')
      return
    }

    if (formData.max_workload < 1 || formData.max_workload > 50) {
      toast.error('Max workload must be between 1 and 50')
      return
    }

    if (formData.expertise_rating < 1 || formData.expertise_rating > 5) {
      toast.error('Expertise rating must be between 1 and 5')
      return
    }

    onSave()
  }, [
    formData.user_id,
    formData.category_id,
    formData.max_workload,
    formData.expertise_rating,
    conflictWarning,
    dialogState.mode,
    onSave
  ])

  // Calculate total workload for selected staff
  const totalWorkload = useMemo(() => {
    if (!selectedStaff) return 0
    return existingSpecializations.reduce((total, spec) => total + spec.max_workload, 0)
  }, [selectedStaff, existingSpecializations])

  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>
              {dialogState.mode === 'create' ? 'Add Counselor Specialization' : 'Edit Specialization'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {dialogState.mode === 'create' 
              ? 'Assign a counselor to a category with specific expertise and workload settings.'
              : 'Update the counselor specialization settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="counselor-user">Counselor *</Label>
              {userLoading.users ? (
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Loading counselors...</span>
                </div>
              ) : (
                <Select
                  value={formData.user_id?.toString() || ""}
                  onValueChange={(value) => handleFormChange('user_id', parseInt(value))}
                  disabled={userLoading.users}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffOptions.length === 0 ? (
                      <SelectItem value="0" disabled>
                        {userLoading.users ? 'Loading...' : 'No counselors available'}
                      </SelectItem>
                    ) : (
                      staffOptions.map((staff) => (
                        <SelectItem key={staff.value} value={staff.value.toString()}>
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium">{staff.label}</div>
                              <div className="text-xs text-gray-500">{staff.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor-category">Category *</Label>
              <Select
                value={formData.category_id?.toString() || ""}
                onValueChange={(value) => handleFormChange('category_id', parseInt(value))}
                disabled={!formData.user_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.length === 0 ? (
                    <SelectItem value="0" disabled>
                      {!formData.user_id 
                        ? 'Select a counselor first' 
                        : 'No available categories'}
                    </SelectItem>
                  ) : (
                    availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                          {category.crisis_detection_enabled && (
                            <Badge variant="destructive" className="text-xs">Crisis</Badge>
                          )}
                          {category.auto_assign && (
                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {conflictWarning && (
                <div className="flex items-center space-x-1 text-amber-600 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  <span>{conflictWarning}</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Staff Info */}
          {selectedStaff && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900">Selected Counselor</h4>
                <Badge variant="outline" className="text-blue-700">
                  {selectedStaff.role}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Name:</span> {selectedStaff.name}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Email:</span> {selectedStaff.email}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Current Specializations:</span> {existingSpecializations.length}
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Total Workload:</span> {totalWorkload}
                </div>
              </div>
              
              {existingSpecializations.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-blue-700 mb-1">Existing Categories:</div>
                  <div className="flex flex-wrap gap-1">
                    {existingSpecializations.map((spec) => (
                      <Badge key={spec.id} variant="outline" className="text-xs">
                        {spec.category?.name} ({spec.priority_level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuration Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="counselor-priority">Priority Level *</Label>
              <Select
                value={formData.priority_level}
                onValueChange={(value: 'primary' | 'secondary' | 'backup') => 
                  handleFormChange('priority_level', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Primary</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="secondary">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Secondary</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="backup">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span>Backup</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor-workload">Max Workload *</Label>
              <Input
                id="counselor-workload"
                type="number"
                value={formData.max_workload}
                onChange={(e) => handleFormChange('max_workload', parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                className="text-center"
              />
              <div className="text-xs text-gray-500 text-center">
                Maximum concurrent tickets
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor-expertise">Expertise Rating</Label>
              <Select
                value={formData.expertise_rating.toString()}
                onValueChange={(value) => handleFormChange('expertise_rating', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>
                          {rating === 1 && 'Beginner'}
                          {rating === 2 && 'Novice'}
                          {rating === 3 && 'Intermediate'}
                          {rating === 4 && 'Advanced'}
                          {rating === 5 && 'Expert'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Availability and Notes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="counselor-available"
                checked={formData.is_available}
                onCheckedChange={(checked) => handleFormChange('is_available', checked)}
              />
              <Label htmlFor="counselor-available" className="flex flex-col">
                <span>Available for Assignment</span>
                <span className="text-xs text-gray-600">Can receive new ticket assignments</span>
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counselor-notes">Notes (Optional)</Label>
              <Textarea
                id="counselor-notes"
                value={formData.notes || ''}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Additional notes about this specialization..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">
                {(formData.notes || '').length}/500 characters
              </div>
            </div>
          </div>

          {/* Workload Preview */}
          {selectedStaff && formData.max_workload && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Workload Preview</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Current Total</div>
                  <div className="font-medium">{totalWorkload}</div>
                </div>
                <div>
                  <div className="text-gray-600">New Max</div>
                  <div className="font-medium">+{formData.max_workload}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Capacity</div>
                  <div className="font-medium">{totalWorkload + formData.max_workload}</div>
                </div>
                <div>
                  <div className="text-gray-600">Categories</div>
                  <div className="font-medium">{existingSpecializations.length + 1}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={counselorData.loading.create || counselorData.loading.update || !!conflictWarning}
            className="w-full sm:w-auto"
          >
            {(counselorData.loading.create || counselorData.loading.update) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {dialogState.mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                {dialogState.mode === 'create' ? 'Add Specialization' : 'Update Specialization'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}