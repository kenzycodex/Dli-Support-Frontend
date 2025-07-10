"use client"

import React, { ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppRouter } from '@/lib/router'
import { LoginForm } from '@/components/auth/login-form'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Array<"student" | "counselor" | "advisor" | "admin">
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { currentRoute } = useAppRouter()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return fallback || <LoginForm />
  }

  // If specific roles are required, check user role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}