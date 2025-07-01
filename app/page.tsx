"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
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
import { AdminUsersPage } from "@/components/pages/admin-users-page"
import { AdminReportsPage } from "@/components/pages/admin-reports-page"
import { AdminSettingsPage } from "@/components/pages/admin-settings-page"
import { AppLayout } from "@/components/layout/app-layout"
import { NotificationsPage } from "@/components/pages/notifications-page"

interface PageParams {
  ticketId?: number
}

function AppContent() {
  const { user, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [pageParams, setPageParams] = useState<PageParams>({})

  const handleLogout = () => {
    logout()
    setCurrentPage("dashboard")
    setPageParams({})
  }

  const handleNavigate = (page: string, params?: PageParams) => {
    setCurrentPage(page)
    setPageParams(params || {})
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        switch (user?.role) {
          case "student":
            return <StudentDashboard user={user} onNavigate={handleNavigate} />
          case "counselor":
          case "advisor":
            return <CounselorDashboard user={user} />
          case "admin":
            return <AdminDashboard user={user} />
          default:
            return <StudentDashboard user={user!} onNavigate={handleNavigate} />
        }
      case "appointments":
        return <AppointmentsPage />
      case "tickets":
        return <TicketsPage onNavigate={handleNavigate} />
      case "submit-ticket":
        return <SubmitTicketPage onNavigate={handleNavigate} />
      case "ticket-details":
        return pageParams.ticketId ? (
          <TicketDetailsPage 
            ticketId={pageParams.ticketId} 
            onNavigate={handleNavigate} 
          />
        ) : (
          <TicketsPage onNavigate={handleNavigate} />
        )
      case "counseling":
        return <CounselingPage />
      case "help":
        return <HelpPage />
      case "resources":
        return <ResourcesPage />
      case "notifications":
        return <NotificationsPage />
      case "admin-users":
        return <AdminUsersPage onNavigate={handleNavigate} />
      case "admin-reports":
        return <AdminReportsPage onNavigate={handleNavigate} />
      case "admin-settings":
        return <AdminSettingsPage onNavigate={handleNavigate} />
      default:
        return <StudentDashboard user={user!} onNavigate={handleNavigate} />
    }
  }

  return (
    <AppLayout 
      user={user!} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={handleNavigate}
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