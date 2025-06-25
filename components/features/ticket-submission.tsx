// components/features/ticket-submission.tsx (Updated with backend integration)
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTickets } from "@/hooks/use-tickets"

interface TicketSubmissionProps {
  open: boolean
  onClose: () => void
  onTicketCreated?: () => void
}

export function TicketSubmission({ open, onClose, onTicketCreated }: TicketSubmissionProps) {
  const { createTicket, loading } = useTickets()
  const isMobile = useIsMobile()

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
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
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
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      })

      if (ticket) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
          if (onTicketCreated) {
            onTicketCreated()
          }
        }, 2000)
      }
    } catch (err) {
      console.error("Failed to create ticket:", err)
      setError("Failed to create ticket. Please try again.")
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        subject: "",
        category: "",
        priority: "Medium",
        description: "",
        attachments: [],
      })
      setError(null)
      setSuccess(false)
      onClose()
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

  const FormContent = () => (
    <>
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Ticket Created Successfully!</h3>
          <p className="text-green-700">You will receive a confirmation email shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              required
              disabled={loading}
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                disabled={loading}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "Low" | "Medium" | "High") => setFormData((prev) => ({ ...prev, priority: value }))}
                disabled={loading}
              >
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about your issue..."
              className="min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
              disabled={loading}
              maxLength={5000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimum 20 characters required</span>
              <span>{formData.description.length}/5000</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
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
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="hover:bg-blue-50 hover:border-blue-200"
                disabled={loading || formData.attachments.length >= 5}
              >
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                PDF, PNG, JPG, DOC, TXT files up to 10MB each (Max 5 files)
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({formData.attachments.length}/5)</Label>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        {formatFileSize(file.size)}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="hover:bg-red-50 text-red-600"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll receive a confirmation email with your ticket number</li>
              <li>• Our team will review and respond within 24 hours</li>
              <li>• You can track progress in your dashboard</li>
              <li>• Crisis-related tickets are prioritized immediately</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
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
              disabled={!isFormValid || loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleClose}>
          <SheetContent side="bottom" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Submit Support Ticket</SheetTitle>
              <SheetDescription>
                Describe your issue and we'll get back to you as soon as possible
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FormContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll get back to you as soon as possible
              </DialogDescription>
            </DialogHeader>
            <FormContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}