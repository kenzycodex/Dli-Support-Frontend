// components/dialogs/IndividualActionDialog.tsx
"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, UserPlus, CheckCircle, MousePointerClick, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TicketData } from "@/stores/ticket-store"

interface IndividualActionDialogProps {
  isOpen: boolean
  ticket?: TicketData | null
  action: 'edit' | 'delete' | 'assign' | 'resolve'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

export function IndividualActionDialog({
  isOpen,
  ticket,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: IndividualActionDialogProps) {
  if (!ticket) return null

  const getActionDetails = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Ticket',
          description: 'Are you sure you want to delete this ticket? This action cannot be undone.',
          confirmText: 'Delete Ticket',
          variant: 'destructive' as const,
          icon: <Trash2 className="h-4 w-4" />
        }
      case 'assign':
        return {
          title: 'Assign Ticket',
          description: 'Are you sure you want to assign this ticket to yourself?',
          confirmText: 'Assign to Me',
          variant: 'default' as const,
          icon: <UserPlus className="h-4 w-4" />
        }
      case 'resolve':
        return {
          title: 'Resolve Ticket',
          description: 'Are you sure you want to mark this ticket as resolved?',
          confirmText: 'Mark Resolved',
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          variant: 'default' as const,
          icon: <MousePointerClick className="h-4 w-4" />
        }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            {actionDetails.icon}
            <span>{actionDetails.title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{actionDetails.description}</p>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="font-medium text-sm">
                  #{ticket.ticket_number} - {ticket.subject}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {ticket.description.substring(0, 80)}...
                </p>
              </div>
              {action === 'delete' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-xs font-medium">
                    ⚠️ This will permanently delete the ticket and all associated data.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              "w-full sm:w-auto",
              actionDetails.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {actionDetails.icon}
                <span className="ml-2">{actionDetails.confirmText}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}