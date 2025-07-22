// components/dialogs/EnhancedDeleteTicketDialog.tsx - Enhanced with Category Context

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
  Tag
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

  // ENHANCED: Calculate ticket data completeness and impact
  const responseCount = ticket.responses?.length || 0
  const attachmentCount = ticket.attachments?.length || 0
  const tagCount = ticket.tags?.length || 0
  const hasConversation = responseCount > 0
  const hasAttachments = attachmentCount > 0
  const hasCrisisKeywords = ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0

  // ENHANCED: Category context
  const category = ticket.category
  const categoryName = category?.name || 'Unknown Category'
  const categoryColor = category?.color || '#gray'

  // ENHANCED: Assignment context
  const isAssigned = !!ticket.assigned_to
  const assignmentType = ticket.auto_assigned === 'yes' ? 'Auto-assigned' : 
                        ticket.auto_assigned === 'manual' ? 'Manually assigned' : 
                        'Unassigned'

  // ENHANCED: Time context
  const createdDate = new Date(ticket.created_at)
  const timeSinceCreation = Date.now() - createdDate.getTime()
  const daysSinceCreation = Math.floor(timeSinceCreation / (1000 * 60 * 60 * 24))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Delete Ticket Confirmation</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All ticket data, responses, and attachments will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ENHANCED: Ticket Overview with Category */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start justify-between mb-3">
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
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {ticket.status}
                </Badge>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
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

            <h3 className="font-medium text-gray-900 mb-2">{ticket.subject}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{ticket.description}</p>

            {/* ENHANCED: Ticket Metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{ticket.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{daysSinceCreation} days old</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">{assignmentType}</span>
              </div>
              {isAssigned && (
                <div className="flex items-center space-x-1">
                  <span>Assigned to: {ticket.assignedTo?.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* ENHANCED: Data Impact Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Data Impact Assessment</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div className="text-center p-2 bg-white rounded border">
                <MessageSquare className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{responseCount}</div>
                <div className="text-xs text-gray-500">Responses</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <Paperclip className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{attachmentCount}</div>
                <div className="text-xs text-gray-500">Attachments</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <Tag className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{tagCount}</div>
                <div className="text-xs text-gray-500">Tags</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                <div className="text-sm font-medium">{hasCrisisKeywords ? 'Yes' : 'No'}</div>
                <div className="text-xs text-gray-500">Crisis Data</div>
              </div>
            </div>

            {/* ENHANCED: Specific warnings */}
            <div className="space-y-2 text-sm">
              {hasConversation && (
                <div className="flex items-center space-x-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This ticket contains {responseCount} conversation responses that will be lost</span>
                </div>
              )}
              
              {hasAttachments && (
                <div className="flex items-center space-x-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{attachmentCount} file attachments will be permanently deleted</span>
                </div>
              )}
              
              {ticket.crisis_flag && (
                <div className="flex items-center space-x-2 text-red-700">
                  <Flag className="h-4 w-4" />
                  <span>This is a crisis case with sensitive mental health data</span>
                </div>
              )}

              {hasCrisisKeywords && (
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Detected crisis keywords and analysis data will be removed</span>
                </div>
              )}

              {isAssigned && (
                <div className="flex items-center space-x-2 text-orange-700">
                  <User className="h-4 w-4" />
                  <span>Assignment history and counselor notes will be lost</span>
                </div>
              )}
            </div>
          </div>

          {/* ENHANCED: Category Impact */}
          {category && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                <span className="font-medium text-blue-900">Category Impact: {categoryName}</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Category statistics and metrics will be updated</div>
                {category.crisis_detection_enabled && (
                  <div>• Crisis detection data and patterns will be affected</div>
                )}
                {category.auto_assign && (
                  <div>• Auto-assignment history and success rates will be recalculated</div>
                )}
                <div>• SLA tracking and performance metrics will be adjusted</div>
              </div>
            </div>
          )}

          {/* Deletion Reason */}
          <div className="space-y-2">
            <label htmlFor="deletion-reason" className="text-sm font-medium text-gray-700">
              Deletion Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="deletion-reason"
              placeholder="Please provide a detailed reason for deleting this ticket..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDeleting}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Required for audit trail and compliance</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          {/* ENHANCED: User Notification with Context */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-user"
                checked={notifyUser}
                onCheckedChange={setNotifyUser}
                disabled={isDeleting}
              />
              <label htmlFor="notify-user" className="text-sm font-medium text-gray-700">
                Notify ticket owner ({ticket.user?.name || 'Unknown User'})
              </label>
            </div>
            
            {notifyUser && (
              <div className="ml-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <div className="font-medium text-yellow-900 mb-1">Notification Details:</div>
                <div className="text-yellow-800 space-y-1">
                  <div>• User will receive an email about ticket deletion</div>
                  <div>• Deletion reason will be included in notification</div>
                  <div>• User will be advised to contact support if needed</div>
                  {ticket.crisis_flag && (
                    <div className="text-red-700 font-medium">
                      • Crisis case deletion will trigger additional support outreach
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ENHANCED: Final Warning */}
          <div className="p-4 bg-red-100 border-2 border-red-300 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-bold text-red-900">Final Warning</span>
            </div>
            <div className="text-red-800 text-sm space-y-1">
              <div>✗ This action is permanent and cannot be undone</div>
              <div>✗ All ticket data will be immediately removed from the system</div>
              <div>✗ Backup recovery is not available for deleted tickets</div>
              {ticket.crisis_flag && (
                <div className="font-medium">✗ Critical mental health case data will be lost forever</div>
              )}
              <div className="mt-2 font-medium">
                Are you absolutely certain you want to proceed?
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isDeleting}
            className="bg-red-600 hover:bg-red-700"
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