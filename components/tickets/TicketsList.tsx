// components/tickets/TicketsList.tsx - Using ModernTicketCard

"use client"

import { useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Ticket, Plus, Loader2 } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import { ModernTicketCard } from './ModernTicketCard' // ✅ Using ModernTicketCard instead

interface TicketsListProps {
  tickets: TicketData[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  selectedTickets: Set<number>
  permissions: TicketPermissions
  userRole?: string
  searchTerm: string
  hasFilters: boolean
  onSelectTicket: (ticketId: number, selected: boolean) => void
  onViewTicket: (ticket: TicketData) => void
  onTicketAction: (action: string, ticket: TicketData) => void
  onCreateTicket: () => void
}

export function TicketsList({
  tickets,
  loading,
  loadingMore = false,
  hasMore = true,
  selectedTickets,
  permissions,
  userRole,
  searchTerm,
  hasFilters,
  onSelectTicket,
  onViewTicket,
  onTicketAction,
  onCreateTicket,
}: TicketsListProps) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  if (loading && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <span className="text-lg text-gray-600">Loading tickets...</span>
      </div>
    )
  }

  if (tickets.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
        <p className="text-gray-600 mb-4">
          {searchTerm || hasFilters
            ? 'Try adjusting your filters or search term'
            : userRole === 'student'
            ? 'Get started by submitting your first ticket'
            : 'No tickets have been assigned to you yet'}
        </p>
        {!searchTerm && !hasFilters && userRole === 'student' && (
          <Button
            onClick={onCreateTicket}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit First Ticket
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Tickets List */}
      {tickets.map((ticket: TicketData) => (
        <ModernTicketCard
          key={ticket.id}
          ticket={ticket}
          category={ticket.category} // ✅ Pass the category properly
          isSelected={selectedTickets.has(ticket.id)}
          permissions={permissions}
          userRole={userRole}
          onSelect={(selected) => onSelectTicket(ticket.id, selected)}
          onView={() => onViewTicket(ticket)}
          onAction={(action) => {
            if (action === 'open_new_tab') {
              // Handle opening in new tab
              const url = `/tickets/${ticket.id}`;
              window.open(url, '_blank');
            } else {
              onTicketAction(action, ticket);
            }
          }}
        />
      ))}

      {/* Floating Create Button for Mobile */}
      {userRole === 'student' && (
        <div className="fixed bottom-6 right-4 sm:hidden z-40">
          <Button
            onClick={onCreateTicket}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl border-4 border-white"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  )
}