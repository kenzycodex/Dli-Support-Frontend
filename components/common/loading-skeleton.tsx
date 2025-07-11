// components/common/loading-skeleton.tsx
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rectangular' | 'text'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  lines = 1,
  ...props 
}: SkeletonProps) {
  const baseClass = "animate-pulse bg-gray-200 rounded"
  
  const variantClasses = {
    default: "h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    text: "h-4 rounded"
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClass,
              variantClasses.text,
              index === lines - 1 ? "w-3/4" : "w-full"
            )}
            style={{ width, height }}
            {...props}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        baseClass,
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  )
}

// FAQ Loading Skeleton
export function FAQSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Skeleton variant="circular" width={20} height={20} />
              <div className="flex-1 space-y-2">
                <Skeleton width="85%" height={20} />
                <Skeleton width="60%" height={16} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Resource Card Loading Skeleton
export function ResourceCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="rectangular" width={40} height={40} />
                  <div className="space-y-2">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={60} height={14} />
                  </div>
                </div>
                <Skeleton width={40} height={16} />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Skeleton width="90%" height={20} />
                <Skeleton variant="text" lines={3} />
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton width={60} height={16} />
                  <Skeleton width={40} height={14} />
                </div>
                <Skeleton width="70%" height={14} />
              </div>

              {/* Tags */}
              <div className="flex gap-1">
                <Skeleton width={50} height={16} />
                <Skeleton width={40} height={16} />
                <Skeleton width={45} height={16} />
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Skeleton className="flex-1" height={32} />
                <Skeleton width={40} height={32} />
                <Skeleton width={40} height={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Resource List Item Loading Skeleton
export function ResourceListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <Skeleton variant="rectangular" width={40} height={40} />

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton width="75%" height={20} />
                    <Skeleton variant="text" lines={2} />
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Skeleton width={60} height={16} />
                    <Skeleton width={70} height={16} />
                    <Skeleton width={40} height={16} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4">
                    <Skeleton width={40} height={12} />
                    <Skeleton width={50} height={12} />
                    <Skeleton width={60} height={12} />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Skeleton width={60} height={32} />
                    <Skeleton width={40} height={32} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Category Loading Skeleton
export function CategorySkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-3 rounded-lg">
          <Skeleton width="70%" height={16} />
          <Skeleton variant="circular" width={20} height={20} />
        </div>
      ))}
    </div>
  )
}

// Bookmark Loading Skeleton
export function BookmarkSkeleton({ viewMode = 'grid', count = 6 }: { viewMode?: 'grid' | 'list', count?: number }) {
  if (viewMode === 'list') {
    return <ResourceListSkeleton count={count} />
  }
  
  return <ResourceCardSkeleton count={count} />
}

// Dashboard Stats Loading Skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <Skeleton width={40} height={24} className="mb-2 bg-white/20" />
          <Skeleton width={60} height={14} className="bg-white/20" />
        </div>
      ))}
    </div>
  )
}

// Featured Content Loading Skeleton
export function FeaturedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="rectangular" width={40} height={40} />
                  <Skeleton width={60} height={16} />
                </div>
                <Skeleton width={40} height={16} />
              </div>
              
              <div className="space-y-2">
                <Skeleton width="90%" height={20} />
                <Skeleton variant="text" lines={3} />
              </div>
              
              <div className="flex items-center justify-between">
                <Skeleton width={50} height={16} />
                <Skeleton width={30} height={32} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Search Loading Skeleton
export function SearchSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton width="100%" height={48} className="rounded-xl" />
      <div className="text-center py-4">
        <Skeleton variant="circular" width={32} height={32} className="mx-auto mb-2" />
        <Skeleton width={120} height={16} className="mx-auto" />
      </div>
    </div>
  )
}

// Table Loading Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width={100} height={16} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              width={colIndex === 0 ? 120 : 80} 
              height={16} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Rating Loading Skeleton
export function RatingSkeleton() {
  return (
    <Card className="border-0 bg-gray-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width={150} height={20} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <Skeleton width={40} height={32} className="mb-2" />
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} variant="circular" width={12} height={12} />
                ))}
              </div>
            </div>
            <div className="border-l pl-3 space-y-1">
              <Skeleton width={80} height={16} />
              <Skeleton width={120} height={12} />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton width={60} height={14} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton width={100} height={16} />
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="circular" width={20} height={20} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}