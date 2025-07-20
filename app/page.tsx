// app/page.tsx - SIMPLIFIED: Fixed router integration without slug complexity

"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useAppRouter } from "@/lib/router"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { CounselorDashboard } from "@/components/dashboards/counselor-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { AppointmentsPage } from "@/components/pages/appointments-page"
import { TicketsPage } from "@/components/pages/tickets-page"
import { SubmitTicketPage } from "@/components/pages/submit-ticket-page"
import { TicketDetailsPage } from "@/components/pages/ticket-details-page"
import { CounselingPage } from "@/components/pages/counseling-page"
import { HelpPage } from "@/components/pages/help-page"
import { ResourcesPage } from "@/components/pages/resources-page"
import { AdminResourcesPage } from "@/components/pages/admin-resources-page"
import { AdminUsersPage } from "@/components/pages/admin-users-page"
import { AdminReportsPage } from "@/components/pages/admin-reports-page"
import { AdminSettingsPage } from "@/components/pages/admin-settings-page"
import { AppLayout } from "@/components/layout/app-layout"
import { NotificationsPage } from "@/components/pages/notifications-page"
import { AdminHelpPage } from "@/components/pages/admin-help-page"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

function AppContent() {
  const { user, logout } = useAuth()
  const { page, params, navigate, isReady } = useAppRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  // Wait for router to be ready before rendering
  useEffect(() => {
    if (isReady) {
      console.log('🌐 App: Router is ready, current route:', { page, params })
      setIsInitialized(true)
    }
  }, [isReady, page, params])

  const handleLogout = () => {
    logout()
    navigate('dashboard')
  }

  // SIMPLIFIED: Page rendering without complex slug handling
  const renderPage = () => {
    console.log('🌐 App: Rendering page:', page, 'with params:', params)
    
    switch (page) {
      case "dashboard":
        switch (user?.role) {
          case "student":
            return <StudentDashboard user={user} onNavigate={navigate} />
          case "counselor":
          case "advisor":
            return <CounselorDashboard user={user} />
          case "admin":
            return <AdminDashboard user={user} />
          default:
            return <StudentDashboard user={user!} onNavigate={navigate} />
        }
      
      case "appointments":
        return <AppointmentsPage />
      
      case "tickets":
        return <TicketsPage onNavigate={navigate} />
      
      case "submit-ticket":
        return <SubmitTicketPage onNavigate={navigate} />
      
      case "ticket-details":
        // SIMPLIFIED: Only use ticket ID, no slug complexity
        const ticketId = params.ticketId as number
        
        console.log('🌐 App: Rendering ticket details with ID:', ticketId)
        
        if (!ticketId || isNaN(ticketId)) {
          console.warn('🌐 App: Invalid ticket ID, redirecting to tickets')
          navigate('tickets')
          return <TicketsPage onNavigate={navigate} />
        }
        
        return (
          <TicketDetailsPage 
            ticketId={ticketId}
            onNavigate={navigate} 
          />
        )
      
      case "counseling":
        return <CounselingPage />
      
      case "help":
        return <HelpPage onNavigate={navigate} />

      case "admin-help":
        return <AdminHelpPage onNavigate={navigate} />

      case "resources":
        return <ResourcesPage onNavigate={navigate} />

      case "admin-resources":
        return <AdminResourcesPage onNavigate={navigate} />
      
      case "notifications":
        return <NotificationsPage />
      
      case "admin-users":
        return <AdminUsersPage onNavigate={navigate} />
      
      case "admin-reports":
        return <AdminReportsPage onNavigate={navigate} />
      
      case "admin-settings":
        return <AdminSettingsPage onNavigate={navigate} />
      
      default:
        console.warn('🌐 App: Unknown page:', page, 'redirecting to dashboard')
        // Redirect to dashboard for unknown pages
        setTimeout(() => navigate('dashboard'), 100)
        return <StudentDashboard user={user!} onNavigate={navigate} />
    }
  }

  // Show loading state while router initializes
  if (!isInitialized || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing Application</h3>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout 
      user={user!} 
      onLogout={handleLogout} 
      currentPage={page} 
      onNavigate={navigate}
    >
      {renderPage()}
    </AppLayout>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  )
}