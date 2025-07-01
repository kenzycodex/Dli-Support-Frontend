"use client"

import { useState, useEffect } from "react"
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
    
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError(`Some files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

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
      case "Open": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "In Progress": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
      case "Resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "Closed": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "Medium": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open": return <Clock className="h-4 w-4" />
      case "In Progress": return <AlertTriangle className="h-4 w-4" />
      case "Resolved": return <CheckCircle className="h-4 w-4" />
      case "Closed": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-lg text-gray-600 dark:text-gray-400">Loading ticket details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="p-8">
            <div className="text-center flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ticket Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400">The ticket you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
  const canAddResponse = currentUser && !isTicketClosed

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket #{ticket.ticket_number}</h1>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(ticket.status)} gap-2`}>
                {getStatusIcon(ticket.status)}
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
          className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
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
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <div className="flex justify-between items-center">
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Ticket Header */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                {ticket.category}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority} Priority
              </Badge>
              {ticket.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  CRISIS
                </Badge>
              )}
              {ticket.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>Assigned to {ticket.assignedTo.name}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-b px-6 py-4">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <span>Conversation</span>
            <Badge variant="secondary">
              {ticket.responses?.length || 0} responses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {refreshing ? (
            <div className="flex justify-center items-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-gray-400">Loading conversation...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Initial Ticket Message */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    ticket.user?.role === "student" 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" 
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  }`}>
                    {ticket.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {ticket.user?.name || "Unknown User"}
                      </span>
                      <Badge
                        className={
                          ticket.user?.role === "student"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        }
                      >
                        {ticket.user?.role === "student" ? "Student" : "Staff"}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">{ticket.description}</p>
                    </div>
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="space-y-2">
                        {ticket.attachments.map((attachment, attachIndex) => (
                          <div
                            key={attachIndex}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {attachment.file_type.startsWith("image/") ? (
                                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{attachment.original_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
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
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" 
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {response.user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {response.user?.name || "Unknown User"}
                          </span>
                          <Badge
                            className={
                              response.user?.role === "student"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            }
                          >
                            {response.user?.role === "student" ? "Student" : "Staff"}
                          </Badge>
                          {response.is_urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">{response.message}</p>
                        </div>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="space-y-2">
                            {response.attachments.map((attachment, attachIndex) => (
                              <div
                                key={attachIndex}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {attachment.file_type.startsWith("image/") ? (
                                    <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{attachment.original_name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatFileSize(attachment.file_size)}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                                  className="hover:bg-blue-50 dark:hover:bg-blue-900/50"
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
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                  <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600" />
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
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-b px-6 py-4">
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
                  disabled={loading}
                  maxLength={5000}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Share your thoughts or ask questions</span>
                  <span>{newResponse.length}/5000</span>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Paperclip className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">Drag and drop files here</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">or click to browse</p>
                    </div>
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
                      onClick={() => document.getElementById("response-file-upload")?.click()}
                      disabled={loading || attachments.length >= 3}
                      className="hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/50 dark:hover:border-purple-700"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Choose Files ({attachments.length}/3)
                    </Button>
                  </div>
                </div>
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Maximum 3 attachments per response. Files up to 10MB each.
                </div>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
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
        <Alert className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-gray-700 dark:text-gray-300">
            This ticket has been {ticket.status.toLowerCase()}. No further responses can be added.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}