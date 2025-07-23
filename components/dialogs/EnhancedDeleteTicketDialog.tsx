// components/dialogs/EnhancedDeleteTicketDialog.tsx - Fixed TypeScript and Mobile-First

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Flag,
  Bot,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  Tag,
  X,
  Calendar,
  Shield,
  ExternalLink,
  Timer,
  TrendingDown
} from 'lucide-react'
import { TicketData } from '@/stores/ticket-store'

interface EnhancedDeleteTicketDialogProps {
  ticket: TicketData | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, notifyUser: boolean) => Promise<void>
}

export function EnhancedDeleteTicketDialog({
  ticket,
  isOpen,
  onClose,
  onConfirm
}: EnhancedDeleteTicketDialogProps) {
  const [reason, setReason] = useState('')
  const [notifyUser, setNotifyUser] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    if (!ticket || !reason.trim()) return

    setIsDeleting(true)
    try {
      await onConfirm(reason.trim(), notifyUser)
      setReason('')
      setNotifyUser(false)
      onClose()
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Delete confirmation failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return // Prevent closing during deletion
    setReason('')
    setNotifyUser(false)
    onClose()
  }

  if (!ticket) return null

  // Calculate ticket data completeness and impact
  const responseCount = ticket.responses?.length || 0
  const attachmentCount = ticket.attachments?.length || 0
  const tagCount = ticket.tags?.length || 0
  const hasConversation = responseCount > 0
  const hasAttachments = attachmentCount > 0
  const hasCrisisKeywords = ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0

  // Category context
  const category = ticket.category
  const categoryName = category?.name || 'Unknown Category'
  const categoryColor = category?.color || '#gray'

  // Assignment context
  const isAssigned = !!ticket.assigned_to
  const assignmentType = ticket.auto_assigned === 'yes' ? 'Auto-assigned' : 
                        ticket.auto_assigned === 'manual' ? 'Manually assigned' : 
                        'Unassigned'

  // Time context
  const createdDate = new Date(ticket.created_at)
  const timeSinceCreation = Date.now() - createdDate.getTime()
  const daysSinceCreation = Math.floor(timeSinceCreation / (1000 * 60 * 60 * 24))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-lg sm:text-xl">Delete Ticket Confirmation</span>
            </div>
            <Badge variant="destructive" className="w-fit animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Permanent Action
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            This action cannot be undone. All ticket data, responses, and attachments will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Ticket Overview */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-medium text-blue-600">
                  #{ticket.ticket_number}
                </span>
                
                {/* Category Badge */}
                <Badge
                  variant="outline"
                  className="border-2"
                  style={{ 
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}15`
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span>{categoryName}</span>
                  </div>
                </Badge>

                {/* Status and Priority */}
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hidden sm:inline-flex">
                  {ticket.status}
                </Badge>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 hidden sm:inline-flex">
                  {ticket.priority}
                </Badge>
              </div>

              {/* Crisis and Assignment Indicators */}
              <div className="flex items-center space-x-2">
                {ticket.crisis_flag && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Flag className="h-3 w-3 mr-1" />
                    CRISIS
                  </Badge>
                )}
                
                {ticket.auto_assigned === 'yes' && (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <Bot className="h-3 w-3 mr-1" />
                    Auto-assigned
                  </Badge>
                )}
              </div>
            </div>

            {/* Mobile badges row */}
            <div className="flex flex-wrap gap-2 mb-3 sm:hidden">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                {ticket.status}
              </Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                {ticket.priority}
              </Badge>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{ticket.subject}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{ticket.description}</p>

            {/* Ticket Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{ticket.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{daysSinceCreation} days old</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">{assignmentType}</span>
              </div>
              {isAssigned && (
                <div className="flex items-center space-x-1">
                  <span className="truncate">Assigned to: {ticket.assignedTo?.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Data Impact Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="font-semibold text-red-900">Data Impact Assessment</span>
            </div>
            
            {/* Impact metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-white rounded border border-red-100">
                <MessageSquare className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-lg font-bold text-gray-900">{responseCount}</div>
                <div className="text-xs text-gray-500">Responses</div>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-100">
                <Paperclip className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-lg font-bold text-gray-900">{attachmentCount}</div>
                <div className="text-xs text-gray-500">Files</div>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-100">
                <Tag className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-lg font-bold text-gray-900">{tagCount}</div>
                <div className="text-xs text-gray-500">Tags</div>
              </div>
              <div className="text-center p-3 bg-white rounded border border-red-100">
                <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-lg font-bold text-gray-900">{hasCrisisKeywords ? 'Yes' : 'No'}</div>
                <div className="text-xs text-gray-500">Crisis Data</div>
              </div>
            </div>

            {/* Specific warnings */}
            <div className="space-y-2 text-sm">
              {hasConversation && (
                <div className="flex items-start space-x-2 text-orange-700 bg-orange-50 p-2 rounded">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>This ticket contains {responseCount} conversation responses that will be permanently lost</span>
                </div>
              )}
              
              {hasAttachments && (
                <div className="flex items-start space-x-2 text-orange-700 bg-orange-50 p-2 rounded">
                  <Paperclip className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{attachmentCount} file attachments will be permanently deleted from the system</span>
                </div>
              )}
              
              {ticket.crisis_flag && (
                <div className="flex items-start space-x-2 text-red-700 bg-red-100 p-2 rounded">
                  <Flag className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>This is a crisis case with sensitive mental health data that will be permanently removed</span>
                </div>
              )}

              {hasCrisisKeywords && (
                <div className="flex items-start space-x-2 text-red-700 bg-red-100 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Detected crisis keywords and AI analysis data will be permanently deleted</span>
                </div>
              )}

              {isAssigned && (
                <div className="flex items-start space-x-2 text-orange-700 bg-orange-50 p-2 rounded">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Assignment history and counselor notes will be permanently lost</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Impact */}
          {category && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                <span className="font-semibold text-blue-900">Category Impact: {categoryName}</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Category statistics and performance metrics will be updated</div>
                {category.crisis_detection_enabled && (
                  <div>• Crisis detection data and patterns will be affected</div>
                )}
                {category.auto_assign && (
                  <div>• Auto-assignment history and success rates will be recalculated</div>
                )}
                <div>• SLA tracking and response time metrics will be adjusted</div>
              </div>
            </div>
          )}

          {/* Deletion Reason */}
          <div className="space-y-3">
            <label htmlFor="deletion-reason" className="text-sm font-semibold text-gray-700 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Deletion Reason <span className="text-red-500 ml-1">*</span>
            </label>
            <Textarea
              id="deletion-reason"
              placeholder="Please provide a detailed reason for deleting this ticket..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDeleting}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Required for audit trail and compliance</span>
              <span className={reason.length > 400 ? 'text-orange-600' : ''}>{reason.length}/500</span>
            </div>
          </div>

          {/* User Notification */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="notify-user"
                checked={notifyUser}
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  if (typeof checked === 'boolean') {
                    setNotifyUser(checked)
                  }
                }}
                disabled={isDeleting}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="notify-user" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Notify ticket owner ({ticket.user?.name || 'Unknown User'})
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Send an email notification about the ticket deletion
                </p>
              </div>
            </div>
            
            {notifyUser && (
              <div className="ml-6 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded text-sm">
                <div className="font-medium text-yellow-900 mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Notification Details:
                </div>
                <div className="text-yellow-800 space-y-1">
                  <div>• User will receive an email about ticket deletion</div>
                  <div>• Deletion reason will be included in notification</div>
                  <div>• User will be advised to contact support if needed</div>
                  {ticket.crisis_flag && (
                    <div className="text-red-700 font-medium bg-red-100 p-2 rounded mt-2">
                      • Crisis case deletion will trigger additional support outreach
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Final Warning */}
          <div className="p-4 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="font-bold text-red-900">Final Warning</span>
            </div>
            <div className="text-red-800 text-sm space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span>This action is permanent and cannot be undone</span>
                </div>
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span>All ticket data will be immediately removed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span>Backup recovery is not available</span>
                </div>
                {ticket.crisis_flag && (
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Critical mental health data will be lost forever</span>
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-red-200 rounded text-center font-medium">
                Are you absolutely certain you want to proceed?
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isDeleting}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}