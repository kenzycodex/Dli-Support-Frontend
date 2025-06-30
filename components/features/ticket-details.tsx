// components/features/ticket-details.tsx (Updated with backend integration)
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea" 
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTickets } from "@/hooks/use-tickets"
import { TicketData, TicketResponseData } from "@/services/ticket.service"
import { authService } from "@/services/auth.service"

interface TicketDetailsProps {
  open: boolean
  onClose: () => void
  ticket: TicketData | null
  onTicketUpdated?: () => void
}

export function TicketDetails({ open, onClose, ticket: initialTicket, onTicketUpdated }: TicketDetailsProps) {
  const isMobile = useIsMobile()
  const { getTicket, addResponse, downloadAttachment, loading } = useTickets()
  
  const [ticket, setTicket] = useState<TicketData | null>(initialTicket)
  const [newResponse, setNewResponse] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const currentUser = authService.getStoredUser()

  // Fetch detailed ticket data when modal opens
  useEffect(() => {
    if (open && initialTicket) {
      fetchTicketDetails()
    }
  }, [open, initialTicket])

  const fetchTicketDetails = async () => {
    if (!initialTicket) return
    
    setRefreshing(true)
    setError(null)
    
    try {
      const detailedTicket = await getTicket(initialTicket.id)
      if (detailedTicket) {
        setTicket(detailedTicket)
      }
    } catch (err) {
      console.error("Failed to fetch ticket details:", err)
      setError("Failed to load ticket details")
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !ticket) return

    setError(null)

    try {
      const response = await addResponse(ticket.id, {
        message: newResponse,
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
        
        if (onTicketUpdated) {
          onTicketUpdated()
        }
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

  if (!ticket) return null

  const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved"
  const canAddResponse = currentUser && !isTicketClosed

  const TicketContent = () => (
    <div className="flex-1 flex flex-col space-y-4">
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

      {/* Refresh Button */}
      <div className="flex justify-end">
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

      {/* Ticket Header */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{ticket.subject}</h3>
              <div className="flex items-center space-x-4 mt-2">
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
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Created: {formatDate(ticket.created_at)}</span>
              <span>Last Updated: {formatDate(ticket.updated_at)}</span>
              {ticket.resolved_at && (
                <span>Resolved: {formatDate(ticket.resolved_at)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses */}
      <Card className="flex-1 border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            <h4 className="font-medium">Conversation</h4>
            <Badge variant="secondary">
              {ticket.responses?.length || 0} responses
            </Badge>
          </div>
          
          {refreshing ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading conversation...</span>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {ticket.responses && ticket.responses.length > 0 ? (
                  ticket.responses.map((response, index) => (
                    <div key={response.id}>
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
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
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                          </div>
                          {response.attachments && response.attachments.length > 0 && (
                            <div className="space-y-2">
                              {response.attachments.map((attachment, attachIndex) => (
                                <div
                                  key={attachIndex}
                                  className="flex items-center justify-between p-2 bg-white border rounded text-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    {attachment.file_type.startsWith("image/") ? (
                                      <ImageIcon className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-gray-600" />
                                    )}
                                    <span className="flex-1">{attachment.original_name}</span>
                                    <span className="text-xs text-gray-500">
                                      {formatFileSize(attachment.file_size)}
                                    </span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDownloadAttachment(attachment.id, attachment.original_name)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Download className="h-3 w-3" />
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
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No responses yet</p>
                    <p className="text-sm">Be the first to respond!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Response Form */}
      {canAddResponse && (
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="font-medium">Add Response</h4>
              <Textarea
                placeholder="Type your response..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="min-h-[100px]"
                disabled={loading}
                maxLength={5000}
              />
              
              {/* File Upload */}
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="response-file-upload"
                  disabled={loading}
                />
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="hover:bg-red-50 text-red-600"
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-purple-50 hover:border-purple-200"
                  onClick={() => document.getElementById("response-file-upload")?.click()}
                  disabled={loading || attachments.length >= 3}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files ({attachments.length}/3)
                </Button>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim() || loading}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
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
              
              <div className="text-xs text-gray-500">
                Maximum 3 attachments per response. Files up to 10MB each.
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

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onClose}>
          <SheetContent side="bottom" className="max-h-[90vh] flex flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <span>Ticket #{ticket.ticket_number}</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(ticket.status)}
                  <Badge variant="outline" className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </SheetTitle>
            </SheetHeader>
            <TicketContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Ticket #{ticket.ticket_number}</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(ticket.status)}
                  <Badge variant="outline" className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            <TicketContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}