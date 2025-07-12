// hooks/useTicketFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { TicketData } from '@/stores/ticket-store';
import { applyTicketFilters, filterTicketsByView } from '@/utils/tickets.utils';

export const useTicketFilters = (tickets: TicketData[], filters: any, currentUserId?: number) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('all');

  // Apply filters to tickets
  const filteredTickets = useMemo(() => {
    return applyTicketFilters(tickets, searchTerm, filters, currentUserId);
  }, [tickets, searchTerm, filters, currentUserId]);

  // Apply view-specific filtering
  const currentTabTickets = useMemo(() => {
    return filterTicketsByView(filteredTickets, currentView, currentUserId);
  }, [filteredTickets, currentView, currentUserId]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    currentView,
    setCurrentView,
    filteredTickets,
    currentTabTickets,
    clearSearch,
  };
};
