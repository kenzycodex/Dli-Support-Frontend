// components/alerts/EnhancedUnassignedAlert.tsx - Enhanced with Category Context

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, TrendingUp } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface EnhancedUnassignedAlertProps {
  unassignedCount: number
  userRole?: string
  permissions: TicketPermissions
  categories: TicketCategory[]
  tickets: TicketData[]
  onViewUnassigned: () => void
  onBulkAssign: () => void
}

export function EnhancedUnassignedAlert({
  unassignedCount,
  userRole,
  permissions,
  tickets,
  onViewUnassigned,
  onBulkAssign
}: EnhancedUnassignedAlertProps) {
  // Don't show if no unassigned tickets, for students, or if user can't assign
  if (unassignedCount === 0 || userRole === 'student' || !permissions.can_assign) return null

  const unassignedTickets = tickets.filter(t => !t.assigned_to)
  const urgentUnassigned = unassignedTickets.filter(t => t.priority === 'Urgent' || t.crisis_flag).length
  const recentUnassigned = unassignedTickets.filter(t => 
    new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  return (
    <Card className="border-orange-200 bg-orange-50 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-orange-900">
                {unassignedCount} Ticket{unassignedCount > 1 ? 's' : ''} Need Assignment
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-orange-700 text-sm">
                  {urgentUnassigned > 0 ? `${urgentUnassigned} urgent cases` : 'Awaiting counselor assignment'}
                </p>
                {recentUnassigned > 0 && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {recentUnassigned} new (24h)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={onViewUnassigned}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              View
            </Button>
            {permissions.can_assign && (
              <Button 
                onClick={onBulkAssign}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Assign ({unassignedCount})
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}