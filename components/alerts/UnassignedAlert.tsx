// components/alerts/UnassignedAlert.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { TicketPermissions } from '@/types/tickets.types'

interface UnassignedAlertProps {
  unassignedCount: number
  userRole?: string
  permissions: TicketPermissions
  onViewUnassigned: () => void
  onBulkAssign: () => void
}

export function UnassignedAlert({ 
  unassignedCount, 
  userRole, 
  permissions,
  onViewUnassigned, 
  onBulkAssign 
}: UnassignedAlertProps) {
  if (userRole === 'student' || unassignedCount === 0) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="p-3 bg-orange-500 rounded-full flex-shrink-0">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-1">
              ⚠️ Unassigned Tickets Need Attention
            </h3>
            <p className="text-orange-700">
              {unassignedCount} ticket(s) are waiting for assignment.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onViewUnassigned}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              View Unassigned
            </Button>
            {permissions.can_assign && (
              <Button
                variant="outline"
                onClick={onBulkAssign}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Bulk Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}