// components/admin-help/AdminHelpHeader.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Settings, Eye, RefreshCw, Loader2 } from "lucide-react"
import { AdminStats } from "@/types/admin-help"

interface AdminHelpHeaderProps {
  adminStats: AdminStats
  isLoading: boolean
  isInitialized: boolean
  onBackToHelp: () => void
  onRefreshAll: () => void
}

export function AdminHelpHeader({
  adminStats,
  isLoading,
  isInitialized,
  onBackToHelp,
  onRefreshAll
}: AdminHelpHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Help Center Management</h1>
            <p className="text-blue-100 text-lg">Manage FAQs, categories, and content suggestions</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToHelp}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Public
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefreshAll}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.total_faqs}
          </div>
          <div className="text-sm text-blue-100">Total FAQs</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.categories_count}
          </div>
          <div className="text-sm text-blue-100">Categories</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.draft_faqs}
          </div>
          <div className="text-sm text-blue-100">Unpublished</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : adminStats.suggested_faqs}
          </div>
          <div className="text-sm text-blue-100">Suggestions</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold">{isInitialized ? '✓' : '...'}</div>
          <div className="text-sm text-blue-100">Store Status</div>
        </div>
      </div>
    </div>
  )
}