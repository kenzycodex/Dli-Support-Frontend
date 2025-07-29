// components/header/AdminTicketsHeader.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Crown, Eye, RefreshCw, Loader2 } from "lucide-react"
import { TicketStats, CategoryStats } from "../../types/admin-types"

interface AdminTicketsHeaderProps {
  ticketStats: TicketStats
  categoryStats: CategoryStats
  isLoading: boolean
  onBackToTickets: () => void
  onRefreshAll: () => void
}

export function AdminTicketsHeader({
  ticketStats,
  categoryStats,
  isLoading,
  onBackToTickets,
  onRefreshAll
}: AdminTicketsHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Ticket Management Center</h1>
            <p className="text-blue-100 text-xs sm:text-sm lg:text-base">Complete oversight of the ticketing system</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToTickets}
            className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Public View</span>
            <span className="sm:hidden">View</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Quick Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Total Tickets</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.crisis}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Crisis Cases</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : categoryStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Categories</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.unassigned}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Unassigned</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.auto_assigned}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Auto-Assigned</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : categoryStats.with_crisis_detection}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Crisis Detection</div>
        </div>
      </div>
    </div>
  )
}