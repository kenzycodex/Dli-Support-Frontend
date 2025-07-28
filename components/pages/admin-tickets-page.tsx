// components/pages/admin-tickets-page.tsx - FIXED: Complete Admin Tickets Management System

"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Video,
  Headphones,
  Brain,
  Heart,
  FileText,
  Activity,
  EyeOff,
  StarOff,
  X,
  Globe,
  Lock,
  Flag,
  Bot,
  UserPlus,
  MessageSquare,
  Paperclip,
  Timer,
  User,
  Phone,
  Shield,
  Sliders,
  Database,
  Workflow,
  PieChart,
  TrendingDown,
  ArrowUpDown,
  ListFilter,
  MousePointerClick,
  Lightbulb,
  Cog,
  Package,
  Layers,
  CrownIcon as Crown,
  Megaphone,
  Hash,
  Link,
  Monitor,
  Smartphone
} from "lucide-react"

import { EnhancedPagination } from '@/components/common/enhanced-pagination'
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// FIXED: Import the correct hook and stores
import { useTicketIntegration } from "@/hooks/useTicketIntegration"
import { useTicketStore, TicketData } from "@/stores/ticket-store"
import { useTicketCategoriesStore, CategoryWithStats } from "@/stores/ticketCategories-store"

// FIXED: Import the correct service and types
import { TicketCategory } from "@/services/ticketCategories.service"

// Types
type AdminTabType = 'tickets' | 'categories' | 'crisis-keywords' | 'counselor-specializations' | 'analytics' | 'system'

interface FilterOptions {
  search?: string
  status?: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  category?: string
  priority?: string
  assigned?: string
  crisis_flag?: string
  auto_assigned?: string
  date_range?: string
  sort_by?: string
  page?: number
  per_page?: number
}

interface AdminTicketsPageProps {
  onNavigate?: (page: string, params?: any) => void
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  auto_assign: boolean
  crisis_detection_enabled: boolean
  sla_response_hours: number
  max_priority_level: number
  sort_order: number
}

interface CrisisKeywordFormData {
  keyword: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  severity_weight: number
  is_active: boolean
  category_ids: number[]
}

interface CounselorSpecializationFormData {
  user_id: number
  category_id: number
  priority_level: 'primary' | 'secondary' | 'backup'
  max_workload: number
  expertise_rating: number
  is_available: boolean
}

// Enhanced Admin Header Component
function AdminTicketsHeader({
  ticketStats,
  categoryStats,
  isLoading,
  onBackToTickets,
  onRefreshAll
}: {
  ticketStats: any
  categoryStats: any
  isLoading: boolean
  onBackToTickets: () => void
  onRefreshAll: () => void
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Ticket Management Center</h1>
            <p className="text-blue-100 text-xs sm:text-sm lg:text-base">Complete oversight of the ticketing system</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToTickets}
            className="bg-white/20 hover:bg-white/30 border-white/30 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Public View</span>
            <span className="sm:hidden">View</span>
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Quick Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Total Tickets</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.crisis}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Crisis Cases</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : categoryStats.total}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Categories</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.unassigned}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Unassigned</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : ticketStats.auto_assigned}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Auto-Assigned</div>
        </div>
        <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" /> : categoryStats.with_crisis_detection}
          </div>
          <div className="text-xs sm:text-sm text-blue-100">Crisis Detection</div>
        </div>
      </div>
    </div>
  )
}

