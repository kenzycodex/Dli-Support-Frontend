// components/features/reset-password-modal.tsx - IMPROVED UI & Responsive Design

"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Key, 
  Loader2, 
  AlertCircle, 
  Shield, 
  User, 
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  Info,
  Copy,
  AlertTriangle
} from "lucide-react"

import { useUserActions } from "@/stores/user-store"
import { userService } from "@/services/user.service"
import type { UserItem } from "@/stores/user-store"
import { toast } from "sonner"

interface ResetPasswordModalProps {
  open: boolean
  onClose: () => void
  user: UserItem
  onPasswordReset: () => void
}

export function ResetPasswordModal({ open, onClose, user, onPasswordReset }: ResetPasswordModalProps) {
  const { resetUserPassword } = useUserActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      console.log('🔄 ResetPasswordModal: Modal opened for user:', user.display_name)
      resetForm()
      if (autoGenerate) {
        generatePassword()
      }
    }
  }, [open, user])

  // Generate password when auto-generate is toggled
  useEffect(() => {
    if (autoGenerate && open) {
      generatePassword()
    } else if (!autoGenerate) {
      setPasswordData({ password: "", confirmPassword: "" })
    }
  }, [autoGenerate, open])

  const resetForm = () => {
    console.log('🔄 Resetting password form')
    setPasswordData({ password: "", confirmPassword: "" })
    setError("")
    setValidationErrors({})
    setShowPassword(false)
    setAutoGenerate(true)
  }

  const generatePassword = () => {
    // Generate a secure password
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
    
    setPasswordData({
      password: shuffled,
      confirmPassword: shuffled,
    })
    
    console.log('🔑 Generated new password for user')
  }

  const validateForm = (): boolean => {
    console.log('✅ Validating password reset form')
    const errors: Record<string, string> = {}
    
    if (!passwordData.password) {
      errors.password = "New password is required"
    } else {
      const passwordValidation = userService.validatePassword(passwordData.password)
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors[0]
      }
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Password confirmation is required"
    }
    
    if (passwordData.password !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    console.log('❌ Password validation errors:', errors)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Password reset submission started for user:', user.id)
    
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
      console.log('📤 Sending password reset request')
      
      await resetUserPassword(user.id, passwordData.password, passwordData.confirmPassword)
      
      console.log('✅ Password reset successful')
      toast.success(`Password reset successfully for ${user.display_name}`)
      onPasswordReset()
      onClose()
    } catch (err: any) {
      console.error('💥 Password reset error:', err)
      
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
        setError(err.message || "Failed to reset password")
      }
    } finally {
      setLoading(false)
      console.log('⏳ Setting loading state to false')
    }
  }

  const handleClose = () => {
    if (!loading) {
      console.log('🚪 Closing password reset modal')
      onClose()
    }
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors[fieldName]
  }

  const updatePasswordData = (field: keyof typeof passwordData, value: string) => {
    console.log(`📝 Updating password field ${field}`)
    setPasswordData(prev => ({ ...prev, [field]: value }))
    
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

  const passwordStrength = getPasswordStrength(passwordData.password)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <Key className="h-5 w-5 text-violet-600" />
            <span>Reset Password</span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* IMPROVED: Compact User Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                {user.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-blue-900 text-sm truncate">{user.display_name}</div>
                <div className="text-xs text-blue-700 truncate">{user.email}</div>
              </div>
              <Badge variant="outline" className={`${userService.getRoleColor(user.role)} text-xs`}>
                {user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IMPROVED: Auto-generate option */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-generate"
                checked={autoGenerate}
                onCheckedChange={(checked) => setAutoGenerate(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="auto-generate" className="text-sm font-medium">
                Auto-generate secure password
              </Label>
            </div>
            {autoGenerate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                New
              </Button>
            )}
          </div>

          {/* IMPROVED: Compact password fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reset-password" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.password}
                  onChange={(e) => updatePasswordData('password', e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading || autoGenerate}
                  className={`pr-20 ${getFieldError('password') ? 'border-red-300 focus:border-red-500' : ''}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-7 w-7 p-0"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {passwordData.password && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(passwordData.password)}
                      className="h-7 w-7 p-0"
                      title="Copy password"
                      disabled={loading}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {getFieldError('password') && (
                <p className="text-xs text-red-600">{getFieldError('password')}</p>
              )}
              
              {/* IMPROVED: Compact Password Strength Indicator */}
              {passwordData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.color === 'bg-red-500' ? 'text-red-600' : 
                      passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => updatePasswordData('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading || autoGenerate}
                className={getFieldError('confirmPassword') ? 'border-red-300 focus:border-red-500' : ''}
              />
              {getFieldError('confirmPassword') && (
                <p className="text-xs text-red-600">{getFieldError('confirmPassword')}</p>
              )}
              
              {/* IMPROVED: Compact Password Match Indicator */}
              {passwordData.password && passwordData.confirmPassword && (
                <div className="flex items-center space-x-1 text-xs">
                  {passwordData.password === passwordData.confirmPassword ? (
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

          {/* IMPROVED: Compact Warning */}
          <Alert className="border-yellow-200 bg-yellow-50 py-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-xs">
              <div className="space-y-0.5">
                <div>• User will be required to log in again</div>
                <div>• All existing sessions will be invalidated</div>
                <div>• Notification email will be sent if enabled</div>
              </div>
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !passwordData.password || !passwordData.confirmPassword}
              className="flex-1 sm:flex-none bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}