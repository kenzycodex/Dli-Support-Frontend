// components/pages/submit-ticket-page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, X, FileText, ImageIcon, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react"
import { useTickets } from "@/hooks/use-tickets"

interface SubmitTicketPageProps {
  onNavigate: (page: string) => void
}

export function SubmitTicketPage({ onNavigate }: SubmitTicketPageProps) {
  const { createTicket, loading } = useTickets()

  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    description: "",
    attachments: [] as File[],
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const categories = [
    { value: "technical", label: "Technical Issues" },
    { value: "academic", label: "Academic Support" },
    { value: "mental-health", label: "Mental Health" },
    { value: "administrative", label: "Administrative" },
    { value: "other", label: "Other" },
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file size (10MB max)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError(`Some files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Validate total attachments (5 max)
    if (formData.attachments.length + files.length > 5) {
      setError("Maximum 5 attachments allowed")
      return
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    const invalidTypes = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidTypes.length > 0) {
      setError(`Invalid file types: ${invalidTypes.map(f => f.name).join(', ')}. Only PDF, images, Word documents, and text files are allowed.`)
      return
    }

    setError(null)
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.subject.trim()) {
      setError("Subject is required")
      return
    }
    if (!formData.category) {
      setError("Please select a category")
      return
    }
    if (!formData.description.trim()) {
      setError("Description is required")
      return
    }
    if (formData.description.length < 20) {
      setError("Description must be at least 20 characters long")
      return
    }

    try {
      const ticket = await createTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      })

      if (ticket) {
        setSuccess(true)
        setTimeout(() => {
          onNavigate('tickets')
        }, 2500)
      }
    } catch (err) {
      console.error("Failed to create ticket:", err)
      setError("Failed to create ticket. Please try again.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isFormValid = formData.subject.trim() && 
                     formData.category && 
                     formData.description.trim() && 
                     formData.description.length >= 20

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Ticket Created Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your support request has been submitted and you will receive a confirmation email shortly.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    You'll receive a confirmation email with your ticket number
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    Our team will review and respond within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    You can track progress in your tickets dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    Crisis-related tickets are prioritized immediately
                  </li>
                </ul>
              </div>
              <Button 
                onClick={() => onNavigate('tickets')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                View All Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate('tickets')}
          className="hover:bg-blue-50 w-fit"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Support Ticket</h1>
          <p className="text-gray-600 mt-1">Describe your issue and we'll get back to you as soon as possible</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
                disabled={loading}
                maxLength={255}
                className="h-11 text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "Low" | "Medium" | "High") => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                className="min-h-[180px] text-base resize-y"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                disabled={loading}
                maxLength={5000}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimum 20 characters required</span>
                <span>{formData.description.length}/5000</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Attachments (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-gray-600 font-medium">Drag and drop files here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="mt-2 hover:bg-blue-50 hover:border-blue-200"
                    disabled={loading || formData.attachments.length >= 5}
                  >
                    Choose Files
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  PDF, PNG, JPG, DOC, TXT files up to 10MB each (Max 5 files)
                </p>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Uploaded Files ({formData.attachments.length}/5)</Label>
                  <div className="space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  You'll receive a confirmation email with your ticket number
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  Our team will review and respond within 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  You can track progress in your dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  Crisis-related tickets are prioritized immediately
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onNavigate('tickets')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}