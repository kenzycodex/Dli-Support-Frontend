// components/alerts/ModernCrisisAlert.tsx - Mobile-First Crisis Alert

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flag, AlertTriangle, TrendingUp, Phone, ArrowRight, Clock } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface ModernCrisisAlertProps {
  crisisCount: number
  userRole?: string
  categories: TicketCategory[]
  tickets: TicketData[]
  onViewCrisis: () => void
}

export function ModernCrisisAlert({ 
  crisisCount, 
  userRole, 
  categories,
  tickets,
  onViewCrisis 
}: ModernCrisisAlertProps) {
  // Only show for counselors and admins
  if (crisisCount === 0 || !['counselor', 'admin'].includes(userRole || '')) return null

  const crisisTickets = tickets.filter(t => t.crisis_flag || t.priority === 'Urgent')
  const recentCrisisCount = crisisTickets.filter(t => 
    new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  // Get crisis categories
  const crisisCategories = categories.filter(c => 
    c.crisis_detection_enabled && crisisTickets.some(t => t.category_id === c.id)
  )

  const urgentCount = crisisTickets.filter(t => t.priority === 'Urgent').length
  const unassignedCrisisCount = crisisTickets.filter(t => !t.assigned_to).length

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 via-pink-50 to-red-50 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 to-pink-100/20 animate-pulse" />
      
      <CardContent className="relative p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Alert Content */}
          <div className="flex items-start space-x-4">
            {/* Crisis Icon */}
            <div className="bg-red-500 p-3 rounded-xl shadow-lg flex-shrink-0">
              <Flag className="h-6 w-6 text-white animate-pulse" />
            </div>
            
            {/* Alert Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h3 className="font-bold text-red-900 text-lg">
                  {crisisCount} Crisis Case{crisisCount > 1 ? 's' : ''} Need Immediate Attention
                </h3>
                
                {/* Priority Badges */}
                <div className="flex flex-wrap gap-2">
                  {recentCrisisCount > 0 && (
                    <Badge variant="destructive" className="animate-bounce text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {recentCrisisCount} new (24h)
                    </Badge>
                  )}
                  
                  {urgentCount > 0 && (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {urgentCount} urgent
                    </Badge>
                  )}
                  
                  {unassignedCrisisCount > 0 && (
                    <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {unassignedCrisisCount} unassigned
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-red-800 text-sm sm:text-base mb-3">
                Critical mental health situations requiring immediate professional intervention
              </p>

              {/* Crisis Categories */}
              {crisisCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-medium text-red-700">Categories:</span>
                  {crisisCategories.slice(0, 3).map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center space-x-1 px-2 py-1 bg-red-100 border border-red-200 rounded-full text-xs"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-red-800 font-medium">{category.name}</span>
                    </div>
                  ))}
                  {crisisCategories.length > 3 && (
                    <span className="px-2 py-1 bg-red-100 border border-red-200 rounded-full text-xs text-red-700">
                      +{crisisCategories.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Mobile-specific warning */}
              <div className="sm:hidden bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-red-800">
                    Emergency protocols may require immediate phone contact
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
            {/* Emergency Contact Button - Priority on mobile */}
            <Button 
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg order-1 sm:order-2 w-full sm:w-auto"
              onClick={() => window.open('tel:911')}
            >
              <Phone className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Emergency: 911</span>
              <span className="sm:hidden">Call 911</span>
            </Button>

            {/* Review Cases Button */}
            <Button 
              onClick={onViewCrisis}
              variant="outline"
              size="lg"
              className="bg-white/90 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 shadow-md order-2 sm:order-1 w-full sm:w-auto"
            >
              <Flag className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Review Cases</span>
              <span className="sm:hidden">Review ({crisisCount})</span>
              <ArrowRight className="h-4 w-4 ml-2 sm:hidden" />
            </Button>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="sm:hidden mt-4 pt-4 border-t border-red-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-red-900">{unassignedCrisisCount}</div>
              <div className="text-red-700">Unassigned</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-900">{recentCrisisCount}</div>
              <div className="text-red-700">Last 24h</div>
            </div>
          </div>
        </div>

        {/* Pulsing indicator */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full" />
      </CardContent>
    </Card>
  )
}