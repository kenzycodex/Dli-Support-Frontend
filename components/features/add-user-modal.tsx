// components/features/add-user-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus } from "lucide-react"
import { userService, CreateUserRequest } from "@/services/user.service"

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onUserAdded: () => void
}

export function AddUserModal({ open, onClose, onUserAdded }: AddUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const initialFormData: CreateUserRequest = {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "student",
    status: "active",
    phone: "",
    student_id: "",
    employee_id: "",
  }
  
  const [formData, setFormData] = useState<CreateUserRequest>({ ...initialFormData })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      console.log("🔄 Modal opened - resetting form")
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    console.log("🔄 Resetting form to initial state")
    setFormData({ ...initialFormData })
    setError("")
    setValidationErrors({})
  }

  const validateForm = (): boolean => {
    console.log("✅ Validating form data:", formData)
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!formData.name?.trim()) {
      errors.name = "Full name is required"
    }
    if (!formData.email?.trim()) {
      errors.email = "Email is required"
    }
    if (!formData.password) {
      errors.password = "Password is required"
    }
    if (!formData.password_confirmation) {
      errors.password_confirmation = "Password confirmation is required"
    }
    
    // Email format validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address"
      }
    }
    
    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long"
    }
    
    // Password match validation
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = "Passwords do not match"
    }
    
    console.log("❌ Validation errors found:", errors)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Form submission started")
    console.log("📝 Form data:", formData)
    
    setError("")
    setValidationErrors({})
    
    // Client-side validation
    if (!validateForm()) {
      console.log("❌ Client-side validation failed")
      return
    }
    
    setLoading(true)
    console.log("⏳ Setting loading state to true")

    try {
      // Prepare clean data for API
      const cleanData: CreateUserRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
        status: formData.status || "active",
      }
      
      // Add optional fields only if they have values
      if (formData.phone?.trim()) {
        cleanData.phone = formData.phone.trim()
      }
      if (formData.student_id?.trim()) {
        cleanData.student_id = formData.student_id.trim()
      }
      if (formData.employee_id?.trim()) {
        cleanData.employee_id = formData.employee_id.trim()
      }
      
      console.log("📤 Sending cleaned data to API:", cleanData)
      
      const response = await userService.createUser(cleanData)
      console.log("📥 API Response:", response)

      if (response.success) {
        console.log("✅ User created successfully:", response.data)
        onUserAdded()
        onClose()
        resetForm()
      } else {
        console.log("❌ API returned error:", response)
        
        // Handle backend validation errors
        if (response.errors && typeof response.errors === 'object') {
          console.log("📋 Processing backend validation errors:", response.errors)
          const backendErrors: Record<string, string> = {}
          
          Object.keys(response.errors).forEach(key => {
            const errorArray = response.errors[key]
            if (Array.isArray(errorArray)) {
              backendErrors[key] = errorArray[0]
            } else if (typeof errorArray === 'string') {
              backendErrors[key] = errorArray
            } else {
              backendErrors[key] = String(errorArray)
            }
          })
          
          console.log("📋 Processed validation errors:", backendErrors)
          setValidationErrors(backendErrors)
        } else {
          setError(response.message || "Failed to create user")
        }
      }
    } catch (err) {
      console.error("💥 Network/unexpected error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
      console.log("⏳ Setting loading state to false")
    }
  }

  const handleClose = () => {
    if (!loading) {
      console.log("🚪 Closing modal")
      resetForm()
      onClose()
    }
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  const updateFormData = (field: keyof CreateUserRequest, value: string) => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-violet-600" />
            <span>Add New User</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
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
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Minimum 8 characters"
                required
                disabled={loading}
                minLength={8}
                className={getFieldError('password') ? 'border-red-300 focus:border-red-500' : ''}
              />
              {getFieldError('password') && (
                <p className="text-sm text-red-600">{getFieldError('password')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm Password *</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => updateFormData('password_confirmation', e.target.value)}
                placeholder="Confirm password"
                required
                disabled={loading}
                minLength={8}
                className={getFieldError('password_confirmation') ? 'border-red-300 focus:border-red-500' : ''}
              />
              {getFieldError('password_confirmation') && (
                <p className="text-sm text-red-600">{getFieldError('password_confirmation')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
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
              <Label htmlFor="status">Status</Label>
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

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="+1234567890"
              disabled={loading}
            />
          </div>

          {formData.role === "student" && (
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID</Label>
              <Input
                id="student_id"
                type="text"
                value={formData.student_id}
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
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                type="text"
                value={formData.employee_id}
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

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}