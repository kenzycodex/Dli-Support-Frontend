// components/tickets/TicketsHeader.tsx - Reverted Shape with Mobile Responsiveness

"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Ticket, 
  RefreshCw, 
  Loader2, 
  Settings, 
  FileDown, 
  Plus,
  MoreHorizontal,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react"
import { TicketStats, TicketPermissions, PageInfo } from '@/types/tickets.types'

interface TicketsHeaderProps {
  pageInfo: PageInfo
  stats: TicketStats
  loading: boolean
  selectedCount: number
  permissions: TicketPermissions
  userRole?: string
  onRefresh: () => void
  onBulkActions: () => void
  onExport: () => void
  onCreate: () => void
  categoriesCount?: number
  activeCategoriesCount?: number
}

export function TicketsHeader({
  pageInfo,
  stats,
  loading,
  selectedCount,
  permissions,
  userRole,
  onRefresh,
  onBulkActions,
  onExport,
  onCreate,
  categoriesCount = 0,
  activeCategoriesCount = 0
}: TicketsHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
                <Ticket className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{pageInfo.title}</h1>
                <p className="text-blue-100 text-xs sm:text-sm lg:text-lg">{pageInfo.description}</p>
                {/* Category info */}
                {categoriesCount > 0 && (
                  <p className="text-blue-200 text-xs lg:text-sm mt-1">
                    {activeCategoriesCount} of {categoriesCount} categories active
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {stats.open + stats.in_progress}
                </div>
                <div className="text-xs lg:text-sm text-blue-100">Active</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.resolved}</div>
                <div className="text-xs lg:text-sm text-blue-100">Resolved</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.crisis}</div>
                <div className="text-xs lg:text-sm text-blue-100">Crisis Cases</div>
              </div>
              {userRole !== 'student' && (
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.unassigned}</div>
                  <div className="text-xs lg:text-sm text-blue-100">Unassigned</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between lg:justify-end space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Refresh</span>
            </Button>

            {/* Bulk Actions Button */}
            {permissions.can_bulk_actions && selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkActions}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Actions ({selectedCount})</span>
                <span className="sm:hidden">({selectedCount})</span>
              </Button>
            )}

            {/* Export Button */}
            {permissions.can_export && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                disabled={loading}
              >
                <FileDown className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}

            {/* Create button */}
            {(userRole === 'student' || userRole === 'admin') && (
              <Button
                onClick={onCreate}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {userRole === 'admin' ? 'Create Ticket' : 'Submit Ticket'}
                </span>
                <span className="sm:hidden">Create</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}