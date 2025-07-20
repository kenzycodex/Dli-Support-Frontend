// components/features/bulk-create-modal.tsx - FIXED FormData handling

"use client"

import React, { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Trash2,
  Eye,
  Info,
	Settings
} from "lucide-react"

import { useUserActions } from "@/stores/user-store"
import { userService } from "@/services/user.service"
import { toast } from "sonner"

interface BulkCreateModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

interface UserData {
  name: string
  email: string
  role: string
  status: string
  phone?: string
  student_id?: string
  employee_id?: string
}

interface BulkCreateResult {
  successful: number
  failed: number
  skipped: number
  errors: Array<{
    index: number
    email: string
    error: string
  }>
  created_users: Array<{
    id: number
    name: string
    email: string
    role: string
    generated_password: string
  }>
}

export function BulkCreateModal({ open, onClose, onComplete }: BulkCreateModalProps) {
  const { bulkCreate } = useUserActions()
  
  const [activeTab, setActiveTab] = useState("upload")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<UserData[]>([])
  const [parseError, setParseError] = useState("")
  
  // Manual entry state
  const [manualUsers, setManualUsers] = useState<UserData[]>([
    { name: "", email: "", role: "student", status: "active" }
  ])
  
  // Options
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false)
  
  // Results
  const [results, setResults] = useState<BulkCreateResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setActiveTab("upload")
    setLoading(false)
    setError("")
    setProgress(0)
    setSelectedFile(null)
    setFilePreview([])
    setParseError("")
    setManualUsers([{ name: "", email: "", role: "student", status: "active" }])
    setSkipDuplicates(true)
    setSendWelcomeEmail(false)
    setResults(null)
    setShowResults(false)
  }

  // File handling
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setParseError("")
    setFilePreview([])

    try {
      console.log('📁 Parsing CSV file:', file.name)
      console.log('📊 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      })
      
      const parsedData = await userService.parseCSVFile(file)
      console.log('📋 Raw parsed data:', parsedData)
      
      // Enhanced data formatting with better validation
      const formattedData: UserData[] = parsedData.map((row, index) => {
        console.log(`🔍 Processing row ${index}:`, row)
        
        const formatted = {
          name: (row.name || row.full_name || '').trim(),
          email: (row.email || row.email_address || '').trim().toLowerCase(),
          role: ['student', 'counselor', 'advisor', 'admin'].includes(row.role?.toLowerCase()) 
            ? row.role.toLowerCase() 
            : 'student',
          status: ['active', 'inactive', 'suspended'].includes(row.status?.toLowerCase()) 
            ? row.status.toLowerCase() 
            : 'active',
          phone: row.phone || row.phone_number || undefined,
          student_id: row.student_id || row.studentid || undefined,
          employee_id: row.employee_id || row.employeeid || undefined,
        }
        
        console.log(`✅ Formatted row ${index}:`, formatted)
        return formatted
      }).filter(user => {
        const isValid = user.name && user.email && user.email.includes('@')
        if (!isValid) {
          console.warn('⚠️ Filtering out invalid user:', user)
        }
        return isValid
      })

      console.log('📊 Final formatted data:', formattedData)
      setFilePreview(formattedData)
      console.log('✅ CSV parsed successfully:', formattedData.length, 'users')
    } catch (err: any) {
      console.error('❌ CSV parsing failed:', err)
      setParseError(err.message || 'Failed to parse CSV file')
    }
  }, [])

  const handleDownloadTemplate = () => {
    userService.downloadCSVTemplate()
    toast.success('CSV template downloaded!')
  }

  // Manual entry handling
  const addManualUser = () => {
    setManualUsers(prev => [...prev, { name: "", email: "", role: "student", status: "active" }])
  }

  const updateManualUser = (index: number, field: keyof UserData, value: string) => {
    setManualUsers(prev => 
      prev.map((user, i) => 
        i === index ? { ...user, [field]: value } : user
      )
    )
  }

  const removeManualUser = (index: number) => {
    if (manualUsers.length > 1) {
      setManualUsers(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Validation
  const validateData = (data: UserData[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (data.length === 0) {
      errors.push('No users to create')
      return { valid: false, errors }
    }

    data.forEach((user, index) => {
      if (!user.name.trim()) {
        errors.push(`Row ${index + 1}: Name is required`)
      }
      if (!user.email.trim()) {
        errors.push(`Row ${index + 1}: Email is required`)
      } else if (!userService.validateEmail(user.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  // FIXED: Submit handling with proper FormData format
  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    setProgress(0)

    try {
      let usersData: UserData[] = []
      
      if (activeTab === "upload" && selectedFile) {
        if (filePreview.length === 0) {
          throw new Error('Please select and preview a valid CSV file')
        }
        usersData = filePreview
      } else if (activeTab === "manual") {
        // Filter out empty manual entries
        usersData = manualUsers.filter(user => user.name.trim() && user.email.trim())
      }

      // Validate data
      const validation = validateData(usersData)
      if (!validation.valid) {
        setError(validation.errors.join('; '))
        setLoading(false)
        return
      }

      console.log('🔄 Starting bulk user creation:', usersData.length, 'users')
      console.log('📋 Users data to send:', usersData)
      setProgress(25)

      // FIXED: Prepare FormData with JSON string for users_data
      const formData = new FormData()
      
      // Convert users_data to JSON string - This is the key fix!
      formData.append('users_data', JSON.stringify(usersData))
      formData.append('skip_duplicates', skipDuplicates.toString())
      formData.append('send_welcome_email', sendWelcomeEmail.toString())
      formData.append('generate_passwords', 'true')

      console.log('📤 FormData prepared with JSON string for users_data')
      setProgress(50)

      // Call the bulk create API using the store action
      const response = await bulkCreate({
        // Pass FormData directly - the store will handle it correctly
        users_data: usersData, // This gets converted to FormData in the store
        skip_duplicates: skipDuplicates,
        send_welcome_email: sendWelcomeEmail,
        generate_passwords: true,
      })
      
      setProgress(75)

      if (response) {
        setResults(response.results)
        setShowResults(true)
        setProgress(100)
        
        console.log('✅ Bulk creation completed:', response)
        toast.success('Bulk user creation completed!')
      } else {
        throw new Error('Failed to create users')
      }
    } catch (err: any) {
      console.error('❌ Bulk creation failed:', err)
      
      // Enhanced error handling with more details
      if (err.response?.data?.errors) {
        console.error('🔍 Validation errors from backend:', err.response.data.errors)
        
        // Extract specific field errors
        const errorDetails = Object.entries(err.response.data.errors).map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`
          }
          return `${field}: ${messages}`
        }).join('\n')
        
        setError(`Validation failed:\n${errorDetails}`)
      } else {
        setError(err.message || 'Failed to create users')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (showResults && results) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Bulk Creation Results</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.successful + results.failed + results.skipped}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Created Users */}
            {results.created_users.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Successfully Created Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.created_users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{user.role}</Badge>
                          <div className="text-xs text-gray-500 mt-1">Password: {user.generated_password}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {results.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="font-medium text-red-800">Row {error.index + 1}: {error.email}</div>
                        <div className="text-sm text-red-600">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-violet-600" />
            <span>Bulk Create Users</span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-violet-600" />
              <p className="text-lg font-medium">Creating users...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!loading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">CSV Upload</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Upload CSV File</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Upload your CSV file</p>
                      <p className="text-sm text-gray-600">
                        Select a CSV file with user data to import
                      </p>
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                        <Button variant="outline" onClick={handleDownloadTemplate}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {selectedFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <Badge variant="secondary">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    </div>
                  )}

                  {parseError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {parseError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {filePreview.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Preview ({filePreview.length} users)</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              setFilePreview([])
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left p-2 border-b">Name</th>
                                <th className="text-left p-2 border-b">Email</th>
                                <th className="text-left p-2 border-b">Role</th>
                                <th className="text-left p-2 border-b">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filePreview.slice(0, 10).map((user, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{user.name}</td>
                                  <td className="p-2">{user.email}</td>
                                  <td className="p-2">
                                    <Badge variant="outline">{user.role}</Badge>
                                  </td>
                                  <td className="p-2">
                                    <Badge variant="outline">{user.status}</Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filePreview.length > 10 && (
                            <div className="text-center p-2 text-sm text-gray-600">
                              ... and {filePreview.length - 10} more users
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Manual Entry ({manualUsers.length} users)</span>
                    </span>
                    <Button onClick={addManualUser} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add User
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {manualUsers.map((user, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">User {index + 1}</span>
                          {manualUsers.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeManualUser(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Name *</Label>
                            <Input
                              value={user.name}
                              onChange={(e) => updateManualUser(index, 'name', e.target.value)}
                              placeholder="Full name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Email *</Label>
                            <Input
                              type="email"
                              value={user.email}
                              onChange={(e) => updateManualUser(index, 'email', e.target.value)}
                              placeholder="user@university.edu"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Role</Label>
                            <select
                              value={user.role}
                              onChange={(e) => updateManualUser(index, 'role', e.target.value)}
                              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            >
                              <option value="student">Student</option>
                              <option value="counselor">Counselor</option>
                              <option value="advisor">Advisor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Status</Label>
                            <select
                              value={user.status}
                              onChange={(e) => updateManualUser(index, 'status', e.target.value)}
                              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Phone</Label>
                            <Input
                              value={user.phone || ''}
                              onChange={(e) => updateManualUser(index, 'phone', e.target.value)}
                              placeholder="+1234567890"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">
                              {user.role === 'student' ? 'Student ID' : 'Employee ID'}
                            </Label>
                            <Input
                              value={user.role === 'student' ? (user.student_id || '') : (user.employee_id || '')}
                              onChange={(e) => updateManualUser(
                                index, 
                                user.role === 'student' ? 'student_id' : 'employee_id', 
                                e.target.value
                              )}
                              placeholder={user.role === 'student' ? 'STU001' : 'EMP001'}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Import Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <Label htmlFor="skip-duplicates" className="text-sm">
                    Skip duplicate emails (recommended)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="welcome-email"
                    checked={sendWelcomeEmail}
                    onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
                  />
                  <Label htmlFor="welcome-email" className="text-sm">
                    Send welcome emails to new users
                  </Label>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    <div className="space-y-1">
                      <div>• Passwords will be automatically generated for all users</div>
                      <div>• Users will need to reset their password on first login</div>
                      <div>• Duplicate emails will be {skipDuplicates ? 'skipped' : 'rejected'}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </Tabs>
        )}

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (activeTab === 'upload' && filePreview.length === 0) || 
                     (activeTab === 'manual' && manualUsers.every(u => !u.name.trim() || !u.email.trim()))}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Users...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Create Users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}