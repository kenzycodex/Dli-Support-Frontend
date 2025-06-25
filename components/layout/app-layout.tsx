// components/layout/app-layout.tsx (UPDATED WITH MANUAL FETCH)

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Bell,
  MessageCircle,
  Calendar,
  Ticket,
  Heart,
  Settings,
  LogOut,
  Home,
  Users,
  BarChart3,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { ChatBot } from "@/components/features/chat-bot"
import { NotificationCenter } from "@/components/features/notification-center"
import { NotificationBell } from "@/components/layout/notification-bell"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  user: {
    role: string
    name: string
    email: string
  }
  onLogout: () => void
  currentPage: string
  onNavigate: (page: string) => void
}

export function AppLayout({ children, user, onLogout, currentPage, onNavigate }: AppLayoutProps) {
  const [showChatBot, setShowChatBot] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isMobile = useIsMobile()
  
  // Get unread count for mobile display only
  const { unreadCount, refreshUnreadCount } = useNotifications()

  const getNavigationItems = () => {
    const baseItems = [
      { icon: Home, label: "Dashboard", page: "dashboard" },
      { icon: Calendar, label: "Appointments", page: "appointments" },
      { icon: Ticket, label: "Support Tickets", page: "tickets" },
      { icon: Heart, label: "Counseling", page: "counseling" },
      { 
        icon: Bell, 
        label: "Notifications", 
        page: "notifications",
        badge: unreadCount > 0 ? unreadCount : undefined
      },
      { icon: HelpCircle, label: "Help & FAQs", page: "help" },
    ]

    if (user.role === "admin") {
      baseItems.push(
        { icon: Users, label: "User Management", page: "admin-users" },
        { icon: BarChart3, label: "Reports", page: "admin-reports" },
        { icon: Settings, label: "System Config", page: "admin-settings" },
      )
    }

    return baseItems
  }

  const handleNavigation = (page: string) => {
    // Refresh unread count when navigating to notifications
    if (page === "notifications") {
      refreshUnreadCount()
    }
    onNavigate(page)
  }

  const handleMobileNotificationClick = () => {
    console.log("🔔 Mobile notification button clicked")
    refreshUnreadCount()
    setShowNotifications(true)
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="relative min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex h-full flex-col">
              <div className="px-6 pt-6 pb-2 flex justify-center">
                <img 
                  src="/logo-dark.png" 
                  alt="Logo" 
                  className="h-16 w-16 object-contain rounded-lg"
                />
              </div>

              <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => (
                  <Button
                    key={item.page}
                    variant={currentPage === item.page ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start rounded-lg relative",
                      currentPage === item.page
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                    )}
                    onClick={() => handleNavigation(item.page)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                    {item.badge && (
                      <Badge className="absolute top-1/2 -translate-y-1/2 right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              <div className="border-t border-border p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center space-x-2">
          <img 
            src="/logo-dark.png" 
            alt="Logo" 
            className="h-9 w-9 object-contain rounded-lg"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleMobileNotificationClick}
            className="rounded-full relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={cn(
            "fixed left-0 top-0 bottom-0 z-40 bg-card border-r border-border transition-all duration-300",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col h-full">
            <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4 mb-6">
                <div className={cn("flex items-center w-full", sidebarCollapsed ? "justify-center" : "justify-center")}>
                  <img 
                    src={sidebarCollapsed ? "/favicon.png" : "/logo-dark.png"}
                    alt="Logo" 
                    className={cn(
                      "object-contain rounded-lg",
                      sidebarCollapsed ? "h-14 w-14" : "h-[95%] w-[95%] max-w-[220px]"
                    )}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground absolute right-2 top-5"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <nav className="mt-2 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.page}
                    variant={currentPage === item.page ? "default" : "ghost"}
                    className={cn(
                      "w-full transition-all rounded-lg relative",
                      sidebarCollapsed ? "justify-center px-2 h-10" : "justify-start h-10",
                      currentPage === item.page
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                    )}
                    onClick={() => handleNavigation(item.page)}
                  >
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", !sidebarCollapsed && "mr-3")} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                    {item.badge && (
                      <Badge className={cn(
                        "absolute h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground animate-pulse",
                        sidebarCollapsed ? "-top-1 -right-1" : "top-1/2 -translate-y-1/2 right-2"
                      )}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 border-t border-border p-4">
              <div className={cn("flex items-center w-full", sidebarCollapsed ? "justify-center" : "")}>
                {!sidebarCollapsed && (
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                )}
                
                {/* Desktop Notification Bell */}
                {!sidebarCollapsed && (
                  <NotificationBell className="mr-2" />
                )}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onLogout} 
                  className={cn(
                    "text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full",
                    sidebarCollapsed ? "ml-0" : "ml-2"
                  )}
                  title={sidebarCollapsed ? "Sign Out" : ""}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-40">
          <div className="flex items-center justify-around">
            {navigationItems.slice(0, 5).map((item) => (
              <Button
                key={item.page}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.page)}
                className={cn(
                  "flex flex-col items-center space-y-1 h-auto py-2 px-2 rounded-lg relative",
                  currentPage === item.page
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </nav>
      )}

      {/* Chat Bot */}
      <ChatBot open={showChatBot} onClose={() => setShowChatBot(!showChatBot)} isMobile={isMobile} />

      {/* Notification Center */}
      <NotificationCenter open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Chat Bot Toggle Button */}
      <Button
        className={cn(
          "fixed z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-transform hover:scale-105",
          isMobile ? "bottom-24 right-4" : "bottom-6 right-6"
        )}
        onClick={() => setShowChatBot(!showChatBot)}
        size="icon"
      >
        {showChatBot ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen bg-background transition-all duration-300 pb-24 pt-4 sm:pt-6 md:pt-8",
          isMobile
            ? "px-4"
            : sidebarCollapsed
            ? "ml-20 px-6 lg:px-8 xl:px-10"
            : "ml-64 px-6 lg:px-8 xl:px-10"
        )}
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}