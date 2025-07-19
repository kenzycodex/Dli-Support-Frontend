// components/features/add-user-modal.tsx - UPDATED to use services and store

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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Loader2, 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  CheckCircle
} from "lucide-react"

// UPDATED: Using Zustand store and services instead of hooks
import { useUserActions, useUserLoading, useUserErrors } from "@/stores/user-store"
import { userService, type CreateUserRequest } from "@/services/user.service"
import { toast } from "sonner"

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onUserAdded: () => void
}

export function AddUserModal({ open, onClose, onUserAdded }: AddUserModalProps) {
  // UPDATED: Using Zustand store instead of hooks
  const { createUser } = useUserActions()
  const loading = useUserLoading()
  const errors = useUserErrors()
  
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  
  const initialFormData: CreateUserRequest = {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "student",
    status: "active",
    phone: "",
    address: "",
    date_of_birth: "",
    student_id: "",
    employee_id: "",
    specializations: [],
    bio: "",
  }
  
  const [formData, setFormData] = useState<CreateUserRequest>({ ...initialFormData })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      console.log("🔄 AddUserModal: Modal opened - resetting form")
      resetForm()
      if (autoGeneratePassword) {
        generatePassword()
      }
    }
  }, [open])

  // Generate password when auto-generate is toggled
  useEffect(() => {
    if (autoGeneratePassword && open) {
      generatePassword()
    } else if (!autoGeneratePassword) {
      setFormData(prev => ({
        ...prev,
        password: "",
        password_confirmation: ""
      }))
    }
  }, [autoGeneratePassword, open])

  const resetForm = () => {
    console.log("🔄 Resetting form to initial state")
    setFormData({ ...initialFormData })
    setError("")
    setValidationErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setAutoGeneratePassword(true)
    setSendWelcomeEmail(true)
  }

  const generatePassword = () => {
    // Generate a secure password using the same logic as reset password modal
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)] // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)] // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)] // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)] // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('')
    
    setFormData(prev => ({
      ...prev,
      password: shuffled,
      password_confirmation: shuffled
    }))
    
    console.log("🔑 Generated new password")
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
    if (formData.email && !userService.validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    // Password validation
    if (formData.password) {
      const passwordValidation = userService.validatePassword(formData.password)
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors[0]
      }
    }
    
    // Password match validation
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = "Passwords do not match"
    }

    // Date validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      if (birthDate >= today) {
        errors.date_of_birth = "Date of birth must be in the past"
      }
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
      if (formData.address?.trim()) {
        cleanData.address = formData.address.trim()
      }
      if (formData.date_of_birth) {
        cleanData.date_of_birth = formData.date_of_birth
      }
      if (formData.student_id?.trim()) {
        cleanData.student_id = formData.student_id.trim()
      }
      if (formData.employee_id?.trim()) {
        cleanData.employee_id = formData.employee_id.trim()
      }
      if (formData.specializations && formData.specializations.length > 0) {
        cleanData.specializations = formData.specializations
      }
      if (formData.bio?.trim()) {
        cleanData.bio = formData.bio.trim()
      }
      
      console.log("📤 Sending cleaned data to store:", cleanData)
      
      // UPDATED: Using store action instead of service directly
      const newUser = await createUser(cleanData)

      if (newUser) {
        console.log("✅ User created successfully:", newUser)
        
        // Show success message with additional info
        if (sendWelcomeEmail) {
          toast.success(`User created successfully! Welcome email sent to ${newUser.email}`)
        } else {
          toast.success("User created successfully!")
        }

        onUserAdded()
        onClose()
        resetForm()
      }
    } catch (err: any) {
      console.error("💥 Create user error:", err)
      
      // Error handling is now managed by the store
      // Additional client-side error display if needed
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        Object.keys(err.response.data.errors).forEach(key => {
          const errorArray = err.response.data.errors[key]
          if (Array.isArray(errorArray)) {
            backendErrors[key] = errorArray[0]
          } else if (typeof errorArray === 'string') {
            backendErrors[key] = errorArray
          } else {
            backendErrors[key] = String(errorArray)
          }
        })
        setValidationErrors(backendErrors)
      } else {
        setError(err.message || "Failed to create user")
      }
    }
  }

  const handleClose = () => {
    if (!loading.create) {
      console.log("🚪 Closing modal")
      resetForm()
      onClose()
    }
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  const updateFormData = (field: keyof CreateUserRequest, value: string | string[]) => {
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Password copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy password:', err)
      toast.error('Failed to copy password')
    }
  }

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: 'No password', color: 'bg-gray-200' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' }
    return { score, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-violet-600" />
            <span>Add New User</span>
          </DialogTitle>
        </DialogHeader>

        {/* UPDATED: Show store errors as well as local errors */}
        {(error || errors.create) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || errors.create}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Additional Details</TabsTrigger>
              <TabsTrigger value="security">Security & Options</TabsTrigger>
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
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="Enter full name"
                        required
                        disabled={loading.create}
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
                        disabled={loading.create}
                        className={getFieldError('email') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('email') && (
                        <p className="text-sm text-red-600">{getFieldError('email')}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: any) => updateFormData('role', value)}
                        disabled={loading.create}
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
                        disabled={loading.create}
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="+1234567890"
                        disabled={loading.create}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                        disabled={loading.create}
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
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="Enter address"
                      disabled={loading.create}
                      rows={3}
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
                        disabled={loading.create}
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
                        disabled={loading.create}
                        className={getFieldError('employee_id') ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {getFieldError('employee_id') && (
                        <p className="text-sm text-red-600">{getFieldError('employee_id')}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateFormData('bio', e.target.value)}
                      placeholder="Enter bio or description..."
                      disabled={loading.create}
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
                    <span>Security & Password</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-generate"
                      checked={autoGeneratePassword}
                      onCheckedChange={(checked) => setAutoGeneratePassword(checked as boolean)}
                      disabled={loading.create}
                    />
                    <Label htmlFor="auto-generate" className="text-sm">
                      Auto-generate secure password (recommended)
                    </Label>
                    {autoGeneratePassword && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                        disabled={loading.create}
                        className="ml-auto"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate New
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          placeholder="Minimum 8 characters"
                          required
                          disabled={loading.create || autoGeneratePassword}
                          className={getFieldError('password') ? 'border-red-300 focus:border-red-500 pr-20' : 'pr-20'}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="h-8 w-8 p-0"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {formData.password && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(formData.password)}
                              className="h-8 w-8 p-0"
                              title="Copy password"
                            >
                              📋
                            </Button>
                          )}
                        </div>
                      </div>
                      {getFieldError('password') && (
                        <p className="text-sm text-red-600">{getFieldError('password')}</p>
                      )}
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Password Strength:</span>
                            <span className={passwordStrength.color === 'bg-red-500' ? 'text-red-600' : 
                                             passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-green-600'}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.password_confirmation}
                          onChange={(e) => updateFormData('password_confirmation', e.target.value)}
                          placeholder="Confirm password"
                          required
                          disabled={loading.create || autoGeneratePassword}
                          className={getFieldError('password_confirmation') ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {getFieldError('password_confirmation') && (
                        <p className="text-sm text-red-600">{getFieldError('password_confirmation')}</p>
                      )}
                      
                      {/* Password Match Indicator */}
                      {formData.password && formData.password_confirmation && (
                        <div className="flex items-center space-x-1 text-xs">
                          {formData.password === formData.password_confirmation ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Options</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-welcome-email"
                      checked={sendWelcomeEmail}
                      onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                      disabled={loading.create}
                    />
                    <Label htmlFor="send-welcome-email" className="text-sm">
                      Send welcome email with login credentials
                    </Label>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <div className="space-y-1">
                        <div>• User will receive an email with their login credentials</div>
                        <div>• They will be required to change their password on first login</div>
                        <div>• Email will include role-specific welcome information</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading.create}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading.create}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {loading.create ? (
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}