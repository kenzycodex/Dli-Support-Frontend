// components/tickets/TicketCard.tsx (FIXED - Removed problematic actions)
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Flag,
  MoreHorizontal,
  Paperclip,
  MessageSquare,
  Tags,
  User,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle,
  UserPlus,
  Copy,
} from 'lucide-react';
import { TicketData } from '@/stores/ticket-store';
import { TicketPermissions } from '@/types/tickets.types';
import { getStatusColor, getPriorityColor, getStatusIcon, formatDate } from '@/utils/tickets.utils';

interface TicketCardProps {
  ticket: TicketData;
  isSelected: boolean;
  permissions: TicketPermissions;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onAction: (action: string) => void;
}

export function TicketCard({
  ticket,
  isSelected,
  permissions,
  onSelect,
  onView,
  onAction,
}: TicketCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-0 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          {/* Selection Checkbox */}
          {permissions.can_bulk_actions && (
            <div className="flex items-start lg:mr-4">
              <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1" />
            </div>
          )}

          <div className="flex items-start space-x-4 flex-1">
            <div className="flex flex-col items-center space-y-1 flex-shrink-0">
              {getStatusIcon(ticket.status)}
              <span className="font-mono text-sm font-medium text-blue-600">
                #{ticket.ticket_number}
              </span>
              {ticket.crisis_flag && <Flag className="h-3 w-3 text-red-600 animate-pulse" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                <h3
                  className="font-medium text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={onView}
                >
                  {ticket.subject}
                </h3>
                {ticket.crisis_flag && (
                  <Badge variant="destructive" className="animate-pulse self-start">
                    <Flag className="h-3 w-3 mr-1" />
                    CRISIS
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-200"
                >
                  {ticket.category}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{ticket.user?.name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">Created: </span>
                  <span>{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">Updated: </span>
                  <span>{formatDate(ticket.updated_at)}</span>
                </div>
                {ticket.assignedTo && (
                  <div className="flex items-center space-x-1">
                    <UserPlus className="h-3 w-3" />
                    <span className="hidden sm:inline">Assigned to: </span>
                    <span>{ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
            {/* Indicators */}
            <div className="flex items-center space-x-3">
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">{ticket.attachments.length}</span>
                </div>
              )}
              {ticket.responses && ticket.responses.length > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{ticket.responses.length}</span>
                </div>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Tags className="h-4 w-4" />
                  <span className="text-xs">{ticket.tags.length}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="hover:bg-blue-50 hover:border-blue-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">View</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>

                  {permissions.can_modify && (
                    <>
                      <DropdownMenuSeparator />
                      {ticket.status === 'Open' && (
                        <DropdownMenuItem onClick={() => onAction('mark_in_progress')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Mark In Progress
                        </DropdownMenuItem>
                      )}
                      {(ticket.status === 'Open' || ticket.status === 'In Progress') && (
                        <DropdownMenuItem onClick={() => onAction('mark_resolved')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                      )}
                      {!ticket.assigned_to && permissions.can_assign && (
                        <DropdownMenuItem onClick={() => onAction('assign_to_me')}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign to Me
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  {/* REMOVED: Open in New Tab and Delete options */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
