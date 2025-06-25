// app/page.tsx
"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { CounselorDashboard } from "@/components/dashboards/counselor-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { AppointmentsPage } from "@/components/pages/appointments-page"
import { TicketsPage } from "@/components/pages/tickets-page"
import { CounselingPage } from "@/components/pages/counseling-page"
import { HelpPage } from "@/components/pages/help-page"
import { ResourcesPage } from "@/components/pages/resources-page"
import { AdminUsersPage } from "@/components/pages/admin-users-page"
import { AdminReportsPage } from "@/components/pages/admin-reports-page"
import { AdminSettingsPage } from "@/components/pages/admin-settings-page"
import { AppLayout } from "@/components/layout/app-layout"
import { NotificationsPage } from "@/components/pages/notifications-page"

type UserRole = "student" | "counselor" | "advisor" | "admin" | null

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{
    role: UserRole
    name: string
    email: string
  } | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")

  const handleLogin = (role: UserRole, name: string, email: string) => {
    setCurrentUser({ role, name, email })
    setCurrentPage("dashboard")
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentPage("dashboard")
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
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
        return <TicketsPage />
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
    <AppLayout user={{ ...currentUser, role: currentUser?.role as string }} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </AppLayout>
  )
}
