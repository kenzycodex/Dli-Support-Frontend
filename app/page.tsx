// Updated app/page.tsx to handle the new page-based navigation
"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
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

type UserRole = "student" | "counselor" | "advisor" | "admin" | null

interface PageParams {
  ticketId?: number
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    role: UserRole
    name: string
    email: string
  } | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [pageParams, setPageParams] = useState<PageParams>({})

  const handleLogin = (role: UserRole, name: string, email: string) => {
    setCurrentUser({ role, name, email })
    setCurrentPage("dashboard")
    setPageParams({})
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentPage("dashboard")
    setPageParams({})
  }

  const handleNavigate = (page: string, params?: PageParams) => {
    setCurrentPage(page)
    setPageParams(params || {})
  }

  // Handle special navigation for ticket pages
  const handleTicketNavigation = (action: string, ticketId?: number) => {
    switch (action) {
      case 'submit':
        setCurrentPage('submit-ticket')
        break
      case 'details':
        if (ticketId) {
          setCurrentPage('ticket-details')
          setPageParams({ ticketId })
        }
        break
      case 'list':
      default:
        setCurrentPage('tickets')
        setPageParams({})
        break
    }
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        switch (currentUser.role) {
          case "student":
            return <StudentDashboard user={{ ...currentUser, role: currentUser.role ?? "" }} onNavigate={handleNavigate} />
          case "counselor":
          case "advisor":
            return <CounselorDashboard user={{ ...currentUser, role: currentUser.role as string }} />
          case "admin":
            return <AdminDashboard user={{ ...currentUser, role: currentUser.role as string }} />
          default:
            return <StudentDashboard user={{ ...currentUser, role: currentUser.role ?? "" }} onNavigate={handleNavigate} />
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
        return <StudentDashboard user={{ ...currentUser, role: currentUser.role as string }} onNavigate={handleNavigate} />
    }
  }

  return (
    <AppLayout 
      user={{ ...currentUser, role: currentUser?.role as string }} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </AppLayout>
  )
}