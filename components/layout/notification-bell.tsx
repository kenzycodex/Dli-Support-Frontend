// components/layout/notification-bell.tsx (MANUAL FETCH ONLY)

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { NotificationCenter } from "@/components/features/notification-center"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount, refreshUnreadCount } = useNotifications()
  const [showCenter, setShowCenter] = useState(false)

  const handleBellClick = () => {
    console.log("🔔 Bell clicked: Opening notification center")
    
    // Refresh unread count when bell is clicked
    refreshUnreadCount()
    setShowCenter(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={`relative hover:bg-gray-100 ${className}`}
        onClick={handleBellClick}
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter 
        open={showCenter} 
        onClose={() => setShowCenter(false)} 
      />
    </>
  )
}