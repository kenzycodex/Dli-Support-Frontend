// components/pages/ticket-details-page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import { useTickets } from "@/hooks/use-tickets"
import { TicketData } from "@/services/ticket.service"
import { authService } from "@/services/auth.service"

interface TicketDetailsPageProps {
  ticketId: number
  onNavigate: (page: string) => void
}

export function TicketDetailsPage({ ticketId, onNavigate }: TicketDetailsPageProps) {
  const { getTicket, addResponse, downloadAttachment, loading } = useTickets()
  
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingTicket, setLoadingTicket] = useState(true)

  const currentUser = authService.getStoredUser()

  // Fetch ticket details on mount
  useEffect(() => {
    fetchTicketDetails()
  }, [ticketId])

  const fetchTicketDetails = async () => {
    setRefreshing(true)
    setError(null)
    
    try {
      const detailedTicket = await getTicket(ticketId)
      if (detailedTicket) {
        setTicket(detailedTicket)
      } else {
        setError("Ticket not found")
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err)
      setError("Failed to load ticket details")
    } finally {
      setRefreshing(false)
      setLoadingTicket(false)
    }
  }

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !ticket) return

    setError(null)

    try {
      const response = await addResponse(ticket.id, {
        message: newResponse.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      if (response) {
        // Update ticket with new response
        setTicket(prev => prev ? {
          ...prev,
          responses: [...(prev.responses || []), response],
          updated_at: new Date().toISOString(),
        } : null)
        
        setNewResponse("")
        setAttachments([])
      }
    } catch (err) {
      console.error("Failed to add response:", err)
      setError("Failed to send response. Please try again.")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Validate file size (10MB max)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError(`Some files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Validate total attachments (3 max for responses)
    if (attachments.length + files.length > 3) {
      setError("Maximum 3 attachments allowed per response")
      return
    }

    setError(null)
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      await downloadAttachment(attachmentId, fileName)
    } catch (err) {
      console.error("Failed to download attachment:", err)
      setError("Failed to download attachment")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "In Progress":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loadingTicket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="pt-12">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <span className="text-lg text-gray-600">Loading ticket details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="pt-12">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
              <p className="text-gray-600">The ticket you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
  const canAddResponse = currentUser && !isTicketClosed

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">Ticket #{ticket.ticket_number}</h1>
            <div className="flex items-center space-x-2">
              {getStatusIcon(ticket.status)}
              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTicketDetails}
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
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Ticket Header */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="text-xl">{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                {ticket.category}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {ticket.priority} Priority
              </Badge>
              {ticket.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  CRISIS
                </Badge>
              )}
              {ticket.assignedTo && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Assigned to {ticket.assignedTo.name}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <span>Created: {formatDate(ticket.created_at)}</span>
              <span>Last Updated: {formatDate(ticket.updated_at)}</span>
              {ticket.resolved_at && (
                <span>Resolved: {formatDate(ticket.resolved_at)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Conversation</span>
            <Badge variant="secondary">
              {ticket.responses?.length || 0} responses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {refreshing ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading conversation...</span>
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {ticket.responses && ticket.responses.length > 0 ? (
                ticket.responses.map((response, index) => (
                  <div key={response.id}>
                    <div className="flex items-start space-x-4">
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
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-sm">
                            {response.user?.name || "Unknown User"}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              response.user?.role === "student"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {response.user?.role === "student" ? "Student" : "Staff"}
                          </Badge>
                          {response.is_urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{response.message}</p>
                        </div>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="space-y-2">
                            {response.attachments.map((attachment, attachIndex) => (
                              <div
                                key={attachIndex}
                                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  {attachment.file_type.startsWith("image/") ? (
                                    <ImageIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{attachment.original_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(attachment.file_size)}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                                  className="hover:bg-blue-50 flex-shrink-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < (ticket.responses?.length || 0) - 1 && <Separator className="my-6" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No responses yet</p>
                  <p className="text-sm">Be the first to respond!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Form */}
      {canAddResponse && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle>Add Response</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your response..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  className="min-h-[120px] text-base resize-y"
                  disabled={loading}
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Share your thoughts or ask questions</span>
                  <span>{newResponse.length}/5000</span>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Attach files (optional)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="response-file-upload"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("response-file-upload")?.click()}
                    disabled={loading || attachments.length >= 3}
                    className="hover:bg-purple-50 hover:border-purple-200"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Choose Files ({attachments.length}/3)
                  </Button>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="hover:bg-red-50 text-red-600 flex-shrink-0"
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Maximum 3 attachments per response. Files up to 10MB each.
                </div>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-8"
                >
                  {loading ? (
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

      {isTicketClosed && (
        <Alert className="border-gray-200 bg-gray-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-gray-700">
            This ticket has been {ticket.status.toLowerCase()}. No further responses can be added.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}