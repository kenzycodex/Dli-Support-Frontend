// components/tickets/InfiniteTicketsList.tsx - Mobile-First with Infinite Scroll

"use client"

import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Ticket, Plus, Loader2, RefreshCw } from "lucide-react"
import { TicketData } from '@/stores/ticket-store'
import { TicketPermissions } from '@/types/tickets.types'
import { ModernTicketCard } from './ModernTicketCard'
import type { TicketCategory } from '@/services/ticketCategories.service'

interface InfiniteTicketsListProps {
  tickets: TicketData[]
  categories: TicketCategory[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  selectedTickets: Set<number>
  permissions: TicketPermissions
  userRole?: string
  searchTerm: string
  hasFilters: boolean
  onSelectTicket: (ticketId: number, selected: boolean) => void
  onViewTicket: (ticket: TicketData) => void
  onTicketAction: (action: string, ticket: TicketData) => void
  onCreateTicket: () => void
  loadMoreRef: React.RefObject<HTMLDivElement | null>
}

export const InfiniteTicketsList = forwardRef<HTMLDivElement, InfiniteTicketsListProps>(
  function InfiniteTicketsList({
    tickets,
    categories,
    loading,
    loadingMore,
    hasMore,
    selectedTickets,
    permissions,
    userRole,
    searchTerm,
    hasFilters,
    onSelectTicket,
    onViewTicket,
    onTicketAction,
    onCreateTicket,
    loadMoreRef
  }, ref) {
    // Initial loading state
    if (loading && tickets.length === 0) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white/80 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Empty state
    if (tickets.length === 0) {
      const activeCategoriesCount = categories.filter(c => c.is_active).length;
      
      return (
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Ticket className="h-10 w-10 text-gray-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || hasFilters ? 'No tickets found' : 'No tickets yet'}
            </h3>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {searchTerm || hasFilters
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : userRole === 'student'
                ? `Get started by submitting your first support ticket${activeCategoriesCount > 0 ? ` in one of ${activeCategoriesCount} available categories` : ''}`
                : 'No tickets have been assigned to you yet'}
            </p>
            
            {/* Category hints for empty state */}
            {!searchTerm && !hasFilters && userRole === 'student' && activeCategoriesCount > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">Available categories:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.filter(c => c.is_active).slice(0, 4).map(category => (
                    <div 
                      key={category.id}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full text-sm border border-gray-200"
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-gray-700">{category.name}</span>
                    </div>
                  ))}
                  {activeCategoriesCount > 4 && (
                    <div className="px-3 py-2 bg-gray-50 rounded-full text-sm text-gray-500 border border-gray-200">
                      +{activeCategoriesCount - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!searchTerm && !hasFilters && userRole === 'student' && (
              <Button
                onClick={onCreateTicket}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Submit Your First Ticket
              </Button>
            )}

            {(searchTerm || hasFilters) && (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="text-gray-600 hover:text-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear and Refresh
              </Button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Tickets List */}
        {tickets.map((ticket: TicketData, index) => {
          const category = categories.find(c => c.id === ticket.category_id);
          
          return (
            <ModernTicketCard
              key={`${ticket.id}-${index}`}
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
        })}
        
        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center space-x-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading more tickets...</span>
            </div>
          )}
          
          {!hasMore && tickets.length > 10 && (
            <div className="text-center text-gray-500">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm">You've reached the end</span>
              </div>
            </div>
          )}
        </div>

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
)