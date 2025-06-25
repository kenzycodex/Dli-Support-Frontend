// components/pages/tickets-page.tsx (Updated with backend integration)
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Ticket,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Eye,
  Flag,
  MessageCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { TicketSubmission } from "@/components/features/ticket-submission"
import { TicketDetails } from "@/components/features/ticket-details"
import { useTickets } from "@/hooks/use-tickets"
import { useDebounce } from "@/hooks/use-debounce"
import { TicketData } from "@/services/ticket.service"

export function TicketsPage() {
  const {
    tickets,
    loading,
    error,
    stats,
    pagination,
    fetchTickets,
    clearError,
    refreshTickets,
  } = useTickets()

  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Fetch tickets when filters change
  useEffect(() => {
    const params = {
      page: 1,
      per_page: 15,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    }
    fetchTickets(params)
  }, [debouncedSearchTerm, statusFilter, categoryFilter, priorityFilter, fetchTickets])

  const handleViewTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setShowTicketDetails(true)
  }

  const handleTicketCreated = () => {
    setShowTicketForm(false)
    refreshTickets()
  }

  const handlePageChange = (page: number) => {
    const params = {
      page,
      per_page: 15,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    }
    fetchTickets(params)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "In Progress":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "In Progress":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openTickets = tickets.filter(t => t.status === "Open" || t.status === "In Progress")
  const closedTickets = tickets.filter(t => t.status === "Resolved" || t.status === "Closed")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Ticket className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Support Tickets</h1>
              <p className="text-blue-100 text-lg">Track and manage your support requests</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{stats.open_tickets}</div>
              <div className="text-sm text-blue-100">Open Tickets</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{stats.in_progress_tickets}</div>
              <div className="text-sm text-blue-100">In Progress</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{stats.resolved_tickets}</div>
              <div className="text-sm text-blue-100">Resolved</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold">{stats.total_tickets}</div>
              <div className="text-sm text-blue-100">Total Tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowTicketForm(true)} 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Submit Ticket
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets by ID or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="mental-health">Mental Health</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={loading}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={refreshTickets}
              disabled={loading}
              className="hover:bg-blue-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <span className="text-lg text-gray-600">Loading tickets...</span>
                  <span className="text-sm text-gray-500 mt-2">This may take a moment</span>
                </div>
              </CardContent>
            </Card>
          ) : tickets.length > 0 ? (
            <>
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium text-blue-600">
                            #{ticket.ticket_number}
                          </span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            {ticket.category}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          {ticket.crisis_flag && (
                            <Badge variant="destructive" className="animate-pulse">
                              <Flag className="h-3 w-3 mr-1" />
                              CRISIS
                            </Badge>
                          )}
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(ticket.status)}
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Created: {formatDate(ticket.created_at)}</span>
                          <span>Updated: {formatDate(ticket.updated_at)}</span>
                          {ticket.assignedTo && (
                            <span>Assigned to: {ticket.assignedTo.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewTicket(ticket)}
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                    {pagination.total} tickets
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1 || loading}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1 || loading}
                    >
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                        let pageNum: number
                        const totalPages = pagination.last_page
                        const currentPage = pagination.current_page

                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.current_page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={pageNum === pagination.current_page ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page || loading}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page || loading}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
                      ? "Try adjusting your filters or search term"
                      : "Get started by submitting your first ticket"
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && priorityFilter === 'all' && (
                    <Button 
                      onClick={() => setShowTicketForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Submit First Ticket
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          {openTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        #{ticket.ticket_number}
                      </span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        {ticket.category}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.crisis_flag && (
                        <Badge variant="destructive" className="animate-pulse">
                          <Flag className="h-3 w-3 mr-1" />
                          CRISIS
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(ticket.status)}
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {formatDate(ticket.created_at)}</span>
                      <span>Updated: {formatDate(ticket.updated_at)}</span>
                      {ticket.assignedTo && (
                        <span>Assigned to: {ticket.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewTicket(ticket)}
                    className="hover:bg-blue-50 hover:border-blue-200"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow border-0 shadow-lg opacity-75">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        #{ticket.ticket_number}
                      </span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        {ticket.category}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(ticket.status)}
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-700 mb-2">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Created: {formatDate(ticket.created_at)}</span>
                      <span>
                        {ticket.status === 'Resolved' ? 'Resolved' : 'Closed'}: {formatDate(ticket.updated_at)}
                      </span>
                      {ticket.assignedTo && (
                        <span>{ticket.status === 'Resolved' ? 'Resolved by' : 'Closed by'}: {ticket.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewTicket(ticket)}
                    className="hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TicketSubmission 
        open={showTicketForm} 
        onClose={() => setShowTicketForm(false)}
        onTicketCreated={handleTicketCreated}
      />
      <TicketDetails 
        open={showTicketDetails} 
        onClose={() => setShowTicketDetails(false)} 
        ticket={selectedTicket}
        onTicketUpdated={refreshTickets}
      />
    </div>
  )
}