// components/alerts/ModernUnassignedAlert.tsx - Admin Only Unassigned Alert

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, TrendingUp, UserPlus, ArrowRight, AlertTriangle, Bot } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface ModernUnassignedAlertProps {
  unassignedCount: number
  userRole?: string
  permissions: TicketPermissions
  categories: TicketCategory[]
  tickets: TicketData[]
  onViewUnassigned: () => void
  onBulkAssign: () => void
}

export function ModernUnassignedAlert({
  unassignedCount,
  userRole,
  permissions,
  categories,
  tickets,
  onViewUnassigned,
  onBulkAssign
}: ModernUnassignedAlertProps) {
  // Only show for admins with assignment permissions
  if (unassignedCount === 0 || userRole !== 'admin' || !permissions.can_assign) return null

  const unassignedTickets = tickets.filter(t => !t.assigned_to)
  const urgentUnassigned = unassignedTickets.filter(t => t.priority === 'Urgent' || t.crisis_flag).length
  const recentUnassigned = unassignedTickets.filter(t => 
    new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  // Get categories with auto-assignment enabled
  const autoAssignCategories = categories.filter(c => 
    c.auto_assign && unassignedTickets.some(t => t.category_id === c.id)
  )
  
  // Count tickets that should have been auto-assigned but weren't
  const failedAutoAssign = unassignedTickets.filter(t => {
    const category = categories.find(c => c.id === t.category_id)
    return category?.auto_assign && new Date(t.created_at) < new Date(Date.now() - 30 * 60 * 1000) // 30+ minutes old
  }).length

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 to-amber-100/30" />
      
      <CardContent className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Alert Content */}
          <div className="flex items-start space-x-4">
            {/* Unassigned Icon */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg flex-shrink-0">
              <Users className="h-6 w-6 text-white" />
            </div>
            
            {/* Alert Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 className="font-bold text-orange-900 text-lg">
                  {unassignedCount} Ticket{unassignedCount > 1 ? 's' : ''} Awaiting Assignment
                </h3>
                
                {/* Priority Badges */}
                <div className="flex flex-wrap gap-2">
                  {urgentUnassigned > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {urgentUnassigned} urgent
                    </Badge>
                  )}
                  
                  {recentUnassigned > 0 && (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {recentUnassigned} new (24h)
                    </Badge>
                  )}
                  
                  {failedAutoAssign > 0 && (
                    <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      {failedAutoAssign} auto-assign failed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-orange-800 text-sm sm:text-base mb-3">
                {urgentUnassigned > 0 
                  ? `${urgentUnassigned} urgent cases need immediate counselor assignment`
                  : 'Students are waiting for counselor assignment to begin support'}
              </p>

              {/* Auto-Assignment Categories */}
              {autoAssignCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-medium text-orange-700">Auto-assign enabled:</span>
                  {autoAssignCategories.slice(0, 3).map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center space-x-1 px-2 py-1 bg-orange-100 border border-orange-200 rounded-full text-xs"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-orange-800 font-medium">{category.name}</span>
                      <Bot className="h-3 w-3 text-green-600" />
                    </div>
                  ))}
                  {autoAssignCategories.length > 3 && (
                    <span className="px-2 py-1 bg-orange-100 border border-orange-200 rounded-full text-xs text-orange-700">
                      +{autoAssignCategories.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Failed Auto-Assignment Warning */}
              {failedAutoAssign > 0 && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-red-800">
                      {failedAutoAssign} tickets with auto-assignment enabled are still unassigned after 30+ minutes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
            {/* Bulk Assign Button - Priority */}
            <Button 
              onClick={onBulkAssign}
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg order-1 w-full sm:w-auto"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Bulk Assign ({unassignedCount})</span>
              <span className="sm:hidden">Assign All ({unassignedCount})</span>
            </Button>

            {/* View Button */}
            <Button 
              variant="outline"
              onClick={onViewUnassigned}
              size="lg"
              className="bg-white/90 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 shadow-md order-2 w-full sm:w-auto"
            >
              <Clock className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">View Queue</span>
              <span className="sm:hidden">View ({unassignedCount})</span>
              <ArrowRight className="h-4 w-4 ml-2 sm:hidden" />
            </Button>
          </div>
        </div>

        {/* Mobile Stats Bar */}
        <div className="sm:hidden mt-4 pt-4 border-t border-orange-200">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-orange-900">{urgentUnassigned}</div>
              <div className="text-orange-700">Urgent</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-900">{recentUnassigned}</div>
              <div className="text-orange-700">Recent</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-900">{autoAssignCategories.length}</div>
              <div className="text-orange-700">Auto-enabled</div>
            </div>
          </div>
        </div>

        {/* Notification indicator */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
      </CardContent>
    </Card>
  )
}