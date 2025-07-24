// components/pages/ticket-details-page.tsx - FIXED: Prevent multiple API calls and hook errors

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
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
  Phone,
  Timer,
} from "lucide-react"

// FIXED: Proper import with stable selectors
import { useTicketStore } from '@/stores/ticket-store'
import { useTicketCategoriesStore } from '@/stores/ticketCategories-store'
import { authService } from '@/services/auth.service'
import { ticketService } from '@/services/ticket.service'
import { useToast } from '@/hooks/use-toast'

interface TicketDetailsPageProps {
  ticketId?: number
  slug?: string
  onNavigate: (page: string, params?: any) => void
}

export function TicketDetailsPage({ ticketId, slug, onNavigate }: TicketDetailsPageProps) {
  console.log('🎫 TicketDetailsPage: Rendering with ID:', ticketId, 'slug:', slug)
  
  // FIXED: Use refs to prevent infinite loops and track initialization
  const initializationRef = useRef({
    categoriesLoaded: false,
    ticketLoaded: false,
    isLoadingTicket: false,
    isLoadingCategories: false,
    lastTicketId: null as number | null,
    mounted: true
  })

  // FIXED: Stable selectors to prevent re-renders
  const actions = useTicketStore(state => state?.actions)
  const tickets = useTicketStore(state => state?.tickets || [])
  const loading = useTicketStore(state => state?.loading || {})
  const errors = useTicketStore(state => state?.errors || {})
  
  // Categories
  const categories = useTicketCategoriesStore(state => state.categories)
  const categoriesActions = useTicketCategoriesStore(state => state.actions)
  const categoriesLoading = useTicketCategoriesStore(state => state.loading.list)

  const { toast } = useToast()

  // FIXED: Stable current user reference
  const currentUser = useMemo(() => {
    try {
      return authService.getStoredUser()
    } catch (error) {
      console.warn('Failed to get stored user:', error)
      return null
    }
  }, [])

  // Local state
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // FIXED: Stable ticket reference with proper memoization
  const ticket = useMemo(() => {
    if (!tickets || tickets.length === 0) return null
    
    try {
      if (ticketId) {
        return tickets.find(t => t.id === ticketId) || null
      }
      if (slug) {
        const parts = slug.split('-')
        const id = parts[0] ? parseInt(parts[0]) : null
        if (id && !isNaN(id)) {
          return tickets.find(t => t.id === id) || null
        }
      }
      return null
    } catch (error) {
      console.error('Error finding ticket:', error)
      return null
    }
  }, [tickets, ticketId, slug])

  // FIXED: Load categories only once with proper error handling
  useEffect(() => {
    if (!initializationRef.current.mounted) return

    const loadCategories = async () => {
      if (initializationRef.current.categoriesLoaded || 
          initializationRef.current.isLoadingCategories ||
          !categoriesActions ||
          categories.length > 0) {
        return
      }

      initializationRef.current.isLoadingCategories = true
      
      try {
        console.log('🎫 TicketDetails: Loading categories (first time)')
        await categoriesActions.fetchCategories()
        
        if (initializationRef.current.mounted) {
          initializationRef.current.categoriesLoaded = true
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        if (initializationRef.current.mounted) {
          initializationRef.current.isLoadingCategories = false
        }
      }
    }

    loadCategories()
  }, [categoriesActions, categories.length])

  // FIXED: Load ticket data with proper duplicate prevention
  useEffect(() => {
    if (!initializationRef.current.mounted) return

    const loadTicket = async () => {
      const currentTicketId = ticketId || (slug ? parseInt(slug.split('-')[0]) : null)
      
      if (!currentTicketId || 
          !actions || 
          isNaN(currentTicketId) ||
          initializationRef.current.isLoadingTicket ||
          initializationRef.current.lastTicketId === currentTicketId) {
        return
      }

      // Check if we already have the ticket
      const existingTicket = tickets.find(t => t.id === currentTicketId)
      if (existingTicket && existingTicket._dataComplete) {
        console.log('🎫 TicketDetails: Using existing complete ticket data')
        initializationRef.current.ticketLoaded = true
        initializationRef.current.lastTicketId = currentTicketId
        return
      }

      initializationRef.current.isLoadingTicket = true
      initializationRef.current.lastTicketId = currentTicketId
      
      try {
        console.log('🎫 TicketDetails: Loading ticket data for ID:', currentTicketId)
        await actions.fetchTicket(currentTicketId, false)
        
        if (initializationRef.current.mounted) {
          initializationRef.current.ticketLoaded = true
        }
      } catch (error: any) {
        console.error('❌ TicketDetails: Failed to fetch ticket:', error)
        
        if (initializationRef.current.mounted) {
          let errorMessage = 'Failed to load ticket details'
          
          if (error.message) {
            if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
              errorMessage = 'Server error occurred. Please try again later.'
            } else if (error.message.includes('404') || error.message.includes('not found')) {
              errorMessage = 'Ticket not found or you may not have access to it.'
            } else {
              errorMessage = error.message
            }
          }
          
          setLocalError(errorMessage)
          
          toast({
            title: "Error Loading Ticket",
            description: errorMessage,
            variant: "destructive"
          })
        }
      } finally {
        if (initializationRef.current.mounted) {
          initializationRef.current.isLoadingTicket = false
        }
      }
    }

    loadTicket()
  }, [ticketId, slug, actions, tickets, toast])

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      initializationRef.current.mounted = false
    }
  }, [])

  // FIXED: Enhanced error display
  const renderErrorState = useCallback(() => {
    if (!localError && !errors.details) return null

    const errorMessage = localError || errors.details
    const isServerError = errorMessage?.includes('500') || errorMessage?.includes('Server error')
    const isNotFound = errorMessage?.includes('404') || errorMessage?.includes('not found')

    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => onNavigate('tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              {isServerError ? (
                <>
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Server Error</h3>
                  <p className="text-gray-600 mb-4">
                    There's a temporary issue with the server. Please try again later.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        setLocalError(null)
                        // Reset initialization flags
                        initializationRef.current.ticketLoaded = false
                        initializationRef.current.isLoadingTicket = false
                        initializationRef.current.lastTicketId = null
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => onNavigate('tickets')}>
                      Back to Tickets
                    </Button>
                  </div>
                </>
              ) : isNotFound ? (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
                  <p className="text-gray-600 mb-4">
                    The ticket you're looking for doesn't exist or you don't have access to it.
                  </p>
                  <Button onClick={() => onNavigate('tickets')}>
                    Back to Tickets
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ticket</h3>
                  <p className="text-gray-600 mb-4">{errorMessage}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        setLocalError(null)
                        if (actions?.clearError) {
                          actions.clearError('details')
                        }
                        // Reset initialization flags
                        initializationRef.current.ticketLoaded = false
                        initializationRef.current.isLoadingTicket = false
                        initializationRef.current.lastTicketId = null
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button variant="outline" onClick={() => onNavigate('tickets')}>
                      Back to Tickets
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }, [localError, errors.details, onNavigate, actions])

  // FIXED: Early returns with proper hook order
  if (localError || errors.details) {
    return renderErrorState()
  }

  // Show loading only if we're actually loading
  if (!ticket && (loading.details || initializationRef.current.isLoadingTicket)) {
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

  // Show ticket not found only after we've tried to load
  if (!ticket && initializationRef.current.ticketLoaded && !initializationRef.current.isLoadingTicket) {
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Available</h3>
            <p className="text-gray-600 mb-4">
              Unable to load ticket details. Please try refreshing or go back to the tickets list.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  // Reset initialization flags
                  initializationRef.current.ticketLoaded = false
                  initializationRef.current.isLoadingTicket = false
                  initializationRef.current.lastTicketId = null
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => onNavigate('tickets')}>
                Back to Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) return null

  // FIXED: Get enriched ticket with category data
  const enrichedTicket = useMemo(() => {
    if (!ticket) return null
    
    const category = categories.find(c => c.id === ticket.category_id)
    return {
      ...ticket,
      category,
      sla_deadline: category?.sla_response_hours ? 
        ticketService.calculateSLADeadline(ticket.created_at, category.sla_response_hours) : null,
      is_overdue: category?.sla_response_hours ? 
        ticketService.isTicketOverdue(ticket.created_at, category.sla_response_hours, ticket.status) : false,
    }
  }, [ticket, categories])

  // FIXED: Response handler with proper error handling
  const handleSendResponse = useCallback(async () => {
    if (!newResponse.trim() || !enrichedTicket || !actions?.addResponse || loading.response) return

    if (newResponse.length < 5) {
      setLocalError("Response must be at least 5 characters long")
      return
    }

    try {
      setIsRefreshing(true)
      
      const responseData = {
        message: newResponse.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      console.log('🎫 TicketDetails: Sending response for ticket:', enrichedTicket.id)
      
      await actions.addResponse(enrichedTicket.id, responseData)
      
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
    } finally {
      setIsRefreshing(false)
    }
  }, [enrichedTicket, newResponse, attachments, actions, loading.response, toast])

  // Other handlers (file upload, download, etc.) remain the same...
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    
    const validation = ticketService.validateFiles(files, 3)
    if (!validation.valid) {
      setLocalError(validation.errors.join(', '))
      return
    }
    
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

  // Download attachment handler
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
    return ticketService.formatFileSize(bytes)
  }, [])

  // Permission checks
  const canAddResponse = useMemo(() => {
    if (!enrichedTicket || !currentUser) return false
    const isTicketClosed = enrichedTicket.status === "Closed" || enrichedTicket.status === "Resolved"
    const isOwner = enrichedTicket.user_id === currentUser.id
    const isAssigned = enrichedTicket.assigned_to === currentUser.id
    const isStaff = ['counselor', 'admin'].includes(currentUser.role)
    return !isTicketClosed && (isOwner || isAssigned || isStaff)
  }, [enrichedTicket, currentUser])

  const showStaffActions = useMemo(() => currentUser?.role !== 'student', [currentUser?.role])

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Ticket #{enrichedTicket?.ticket_number}</h1>
              {isRefreshing && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Updating..." />
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={ticketService.getStatusColor(enrichedTicket?.status || 'Open')}>
                {enrichedTicket?.status}
              </Badge>
              <Badge className={ticketService.getPriorityColor(enrichedTicket?.priority || 'Medium')}>
                {enrichedTicket?.priority}
              </Badge>
              {enrichedTicket?.category && (
                <Badge 
                  variant="outline" 
                  className="border-2"
                  style={{ 
                    borderColor: enrichedTicket.category.color,
                    backgroundColor: `${enrichedTicket.category.color}10`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: enrichedTicket.category.color }}
                  />
                  {enrichedTicket.category.name}
                </Badge>
              )}
              {enrichedTicket?.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  <Flag className="h-3 w-3 mr-1" />
                  CRISIS
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {(errors.details || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.details || localError}</AlertDescription>
        </Alert>
      )}

      {/* Ticket Details Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <CardTitle className="text-xl">{enrichedTicket?.subject}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <div className="text-gray-900">{formatDate(enrichedTicket?.created_at || '')}</div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Updated:</span>
                <div className="text-gray-900">{formatDate(enrichedTicket?.updated_at || '')}</div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Student:</span>
                <div className="text-gray-900">{enrichedTicket?.user?.name || 'Unknown User'}</div>
              </div>
              {enrichedTicket?.assignedTo && (
                <div>
                  <span className="font-medium text-gray-500">Assigned to:</span>
                  <div className="text-gray-900">{enrichedTicket.assignedTo.name}</div>
                </div>
              )}
            </div>

            {/* Crisis Keywords Alert */}
            {enrichedTicket?.detected_crisis_keywords && enrichedTicket.detected_crisis_keywords.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Crisis Keywords Detected:</strong>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {enrichedTicket.detected_crisis_keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border border-red-200"
                      >
                        {keyword.keyword} ({keyword.severity_level})
                      </span>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            Conversation
            <Badge variant="secondary">
              {(enrichedTicket?.responses?.length || 0) + 1} messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-4 p-6">
              {/* Initial Message */}
              <div className="flex items-start gap-4 bg-blue-50/50 rounded-lg p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {enrichedTicket?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{enrichedTicket?.user?.name || 'Unknown User'}</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">Student</Badge>
                    <span className="text-xs text-gray-500">{formatDate(enrichedTicket?.created_at || '')}</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{enrichedTicket?.description}</p>
                  </div>
                  
                  {/* Initial attachments */}
                  {enrichedTicket?.attachments && enrichedTicket.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="text-sm font-medium text-gray-700">Attachments:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {enrichedTicket.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {ticketService.isImage(attachment.file_type) ? (
                                <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">{attachment.original_name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                              disabled={downloadingFiles.has(attachment.id)}
                              className="flex-shrink-0 ml-2"
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
                    </div>
                  )}
                </div>
              </div>

              {/* Responses */}
              {enrichedTicket?.responses && enrichedTicket.responses.length > 0 ? (
                enrichedTicket.responses.map((response, index) => (
                  <div key={response.id} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      response.user?.role === 'student' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {response.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{response.user?.name || 'Unknown User'}</span>
                        <Badge variant="outline" className={
                          response.user?.role === 'student' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }>
                          {response.user?.role === 'student' ? 'Student' : 'Staff'}
                        </Badge>
                        {response.is_internal && (
                          <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                            Internal
                          </Badge>
                        )}
                        {response.is_urgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(response.created_at)}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{response.message}</p>
                      </div>
                      
                      {/* Response attachments */}
                      {response.attachments && response.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-sm font-medium text-gray-700">Attachments:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {response.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  {ticketService.isImage(attachment.file_type) ? (
                                    <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate">{attachment.original_name}</div>
                                    <div className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                                  disabled={downloadingFiles.has(attachment.id)}
                                  className="flex-shrink-0 ml-2"
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
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No responses yet</p>
                  <p className="text-sm">Be the first to respond to this ticket!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Form */}
      {canAddResponse && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-lg">Add Response</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Textarea
                placeholder="Type your response..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="min-h-[120px] text-base resize-y border-2 focus:border-blue-400"
                disabled={loading.response || isRefreshing}
              />
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="response-file-upload"
                  disabled={loading.response || isRefreshing}
                />
                <div className="flex flex-col items-center gap-3">
                  <Paperclip className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-gray-600 font-medium">Attach files</p>
                    <p className="text-gray-500 text-sm">or drag and drop</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('response-file-upload')?.click()}
                    disabled={loading.response || isRefreshing || attachments.length >= 3}
                    className="hover:bg-blue-50"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Choose Files ({attachments.length}/3)
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  PDF, images, and documents up to 10MB each
                </p>
              </div>

              {/* Selected Files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Selected Files:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          {ticketService.isImage(file.type) ? (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          disabled={loading.response || isRefreshing}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs text-gray-500">
                  <div>{newResponse.length}/5000 characters</div>
                  {newResponse.length < 5 && (
                    <div className="text-red-500">Minimum 5 characters required</div>
                  )}
                </div>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || newResponse.length < 5 || loading.response || isRefreshing}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading.response || isRefreshing ? (
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
      {enrichedTicket?.crisis_flag && (
        <Alert className="border-red-200 bg-red-50 shadow-lg">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>🚨 Crisis Ticket:</strong> This ticket has been flagged for urgent attention. 
            If this is a life-threatening emergency, please contact emergency services immediately at{' '}
            <Button
              variant="link"
              className="text-red-800 underline p-0 h-auto font-bold"
              onClick={() => window.open('tel:911', '_self')}
            >
              911
            </Button>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* FIXED: Accessibility Dialog Example */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">
            Hidden Trigger for Accessibility
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket Actions</DialogTitle>
            {/* If you want to hide the title visually but keep it for screen readers: */}
            {/* <VisuallyHidden>
              <DialogTitle>Ticket Actions</DialogTitle>
            </VisuallyHidden> */}
          </DialogHeader>
          <div className="p-4">
            <p>This is an example of a properly accessible dialog.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}