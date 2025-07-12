// components/tickets/TicketsList.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Ticket, Plus, Loader2 } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import { TicketCard } from './TicketCard'

interface TicketsListProps {
  tickets: TicketData[]
  loading: boolean
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
  selectedTickets,
  permissions,
  userRole,
  searchTerm,
  hasFilters,
  onSelectTicket,
  onViewTicket,
  onTicketAction,
  onCreateTicket
}: TicketsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <span className="text-lg text-gray-600">Loading tickets...</span>
      </div>
    )
  }

  if (tickets.length === 0) {
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
      {tickets.map((ticket: TicketData) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          isSelected={selectedTickets.has(ticket.id)}
          permissions={permissions}
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
    </div>
  )
}