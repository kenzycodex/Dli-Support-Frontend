// components/cards/AdminTicketCard.tsx
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Edit,
  Trash2,
  Eye,
  UserPlus,
  CheckCircle,
  Flag,
  Bot,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusColor, getPriorityColor } from "../../utils/helpers"
import { TicketData } from "@/stores/ticket-store"

interface AdminTicketCardProps {
  ticket: TicketData
  onEdit: (ticket: TicketData) => void
  onDelete: (ticket: TicketData) => void
  onAssign: (ticket: TicketData) => void
  onResolve: (ticket: TicketData) => void
  onView: (ticket: TicketData) => void
  isLoading: boolean
}

export function AdminTicketCard({ 
  ticket, 
  onEdit, 
  onDelete, 
  onAssign, 
  onResolve, 
  onView,
  isLoading 
}: AdminTicketCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Mobile-First Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  #{ticket.ticket_number}
                </h3>
                <div className="flex items-center space-x-1 sm:hidden">
                  {ticket.crisis_flag && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      <Flag className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 line-clamp-1">
                {ticket.subject}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2 sm:line-clamp-1">
                {ticket.description.substring(0, 100)}...
              </p>
            </div>

            {/* Desktop Status Badges */}
            <div className="hidden sm:flex items-center space-x-2">
              {ticket.crisis_flag && (
                <Badge variant="destructive" className="animate-pulse">
                  <Flag className="h-3 w-3 mr-1" />
                  CRISIS
                </Badge>
              )}
              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
          </div>

          {/* Mobile Status Row */}
          <div className="flex flex-wrap items-center gap-1 sm:hidden">
            <Badge variant="outline" className={cn("text-xs", getStatusColor(ticket.status))}>
              {ticket.status}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
              {ticket.priority}
            </Badge>
            {ticket.category && (
              <Badge
                variant="outline"
                className="text-xs border-2"
                style={{ 
                  borderColor: ticket.category.color,
                  backgroundColor: `${ticket.category.color}10`
                }}
              >
                {ticket.category.name}
              </Badge>
            )}
          </div>

          {/* Desktop Category and Assignment Info */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {ticket.category && (
              <Badge
                variant="outline"
                className="border-2"
                style={{ 
                  borderColor: ticket.category.color,
                  backgroundColor: `${ticket.category.color}10`
                }}
              >
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ticket.category.color }}
                  />
                  <span>{ticket.category.name}</span>
                  {ticket.category.crisis_detection_enabled && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                  {ticket.category.auto_assign && (
                    <Bot className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </Badge>
            )}
            
            {ticket.auto_assigned === 'yes' && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <Bot className="h-3 w-3 mr-1" />
                Auto-assigned
              </Badge>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-24 sm:max-w-none">{ticket.user?.name || 'Unknown User'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center space-x-1">
                  <UserPlus className="h-3 w-3" />
                  <span className="truncate max-w-20 sm:max-w-none">Assigned to: {ticket.assignedTo.name}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(ticket)}
                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                title="View Ticket"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(ticket)}
                className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                title="Edit Ticket"
              >
                <Edit className="h-4 w-4" />
              </Button>

              {!ticket.assigned_to && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAssign(ticket)}
                  className="text-purple-600 hover:text-purple-700 h-8 w-8 p-0"
                  title="Assign to Me"
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}

              {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResolve(ticket)}
                  className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                  title="Mark Resolved"
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(ticket)}
                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                title="Delete Ticket"
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Crisis Keywords Mobile */}
          {ticket.detected_crisis_keywords && ticket.detected_crisis_keywords.length > 0 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs sm:text-sm font-medium text-red-800">Crisis Keywords:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ticket.detected_crisis_keywords.slice(0, 3).map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                  >
                    {keyword.keyword}
                  </span>
                ))}
                {ticket.detected_crisis_keywords.length > 3 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    +{ticket.detected_crisis_keywords.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}