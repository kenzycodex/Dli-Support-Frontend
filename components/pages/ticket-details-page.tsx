// components/pages/ticket-details-page.tsx - FIXED: Simplified without slug complexity

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Copy,
  ExternalLink,
  Settings,
} from "lucide-react"
import { 
  useTicketStore, 
  useTicketById,
  useTicketLoading, 
  useTicketError,
  useTicketPermissions,
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
  // SIMPLIFIED: Store access without slug complexity
  const actions = useTicketStore(state => state?.actions)
  const tickets = useTicketStore(state => state?.tickets || [])
  
  // SIMPLIFIED: Get ticket by ID only
  const ticket = useTicketById(ticketId || 0)
  
  const loadingDetails = useTicketLoading('details')
  const loadingResponse = useTicketLoading('response')
  const error = useTicketError('details')
  const currentResponseError = useTicketError('response')
  const permissions = useTicketPermissions()

  const { toast } = useToast()

  // Local state for response form
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const currentUser = useMemo(() => authService.getStoredUser(), [])
  const initRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  // SIMPLIFIED: Load ticket details without slug complexity
  useEffect(() => {
    let isMounted = true
    
    const loadTicketDetails = async () => {
      if (!actions || !ticketId || initRef.current) return
      
      initRef.current = true
      
      console.log("🎫 TicketDetailsPage: Starting ticket load for ID:", ticketId)
      
      // If we already have the ticket, mark as initialized
      if (ticket) {
        console.log('🎫 TicketDetailsPage: Ticket already available, marking as initialized')
        if (isMounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
        return
      }
      
      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMounted && !ticket) {
          console.warn('🎫 TicketDetailsPage: Loading timeout reached')
          setLocalError("Failed to load ticket details - request timed out")
          setIsLoading(false)
          setIsInitialized(true)
        }
      }, 15000)
      
      try {
        console.log("🎫 TicketDetailsPage: Fetching ticket details for ID:", ticketId)
        await actions.fetchTicket(ticketId)
        
        if (isMounted) {
          setIsInitialized(true)
          setIsLoading(false)
          console.log('✅ TicketDetailsPage: Ticket details loaded and initialized')
        }
      } catch (error) {
        console.error("❌ TicketDetailsPage: Failed to load ticket details:", error)
        if (isMounted) {
          setLocalError("Failed to load ticket details")
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    loadTicketDetails()

    return () => {
      isMounted = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [ticketId, actions, ticket])

  // Auto-refresh for open tickets
  useEffect(() => {
    if (!ticket || !isInitialized || !actions) return

    const isTicketOpen = ticket.status === "Open" || ticket.status === "In Progress"
    
    if (isTicketOpen) {
      autoRefreshRef.current = setInterval(() => {
        console.log("🔄 TicketDetailsPage: Auto-refreshing ticket details")
        fetchTicketDetails(true) // Silent refresh
      }, 30000)

      return () => {
        if (autoRefreshRef.current) {
          clearInterval(autoRefreshRef.current)
        }
      }
    }
  }, [ticket?.status, isInitialized, actions])

  // SIMPLIFIED: Fetch ticket details
  const fetchTicketDetails = useCallback(async (silent = false) => {
    if (!actions || !ticketId) return
    
    if (!silent) {
      setRefreshing(true)
    }
    setLocalError(null)
    
    try {
      await actions.fetchTicket(ticketId)
      console.log('✅ TicketDetailsPage: Ticket details refreshed')
      
      if (!silent) {
        toast({
          title: "Success",
          description: "Ticket details refreshed"
        })
      }
    } catch (err) {
      console.error("❌ TicketDetailsPage: Failed to refresh ticket details:", err)
      if (!silent) {
        setLocalError("Failed to refresh ticket details")
        toast({
          title: "Error",
          description: "Failed to refresh ticket details",
          variant: "destructive"
        })
      }
    } finally {
      if (!silent) {
        setRefreshing(false)
      }
    }
  }, [ticketId, actions, toast])

  // SIMPLIFIED: Send response without complex error handling
  const handleSendResponse = useCallback(async () => {
    if (!newResponse.trim() || !ticket || !actions?.addResponse) return

    setLocalError(null)
    actions.clearError && actions.clearError('response')

    // Basic validation
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

      console.log("🎫 TicketDetailsPage: Sending response:", responseData)
      await actions.addResponse(ticket.id, responseData)

      // Check for errors
      const errorAfterCall = useTicketStore.getState().errors.response
      if (!errorAfterCall) {
        console.log("✅ TicketDetailsPage: Response sent successfully, clearing form")
        setNewResponse("")
        setAttachments([])
        
        // Refresh to get updated conversation
        setTimeout(() => fetchTicketDetails(true), 1000)
        
        toast({
          title: "Success",
          description: "Response sent successfully"
        })
      } else {
        setLocalError(errorAfterCall)
        toast({
          title: "Error",
          description: errorAfterCall,
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("❌ TicketDetailsPage: Failed to add response:", err)
      setLocalError("Failed to send response. Please try again.")
    }
  }, [ticket, newResponse, attachments, actions, fetchTicketDetails, toast])

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    setLocalError(null)
    
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
    event.target.value = ''
  }, [attachments.length])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  // SIMPLIFIED: Download attachment
  const handleDownloadAttachment = useCallback(async (attachmentId: number, fileName: string) => {
    if (!actions?.downloadAttachment) return
    
    try {
      await actions.downloadAttachment(attachmentId, fileName)
      toast({
        title: "Success",
        description: "Attachment downloaded successfully"
      })
    } catch (err) {
      console.error("Failed to download attachment:", err)
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive"
      })
    }
  }, [actions, toast])

  // Quick actions
  const handleQuickAction = useCallback(async (action: string, params?: any) => {
    if (!ticket || !actions) return
    
    try {
      switch (action) {
        case 'assign_to_me':
          if (currentUser?.role === 'admin' && actions.assignTicket) {
            await actions.assignTicket(ticket.id, currentUser.id)
            toast({
              title: "Success",
              description: "Ticket assigned to you"
            })
          }
          break
        case 'mark_in_progress':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'In Progress' })
            toast({
              title: "Success",
              description: "Ticket marked as In Progress"
            })
          }
          break
        case 'mark_resolved':
          if (actions.updateTicket) {
            await actions.updateTicket(ticket.id, { status: 'Resolved' })
            toast({
              title: "Success",
              description: "Ticket marked as Resolved"
            })
          }
          break
        case 'escalate':
          if (actions.updateTicket && actions.addTag) {
            await actions.updateTicket(ticket.id, { priority: 'Urgent' })
            await actions.addTag(ticket.id, 'escalated')
            toast({
              title: "Success",
              description: "Ticket escalated to Urgent priority"
            })
          }
          break
      }
      
      // Refresh after action
      setTimeout(() => fetchTicketDetails(true), 500)
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action.replace('_', ' ')}`,
        variant: "destructive"
      })
    }
  }, [ticket, currentUser, actions, fetchTicketDetails, toast])

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

  // Check permissions
  const canAddResponse = useMemo(() => {
    if (!ticket || !currentUser) return false
    
    const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
    const isOwner = ticket.user_id === currentUser.id
    const isAssigned = ticket.assigned_to === currentUser.id
    const isStaff = ['counselor', 'admin'].includes(currentUser.role)
    
    return !isTicketClosed && (isOwner || isAssigned || isStaff)
  }, [ticket, currentUser])

  const isTicketClosed = useMemo(() => {
    return ticket ? (ticket.status === "Closed" || ticket.status === "Resolved") : false
  }, [ticket?.status])

  const showStaffActions = useMemo(() => {
    return currentUser?.role !== 'student'
  }, [currentUser?.role])

  const showTicketInformation = useMemo(() => {
    return currentUser?.role !== 'student'
  }, [currentUser?.role])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
      }
    }
  }, [])

  // Show loading state
  if (isLoading || (loadingDetails && !isInitialized) || !actions || !ticketId) {
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
              <div className="text-xs text-gray-400 mt-2">
                Loading ticket ID: {ticketId}
              </div>
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
              <p className="text-gray-600">
                {error || localError || "The ticket you're looking for doesn't exist or you don't have access to it."}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => fetchTicketDetails()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => onNavigate('tickets')}>
                  Back to Tickets
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Ticket ID: {ticketId}
              </div>
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
          {showStaffActions && (
            <>
              {!ticket.assigned_to && currentUser?.role === 'admin' && (
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

              {ticket.status === 'Open' &&
                (currentUser?.role === 'admin' || currentUser?.role === 'counselor') && (
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

              {ticket.status === 'In Progress' &&
                (currentUser?.role === 'admin' || currentUser?.role === 'counselor') && (
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
                actions?.clearError && actions.clearError('details');
                actions?.clearError && actions.clearError('response');
                setLocalError(null);
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
                  {ticket.tags.map((tag) => (
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
              {ticket.resolved_at && <span>Resolved: {formatDate(ticket.resolved_at)}</span>}
              {ticket.resolved_at && ticket.created_at && (
                <span>
                  Resolution Time:{' '}
                  {ticketService.getResolutionTime(ticket.created_at, ticket.resolved_at)}
                </span>
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
            <Badge variant="secondary">{ticket.responses?.length || 0} responses</Badge>
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      ticket.user?.role === 'student'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {ticket.user?.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {ticket.user?.name || 'Unknown User'}
                      </span>
                      <Badge
                        className={
                          ticket.user?.role === 'student'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {ticket.user?.role === 'student' ? 'Student' : 'Staff'}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                        {ticket.description}
                      </p>
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
                                <p className="text-sm font-medium truncate text-gray-900">
                                  {attachment.original_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadAttachment(attachment.id, attachment.original_name)
                              }
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
                          response.user?.role === 'student'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {response.user?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('') || '?'}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {response.user?.name || 'Unknown User'}
                          </span>
                          <Badge
                            className={
                              response.user?.role === 'student'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {response.user?.role === 'student' ? 'Student' : 'Staff'}
                          </Badge>
                          {response.is_urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          {response.is_internal && (
                            <Badge
                              variant="outline"
                              className="text-xs border-orange-200 text-orange-700"
                            >
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                            {response.message}
                          </p>
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
                                    <p className="text-sm font-medium truncate text-gray-900">
                                      {attachment.original_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.file_size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadAttachment(
                                      attachment.id,
                                      attachment.original_name
                                    )
                                  }
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
                      onClick={() => document.getElementById('response-file-upload')?.click()}
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
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {ticketService.isImage(file.type) ? (
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">
                              {file.name}
                            </p>
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

      {/* Crisis Alert for crisis tickets */}
      {ticket.crisis_flag && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>🚨 Crisis Ticket:</strong> This ticket has been flagged for urgent attention. If
            this is a life-threatening emergency, please contact emergency services immediately at
            911.
            {currentUser?.role !== 'student' && (
              <span className="block mt-2">
                <strong>Staff Notice:</strong> Crisis tickets require immediate response within 1
                hour.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Staff-only Quick Actions Panel */}
      {showStaffActions && (
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Staff Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {!ticket.assigned_to && currentUser?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => handleQuickAction('assign_to_me')}
                  disabled={loadingDetails}
                  className="flex items-center gap-2 hover:bg-green-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign to Me
                </Button>
              )}

              {ticket.status === 'Open' &&
                (currentUser?.role === 'admin' || currentUser?.role === 'counselor') && (
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('mark_in_progress')}
                    disabled={loadingDetails}
                    className="flex items-center gap-2 hover:bg-yellow-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Mark In Progress
                  </Button>
                )}

              {(ticket.status === 'Open' || ticket.status === 'In Progress') &&
                (currentUser?.role === 'admin' || currentUser?.role === 'counselor') && (
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('mark_resolved')}
                    disabled={loadingDetails}
                    className="flex items-center gap-2 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Resolved
                  </Button>
                )}

              {ticket.priority !== 'Urgent' &&
                (currentUser?.role === 'admin' || currentUser?.role === 'counselor') && (
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('escalate')}
                    disabled={loadingDetails}
                    className="flex items-center gap-2 hover:bg-red-50"
                  >
                    <Flag className="h-4 w-4" />
                    Escalate
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Information Panel */}
      {showTicketInformation && (
        <Card className="border shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ticket Number</label>
                  <p className="text-sm text-gray-900">{ticket.ticket_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">
                    {ticketService.getCategoryDisplayName(ticket.category)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <p className="text-sm text-gray-900">{ticket.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{ticket.status}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm text-gray-900">{ticket.user?.name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="text-sm text-gray-900">{ticket.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm text-gray-900">{formatDate(ticket.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
            </div>

            {ticket.tags && ticket.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-500 block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh indicator for open tickets */}
      {(ticket.status === 'Open' || ticket.status === 'In Progress') && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing every 30 seconds for updates</span>
          </div>
        </div>
      )}

      {/* Loading states overlay */}
      {(loadingDetails || loadingResponse) && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">
              {loadingDetails && 'Updating ticket...'}
              {loadingResponse && 'Sending response...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}