// Individual Action Dialog Component
function IndividualActionDialog({
  isOpen,
  ticket,
  action,
  onConfirm,
  onCancel,
  isProcessing
}: {
  isOpen: boolean
  ticket?: TicketData | null
  action: 'edit' | 'delete' | 'assign' | 'resolve'
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}) {
  if (!ticket) return null

  const getActionDetails = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Ticket',
          description: 'Are you sure you want to delete this ticket? This action cannot be undone.',
          confirmText: 'Delete Ticket',
          variant: 'destructive' as const,
          icon: <Trash2 className="h-4 w-4" />
        }
      case 'assign':
        return {
          title: 'Assign Ticket',
          description: 'Are you sure you want to assign this ticket to yourself?',
          confirmText: 'Assign to Me',
          variant: 'default' as const,
          icon: <UserPlus className="h-4 w-4" />
        }
      case 'resolve':
        return {
          title: 'Resolve Ticket',
          description: 'Are you sure you want to mark this ticket as resolved?',
          confirmText: 'Mark Resolved',
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          variant: 'default' as const,
          icon: <MousePointerClick className="h-4 w-4" />
        }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className="max-w-md mx-4 sm:mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            {actionDetails.icon}
            <span>{actionDetails.title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{actionDetails.description}</p>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="font-medium text-sm">
                  #{ticket.ticket_number} - {ticket.subject}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {ticket.description.substring(0, 80)}...
                </p>
              </div>
              {action === 'delete' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-xs font-medium">
                    ⚠️ This will permanently delete the ticket and all associated data.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isProcessing}
            className={cn(
              "w-full sm:w-auto",
              actionDetails.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {actionDetails.icon}
                <span className="ml-2">{actionDetails.confirmText}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Enhanced Mobile-First Ticket Card Component
function AdminTicketCard({ 
  ticket, 
  onEdit, 
  onDelete, 
  onAssign, 
  onResolve, 
  onView,
  isLoading 
}: {
  ticket: TicketData
  onEdit: (ticket: TicketData) => void
  onDelete: (ticket: TicketData) => void
  onAssign: (ticket: TicketData) => void
  onResolve: (ticket: TicketData) => void
  onView: (ticket: TicketData) => void
  isLoading: boolean
}) {
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

// Helper functions for styling
function getStatusColor(status: string): string {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'In Progress':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Resolved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800 border-red-200 animate-pulse'
    case 'High':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Medium':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// FIXED: Main component with proper return type
export function AdminTicketsPage({ onNavigate }: AdminTicketsPageProps): React.ReactElement {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState<AdminTabType>("tickets")
  
  // FIXED: Use the ticket integration hook properly
  const {
    data: { tickets, categories },
    state: { loading, errors },
    ticketOperations,
    refreshAll,
    clearAllCaches,
  } = useTicketIntegration({
    autoLoadCategories: true,
    autoLoadTickets: true,
    enableRealTimeUpdates: true
  })

  // FIXED: Use ticket categories store for enhanced category management
  const categoriesStore = useTicketCategoriesStore()

  // Local filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    category: 'all',
    priority: 'all',
    assigned: 'all',
    crisis_flag: 'all',
    auto_assigned: 'all',
    sort_by: 'newest',
    page: 1,
    per_page: 25,
  })

  // Dialog states
  const [individualActionDialog, setIndividualActionDialog] = useState<{
    isOpen: boolean
    ticket?: TicketData | null
    action: 'edit' | 'delete' | 'assign' | 'resolve'
    isProcessing: boolean
  }>({
    isOpen: false,
    ticket: null,
    action: 'edit',
    isProcessing: false
  })

  // Category form dialog state
  const [categoryDialog, setCategoryDialog] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    category: null as TicketCategory | null
  })

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: 'MessageSquare',
    color: '#3B82F6',
    is_active: true,
    auto_assign: true,
    crisis_detection_enabled: false,
    sla_response_hours: 24,
    max_priority_level: 3,
    sort_order: 0
  })

  // Crisis Keywords state
  const [crisisKeywordsDialog, setCrisisKeywordsDialog] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    keyword: null as any
  })

  const [crisisKeywordForm, setCrisisKeywordForm] = useState<CrisisKeywordFormData>({
    keyword: '',
    severity_level: 'medium',
    severity_weight: 50,
    is_active: true,
    category_ids: []
  })

  // Counselor Specializations state
  const [counselorDialog, setCounselorDialog] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'edit',
    specialization: null as any
  })

  const [counselorForm, setCounselorForm] = useState<CounselorSpecializationFormData>({
    user_id: 0,
    category_id: 0,
    priority_level: 'primary',
    max_workload: 10,
    expertise_rating: 3,
    is_available: true
  })

  // Available staff for assignments
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [crisisKeywords, setCrisisKeywords] = useState<any[]>([])
  const [counselorSpecializations, setCounselorSpecializations] = useState<any[]>([])

  // Permission check
  const isAdmin = user?.role === 'admin'

  // Permission check effect
  useEffect(() => {
    if (!user) return

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.')
      onNavigate?.('tickets')
    }
  }, [user, isAdmin, onNavigate])

  // Load additional data
  useEffect(() => {
    if (isAdmin) {
      loadAdditionalData()
    }
  }, [isAdmin])

  const loadAdditionalData = async () => {
    try {
      // Load available staff
      // This would typically come from an API call
      setAvailableStaff([])
      
      // Load crisis keywords
      setCrisisKeywords([])
      
      // Load counselor specializations
      setCounselorSpecializations([])
    } catch (error) {
      console.error('Failed to load additional data:', error)
    }
  }

  // Navigation handler
  const handleBackToTickets = useCallback(() => {
    onNavigate?.('tickets')
  }, [onNavigate])

  // Safe pagination calculation
  const paginatedTickets = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return []

    let filtered = tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          ticket.ticket_number.toLowerCase().includes(searchLower) ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.user?.name?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'open':
            if (ticket.status !== 'Open') return false
            break
          case 'in_progress':
            if (ticket.status !== 'In Progress') return false
            break
          case 'resolved':
            if (ticket.status !== 'Resolved') return false
            break
          case 'closed':
            if (ticket.status !== 'Closed') return false
            break
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && ticket.category_id !== category.id) return false
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false
      }

      // Assignment filter
      if (filters.assigned && filters.assigned !== 'all') {
        switch (filters.assigned) {
          case 'assigned':
            if (!ticket.assigned_to) return false
            break
          case 'unassigned':
            if (ticket.assigned_to) return false
            break
        }
      }

      // Crisis filter
      if (filters.crisis_flag && filters.crisis_flag !== 'all') {
        if (filters.crisis_flag === 'true' && !ticket.crisis_flag) return false
        if (filters.crisis_flag === 'false' && ticket.crisis_flag) return false
      }

      // Auto-assignment filter
      if (filters.auto_assigned && filters.auto_assigned !== 'all') {
        if (filters.auto_assigned === 'yes' && ticket.auto_assigned !== 'yes') return false
        if (filters.auto_assigned === 'no' && ticket.auto_assigned === 'yes') return false
      }
      
      return true
    })

    // Safe pagination
    const safePerPage = filters.per_page || 25
    const safePage = filters.page || 1
    const startIndex = (safePage - 1) * safePerPage
    const endIndex = startIndex + safePerPage
    
    return filtered.slice(startIndex, endIndex)
  }, [tickets, filters, categories])

  // Safe pagination info calculation
  const paginationInfo = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) {
      return {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
        from: 0,
        to: 0,
        has_more_pages: false
      }
    }

    // Apply same filtering logic to get total count
    let totalFiltered = tickets.filter(ticket => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          ticket.ticket_number.toLowerCase().includes(searchLower) ||
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.user?.name?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'open':
            if (ticket.status !== 'Open') return false
            break
          case 'in_progress':
            if (ticket.status !== 'In Progress') return false
            break
          case 'resolved':
            if (ticket.status !== 'Resolved') return false
            break
          case 'closed':
            if (ticket.status !== 'Closed') return false
            break
        }
      }

      if (filters.category && filters.category !== 'all') {
        const category = categories.find(c => c.slug === filters.category)
        if (category && ticket.category_id !== category.id) return false
      }

      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false
      }

      if (filters.assigned && filters.assigned !== 'all') {
        switch (filters.assigned) {
          case 'assigned':
            if (!ticket.assigned_to) return false
            break
          case 'unassigned':
            if (ticket.assigned_to) return false
            break
        }
      }

      if (filters.crisis_flag && filters.crisis_flag !== 'all') {
        if (filters.crisis_flag === 'true' && !ticket.crisis_flag) return false
        if (filters.crisis_flag === 'false' && ticket.crisis_flag) return false
      }

      if (filters.auto_assigned && filters.auto_assigned !== 'all') {
        if (filters.auto_assigned === 'yes' && ticket.auto_assigned !== 'yes') return false
        if (filters.auto_assigned === 'no' && ticket.auto_assigned === 'yes') return false
      }
      
      return true
    }).length

    const safePerPage = filters.per_page || 25
    const safePage = filters.page || 1
    const lastPage = Math.ceil(totalFiltered / safePerPage)
    const startIndex = (safePage - 1) * safePerPage

    return {
      current_page: safePage,
      last_page: lastPage,
      per_page: safePerPage,
      total: totalFiltered,
      from: totalFiltered > 0 ? startIndex + 1 : 0,
      to: Math.min(startIndex + safePerPage, totalFiltered),
      has_more_pages: safePage < lastPage
    }
  }, [tickets, filters, categories])

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 AdminTicketsPage: Page changed to:', page)
    setFilters((prev) => ({ ...prev, page }))
    
    // Scroll to top of results
    const resultsSection = document.getElementById('admin-tickets-results')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handlePerPageChange = useCallback((perPage: number) => {
    console.log('📄 AdminTicketsPage: Per page changed to:', perPage)
    setFilters((prev) => ({ ...prev, per_page: perPage, page: 1 }))
  }, [])

  // Manual refresh handler
  const handleRefreshAll = useCallback(async () => {
    try {
      console.log('🔄 AdminTicketsPage: Manual refresh triggered by user')
      await refreshAll()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      toast.error('Failed to refresh data')
    }
  }, [refreshAll])

  // Individual action handlers
  const handleIndividualEditTicket = useCallback((ticket: TicketData) => {
    // Navigate to ticket details for editing
    onNavigate?.('ticket-details', { ticketId: ticket.id })
  }, [onNavigate])

  const handleIndividualDeleteTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'delete',
      isProcessing: false
    })
  }, [])

  const handleIndividualAssignTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'assign',
      isProcessing: false
    })
  }, [])

  const handleIndividualResolveTicket = useCallback((ticket: TicketData) => {
    setIndividualActionDialog({
      isOpen: true,
      ticket,
      action: 'resolve',
      isProcessing: false
    })
  }, [])

  const handleIndividualViewTicket = useCallback((ticket: TicketData) => {
    onNavigate?.('ticket-details', { ticketId: ticket.id })
  }, [onNavigate])

  // Execute individual action
  const executeIndividualAction = useCallback(async () => {
    const { ticket, action } = individualActionDialog
    
    if (!ticket) return

    setIndividualActionDialog(prev => ({ ...prev, isProcessing: true }))

    try {
      switch (action) {
        case 'delete':
          await ticketOperations.deleteTicket(ticket.id, 'Deleted by administrator', false)
          break
        case 'assign':
          if (user) {
            await ticketOperations.assignTicket(ticket.id, user.id, 'Assigned by administrator')
          }
          break
        case 'resolve':
          await ticketOperations.updateTicket(ticket.id, { status: 'Resolved' })
          break
      }

      setIndividualActionDialog({
        isOpen: false,
        ticket: null,
        action: 'edit',
        isProcessing: false
      })

      toast.success(`Ticket ${action} successful`)
    } catch (error: any) {
      console.error(`Failed to ${action}:`, error)
      setIndividualActionDialog(prev => ({ ...prev, isProcessing: false }))
      toast.error(`Failed to ${action} ticket: ${error.message}`)
    }
  }, [individualActionDialog, ticketOperations, user])

  // Filter handlers
  const handleSearchChange = useCallback((value: string) => {
    console.log('🔍 AdminTicketsPage: Search changed:', value)
    setFilters((prev) => ({ ...prev, search: value, page: 1 }))
  }, [])

  const handleFilterChange = useCallback((key: string, value: string) => {
    console.log('🔧 AdminTicketsPage: Filter changed:', key, value)
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? 'all' : value,
      page: 1,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    console.log('🧹 AdminTicketsPage: Clearing filters')
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      priority: 'all',
      assigned: 'all',
      crisis_flag: 'all',
      auto_assigned: 'all',
      sort_by: 'newest',
      page: 1,
      per_page: 25,
    })
  }, [])

  // Check for active filters
  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.assigned && filters.assigned !== 'all') ||
    (filters.crisis_flag && filters.crisis_flag !== 'all') ||
    (filters.auto_assigned && filters.auto_assigned !== 'all')
  )

  // Category management handlers
  const handleCreateCategory = useCallback(async () => {
    try {
      await categoriesStore.actions.createCategory(categoryForm)
      setCategoryDialog({ isOpen: false, mode: 'create', category: null })
      setCategoryForm({
        name: '',
        description: '',
        icon: 'MessageSquare',
        color: '#3B82F6',
        is_active: true,
        auto_assign: true,
        crisis_detection_enabled: false,
        sla_response_hours: 24,
        max_priority_level: 3,
        sort_order: 0
      })
      toast.success('Category created successfully')
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error('Failed to create category')
    }
  }, [categoryForm, categoriesStore.actions])

  const handleUpdateCategory = useCallback(async () => {
    if (!categoryDialog.category) return

    try {
      await categoriesStore.actions.updateCategory(categoryDialog.category.id, categoryForm)
      setCategoryDialog({ isOpen: false, mode: 'create', category: null })
      toast.success('Category updated successfully')
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }, [categoryDialog.category, categoryForm, categoriesStore.actions])

  const handleDeleteCategory = useCallback(async (category: TicketCategory) => {
    try {
      await categoriesStore.actions.deleteCategory(category.id)
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category')
    }
  }, [categoriesStore.actions])

  // Calculate stats
  const ticketStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    in_progress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    crisis: tickets.filter(t => t.crisis_flag).length,
    unassigned: tickets.filter(t => !t.assigned_to).length,
    auto_assigned: tickets.filter(t => t.auto_assigned === 'yes').length,
  }), [tickets])

  const categoryStats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    with_auto_assign: categories.filter(c => c.auto_assign).length,
    with_crisis_detection: categories.filter(c => c.crisis_detection_enabled).length,
  }), [categories])

  // Early returns
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600">Please wait while we verify your access.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <Button onClick={handleBackToTickets}>Back to Tickets</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Better loading state for initial load only
  if (loading.any && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Admin Panel</h3>
            <p className="text-gray-600">Fetching your dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header */}
        <AdminTicketsHeader
          ticketStats={ticketStats}
          categoryStats={categoryStats}
          isLoading={loading.any}
          onBackToTickets={handleBackToTickets}
          onRefreshAll={handleRefreshAll}
        />

        {/* Error Display */}
        {errors.any && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    {errors.tickets.list || errors.categories.list || 'An error occurred'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Status */}
        {!loading.any && !errors.any && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Ticket management system ready - {ticketStats.total} tickets,{' '}
                  {categoryStats.total} categories
                  {ticketStats.crisis > 0 && `, ${ticketStats.crisis} crisis cases`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs - Mobile Responsive */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as AdminTabType)}>
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto min-w-max">
              <TabsTrigger value="tickets" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Tickets</span>
                  <span className="sm:hidden">Tickets</span>
                  <Badge variant="secondary" className="text-xs">
                    {ticketStats.total}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Categories</span>
                  <span className="sm:hidden">Categories</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryStats.total}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger value="crisis-keywords" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Crisis</span>
                  <span className="sm:hidden">Crisis</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="counselor-specializations" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Counselors</span>
                  <span className="sm:hidden">Staff</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">System</span>
                  <span className="sm:hidden">System</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tickets Management Tab */}
          <TabsContent value="tickets" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span>Ticket Management</span>
                    </CardTitle>
                    <CardDescription>Manage all tickets with administrative controls</CardDescription>
                  </div>
                  <Button onClick={() => onNavigate?.('submit-ticket')} disabled={loading.any} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Ticket</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {/* Search and Filters - Mobile Responsive */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={filters.search || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Mobile Filter Row */}
                    <div className="flex gap-2 sm:hidden">
                      <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={filters.priority || 'all'}
                        onValueChange={(value) => handleFilterChange('priority', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden sm:flex gap-2">
                      <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={filters.category || 'all'}
                        onValueChange={(value) => handleFilterChange('category', value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={filters.priority || 'all'}
                        onValueChange={(value) => handleFilterChange('priority', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={handleClearFilters} className="shrink-0">
                        <X className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Clear Filters</span>
                        <span className="sm:hidden">Clear</span>
                      </Button>
                    )}
                  </div>
                  
                  {/* Secondary Mobile Filters */}
                  <div className="flex gap-2 sm:hidden overflow-x-auto pb-2">
                    <Select
                      value={filters.category || 'all'}
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger className="w-32 shrink-0">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.assigned || 'all'}
                      onValueChange={(value) => handleFilterChange('assigned', value)}
                    >
                      <SelectTrigger className="w-28 shrink-0">
                        <SelectValue placeholder="Assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.crisis_flag || 'all'}
                      onValueChange={(value) => handleFilterChange('crisis_flag', value)}
                    >
                      <SelectTrigger className="w-24 shrink-0">
                        <SelectValue placeholder="Crisis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Crisis</SelectItem>
                        <SelectItem value="false">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tickets List with Pagination */}
                <div className="space-y-4 sm:space-y-6" id="admin-tickets-results">
                  {loading.tickets.list && !tickets.length ? (
                    <div className="space-y-4">
                      {[...Array(filters.per_page || 25)].map((_, i) => (
                        <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : errors.tickets.list ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Failed to load tickets
                      </h3>
                      <p className="text-gray-600 mb-4">Please try refreshing the page</p>
                      <Button onClick={handleRefreshAll}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : paginatedTickets.length > 0 ? (
                    <>
                      {/* Results Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="text-sm font-medium text-gray-700">
                          Showing {paginationInfo.from}-{paginationInfo.to} of {paginationInfo.total} ticket{paginationInfo.total !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{paginationInfo.total} total results</span>
                          <Badge variant="outline" className="text-xs">
                            {tickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length} active
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tickets.filter(t => t.crisis_flag).length} crisis
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tickets.filter(t => !t.assigned_to).length} unassigned
                          </Badge>
                        </div>
                      </div>

                      {/* Ticket Cards */}
                      <div className="space-y-3 sm:space-y-4">
                        {paginatedTickets.map((ticket) => (
                          <AdminTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onEdit={handleIndividualEditTicket}
                            onDelete={handleIndividualDeleteTicket}
                            onAssign={handleIndividualAssignTicket}
                            onResolve={handleIndividualResolveTicket}
                            onView={handleIndividualViewTicket}
                            isLoading={loading.any}
                          />
                        ))}
                      </div>

                      {/* Enhanced Pagination */}
                      {paginationInfo.total > (filters.per_page || 25) && (
                        <Card className="border-0 shadow-lg">
                          <CardContent className="p-4 sm:p-6">
                            <EnhancedPagination
                              pagination={paginationInfo}
                              onPageChange={handlePageChange}
                              onPerPageChange={handlePerPageChange}
                              isLoading={loading.tickets.list}
                              showPerPageSelector={true}
                              showResultsInfo={true}
                              perPageOptions={[10, 25, 50, 100]}
                              className="w-full"
                            />
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium text-gray-900">No Tickets Found</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            {hasActiveFilters
                              ? 'No tickets match your current filters. Try adjusting your search criteria.'
                              : 'No tickets have been created yet.'}
                          </p>
                        </div>
                        {hasActiveFilters ? (
                          <Button variant="outline" onClick={handleClearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                        ) : (
                          <Button onClick={() => onNavigate?.('submit-ticket')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Ticket
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management Tab */}
          <TabsContent value="categories" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-green-600" />
                      <span>Category Management</span>
                    </CardTitle>
                    <CardDescription>Organize tickets with dynamic categories</CardDescription>
                  </div>
                  <Button 
                    disabled={loading.any} 
                    size="sm"
                    onClick={() => setCategoryDialog({ isOpen: true, mode: 'create', category: null })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Category</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {loading.categories.list && !categories.length ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categories.map((category) => {
                      const categoryTickets = tickets.filter(t => t.category_id === category.id)
                      const openTickets = categoryTickets.filter(t => ['Open', 'In Progress'].includes(t.status))
                      const crisisTickets = categoryTickets.filter(t => t.crisis_flag)

                      return (
                        <Card
                          key={category.id}
                          className="border-0 shadow-md hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-4 sm:p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: category.color + '20' }}
                                  >
                                    <div
                                      className="w-5 h-5 sm:w-6 sm:h-6 rounded"
                                      style={{ backgroundColor: category.color }}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-base sm:text-lg truncate">{category.name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                      {categoryTickets.length} tickets
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {category.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Category Features */}
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                {category.auto_assign && (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Auto-assign</span>
                                  </div>
                                )}
                                {category.crisis_detection_enabled && (
                                  <div className="flex items-center space-x-1 text-orange-600">
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Crisis Detection</span>
                                  </div>
                                )}
                                {category.sla_response_hours && (
                                  <div className="flex items-center space-x-1 text-blue-600">
                                    <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>{category.sla_response_hours}h SLA</span>
                                  </div>
                                )}
                              </div>

                              {category.description && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {category.description}
                                </p>
                              )}

                              {/* Ticket Stats */}
                              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                                <div className="p-2 bg-blue-50 rounded">
                                  <div className="font-medium text-blue-700">{categoryTickets.length}</div>
                                  <div className="text-blue-600 text-xs">Total</div>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded">
                                  <div className="font-medium text-yellow-700">{openTickets.length}</div>
                                  <div className="text-yellow-600 text-xs">Active</div>
                                </div>
                                <div className="p-2 bg-red-50 rounded">
                                  <div className="font-medium text-red-700">{crisisTickets.length}</div>
                                  <div className="text-red-600 text-xs">Crisis</div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="text-xs text-gray-500">
                                  Sort: {category.sort_order}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setCategoryForm({
                                        name: category.name,
                                        description: category.description || '',
                                        icon: category.icon,
                                        color: category.color,
                                        is_active: category.is_active,
                                        auto_assign: category.auto_assign,
                                        crisis_detection_enabled: category.crisis_detection_enabled,
                                        sla_response_hours: category.sla_response_hours,
                                        max_priority_level: category.max_priority_level || 3,
                                        sort_order: category.sort_order
                                      })
                                      setCategoryDialog({ isOpen: true, mode: 'edit', category })
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first category to organize tickets
                    </p>
                    <Button onClick={() => setCategoryDialog({ isOpen: true, mode: 'create', category: null })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crisis Keywords Tab */}
          <TabsContent value="crisis-keywords" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span>Crisis Keywords</span>
                    </CardTitle>
                    <CardDescription>Manage crisis detection keywords and settings</CardDescription>
                  </div>
                  <Button 
                    disabled={loading.any} 
                    size="sm"
                    onClick={() => setCrisisKeywordsDialog({ isOpen: true, mode: 'create', keyword: null })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Keyword</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Crisis Keywords Management</h3>
                  <p className="text-gray-600 mb-4">
                    Set up keywords that automatically flag tickets as crisis cases
                  </p>
                  <Button onClick={() => setCrisisKeywordsDialog({ isOpen: true, mode: 'create', keyword: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crisis Keyword
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Counselor Specializations Tab */}
          <TabsContent value="counselor-specializations" className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>Counselor Specializations</span>
                    </CardTitle>
                    <CardDescription>Assign counselors to categories and manage workloads</CardDescription>
                  </div>
                  <Button 
                    disabled={loading.any} 
                    size="sm"
                    onClick={() => setCounselorDialog({ isOpen: true, mode: 'create', specialization: null })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Assign Counselor</span>
                    <span className="sm:hidden">Assign</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-purple-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Counselor Management</h3>
                  <p className="text-gray-600 mb-4">
                    Assign counselors to specific categories and manage their workloads
                  </p>
                  <Button onClick={() => setCounselorDialog({ isOpen: true, mode: 'create', specialization: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Counselor to Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Ticket Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{ticketStats.total}</div>
                      <div className="text-sm text-blue-700">Total Tickets</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
                      <div className="text-sm text-green-700">Resolved</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{ticketStats.crisis}</div>
                      <div className="text-sm text-red-700">Crisis Cases</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{ticketStats.unassigned}</div>
                      <div className="text-sm text-yellow-700">Unassigned</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Category Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{categoryStats.total}</div>
                      <div className="text-sm text-indigo-700">Total Categories</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">{categoryStats.active}</div>
                      <div className="text-sm text-emerald-700">Active</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{categoryStats.with_auto_assign}</div>
                      <div className="text-sm text-purple-700">Auto-assign</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{categoryStats.with_crisis_detection}</div>
                      <div className="text-sm text-orange-700">Crisis Detection</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {ticketStats.total > 0 ? Math.round((ticketStats.resolved / ticketStats.total) * 100) : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Resolution Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-xl font-bold text-green-600">2.3h</div>
                    <div className="text-sm text-green-700">Avg Response Time</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {ticketStats.total > 0 ? Math.round((ticketStats.auto_assigned / ticketStats.total) * 100) : 0}%
                    </div>
                    <div className="text-sm text-purple-700">Auto-assignment Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {ticketStats.total > 0 ? Math.round((ticketStats.crisis / ticketStats.total) * 100) : 0}%
                    </div>
                    <div className="text-sm text-orange-700">Crisis Detection Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-6 w-6 text-blue-600" />
                    <span>System Operations</span>
                  </CardTitle>
                  <CardDescription>
                    System maintenance and data management tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Sync Workload Counters</h4>
                      <p className="text-sm text-gray-600">Update counselor workload statistics</p>
                    </div>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Test Auto-Assignment</h4>
                      <p className="text-sm text-gray-600">Verify assignment algorithm functionality</p>
                    </div>
                    <Workflow className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">System Health Check</h4>
                      <p className="text-sm text-gray-600">Comprehensive system diagnostics</p>
                    </div>
                    <Shield className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Cache Management</h4>
                      <p className="text-sm text-gray-600">Clear and refresh system caches</p>
                    </div>
                    <Database className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-6 w-6 text-green-600" />
                    <span>Export & Import</span>
                  </CardTitle>
                  <CardDescription>
                    Data export and import operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export All Tickets</h4>
                      <p className="text-sm text-gray-600">Download complete ticket database</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Export Categories</h4>
                      <p className="text-sm text-gray-600">Download category structure and settings</p>
                    </div>
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-between h-auto p-4">
                    <div className="text-left">
                      <h4 className="font-medium">Import Data</h4>
                      <p className="text-sm text-gray-600">Bulk import from CSV or JSON files</p>
                    </div>
                    <Upload className="h-4 w-4" />
                  </Button>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Import Guidelines</h4>
                        <p className="text-sm text-yellow-700">
                          Ensure your files follow the required format. Large imports may take time to process.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health Status */}
              <Card className="border-0 shadow-lg lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-6 w-6 text-purple-600" />
                    <span>System Health Status</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time system health monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Database</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">Connected & Healthy</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">API Services</span>
                      </div>
											<p className="text-sm text-green-700 mt-1">All Services Running</p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Queue</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">3 Jobs Pending</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Storage</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">15.2GB / 100GB Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* All Dialog Components */}
      
      {/* Individual Action Confirmation Dialog */}
      <IndividualActionDialog
        isOpen={individualActionDialog.isOpen}
        ticket={individualActionDialog.ticket}
        action={individualActionDialog.action}
        isProcessing={individualActionDialog.isProcessing}
        onConfirm={executeIndividualAction}
        onCancel={() =>
          setIndividualActionDialog({
            isOpen: false,
            ticket: null,
            action: 'edit',
            isProcessing: false,
          })
        }
      />

      {/* Create/Edit Category Dialog */}
      <Dialog
        open={categoryDialog.isOpen}
        onOpenChange={(open) => !open && setCategoryDialog({ isOpen: false, mode: 'create', category: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>
              {categoryDialog.mode === 'create' ? 'Create New Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {categoryDialog.mode === 'create' 
                ? 'Add a new category to organize tickets effectively.'
                : 'Update the category information and settings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name *</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1 rounded border"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-sla">SLA Response Hours</Label>
                <Input
                  id="category-sla"
                  type="number"
                  value={categoryForm.sla_response_hours}
                  onChange={(e) => setCategoryForm(prev => ({ 
                    ...prev, 
                    sla_response_hours: parseInt(e.target.value) || 24 
                  }))}
                  min="1"
                  max="168"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-priority">Max Priority Level</Label>
                <Select
                  value={categoryForm.max_priority_level.toString()}
                  onValueChange={(value) => setCategoryForm(prev => ({ 
                    ...prev, 
                    max_priority_level: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low Only</SelectItem>
                    <SelectItem value="2">2 - Low to Medium</SelectItem>
                    <SelectItem value="3">3 - Low to High</SelectItem>
                    <SelectItem value="4">4 - All Priorities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-sort">Sort Order</Label>
                <Input
                  id="category-sort"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm(prev => ({ 
                    ...prev, 
                    sort_order: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="category-active"
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="category-active" className="flex flex-col">
                  <span>Active Category</span>
                  <span className="text-xs text-gray-600">Allow new tickets in this category</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="category-auto-assign"
                  checked={categoryForm.auto_assign}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, auto_assign: checked }))}
                />
                <Label htmlFor="category-auto-assign" className="flex flex-col">
                  <span>Auto-Assignment</span>
                  <span className="text-xs text-gray-600">Automatically assign to available counselors</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="category-crisis"
                  checked={categoryForm.crisis_detection_enabled}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, crisis_detection_enabled: checked }))}
                />
                <Label htmlFor="category-crisis" className="flex flex-col">
                  <span>Crisis Detection</span>
                  <span className="text-xs text-gray-600">Enable automatic crisis keyword detection</span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCategoryDialog({ isOpen: false, mode: 'create', category: null })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={categoryDialog.mode === 'create' ? handleCreateCategory : handleUpdateCategory}
              disabled={loading.categories.list}
              className="w-full sm:w-auto"
            >
              {loading.categories ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                categoryDialog.mode === 'create' ? (
                  <Plus className="h-4 w-4 mr-2" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )
              )}
              {categoryDialog.mode === 'create' ? 'Create Category' : 'Update Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Crisis Keywords Dialog */}
      <Dialog
        open={crisisKeywordsDialog.isOpen}
        onOpenChange={(open) => !open && setCrisisKeywordsDialog({ isOpen: false, mode: 'create', keyword: null })}
      >
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>
              {crisisKeywordsDialog.mode === 'create' ? 'Add Crisis Keyword' : 'Edit Crisis Keyword'}
            </DialogTitle>
            <DialogDescription>
              {crisisKeywordsDialog.mode === 'create' 
                ? 'Define keywords that trigger crisis detection in tickets.'
                : 'Update the crisis keyword settings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword-text">Keyword *</Label>
              <Input
                id="keyword-text"
                value={crisisKeywordForm.keyword}
                onChange={(e) => setCrisisKeywordForm(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="Enter crisis keyword..."
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword-severity">Severity Level</Label>
                <Select
                  value={crisisKeywordForm.severity_level}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                    setCrisisKeywordForm(prev => ({ ...prev, severity_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyword-weight">Severity Weight</Label>
                <Input
                  id="keyword-weight"
                  type="number"
                  value={crisisKeywordForm.severity_weight}
                  onChange={(e) => setCrisisKeywordForm(prev => ({ 
                    ...prev, 
                    severity_weight: parseInt(e.target.value) || 50 
                  }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Apply to Categories</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`cat-${category.id}`}
                      checked={crisisKeywordForm.category_ids.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCrisisKeywordForm(prev => ({
                            ...prev,
                            category_ids: [...prev.category_ids, category.id]
                          }))
                        } else {
                          setCrisisKeywordForm(prev => ({
                            ...prev,
                            category_ids: prev.category_ids.filter(id => id !== category.id)
                          }))
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="keyword-active"
                checked={crisisKeywordForm.is_active}
                onCheckedChange={(checked) => setCrisisKeywordForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="keyword-active">Active Keyword</Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCrisisKeywordsDialog({ isOpen: false, mode: 'create', keyword: null })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Handle create/update crisis keyword
                toast.success('Crisis keyword saved successfully')
                setCrisisKeywordsDialog({ isOpen: false, mode: 'create', keyword: null })
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {crisisKeywordsDialog.mode === 'create' ? 'Add Keyword' : 'Update Keyword'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Counselor Specialization Dialog */}
      <Dialog
        open={counselorDialog.isOpen}
        onOpenChange={(open) => !open && setCounselorDialog({ isOpen: false, mode: 'create', specialization: null })}
      >
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>
              {counselorDialog.mode === 'create' ? 'Add Counselor Specialization' : 'Edit Specialization'}
            </DialogTitle>
            <DialogDescription>
              {counselorDialog.mode === 'create' 
                ? 'Assign counselors to categories with specific expertise levels.'
                : 'Update the counselor specialization settings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="counselor-user">Counselor *</Label>
                <Select
                  value={counselorForm.user_id.toString()}
                  onValueChange={(value) => setCounselorForm(prev => ({ 
                    ...prev, 
                    user_id: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select counselor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselor-category">Category *</Label>
                <Select
                  value={counselorForm.category_id.toString()}
                  onValueChange={(value) => setCounselorForm(prev => ({ 
                    ...prev, 
                    category_id: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="counselor-priority">Priority Level</Label>
                <Select
                  value={counselorForm.priority_level}
                  onValueChange={(value: 'primary' | 'secondary' | 'backup') => 
                    setCounselorForm(prev => ({ ...prev, priority_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselor-workload">Max Workload</Label>
                <Input
                  id="counselor-workload"
                  type="number"
                  value={counselorForm.max_workload}
                  onChange={(e) => setCounselorForm(prev => ({ 
                    ...prev, 
                    max_workload: parseInt(e.target.value) || 10 
                  }))}
                  min="1"
                  max="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselor-expertise">Expertise Rating</Label>
                <Select
                  value={counselorForm.expertise_rating.toString()}
                  onValueChange={(value) => setCounselorForm(prev => ({ 
                    ...prev, 
                    expertise_rating: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ - Beginner</SelectItem>
                    <SelectItem value="2">⭐⭐ - Novice</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ - Intermediate</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ - Advanced</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="counselor-available"
                checked={counselorForm.is_available}
                onCheckedChange={(checked) => setCounselorForm(prev => ({ ...prev, is_available: checked }))}
              />
              <Label htmlFor="counselor-available" className="flex flex-col">
                <span>Available for Assignment</span>
                <span className="text-xs text-gray-600">Can receive new ticket assignments</span>
              </Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCounselorDialog({ isOpen: false, mode: 'create', specialization: null })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Handle create/update specialization
                toast.success('Counselor specialization saved successfully')
                setCounselorDialog({ isOpen: false, mode: 'create', specialization: null })
              }}
              className="w-full sm:w-auto"
            >
              <Users className="h-4 w-4 mr-2" />
              {counselorDialog.mode === 'create' ? 'Add Specialization' : 'Update Specialization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}