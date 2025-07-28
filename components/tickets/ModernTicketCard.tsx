// components/tickets/ModernTicketCard.tsx - Mobile-First Responsive Design - FIXED

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
  MoreVertical,
  Paperclip,
  MessageSquare,
  User,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle,
  UserPlus,
  Bot,
  AlertTriangle,
  Timer,
  Zap,
  ArrowRight,
  Phone
} from 'lucide-react';
import { TicketData } from '@/stores/ticket-store';
import { TicketPermissions } from '@/types/tickets.types';
import { getStatusColor, getPriorityColor, getStatusIcon, formatDate } from '@/utils/tickets.utils';
import type { TicketCategory } from '@/services/ticketCategories.service';

interface ModernTicketCardProps {
  ticket: TicketData;
  category?: TicketCategory;
  isSelected: boolean;
  permissions: TicketPermissions;
  userRole?: string;
  onSelect: (selected: boolean) => void;
  onView: () => void;
  onAction: (action: string) => void;
}

// Helper function to calculate time remaining for SLA
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
      time: `${hours}h`, 
      urgent: hours < 2, 
      overdue: false,
      color: hours < 2 ? 'text-orange-500' : 'text-yellow-600'
    };
  } else {
    const days = Math.floor(hours / 24);
    return { 
      time: `${days}d`, 
      urgent: false, 
      overdue: false,
      color: 'text-green-600'
    };
  }
}

// Assignment type display
function getAssignmentDisplay(autoAssigned: string): { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
} {
  switch (autoAssigned) {
    case 'yes':
      return {
        label: 'Auto',
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
        icon: <User className="h-3 w-3" />,
        color: 'bg-gray-100 text-gray-600'
      };
  }
}

export function ModernTicketCard({
  ticket,
  category,
  isSelected,
  permissions,
  userRole,
  onSelect,
  onView,
  onAction,
}: ModernTicketCardProps) {
  // Calculate SLA status if category has SLA settings
  const slaStatus = category?.sla_response_hours && ticket.sla_deadline 
    ? calculateTimeRemaining(ticket.sla_deadline)
    : null;

  // Get assignment display
  const assignmentDisplay = getAssignmentDisplay(ticket.auto_assigned || 'no');

	return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm group">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Mobile-First Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {/* Selection Checkbox - Hidden on mobile unless bulk actions enabled */}
              {permissions.can_bulk_actions && (
                <div className="hidden sm:block pt-1">
                  <Checkbox checked={isSelected} onCheckedChange={onSelect} />
                </div>
              )}

              {/* Status Icon with Category Accent */}
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
                <span className="font-mono text-xs font-medium text-blue-600">
                  #{ticket.ticket_number}
                </span>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Title and Crisis Indicators */}
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition-colors text-sm sm:text-base leading-tight"
                    onClick={onView}
                  >
                    {ticket.subject}
                  </h3>
                  
                  {/* Crisis and Priority Indicators */}
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    {ticket.crisis_flag && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Crisis" />
                    )}
                    
                    {ticket.priority_score && ticket.priority_score > 100 && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" title={`Priority Score: ${ticket.priority_score}`} />
                    )}
                  </div>
                </div>

                {/* Mobile-Optimized Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {/* Category Badge - FIXED: Added null check */}
                  {category && (
                    <Badge
                      variant="outline"
                      className="text-xs border-2"
                      style={{ 
                        borderColor: category.color,
                        backgroundColor: `${category.color}10`
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="hidden sm:inline">{category.name}</span>
                        <span className="sm:hidden">
                          {category.name ? (category.name.length > 6 ? category.name.slice(0, 6) + '.' : category.name) : 'N/A'}
                        </span>
                      </div>
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-xs`}>
                    <span className="hidden sm:inline">{ticket.priority}</span>
                    <span className="sm:hidden">{ticket.priority?.slice(0, 1) || 'N'}</span>
                  </Badge>
                  
                  <Badge variant="outline" className={`${getStatusColor(ticket.status)} text-xs`}>
                    <span className="hidden sm:inline">{ticket.status}</span>
                    <span className="sm:hidden">
                      {ticket.status === 'In Progress' ? 'IP' : (ticket.status?.slice(0, 3) || 'N/A')}
                    </span>
                  </Badge>

                  {/* Crisis Badge - Mobile Priority */}
                  {ticket.crisis_flag && (
                    <Badge variant="destructive" className="animate-pulse text-xs">
                      <Flag className="h-2.5 w-2.5 mr-1" />
                      <span className="hidden sm:inline">CRISIS</span>
                      <span className="sm:hidden">!</span>
                    </Badge>
                  )}

                  {/* Assignment Badge */}
                  {ticket.assigned_to && (
                    <Badge variant="outline" className={`${assignmentDisplay.color} text-xs hidden sm:inline-flex`}>
                      {assignmentDisplay.icon}
                      <span className="ml-1">{assignmentDisplay.label}</span>
                    </Badge>
                  )}

                  {/* SLA Status Badge */}
                  {slaStatus && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${slaStatus.overdue ? 'bg-red-50 text-red-700 border-red-200' : 
                                  slaStatus.urgent ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                  'bg-green-50 text-green-700 border-green-200'}`}
                    >
                      <Timer className="h-2.5 w-2.5 mr-1" />
                      {slaStatus.time}
                    </Badge>
                  )}
                </div>

                {/* Description - Mobile Optimized */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Crisis Keywords - Mobile Alert - FIXED: Added null check */}
                {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-medium text-red-800">Crisis Keywords:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ticket.detected_crisis_keywords.slice(0, 2).map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded"
                        >
                          {keyword?.keyword || 'Unknown'}
                        </span>
                      ))}
                      {ticket.detected_crisis_keywords.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          +{ticket.detected_crisis_keywords.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile-First Metadata */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-x-4 sm:gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{ticket.user?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(ticket.created_at)}</span>
                  </div>
                  
                  {ticket.assignedTo && (
                    <div className="flex items-center space-x-1 col-span-2 sm:col-span-1">
                      <UserPlus className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{ticket.assignedTo.name}</span>
                    </div>
                  )}

                  {category?.sla_response_hours && (
                    <div className="flex items-center space-x-1">
                      <Timer className="h-3 w-3 flex-shrink-0" />
                      <span>SLA: {category.sla_response_hours}h</span>
                    </div>
                  )}
                </div>

                {/* Content Indicators */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs">{ticket.attachments.length}</span>
                      </div>
                    )}
                    
                    {ticket.responses && ticket.responses.length > 0 && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">{ticket.responses.length}</span>
                      </div>
                    )}

                    {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
                      <div className="flex items-center space-x-1 text-red-500">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">{ticket.detected_crisis_keywords.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile-First Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Crisis Emergency Call Button */}
                    {ticket.crisis_flag && userRole !== 'student' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2 sm:px-3 bg-red-600 hover:bg-red-700"
                        onClick={() => onAction('emergency_call')}
                      >
                        <Phone className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Call</span>
                      </Button>
                    )}

                    {/* Primary View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onView}
                      className="h-8 px-2 sm:px-3 hover:bg-blue-50 hover:border-blue-200 group"
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">View</span>
                      <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity sm:hidden" />
                    </Button>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-3 w-3" />
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

                        {userRole === 'admin' && category?.crisis_detection_enabled && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAction('test_crisis')}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Test Crisis Detection
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}