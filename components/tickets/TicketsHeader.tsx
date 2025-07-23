// components/tickets/TicketsHeader.tsx - Modern App-like Design

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
  Bell,
  Search,
  Filter,
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
  const quickStats = [
    {
      label: 'Open',
      value: stats.open,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+2'
    },
    {
      label: 'Progress',
      value: stats.in_progress,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+5'
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12'
    },
    ...(stats.crisis > 0 ? [{
      label: 'Crisis',
      value: stats.crisis,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '!',
      urgent: true
    }] : [])
  ]

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600">
      {/* Mobile: Edge-to-edge header */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/5">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 pt-4 pb-6">
          {/* Top Bar - Mobile App Style */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {pageInfo.title}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 leading-tight">
                  {userRole === 'student' ? 'Your Support Center' : 'Support Dashboard'}
                </p>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0 text-white hover:bg-white/20 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {stats.crisis > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{stats.crisis}</span>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="w-10 h-10 p-0 text-white hover:bg-white/20 rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </Button>

              {/* More Options */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 text-white hover:bg-white/20 rounded-xl"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid - Mobile First */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {quickStats.map((stat, index) => (
              <div
                key={stat.label}
                className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 ${
                  stat.urgent ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  {stat.trend && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      stat.urgent 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {stat.trend}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar - App Style */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Category Info */}
              {categoriesCount > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-100">
                    {activeCategoriesCount} categories active
                  </span>
                </div>
              )}
              
              {/* Selected Count */}
              {selectedCount > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {selectedCount} selected
                </Badge>
              )}
            </div>

            {/* Primary Actions */}
            <div className="flex items-center space-x-2">
              {/* Bulk Actions */}
              {permissions.can_bulk_actions && selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBulkActions}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              )}

              {/* Export */}
              {permissions.can_export && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30"
                  disabled={loading}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}

              {/* Create/Submit Button */}
              {(userRole === 'student' || userRole === 'admin') && (
                <Button
                  onClick={onCreate}
                  className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold shadow-lg"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {userRole === 'admin' ? 'Create' : 'Submit'}
                  </span>
                  <span className="sm:hidden">New</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Progress Bar - Mobile Enhancement */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-blue-100 mb-2">
              <span>Today's Progress</span>
              <span>
                {stats.resolved} / {stats.total} resolved
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}