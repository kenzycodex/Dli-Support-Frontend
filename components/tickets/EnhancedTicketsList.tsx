// components/tickets/EnhancedTicketsList.tsx - Enhanced with Dynamic Categories

"use client"

import { Button } from "@/components/ui/button"
import { Ticket, Plus, Loader2 } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import { EnhancedTicketCard } from './EnhancedTicketCard'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface EnhancedTicketsListProps {
  tickets: TicketData[]
  categories: TicketCategory[] // ENHANCED: Categories data
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

export function EnhancedTicketsList({
  tickets,
  categories, // ENHANCED: Categories data
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
}: EnhancedTicketsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <span className="text-lg text-gray-600">Loading tickets...</span>
        <span className="text-sm text-gray-500 mt-2">Fetching tickets and categories...</span>
      </div>
    )
  }

  if (tickets.length === 0) {
    // ENHANCED: Empty state with category context
    const activeCategoriesCount = categories.filter(c => c.is_active).length;
    
    return (
      <div className="text-center py-12">
        <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
        <p className="text-gray-600 mb-4">
          {searchTerm || hasFilters
            ? 'Try adjusting your filters or search term'
            : userRole === 'student'
            ? `Get started by submitting your first ticket${activeCategoriesCount > 0 ? ` in one of ${activeCategoriesCount} available categories` : ''}`
            : 'No tickets have been assigned to you yet'}
        </p>
        
        {/* ENHANCED: Category hints for empty state */}
        {!searchTerm && !hasFilters && userRole === 'student' && activeCategoriesCount > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Available categories:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {categories.filter(c => c.is_active).slice(0, 5).map(category => (
                <div 
                  key={category.id}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              ))}
              {activeCategoriesCount > 5 && (
                <div className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                  +{activeCategoriesCount - 5} more
                </div>
              )}
            </div>
          </div>
        )}
        
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

  // ENHANCED: Group tickets by category for better organization (optional display)
  const ticketsByCategory = tickets.reduce((acc, ticket) => {
    const categoryName = ticket.category?.name || 'Unknown Category';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(ticket);
    return acc;
  }, {} as Record<string, TicketData[]>);

  const shouldGroupByCategory = hasFilters && searchTerm && Object.keys(ticketsByCategory).length > 1;

  return (
    <div className="space-y-3">
      {/* ENHANCED: Category grouping when multiple categories are shown */}
      {shouldGroupByCategory ? (
        Object.entries(ticketsByCategory).map(([categoryName, categoryTickets]) => {
          const category = categories.find(c => c.name === categoryName);
          
          return (
            <div key={categoryName} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center space-x-3 py-2 border-b">
                <div className="flex items-center space-x-2">
                  {category && (
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <h4 className="font-medium text-gray-900">{categoryName}</h4>
                  <span className="text-sm text-gray-500">({categoryTickets.length})</span>
                </div>
                
                {category && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {category.crisis_detection_enabled && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                        Crisis Detection
                      </span>
                    )}
                    {category.auto_assign && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        Auto-assign
                      </span>
                    )}
                    <span>SLA: {category.sla_response_hours || 24}h</span>
                  </div>
                )}
              </div>
              
              {/* Category Tickets */}
              <div className="space-y-3 pl-4">
                {categoryTickets.map((ticket: TicketData) => (
                  <EnhancedTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    category={category}
                    isSelected={selectedTickets.has(ticket.id)}
                    permissions={permissions}
                    userRole={userRole}
                    onSelect={(selected) => onSelectTicket(ticket.id, selected)}
                    onView={() => onViewTicket(ticket)}
                    onAction={(action) => onTicketAction(action, ticket)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // ENHANCED: Standard list view with enhanced ticket cards
        tickets.map((ticket: TicketData) => {
          const category = categories.find(c => c.id === ticket.category_id);
          
          return (
            <EnhancedTicketCard
              key={ticket.id}
              ticket={ticket}
              category={category}
              isSelected={selectedTickets.has(ticket.id)}
              permissions={permissions}
              userRole={userRole}
              onSelect={(selected) => onSelectTicket(ticket.id, selected)}
              onView={() => onViewTicket(ticket)}
              onAction={(action) => onTicketAction(action, ticket)}
            />
          );
        })
      )}
      
      {/* ENHANCED: Results summary with category breakdown */}
      {tickets.length > 0 && (
        <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Tickets Summary */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Tickets Summary</h5>
              <div className="space-y-1 text-gray-600">
                <div>Total: {tickets.length}</div>
                <div>Selected: {selectedTickets.size}</div>
                <div>Crisis: {tickets.filter(t => t.crisis_flag).length}</div>
                <div>Unassigned: {tickets.filter(t => !t.assigned_to).length}</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">By Category</h5>
              <div className="space-y-1">
                {Object.entries(ticketsByCategory).slice(0, 3).map(([categoryName, categoryTickets]) => {
                  const category = categories.find(c => c.name === categoryName);
                  return (
                    <div key={categoryName} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {category && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <span className="text-gray-600 text-xs truncate">
                          {categoryName}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">{categoryTickets.length}</span>
                    </div>
                  );
                })}
                {Object.keys(ticketsByCategory).length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{Object.keys(ticketsByCategory).length - 3} more categories
                  </div>
                )}
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">By Status</h5>
              <div className="space-y-1 text-gray-600 text-xs">
                <div className="flex justify-between">
                  <span>Open:</span>
                  <span>{tickets.filter(t => t.status === 'Open').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span>{tickets.filter(t => t.status === 'In Progress').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolved:</span>
                  <span>{tickets.filter(t => t.status === 'Resolved').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span>{tickets.filter(t => t.status === 'Closed').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}