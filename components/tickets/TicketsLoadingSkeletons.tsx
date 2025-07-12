// components/tickets/TicketsLoadingSkeletons.tsx
"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/common/loading-skeleton"

// Header Loading Skeleton
export function TicketsHeaderSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 lg:p-8 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Skeleton variant="rectangular" width={32} height={32} className="bg-white/30" />
              </div>
              <div>
                <Skeleton width={200} height={28} className="mb-2 bg-white/30" />
                <Skeleton width={300} height={16} className="bg-white/20" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm border border-white/10">
                  <Skeleton width={40} height={24} className="mb-2 bg-white/20" />
                  <Skeleton width={60} height={14} className="bg-white/20" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width={80} height={36} className="bg-white/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Filters Loading Skeleton
export function TicketsFiltersSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <Skeleton width="100%" height={44} className="rounded-lg" />
          
          {/* Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} width="100%" height={44} />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton width={100} height={44} />
              <Skeleton width={140} height={44} />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Skeleton width={150} height={16} />
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" width={16} height={16} />
              <Skeleton width={80} height={16} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Ticket Tabs Loading Skeleton
export function TicketTabsSkeleton() {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <div className="flex min-w-max space-x-0 p-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex-shrink-0 px-4 py-3">
            <div className="flex items-center space-x-2">
              <Skeleton width={60} height={16} />
              <Skeleton variant="rectangular" width={20} height={16} className="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Single Ticket Card Loading Skeleton
export function TicketCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          {/* Selection Checkbox */}
          <div className="flex items-start lg:mr-4">
            <Skeleton variant="rectangular" width={16} height={16} />
          </div>

          <div className="flex items-start space-x-4 flex-1">
            <div className="flex flex-col items-center space-y-1 flex-shrink-0">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton width={50} height={14} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Title and Crisis Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                <Skeleton width="70%" height={20} />
                <Skeleton width={60} height={20} className="rounded-full" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Skeleton width={80} height={20} className="rounded-full" />
                <Skeleton width={60} height={20} className="rounded-full" />
                <Skeleton width={70} height={20} className="rounded-full" />
              </div>

              {/* Description */}
              <Skeleton variant="text" lines={2} className="mb-3" />

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <Skeleton variant="circular" width={12} height={12} />
                    <Skeleton width={60} height={12} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:ml-4">
            {/* Indicators */}
            <div className="flex items-center space-x-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <Skeleton variant="circular" width={16} height={16} />
                  <Skeleton width={12} height={12} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Skeleton width={60} height={32} />
              <Skeleton width={40} height={32} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Multiple Ticket Cards Loading Skeleton
export function TicketsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TicketCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Pagination Loading Skeleton
export function TicketsPaginationSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Skeleton width={200} height={16} />
          
          <div className="flex items-center space-x-2">
            <Skeleton width={70} height={32} />
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} width={32} height={32} />
              ))}
            </div>
            <Skeleton width={60} height={32} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Alert Skeletons
export function AlertSkeleton() {
  return (
    <Card className="border-orange-200 bg-orange-50 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Skeleton variant="circular" width={52} height={52} className="bg-orange-200" />
          <div className="flex-1 space-y-2">
            <Skeleton width={300} height={20} className="bg-orange-200" />
            <Skeleton width={250} height={16} className="bg-orange-200" />
          </div>
          <div className="flex gap-2">
            <Skeleton width={120} height={36} className="bg-orange-200" />
            <Skeleton width={100} height={36} className="bg-orange-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// System Overview Skeleton
export function SystemOverviewSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width={150} height={20} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <Skeleton width={40} height={32} className="mx-auto mb-2" />
              <Skeleton width={60} height={14} className="mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance Insights Skeleton
export function PerformanceInsightsSkeleton() {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width={180} height={20} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton width={100} height={16} />
                <Skeleton width={40} height={16} />
              </div>
              <Skeleton width="100%" height={8} className="rounded-full" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} width={120} height={16} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}