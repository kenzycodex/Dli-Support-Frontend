// components/tickets/EnhancedTicketCard.tsx - Enhanced with Dynamic Categories

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
  Bot,
  AlertTriangle,
  Target,
  Zap,
  Timer
} from 'lucide-react';
import { TicketData } from '@/stores/ticket-store';
import { TicketPermissions } from '@/types/tickets.types';
import { getStatusColor, getPriorityColor, getStatusIcon, formatDate } from '@/utils/tickets.utils';
import type { TicketCategory } from '@/services/ticketCategories.service';

interface EnhancedTicketCardProps {
  ticket: TicketData;
  category?: TicketCategory; // ENHANCED: Category data
  isSelected: boolean;
  permissions: TicketPermissions;
  userRole?: string;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onAction: (action: string) => void;
}

// ENHANCED: Helper function to calculate time remaining for SLA
function calculateTimeRemaining(deadline: string): { 
  time: string; 
  urgent: boolean; 
  overdue: boolean;
  color: string;
} {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { 
      time: 'Overdue', 
      urgent: true, 
      overdue: true,
      color: 'text-red-600'
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) {
    return { 
      time: `${minutes}m`, 
      urgent: true, 
      overdue: false,
      color: 'text-red-500'
    };
  } else if (hours < 24) {
    return { 
      time: `${hours}h ${minutes}m`, 
      urgent: hours < 2, 
      overdue: false,
      color: hours < 2 ? 'text-orange-500' : 'text-yellow-600'
    };
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return { 
      time: `${days}d ${remainingHours}h`, 
      urgent: false, 
      overdue: false,
      color: 'text-green-600'
    };
  }
}

// ENHANCED: Assignment type display
function getAssignmentDisplay(autoAssigned: string): { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
} {
  switch (autoAssigned) {
    case 'yes':
      return {
        label: 'Auto-assigned',
        icon: <Bot className="h-3 w-3" />,
        color: 'bg-green-100 text-green-800'
      };
    case 'manual':
      return {
        label: 'Manual',
        icon: <User className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-800'
      };
    default:
      return {
        label: 'Unassigned',
        icon: <Target className="h-3 w-3" />,
        color: 'bg-gray-100 text-gray-600'
      };
  }
}

export function EnhancedTicketCard({
  ticket,
  category, // ENHANCED: Category data
  isSelected,
  permissions,
  userRole,
  onSelect,
  onView,
  onAction,
}: EnhancedTicketCardProps) {
  // ENHANCED: Calculate SLA status if category has SLA settings
  const slaStatus = category?.sla_response_hours && ticket.sla_deadline 
    ? calculateTimeRemaining(ticket.sla_deadline)
    : null;

  // ENHANCED: Get assignment display
  const assignmentDisplay = getAssignmentDisplay(ticket.auto_assigned || 'no');

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
            {/* ENHANCED: Status icon with category color accent */}
            <div className="flex flex-col items-center space-y-1 flex-shrink-0">
              <div className="relative">
                {getStatusIcon(ticket.status)}
                {category && (
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: category.color }}
                    title={`${category.name} category`}
                  />
                )}
              </div>
              <span className="font-mono text-sm font-medium text-blue-600">
                #{ticket.ticket_number}
              </span>
              {ticket.crisis_flag && <Flag className="h-3 w-3 text-red-600 animate-pulse" />}
            </div>

            <div className="flex-1 min-w-0">
              {/* ENHANCED: Title with crisis and priority indicators */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                <h3
                  className="font-medium text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={onView}
                >
                  {ticket.subject}
                </h3>
                
                <div className="flex items-center space-x-2">
                  {ticket.crisis_flag && (
                    <Badge variant="destructive" className="animate-pulse self-start">
                      <Flag className="h-3 w-3 mr-1" />
                      CRISIS
                    </Badge>
                  )}
                  
                  {/* ENHANCED: Priority score indicator */}
                  {ticket.priority_score && ticket.priority_score > 100 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Score: {ticket.priority_score}
                    </Badge>
                  )}
                </div>
              </div>

              {/* ENHANCED: Badges with category and assignment info */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {/* Category Badge with color and features */}
                {category && (
                  <Badge
                    variant="outline"
                    className="border-2"
                    style={{ 
                      borderColor: category.color,
                      backgroundColor: `${category.color}10`
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      {category.crisis_detection_enabled && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" title="Crisis detection enabled" />
                      )}
                      {category.auto_assign && (
                        <Bot className="h-3 w-3 text-green-500" title="Auto-assignment enabled" />
                      )}
                    </div>
                  </Badge>
                )}
                
                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>

                {/* ENHANCED: Assignment type badge */}
                {ticket.assigned_to && (
                  <Badge variant="outline" className={assignmentDisplay.color}>
                    {assignmentDisplay.icon}
                    <span className="ml-1">{assignmentDisplay.label}</span>
                  </Badge>
                )}

                {/* ENHANCED: SLA status badge */}
                {slaStatus && (
                  <Badge 
                    variant="outline" 
                    className={`${slaStatus.overdue ? 'bg-red-50 text-red-700 border-red-200' : 
                                slaStatus.urgent ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                'bg-green-50 text-green-700 border-green-200'}`}
                  >
                    <Timer className="h-3 w-3 mr-1" />
                    {slaStatus.time}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

              {/* ENHANCED: Crisis keywords display */}
              {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Crisis Keywords Detected:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ticket.detected_crisis_keywords.slice(0, 3).map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border"
                        title={`Severity: ${keyword.severity_level} (Weight: ${keyword.severity_weight})`}
                      >
                        {keyword.keyword}
                      </span>
                    ))}
                    {ticket.detected_crisis_keywords.length > 3 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded border">
                        +{ticket.detected_crisis_keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ENHANCED: Metadata with category context */}
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
                    {ticket.assigned_at && (
                      <span className="text-gray-400">
                        ({formatDate(ticket.assigned_at)})
                      </span>
                    )}
                  </div>
                )}

                {/* ENHANCED: Category SLA info */}
                {category?.sla_response_hours && (
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>SLA: {category.sla_response_hours}h</span>
                  </div>
                )}
              </div>

              {/* ENHANCED: Tags display */}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ticket.tags.slice(0, 4).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border"
                    >
                      {tag}
                    </span>
                  ))}
                  {ticket.tags.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border">
                      +{ticket.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
            {/* ENHANCED: Indicators with crisis and SLA context */}
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

              {/* ENHANCED: Crisis indicator */}
              {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
                <div className="flex items-center space-x-1 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">{ticket.detected_crisis_keywords.length}</span>
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

                  {/* ENHANCED: Crisis detection test for admins */}
                  {userRole === 'admin' && category?.crisis_detection_enabled && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction('test_crisis')}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Test Crisis Detection
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  {/* Note: Removed potentially problematic actions like delete from dropdown */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}