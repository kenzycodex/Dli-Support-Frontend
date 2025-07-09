// components/pages/ticket-details-page.tsx (FIXED - All TypeScript errors resolved)
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
  Edit,
  Tags,
  UserPlus,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketById,
  useTicketLoading, 
  useTicketError,
  useTicketPermissions,
  TicketData,
  AddResponseRequest 
} from "@/stores/ticket-store"
import { authService } from "@/services/auth.service"
import { ticketService } from "@/services/ticket.service"

interface TicketDetailsPageProps {
  ticketId: number
  onNavigate: (page: string, params?: any) => void
}

export function TicketDetailsPage({ ticketId, onNavigate }: TicketDetailsPageProps) {
  // FIXED: Use store hooks properly
  const actions = useTicketStore(state => state?.actions)
  const ticket = useTicketById(ticketId)
  const loadingDetails = useTicketLoading('update')
  const loadingResponse = useTicketLoading('response') // FIXED: Now response is valid
  const error = useTicketError('update')
  // FIXED: Get error state at component level, not in callback
  const currentResponseError = useTicketError('response')
  const permissions = useTicketPermissions()

  // Local state for response form
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // Fetch ticket details on mount or when ticketId changes
  useEffect(() => {
    console.log("🎫 TicketDetailsPage: Loading ticket details for ID:", ticketId)
    
    if (ticketId && !ticket && actions) {
      fetchTicketDetails()
    }
  }, [ticketId, ticket, actions])

  // Auto-refresh ticket details periodically
  useEffect(() => {
    if (ticket && !isTicketClosed) {
      const interval = setInterval(() => {
        fetchTicketDetails(true) // Silent refresh
      }, 30000) // Refresh every 30 seconds for open tickets

      return () => clearInterval(interval)
    }
  }, [ticket?.status])

  const fetchTicketDetails = useCallback(async (silent = false) => {
    if (!actions?.fetchTicket) return
    
    if (!silent) {
      setRefreshing(true)
    }
    setLocalError(null)
    
    try {
      await actions.fetchTicket(ticketId) // FIXED: fetchTicket returns void
      console.log('✅ TicketDetailsPage: Ticket details loaded')
    } catch (err) {
      console.error("Failed to fetch ticket details:", err)
      if (!silent) {
        setLocalError("Failed to load ticket details")
      }
    } finally {
      if (!silent) {
        setRefreshing(false)
      }
    }
  }, [ticketId, actions])

  // Handle sending response
  const handleSendResponse = useCallback(async () => {
    if (!newResponse.trim() || !ticket || !actions?.addResponse) return

    setLocalError(null)
    actions.clearError && actions.clearError('response')

    // Validate response
    if (newResponse.length < 5) {
      setLocalError("Response must be at least 5 characters long")
      return
    }

    // Validate attachments
    if (attachments.length > 0) {
      const validation = ticketService.validateFiles(attachments, 3)
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '))
        return
      }
    }

    try {
      const responseData: AddResponseRequest = {
        message: newResponse.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      await actions.addResponse(ticket.id, responseData) // FIXED: addResponse returns void

      // Check if there was an error after the call
      const errorAfterCall = useTicketStore.getState().errors.response
      if (!errorAfterCall) {
        setNewResponse("")
        setAttachments([])
        
        // Refresh ticket to get updated conversation
        await fetchTicketDetails(true)
      }
    } catch (err) {
      console.error("Failed to add response:", err)
      setLocalError("Failed to send response. Please try again.")
    }
  }, [ticket, newResponse, attachments, actions, fetchTicketDetails])

  // Handle file upload for responses
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    setLocalError(null)
    
    // Validate files
    const validation = ticketService.validateFiles(files, 3)
    if (!validation.valid) {
      setLocalError(validation.errors.join(', '))
      return
    }

    if (attachments.length + files.length > 3) {
      setLocalError("Maximum 3 attachments allowed per response")
      return
    }

    setAttachments(prev => [...prev, ...files])
    
    // Reset file input
    event.target.value = ''
  }, [attachments.length])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handle attachment download
  const handleDownloadAttachment = useCallback(async (attachmentId: number, fileName: string) => {
    if (!actions?.downloadAttachment) return
    
    try {
      await actions.downloadAttachment(attachmentId, fileName) // FIXED: Method now exists
    } catch (err) {
      console.error("Failed to download attachment:", err)
      setLocalError("Failed to download attachment")
    }
  }, [actions])

  // Quick actions
  const handleQuickAction = useCallback(async (action: string, params?: any) => {
    if (!ticket || !actions) return
    
    try {
      switch (action) {
        case 'assign_to_me':
          if (currentUser && actions.assignTicket) {
            await actions.assignTicket(ticket.id, currentUser.id) // FIXED: Only 2 params
          }
          break
        case 'mark_in_progress':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'In Progress' })
          }
          break
        case 'mark_resolved':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'Resolved' })
          }
          break
        case 'escalate':
          if (actions.updateTicket && actions.addTag) {
            await actions.updateTicket(ticket.id, { priority: 'Urgent' })
            await actions.addTag(ticket.id, 'escalated') // FIXED: Method now exists
          }
          break
      }
      
      // Refresh ticket after action
      await fetchTicketDetails(true)
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    }
  }, [ticket, currentUser, actions, fetchTicketDetails])

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

  const getStatusColor = useCallback((status: string) => {
    return ticketService.getStatusColor(status)
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    return ticketService.getPriorityColor(priority)
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "Open": return <Clock className="h-4 w-4" />
      case "In Progress": return <RefreshCw className="h-4 w-4" />
      case "Resolved": return <CheckCircle className="h-4 w-4" />
      case "Closed": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    return ticketService.formatFileSize(bytes)
  }, [])

  // Check if user can add responses
  const canAddResponse = useMemo(() => {
    if (!ticket || !currentUser) return false
    
    const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
    const isOwner = ticket.user_id === currentUser.id
    const isAssigned = ticket.assigned_to === currentUser.id
    const isStaff = ['counselor', 'advisor', 'admin'].includes(currentUser.role)
    
    return !isTicketClosed && (isOwner || isAssigned || isStaff)
  }, [ticket, currentUser])

  // FIXED: Calculate isTicketClosed from ticket status directly
  const isTicketClosed = useMemo(() => {
    return ticket ? (ticket.status === "Closed" || ticket.status === "Resolved") : false
  }, [ticket?.status])

  // Loading state
  if (loadingDetails && !ticket) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Loading ticket details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (!ticket && (error || localError)) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-8">
            <div className="text-center flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Ticket Not Found</h3>
              <p className="text-gray-600">{error || localError || "The ticket you're looking for doesn't exist or you don't have access to it."}</p>
              <Button onClick={() => fetchTicketDetails()}>
                Try Again
              </Button>
            </div>
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
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.ticket_number}</h1>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(ticket.status)} gap-2`}>
                {getStatusIcon(ticket.status)}
                {ticket.status}
              </Badge>
              {ticket.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  <Flag className="h-3 w-3 mr-1" />
                  CRISIS
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTicketDetails()}
            disabled={refreshing}
            className="hover:bg-blue-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          {/* Quick Actions for Staff */}
          {currentUser?.role !== 'student' && (
            <>
              {!ticket.assigned_to && permissions.can_assign && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('assign_to_me')}
                  disabled={loadingDetails}
                  className="hover:bg-green-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Me
                </Button>
              )}
              
              {ticket.status === 'Open' && permissions.can_modify && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('mark_in_progress')}
                  disabled={loadingDetails}
                  className="hover:bg-yellow-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Progress
                </Button>
              )}

              {ticket.status === 'In Progress' && permissions.can_modify && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('mark_resolved')}
                  disabled={loadingDetails}
                  className="hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {(error || currentResponseError || localError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <div className="flex justify-between items-center">
            <AlertDescription>{error || currentResponseError || localError}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                actions?.clearError && actions.clearError('update')
                actions?.clearError && actions.clearError('response') // FIXED: Now valid
                setLocalError(null)
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Ticket Header */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                {ticketService.getCategoryDisplayName(ticket.category)}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority} Priority
              </Badge>
              {ticket.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  <Flag className="h-3 w-3 mr-1" />
                  CRISIS
                </Badge>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tags className="h-3 w-3 text-gray-500" />
                  {ticket.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {ticket.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Assigned to {ticket.assignedTo.name}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>Created: {formatDate(ticket.created_at)}</span>
              <span>Last Updated: {formatDate(ticket.updated_at)}</span>
              {ticket.resolved_at && (
                <span>Resolved: {formatDate(ticket.resolved_at)}</span>
              )}
              {ticket.resolved_at && ticket.created_at && (
                <span>Resolution Time: {ticketService.getResolutionTime(ticket.created_at, ticket.resolved_at)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-6 py-4">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <span>Conversation</span>
            <Badge variant="secondary">
              {ticket.responses?.length || 0} responses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {refreshing && !loadingDetails ? (
            <div className="flex justify-center items-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Updating conversation...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Initial Ticket Message */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    ticket.user?.role === "student" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {ticket.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {ticket.user?.name || "Unknown User"}
                      </span>
                      <Badge
                        className={
                          ticket.user?.role === "student"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {ticket.user?.role === "student" ? "Student" : "Staff"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">{ticket.description}</p>
                    </div>
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">Attachments:</span>
                        {ticket.attachments.map((attachment, attachIndex) => (
                          <div
                            key={attachIndex}
                            className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {ticketService.isImage(attachment.file_type) ? (
                                <ImageIcon className="h-5 w-5 text-blue-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-600" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-gray-900">{attachment.original_name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                              className="hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {ticket.responses && ticket.responses.length > 0 && <Separator className="my-4" />}
              </div>

              {/* Responses */}
              {ticket.responses && ticket.responses.length > 0 ? (
                ticket.responses.map((response, index) => (
                  <div key={response.id} className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                          response.user?.role === "student" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {response.user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {response.user?.name || "Unknown User"}
                          </span>
                          <Badge
                            className={
                              response.user?.role === "student"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {response.user?.role === "student" ? "Student" : "Staff"}
                          </Badge>
                          {response.is_urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          {response.is_internal && (
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">{response.message}</p>
                        </div>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-700">Attachments:</span>
                            {response.attachments.map((attachment, attachIndex) => (
                              <div
                                key={attachIndex}
                                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {ticketService.isImage(attachment.file_type) ? (
                                    <ImageIcon className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-gray-600" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-900">{attachment.original_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.file_size)}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                                  className="hover:bg-blue-50"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < (ticket.responses?.length || 0) - 1 && <Separator className="my-4" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                  <MessageSquare className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">No responses yet</p>
                  <p className="text-sm">Be the first to respond!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Form */}
      {canAddResponse && (
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-6 py-4">
            <CardTitle>Add Response</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your response..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="min-h-[150px] text-base resize-y"
                  disabled={loadingResponse}
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Share your thoughts or ask questions</span>
                  <span className={newResponse.length < 5 ? 'text-red-500' : 'text-gray-500'}>
                    {newResponse.length}/5000 {newResponse.length < 5 && '(minimum 5 characters)'}
                  </span>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Paperclip className="h-8 w-8 text-gray-400" />
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
                      id="response-file-upload"
                      disabled={loadingResponse}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("response-file-upload")?.click()}
                      disabled={loadingResponse || attachments.length >= 3}
                      className="hover:bg-purple-50 hover:border-purple-200"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Choose Files ({attachments.length}/3)
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    PDF, PNG, JPG, DOC, TXT files up to 10MB each (Max 3 files)
                  </p>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Selected Files:</span>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {ticketService.isImage(file.type) ? (
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          disabled={loadingResponse}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Maximum 3 attachments per response. Files up to 10MB each.
                </div>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || newResponse.length < 5 || loadingResponse}
                  className={`transition-all duration-200 ${
                    loadingResponse 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                  }`}
                >
                  {loadingResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="animate-pulse">Sending...</span>
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

      {/* Closed Ticket Notice */}
      {isTicketClosed && (
        <Alert className="border-gray-200 bg-gray-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-gray-700">
            This ticket has been {ticket.status.toLowerCase()}. No further responses can be added.
            {ticket.status === 'Resolved' && currentUser?.role === 'student' && (
              <span className="block mt-2">
                If you need additional help with this issue, please create a new ticket.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}