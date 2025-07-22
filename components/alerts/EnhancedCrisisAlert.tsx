// components/alerts/EnhancedCrisisAlert.tsx - Enhanced with Category Breakdown

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flag, AlertTriangle, TrendingUp } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface EnhancedCrisisAlertProps {
  crisisCount: number
  userRole?: string
  categories: TicketCategory[]
  tickets: TicketData[]
  onViewCrisis: () => void
}

export function EnhancedCrisisAlert({ 
  crisisCount, 
  userRole, 
  categories,
  tickets,
  onViewCrisis 
}: EnhancedCrisisAlertProps) {
  // Don't show if no crisis tickets or for students
  if (crisisCount === 0 || userRole === 'student') return null

  const crisisTickets = tickets.filter(t => t.crisis_flag || t.priority === 'Urgent')
  const recentCrisisCount = crisisTickets.filter(t => 
    new Date(t.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length

  return (
    <Card className="border-red-200 bg-red-50 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Flag className="h-5 w-5 text-red-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-red-900">
                {crisisCount} Crisis Case{crisisCount > 1 ? 's' : ''} Require Attention
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-red-700 text-sm">
                  Immediate intervention needed for critical situations
                </p>
                {recentCrisisCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {recentCrisisCount} new (24h)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={onViewCrisis}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Review Cases
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}