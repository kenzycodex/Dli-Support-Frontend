// components/pages/ticket-details-page.tsx - FIXED: Simple and fast loading like WhatsApp

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Clock,
  User,
  Paperclip,
  Send,
  Download,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  ImageIcon,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Flag,
  UserPlus,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react"
import { 
  useTicketStore, 
  TicketData,
  AddResponseRequest,
} from "@/stores/ticket-store"
import { authService } from "@/services/auth.service"
import { ticketService } from "@/services/ticket.service"
import { useToast } from "@/hooks/use-toast"

interface TicketDetailsPageProps {
  ticketId?: number
  onNavigate: (page: string, params?: any) => void
}

export function TicketDetailsPage({ ticketId, onNavigate }: TicketDetailsPageProps) {
  console.log('🎫 TicketDetailsPage: Rendering with ID:', ticketId)
  
  // Get ticket from store - simple and direct
  const store = useTicketStore()
  const actions = store?.actions
  const tickets = store?.tickets || []
  
  // Find ticket by ID - simple lookup
  const ticket = useMemo(() => {
    if (!ticketId) return null
    return tickets.find(t => t.id === ticketId) || null
  }, [tickets, ticketId])

  const isLoading = store?.loading?.details || false
  const error = store?.errors?.details || null
  const responseLoading = store?.loading?.response || false
  
  const { toast } = useToast()

  // Local state - minimal and focused
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set())
  const [initialized, setInitialized] = useState(false)

  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // SIMPLIFIED: Load ticket details only once when needed
  useEffect(() => {
    if (!ticketId || !actions || initialized) return

    console.log('🎫 TicketDetailsPage: Loading ticket details for ID:', ticketId)
    
    // Check if we already have complete data
    if (ticket && ticket.responses !== undefined) {
      console.log('✅ TicketDetailsPage: Complete data already available')
      setInitialized(true)
      return
    }

    // Load ticket details
    const loadTicket = async () => {
      try {
        await actions.fetchTicket(ticketId)
        setInitialized(true)
        console.log('✅ TicketDetailsPage: Ticket loaded successfully')
      } catch (error) {
        console.error('❌ TicketDetailsPage: Failed to load ticket:', error)
        setLocalError('Failed to load ticket details')
        setInitialized(true)
      }
    }

    loadTicket()
  }, [ticketId, actions, ticket, initialized])

  // SIMPLIFIED: Send response
  const handleSendResponse = useCallback(async () => {
    if (!newResponse.trim() || !ticket || !actions?.addResponse || responseLoading) return

    if (newResponse.length < 5) {
      setLocalError("Response must be at least 5 characters long")
      return
    }

    try {
      const responseData: AddResponseRequest = {
        message: newResponse.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      await actions.addResponse(ticket.id, responseData)
      
      // Clear form on success
      setNewResponse("")
      setAttachments([])
      setLocalError(null)
      
      toast({
        title: "Success",
        description: "Response sent successfully"
      })
    } catch (err: any) {
      console.error("❌ Failed to send response:", err)
      setLocalError(err?.message || "Failed to send response")
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      })
    }
  }, [ticket, newResponse, attachments, actions, responseLoading, toast])

  // SIMPLIFIED: File upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    
    if (attachments.length + files.length > 3) {
      setLocalError("Maximum 3 attachments allowed")
      return
    }

    setAttachments(prev => [...prev, ...files])
    setLocalError(null)
    event.target.value = ''
  }, [attachments.length])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // SIMPLIFIED: Download attachment
  const handleDownloadAttachment = useCallback(async (attachmentId: number, fileName: string) => {
    if (downloadingFiles.has(attachmentId)) return
    
    setDownloadingFiles(prev => new Set(prev).add(attachmentId))
    
    try {
      await ticketService.downloadAttachment(attachmentId, fileName)
      toast({
        title: "Success",
        description: `Downloading ${fileName}...`
      })
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err?.message || "Failed to download file",
        variant: "destructive"
      })
    } finally {
      setTimeout(() => {
        setDownloadingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(attachmentId)
          return newSet
        })
      }, 2000)
    }
  }, [downloadingFiles, toast])

  // SIMPLIFIED: Quick actions
  const handleQuickAction = useCallback(async (action: string) => {
    if (!ticket || !actions) return
    
    try {
      switch (action) {
        case 'assign_to_me':
          if (currentUser?.role === 'admin' && actions.assignTicket) {
            await actions.assignTicket(ticket.id, currentUser.id)
            toast({ title: "Success", description: "Ticket assigned to you" })
          }
          break
        case 'mark_in_progress':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'In Progress' })
            toast({ title: "Success", description: "Ticket marked as In Progress" })
          }
          break
        case 'mark_resolved':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'Resolved' })
            toast({ title: "Success", description: "Ticket marked as Resolved" })
          }
          break
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || `Failed to ${action.replace('_', ' ')}`,
        variant: "destructive"
      })
    }
  }, [ticket, currentUser, actions, toast])

  // Utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }, [])

  // Permission checks
  const canAddResponse = useMemo(() => {
    if (!ticket || !currentUser) return false
    const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
    const isOwner = ticket.user_id === currentUser.id
    const isAssigned = ticket.assigned_to === currentUser.id
    const isStaff = ['counselor', 'admin'].includes(currentUser.role)
    return !isTicketClosed && (isOwner || isAssigned || isStaff)
  }, [ticket, currentUser])

  const showStaffActions = useMemo(() => currentUser?.role !== 'student', [currentUser?.role])

  // SIMPLIFIED LOADING: Show simple loading only when necessary
  if (!initialized && isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => onNavigate('tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <span className="text-gray-600">Loading ticket details...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // SIMPLIFIED ERROR: Show error if ticket not found
  if (initialized && !ticket) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => onNavigate('tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
            <p className="text-gray-600 mb-4">
              {error || localError || "The ticket you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Button onClick={() => onNavigate('tickets')}>
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onNavigate('tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.ticket_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={ticketService.getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              {ticket.crisis_flag && (
                <Badge variant="destructive">
                  <Flag className="h-3 w-3 mr-1" />
                  CRISIS
                </Badge>
              )}
            </div>
          </div>
        </div>

        {showStaffActions && (
          <div className="flex items-center gap-2">
            {!ticket.assigned_to && currentUser?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('assign_to_me')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to Me
              </Button>
            )}
            {ticket.status === 'Open' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('mark_in_progress')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Progress
              </Button>
            )}
            {ticket.status === 'In Progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('mark_resolved')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ticket.category}</Badge>
              <Badge variant="outline" className={ticketService.getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              {ticket.assignedTo && (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  {ticket.assignedTo.name}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Created: {formatDate(ticket.created_at)} • Updated: {formatDate(ticket.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            Conversation
            <Badge variant="secondary">
              {ticket.responses?.length || 0} responses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Initial Message */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                {ticket.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{ticket.user?.name || 'Unknown User'}</span>
                  <Badge variant="outline">Student</Badge>
                  <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </div>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-sm font-medium">Attachments:</span>
                    {ticket.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{attachment.original_name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(attachment.file_size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                          disabled={downloadingFiles.has(attachment.id)}
                        >
                          {downloadingFiles.has(attachment.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {ticket.responses && ticket.responses.length > 0 && <Separator />}

            {/* Responses */}
            {ticket.responses?.map((response, index) => (
              <div key={response.id} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  response.user?.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {response.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{response.user?.name || 'Unknown User'}</span>
                    <Badge variant="outline">
                      {response.user?.role === 'student' ? 'Student' : 'Staff'}
                    </Badge>
                    {response.is_internal && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">{formatDate(response.created_at)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{response.message}</p>
                  </div>
                  {response.attachments && response.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-sm font-medium">Attachments:</span>
                      {response.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{attachment.original_name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(attachment.file_size)})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                            disabled={downloadingFiles.has(attachment.id)}
                          >
                            {downloadingFiles.has(attachment.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!ticket.responses || ticket.responses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p>No responses yet. Be the first to respond!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Form */}
      {canAddResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Add Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your response..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="min-h-[120px]"
                disabled={responseLoading}
              />
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={responseLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={responseLoading || attachments.length >= 3}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files ({attachments.length}/3)
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, images, and documents up to 10MB each
                </p>
              </div>

              {/* Selected Files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        disabled={responseLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {newResponse.length}/5000 characters
                </span>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || newResponse.length < 5 || responseLoading}
                >
                  {responseLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crisis Alert */}
      {ticket.crisis_flag && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>🚨 Crisis Ticket:</strong> This ticket has been flagged for urgent attention. 
            If this is a life-threatening emergency, please contact emergency services immediately at 911.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}