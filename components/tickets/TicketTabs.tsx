// components/tickets/TicketTabs.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flag } from "lucide-react"
import { TicketStats } from '@/types/tickets.types'

interface TicketTabsProps {
  currentView: string
  stats: TicketStats
  userRole?: string
  onViewChange: (view: string) => void
}

export function TicketTabs({
  currentView,
  stats,
  userRole,
  onViewChange
}: TicketTabsProps) {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <Tabs value={currentView} onValueChange={onViewChange} className="w-full">
        <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
          <div className="flex min-w-max space-x-0">
            <TabsTrigger
              value="all"
              className="flex-shrink-0 px-4 py-3 text-sm font-medium"
            >
              All Tickets
              <Badge variant="secondary" className="ml-2">
                {stats.total}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="open"
              className="flex-shrink-0 px-4 py-3 text-sm font-medium"
            >
              Active
              <Badge variant="secondary" className="ml-2">
                {stats.open + stats.in_progress}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="closed"
              className="flex-shrink-0 px-4 py-3 text-sm font-medium"
            >
              Closed
              <Badge variant="secondary" className="ml-2">
                {stats.resolved + stats.closed}
              </Badge>
            </TabsTrigger>

            {userRole !== 'student' && stats.crisis > 0 && (
              <TabsTrigger
                value="crisis"
                className="flex-shrink-0 px-4 py-3 text-sm font-medium text-red-600"
              >
                <Flag className="h-4 w-4 mr-1" />
                Crisis
                <Badge variant="destructive" className="ml-2">
                  {stats.crisis}
                </Badge>
              </TabsTrigger>
            )}

            {userRole !== 'student' && (
              <>
                <TabsTrigger
                  value="unassigned"
                  className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                >
                  Unassigned
                  <Badge variant="secondary" className="ml-2">
                    {stats.unassigned}
                  </Badge>
                </TabsTrigger>

                <TabsTrigger
                  value="my_assigned"
                  className="flex-shrink-0 px-4 py-3 text-sm font-medium"
                >
                  My Cases
                  <Badge variant="secondary" className="ml-2">
                    {stats.my_assigned}
                  </Badge>
                </TabsTrigger>
              </>
            )}
          </div>
        </TabsList>
      </Tabs>
    </div>
  )
}