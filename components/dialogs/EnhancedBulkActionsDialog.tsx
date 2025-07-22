// components/dialogs/EnhancedBulkActionsDialog.tsx - Enhanced with Category Context

"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Settings, 
  Users, 
  AlertTriangle, 
  Loader2, 
  Flag,
  Bot,
  Clock,
  Tag,
  Trash2,
  RefreshCw,
  CheckCircle,
  UserPlus,
  FileDown
} from 'lucide-react'
import { TicketData } from '@/stores/ticket-store'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface EnhancedBulkActionsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTickets: TicketData[]
  categories: TicketCategory[]
  onBulkAction: (action: string, params?: any) => Promise<void>
  onBulkDelete: (reason: string, notifyUsers: boolean) => Promise<void>
}

export function EnhancedBulkActionsDialog({
  isOpen,
  onClose,
  selectedTickets,
  categories,
  onBulkAction,
  onBulkDelete
}: EnhancedBulkActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [assignTarget, setAssignTarget] = useState<string>('')
  const [statusTarget, setStatusTarget] = useState<string>('')
  const [priorityTarget, setPriorityTarget] = useState<string>('')
  const [deleteReason, setDeleteReason] = useState('')
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // ENHANCED: Analyze selected tickets
  const ticketAnalysis = useMemo(() => {
    const analysis = {
      total: selectedTickets.length,
      byCategory: {} as Record<string, { count: number; color: string; tickets: TicketData[] }>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byAssignment: {
        assigned: 0,
        unassigned: 0,
        autoAssigned: 0,
        manualAssigned: 0
      },
      crisis: 0,
      withResponses: 0,
      withAttachments: 0,
      withCrisisKeywords: 0,
      avgAge: 0,
      overdue: 0
    }

    let totalAge = 0

    selectedTickets.forEach(ticket => {
      // Category breakdown
      const category = categories.find(c => c.id === ticket.category_id)
      const categoryName = category?.name || 'Unknown'
      if (!analysis.byCategory[categoryName]) {
        analysis.byCategory[categoryName] = {
          count: 0,
          color: category?.color || '#gray',
          tickets: []
        }
      }
      analysis.byCategory[categoryName].count++
      analysis.byCategory[categoryName].tickets.push(ticket)

      // Status breakdown
      analysis.byStatus[ticket.status] = (analysis.byStatus[ticket.status] || 0) + 1

      // Priority breakdown
      analysis.byPriority[ticket.priority] = (analysis.byPriority[ticket.priority] || 0) + 1

      // Assignment analysis
      if (ticket.assigned_to) {
        analysis.byAssignment.assigned++
        if (ticket.auto_assigned === 'yes') {
          analysis.byAssignment.autoAssigned++
        } else {
          analysis.byAssignment.manualAssigned++
        }
      } else {
        analysis.byAssignment.unassigned++
      }

      // Crisis analysis
      if (ticket.crisis_flag) analysis.crisis++

      // Content analysis
      if (ticket.responses && ticket.responses.length > 0) analysis.withResponses++
      if (ticket.attachments && ticket.attachments.length > 0) analysis.withAttachments++
      if (ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0) analysis.withCrisisKeywords++

      // Age calculation
      const age = Date.now() - new Date(ticket.created_at).getTime()
      totalAge += age

      // Overdue calculation
      if (category?.sla_response_hours && !['Resolved', 'Closed'].includes(ticket.status)) {
        const deadline = new Date(ticket.created_at).getTime() + (category.sla_response_hours * 60 * 60 * 1000)
        if (Date.now() > deadline) analysis.overdue++
      }
    })

    analysis.avgAge = selectedTickets.length > 0 ? Math.floor(totalAge / selectedTickets.length / (1000 * 60 * 60 * 24)) : 0

    return analysis
  }, [selectedTickets, categories])

  const handleAction = async () => {
    if (!selectedAction || isProcessing) return

    setIsProcessing(true)
    try {
      switch (selectedAction) {
        case 'assign':
          await onBulkAction('assign', { assignTo: assignTarget })
          break
        case 'status':
          await onBulkAction('update_status', { status: statusTarget })
          break
        case 'priority':
          await onBulkAction('update_priority', { priority: priorityTarget })
          break
        case 'export':
          await onBulkAction('export')
          break
        case 'delete':
          if (deleteReason.trim()) {
            await onBulkDelete(deleteReason.trim(), notifyUsers)
          }
          break
      }
      
      // Reset form
      setSelectedAction('')
      setAssignTarget('')
      setStatusTarget('')
      setPriorityTarget('')
      setDeleteReason('')
      setNotifyUsers(false)
      onClose()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const canExecute = () => {
    if (isProcessing) return false
    
    switch (selectedAction) {
      case 'assign':
        return !!assignTarget
      case 'status':
        return !!statusTarget
      case 'priority':
        return !!priorityTarget
      case 'export':
        return true
      case 'delete':
        return !!deleteReason.trim()
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Bulk Actions</span>
            <Badge variant="outline" className="ml-2">
              {selectedTickets.length} tickets selected
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Perform actions on multiple tickets across different categories and priorities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ENHANCED: Selection Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Selection Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">Total Tickets</div>
                  <div className="text-2xl font-bold text-blue-700">{ticketAnalysis.total}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-sm font-medium text-orange-900">Avg Age</div>
                  <div className="text-2xl font-bold text-orange-700">{ticketAnalysis.avgAge}d</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-sm font-medium text-red-900">Crisis Cases</div>
                  <div className="text-2xl font-bold text-red-700">{ticketAnalysis.crisis}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-900">Overdue</div>
                  <div className="text-2xl font-bold text-yellow-700">{ticketAnalysis.overdue}</div>
                </div>
              </div>

              {/* Assignment Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span className="font-medium">{ticketAnalysis.byAssignment.assigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unassigned:</span>
                    <span className="font-medium">{ticketAnalysis.byAssignment.unassigned}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Auto-assigned:</span>
                    <span className="font-medium">{ticketAnalysis.byAssignment.autoAssigned}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Manual:</span>
                    <span className="font-medium">{ticketAnalysis.byAssignment.manualAssigned}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">By Category</h3>
              <div className="space-y-2">
                {Object.entries(ticketAnalysis.byCategory).map(([categoryName, data]) => (
                  <div key={categoryName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-sm font-medium">{categoryName}</span>
                    </div>
                    <Badge variant="outline">{data.count}</Badge>
                  </div>
                ))}
              </div>

              {/* Status Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">By Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(ticketAnalysis.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span>{status}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ENHANCED: Action Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Select Action</h3>
            
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an action to perform..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assign">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Assign Tickets</span>
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Update Status</span>
                  </div>
                </SelectItem>
                <SelectItem value="priority">
                  <div className="flex items-center space-x-2">
                    <Flag className="h-4 w-4" />
                    <span>Change Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="export">
                  <div className="flex items-center space-x-2">
                    <FileDown className="h-4 w-4" />
                    <span>Export Selection</span>
                  </div>
                </SelectItem>
                <SelectItem value="delete">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Delete Tickets</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ENHANCED: Action-Specific Forms */}
          {selectedAction === 'assign' && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Assignment Options</h4>
              <Select value={assignTarget} onValueChange={setAssignTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment target..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">Assign to me</SelectItem>
                  <SelectItem value="unassign">Remove assignments</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-blue-800">
                {assignTarget === 'me' && (
                  <div>All {selectedTickets.length} tickets will be assigned to you</div>
                )}
                {assignTarget === 'unassign' && (
                  <div>All assignments will be removed from {ticketAnalysis.byAssignment.assigned} currently assigned tickets</div>
                )}
              </div>
            </div>
          )}

          {selectedAction === 'status' && (
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900">Status Update</h4>
              <Select value={statusTarget} onValueChange={setStatusTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {statusTarget && (
                <div className="text-sm text-green-800">
                  All {selectedTickets.length} tickets will be updated to "{statusTarget}" status
                </div>
              )}
            </div>
          )}

          {selectedAction === 'priority' && (
            <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900">Priority Update</h4>
              <Select value={priorityTarget} onValueChange={setPriorityTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {priorityTarget && (
                <div className="text-sm text-orange-800">
                  All {selectedTickets.length} tickets will be updated to "{priorityTarget}" priority
                </div>
              )}
            </div>
          )}

          {selectedAction === 'export' && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Export Details</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• Export {selectedTickets.length} selected tickets to CSV format</div>
                <div>• Includes all ticket data, responses, and metadata</div>
                <div>• Category information and crisis detection data included</div>
                <div>• File will be downloaded to your device</div>
              </div>
            </div>
          )}

          {selectedAction === 'delete' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-900">Dangerous Action - Delete Tickets</h4>
              </div>
              
              {/* Data Impact Warning */}
              <div className="bg-red-100 border border-red-300 rounded p-3">
                <div className="text-sm font-medium text-red-900 mb-2">Data that will be permanently lost:</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-red-800">
                  <div>• {ticketAnalysis.withResponses} tickets with responses</div>
                  <div>• {ticketAnalysis.withAttachments} tickets with attachments</div>
                  <div>• {ticketAnalysis.crisis} crisis cases</div>
                  <div>• {ticketAnalysis.withCrisisKeywords} with crisis keywords</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-red-900">
                  Deletion Reason <span className="text-red-600">*</span>
                </label>
                <Textarea
                  placeholder="Provide a detailed reason for bulk deletion..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="min-h-[80px]"
                  maxLength={500}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-users-bulk"
                  checked={notifyUsers}
                  onCheckedChange={setNotifyUsers}
                />
                <label htmlFor="notify-users-bulk" className="text-sm font-medium text-red-900">
                  Notify all affected users about deletion
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={!canExecute()}
            variant={selectedAction === 'delete' ? 'destructive' : 'default'}
            className={selectedAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedAction === 'assign' && <UserPlus className="h-4 w-4 mr-2" />}
                {selectedAction === 'status' && <RefreshCw className="h-4 w-4 mr-2" />}
                {selectedAction === 'priority' && <Flag className="h-4 w-4 mr-2" />}
                {selectedAction === 'export' && <FileDown className="h-4 w-4 mr-2" />}
                {selectedAction === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                Execute Action
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}