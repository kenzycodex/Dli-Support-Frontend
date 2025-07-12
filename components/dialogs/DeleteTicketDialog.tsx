// components/dialogs/DeleteTicketDialog.tsx (FIXED - Anti-Freeze Version)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { TicketData } from '@/stores/ticket-store';

interface DeleteTicketDialogProps {
  ticket: TicketData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notifyUser: boolean) => Promise<void>;
}

export function DeleteTicketDialog({
  ticket,
  isOpen,
  onClose,
  onConfirm,
}: DeleteTicketDialogProps) {
  const [reason, setReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // FIXED: Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // FIXED: Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotifyUser(false);
      setIsDeleting(false);
      setDeleteError(null);
    }
  }, [isOpen]);

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FIXED: Enhanced confirm handler with proper error handling and state management
  const handleConfirm = useCallback(async () => {
    if (!reason.trim() || isDeleting || !ticket) {
      return;
    }

    // FIXED: Validate reason length
    if (reason.trim().length < 10) {
      setDeleteError('Deletion reason must be at least 10 characters long');
      return;
    }

    console.log('🗑️ DeleteDialog: Starting deletion process for ticket:', ticket.id);

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // FIXED: Use a timeout to ensure the UI updates before the async call
      await new Promise((resolve) => setTimeout(resolve, 50));

      console.log('🔄 DeleteDialog: Calling onConfirm with:', {
        reason: reason.trim(),
        notifyUser,
      });

      // Call the parent's confirm handler
      await onConfirm(reason.trim(), notifyUser);

      console.log('✅ DeleteDialog: Deletion successful, dialog should close');

      // FIXED: Only update state if component is still mounted
      if (isMountedRef.current) {
        // Reset form state
        setReason('');
        setNotifyUser(false);
        setIsDeleting(false);
        setDeleteError(null);

        // FIXED: Small delay before closing to ensure state is clean
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log('🚪 DeleteDialog: Closing dialog after successful deletion');
            // The parent component should handle closing the dialog
            // We don't call onClose here to prevent double-closing
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ DeleteDialog: Deletion failed:', error);

      // FIXED: Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsDeleting(false);
        setDeleteError(error.message || 'Failed to delete ticket. Please try again.');

        // FIXED: Don't close dialog on error, let user see the error and retry
        console.log('⚠️ DeleteDialog: Keeping dialog open due to error');
      }
    }
  }, [reason, notifyUser, isDeleting, ticket, onConfirm]);

  // FIXED: Enhanced close handler with proper cleanup
  const handleClose = useCallback(() => {
    if (isDeleting) {
      console.log('⚠️ DeleteDialog: Cannot close while deletion in progress');
      return;
    }

    console.log('🚪 DeleteDialog: Closing dialog and resetting state');

    // Reset all state before closing
    setReason('');
    setNotifyUser(false);
    setIsDeleting(false);
    setDeleteError(null);

    // FIXED: Small delay to ensure state is reset before closing
    setTimeout(() => {
      if (isMountedRef.current) {
        onClose();
      }
    }, 50);
  }, [isDeleting, onClose]);

  // FIXED: Prevent dialog from staying open if ticket is null
  useEffect(() => {
    if (isOpen && !ticket) {
      console.log('⚠️ DeleteDialog: No ticket provided, closing dialog');
      handleClose();
    }
  }, [isOpen, ticket, handleClose]);

  // FIXED: Don't render if no ticket
  if (!ticket) {
    return null;
  }

  return (
    <Dialog
      open={isOpen && !!ticket}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Ticket
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete ticket #
            {ticket.ticket_number}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* FIXED: Show error message if any */}
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{deleteError}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Reason for deletion *
              <span className="text-xs text-gray-500 ml-1">(minimum 10 characters)</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                // Clear error when user starts typing
                if (deleteError) {
                  setDeleteError(null);
                }
              }}
              placeholder="Explain why this ticket is being deleted..."
              className="mt-1"
              rows={3}
              disabled={isDeleting}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{reason.length}/500 characters</span>
              <span className="text-xs text-gray-500">
                {reason.trim().length >= 10 ? '✓' : `${10 - reason.trim().length} more needed`}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-user"
              checked={notifyUser}
              onCheckedChange={(checked) => setNotifyUser(checked as boolean)}
              disabled={isDeleting}
            />
            <label htmlFor="notify-user" className="text-sm">
              Notify the user about this deletion
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !reason.trim() || reason.trim().length < 10}
            className="min-w-[120px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
