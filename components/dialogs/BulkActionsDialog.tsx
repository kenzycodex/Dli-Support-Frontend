// components/dialogs/BulkActionsDialog.tsx (ENHANCED - Added Delete Option)
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { authService } from "@/services/auth.service"
import { BulkActionParams } from '@/types/tickets.types'

interface BulkActionsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTickets: TicketData[]
  onBulkAction: (action: string, params?: BulkActionParams) => Promise<void>
  onBulkDelete?: (reason: string, notifyUser: boolean) => Promise<void>
}

export function BulkActionsDialog({
  isOpen,
  onClose,
  selectedTickets,
  onBulkAction,
  onBulkDelete
}: BulkActionsDialogProps) {
  const [action, setAction] = useState("")
  const [assignTo, setAssignTo] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const currentUser = useMemo(() => authService.getStoredUser(), [])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAction("")
      setAssignTo("")
      setStatus("")
      setPriority("")
      setDeleteReason("")
      setNotifyUsers(false)
      setIsProcessing(false)
    }
  }, [isOpen])

  const handleApply = useCallback(async () => {
    if (!action || isProcessing) return

    setIsProcessing(true)
    try {
      if (action === 'delete') {
        // Handle bulk delete separately
        if (!deleteReason.trim() || deleteReason.trim().length < 10) {
          throw new Error('Deletion reason must be at least 10 characters long')
        }
        
        if (onBulkDelete) {
          await onBulkDelete(deleteReason.trim(), notifyUsers)
        }
      } else {
        // Handle other bulk actions
        const params: BulkActionParams = {}
        if (action === 'assign' && assignTo) params.assignTo = assignTo
        if (action === 'update_status' && status) params.status = status
        if (action === 'update_priority' && priority) params.priority = priority

        await onBulkAction(action, params)
      }
      
      // Close dialog after successful action
      onClose()
    } catch (error) {
      console.error('Bulk action error:', error)
      // Don't close dialog on error, let user see the error and retry
    } finally {
      setIsProcessing(false)
    }
  }, [action, assignTo, status, priority, deleteReason, notifyUsers, isProcessing, onBulkAction, onBulkDelete, onClose])

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose()
    }
  }, [isProcessing, onClose])

  const canApply = useMemo(() => {
    if (!action) return false
    
    switch (action) {
      case 'assign':
        return !!assignTo
      case 'update_status':
        return !!status
      case 'update_priority':
        return !!priority
      case 'export':
        return true
      case 'delete':
        return deleteReason.trim().length >= 10
      default:
        return false
    }
  }, [action, assignTo, status, priority, deleteReason])

  const getActionButtonText = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      )
    }
    
    if (action === 'delete') {
      return (
        <>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete {selectedTickets.length} tickets
        </>
      )
    }
    
    return `Apply to ${selectedTickets.length} tickets`
  }

  const getDialogTitle = () => {
    if (action === 'delete') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Bulk Delete Tickets
        </div>
      )
    }
    return 'Bulk Actions'
  }

  const getDialogDescription = () => {
    if (action === 'delete') {
      return `⚠️ This will permanently delete ${selectedTickets.length} selected tickets. This action cannot be undone.`
    }
    return `Apply actions to ${selectedTickets.length} selected tickets`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select value={action} onValueChange={setAction} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {currentUser?.role === 'admin' && (
                  <SelectItem value="assign">Assign tickets</SelectItem>
                )}
                <SelectItem value="update_status">Update status</SelectItem>
                <SelectItem value="update_priority">Update priority</SelectItem>
                <SelectItem value="export">Export selected</SelectItem>
                {/* ADDED: Delete option for admin only */}
                {currentUser?.role === 'admin' && (
                  <SelectItem value="delete" className="text-red-600 focus:text-red-600">
                    Delete tickets
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {action === 'assign' && currentUser?.role === 'admin' && (
            <div>
              <label className="text-sm font-medium">Assign to</label>
              <Select value={assignTo} onValueChange={setAssignTo} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">Assign to me</SelectItem>
                  <SelectItem value="unassign">Unassign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'update_status' && (
            <div>
              <label className="text-sm font-medium">New status</label>
              <Select value={status} onValueChange={setStatus} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'update_priority' && (
            <div>
              <label className="text-sm font-medium">New priority</label>
              <Select value={priority} onValueChange={setPriority} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ADDED: Delete specific fields */}
          {action === 'delete' && (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Warning: This action cannot be undone</p>
                    <p>All selected tickets will be permanently deleted along with their responses and attachments.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Reason for deletion *
                  <span className="text-xs text-gray-500 ml-1">(minimum 10 characters)</span>
                </label>
                <Textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Explain why these tickets are being deleted..."
                  className="mt-1"
                  rows={3}
                  disabled={isProcessing}
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {deleteReason.length}/500 characters
                  </span>
                  <span className="text-xs text-gray-500">
                    {deleteReason.trim().length >= 10 ? '✓' : `${10 - deleteReason.trim().length} more needed`}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-users"
                  checked={notifyUsers}
                  onCheckedChange={(checked) => setNotifyUsers(checked as boolean)}
                  disabled={isProcessing}
                />
                <label htmlFor="notify-users" className="text-sm">
                  Notify all users about their ticket deletions
                </label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!canApply || isProcessing}
            variant={action === 'delete' ? 'destructive' : 'default'}
            className="min-w-[180px]"
          >
            {getActionButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}