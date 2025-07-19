// components/features/edit-user-modal.tsx

"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit, User, Shield, AlertCircle, Calendar, Phone, Mail, FileText } from "lucide-react"

import { useUserActions } from "@/stores/user-store"
import { userService, type UpdateUserRequest } from "@/services/user.service"
import type { UserItem } from "@/stores/user-store"

interface EditUserModalProps {
  open: boolean
  onClose: () => void
  user: UserItem
  onUserUpdated: () => void
}

export function EditUserModal({ open, onClose, user, onUserUpdated }: EditUserModalProps) {
  const { updateUser } = useUserActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: "",
    email: "",
    role: "student",
    status: "active",
    phone: "",
    address: "",
    date_of_birth: "",
    student_id: "",
    employee_id: "",
    bio: "",
  })

  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
    changePassword: false,
  })

  // Initialize form data when user changes
  useEffect(() => {
    if (user && open) {
      console.log('🔄 EditUserModal: Initializing form with user data:', user)
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role as any,
        status: user.status as any,
        phone: user.phone || "",
        address: user.address || "",
        date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : "",
        student_id: user.student_id || "",
        employee_id: user.employee_id || "",
        bio: user.bio || "",
      })
      setPasswordData({
        password: "",
        password_confirmation: "",
        changePassword: false,
      })
      setError("")
      setValidationErrors({})
    }
  }, [user, open])

  const validateForm = (): boolean => {
    console.log('✅ Validating edit form data:', formData)
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!formData.name?.trim()) {
      errors.name = "Full name is required"
    }
    if (!formData.email?.trim()) {
      errors.email = "Email is required"
    }
    
    // Email format validation
    if (formData.email && !userService.validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    // Password validation (only if changing password)
    if (passwordData.changePassword) {
      if (!passwordData.password) {
        errors.password = "New password is required"
      } else {
        const passwordValidation = userService.validatePassword(passwordData.password)
        if (!passwordValidation.valid) {
          errors.password = passwordValidation.errors[0]
        }
      }
      
      if (passwordData.password !== passwordData.password_confirmation) {
        errors.password_confirmation = "Passwords do not match"
      }
    }
    
    // Date validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      if (birthDate >= today) {
        errors.date_of_birth = "Date of birth must be in the past"
      }
    }
    
    console.log('❌ Edit validation errors found:', errors)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Edit form submission started for user:', user.id)
    
    setError("")
    setValidationErrors({})
    
    // Client-side validation
    if (!validateForm()) {
      console.log('❌ Client-side validation failed')
      return
    }
    
    setLoading(true)
    console.log('⏳ Setting loading state to true')

    try {
      // Prepare clean data for API
      const updateData: UpdateUserRequest = {
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        role: formData.role,
        status: formData.status,
      }
      
      // Add optional fields only if they have values
      if (formData.phone?.trim()) {
        updateData.phone = formData.phone.trim()
      }
      if (formData.address?.trim()) {
        updateData.address = formData.address.trim()
      }
      if (formData.date_of_birth) {
        updateData.date_of_birth = formData.date_of_birth
      }
      if (formData.student_id?.trim()) {
        updateData.student_id = formData.student_id.trim()
      }
      if (formData.employee_id?.trim()) {
        updateData.employee_id = formData.employee_id.trim()
      }
      if (formData.bio?.trim()) {
        updateData.bio = formData.bio.trim()
      }
      
      // Add password fields if changing password
      if (passwordData.changePassword && passwordData.password) {
        updateData.password = passwordData.password
        updateData.password_confirmation = passwordData.password_confirmation
      }
      
      console.log('📤 Sending update data to API:', updateData)
      
      await updateUser(user.id, updateData)
      
      console.log('✅ User updated successfully')
      onUserUpdated()
      onClose()
    } catch (err: any) {
      console.error('💥 Update error:', err)
      
      // Handle backend validation errors
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        Object.keys(err.response.data.errors).forEach(key => {
          const errorArray = err.response.data.errors[key]
          if (Array.isArray(errorArray)) {
            backendErrors[key] = errorArray[0]
          } else if (typeof errorArray === 'string') {
            backendErrors[key] = errorArray
          }
        })
        setValidationErrors(backendErrors)
      } else {
        setError(err.message || "Failed to update user")
      }
    } finally {
      setLoading(false)
      console.log('⏳ Setting loading state to false')
    }
  }

  const handleClose = () => {
    if (!loading) {
      console.log('🚪 Closing edit modal')
      onClose()
    }
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  const updateFormData = (field: keyof UpdateUserRequest, value: string) => {
    console.log(`📝 Updating field ${field}:`, value)
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const updatePasswordData = (field: keyof typeof passwordData, value: string | boolean) => {
    console.log(`🔑 Updating password field ${field}:`, value)
    setPasswordData(prev => ({ ...prev, [field]: value }))
    
    // Clear password-related validation errors
    if (typeof value === 'string' && validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-violet-600" />
            <span>Edit User: {user.display_name}</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Additional Details</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input
                        id="edit-name"
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Enter full name"
                        required
                        disabled={loading}
                        className={getFieldError('name') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('name') && (
                        <p className="text-sm text-red-600">{getFieldError('name')}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="user@university.edu"
                        required
                        disabled={loading}
                        className={getFieldError('email') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('email') && (
                        <p className="text-sm text-red-600">{getFieldError('email')}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: any) => updateFormData('role', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className={getFieldError('role') ? 'border-red-300 focus:border-red-500' : ''}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="counselor">Counselor</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {getFieldError('role') && (
                        <p className="text-sm text-red-600">{getFieldError('role')}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => updateFormData('status', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="+1234567890"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-date-of-birth">Date of Birth</Label>
                      <Input
                        id="edit-date-of-birth"
                        type="date"
                        value={formData.date_of_birth || ""}
                        onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                        disabled={loading}
                        className={getFieldError('date_of_birth') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('date_of_birth') && (
                        <p className="text-sm text-red-600">{getFieldError('date_of_birth')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Additional Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      value={formData.address || ""}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="Enter address"
                      disabled={loading}
                      rows={3}
                    />
                  </div>

                  {formData.role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-student-id">Student ID</Label>
                      <Input
                        id="edit-student-id"
                        type="text"
                        value={formData.student_id || ""}
                        onChange={(e) => updateFormData('student_id', e.target.value)}
                        placeholder="STU001"
                        disabled={loading}
                        className={getFieldError('student_id') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('student_id') && (
                        <p className="text-sm text-red-600">{getFieldError('student_id')}</p>
                      )}
                    </div>
                  )}

                  {(formData.role === "counselor" || formData.role === "advisor" || formData.role === "admin") && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-employee-id">Employee ID</Label>
                      <Input
                        id="edit-employee-id"
                        type="text"
                        value={formData.employee_id || ""}
                        onChange={(e) => updateFormData('employee_id', e.target.value)}
                        placeholder="EMP001"
                        disabled={loading}
                        className={getFieldError('employee_id') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('employee_id') && (
                        <p className="text-sm text-red-600">{getFieldError('employee_id')}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      value={formData.bio || ""}
                      onChange={(e) => updateFormData('bio', e.target.value)}
                      placeholder="Enter bio or description..."
                      disabled={loading}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="change-password"
                      checked={passwordData.changePassword}
                      onChange={(e) => updatePasswordData('changePassword', e.target.checked)}
                      disabled={loading}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <Label htmlFor="change-password" className="text-sm">
                      Change user password
                    </Label>
                  </div>

                  {passwordData.changePassword && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-password">New Password *</Label>
                          <Input
                            id="edit-password"
                            type="password"
                            value={passwordData.password}
                            onChange={(e) => updatePasswordData('password', e.target.value)}
                            placeholder="Minimum 8 characters"
                            disabled={loading}
                            className={getFieldError('password') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                          {getFieldError('password') && (
                            <p className="text-sm text-red-600">{getFieldError('password')}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-password-confirmation">Confirm New Password *</Label>
                          <Input
                            id="edit-password-confirmation"
                            type="password"
                            value={passwordData.password_confirmation}
                            onChange={(e) => updatePasswordData('password_confirmation', e.target.value)}
                            placeholder="Confirm new password"
                            disabled={loading}
                            className={getFieldError('password_confirmation') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                          {getFieldError('password_confirmation') && (
                            <p className="text-sm text-red-600">{getFieldError('password_confirmation')}</p>
                          )}
                        </div>
                      </div>

                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-sm">
                          <div className="space-y-1">
                            <div>• Password must be at least 8 characters long</div>
                            <div>• User will be required to log in again after password change</div>
                            <div>• All existing sessions will be invalidated</div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">User Information</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>User ID:</span>
                        <span className="font-mono">{user.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{userService.formatDate(user.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Login:</span>
                        <span>{userService.formatDate(user.last_login_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Status:</span>
                        <Badge variant="outline" className={userService.getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}