// components/layout/app-layout.tsx - FIXED: Removed ticket badge and duplicate chat icon

'use client';

import type React from 'react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
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
  BookOpen,
  Plus,
  FolderOpen,
  Cog,
  Shield,
} from 'lucide-react';
import { ChatBot } from '@/components/features/chat-bot';
import { NotificationCenter } from '@/components/features/notification-center';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

// FIXED: Proper type definitions for navigation items
type BaseNavigationItem = {
  name: string;
  href: string;
  page: string;
  current: boolean;
  roles: string[];
  badge?: number;
};

type RegularNavigationItem = BaseNavigationItem & {
  icon: React.ComponentType<any>;
  isSeparator?: never;
  label?: never;
  description?: string;
};

type SeparatorNavigationItem = {
  name: 'separator';
  href: '#';
  page: 'separator';
  icon: null;
  current: false;
  roles: string[];
  isSeparator: true;
  label: string;
  badge?: never;
  description?: never;
};

type NavigationItem = RegularNavigationItem | SeparatorNavigationItem;

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    role: string;
    name: string;
    email: string;
  };
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppLayout({ children, user, onLogout, currentPage, onNavigate }: AppLayoutProps) {
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get unread count for notifications
  const { unreadCount, refreshUnreadCount } = useNotifications();

  // FIXED: Navigation items with ticket badge removed
  const navigationItems = useMemo((): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        page: 'dashboard',
        icon: Home,
        current: currentPage === 'dashboard',
        roles: ['student', 'counselor', 'advisor', 'admin'],
      },
      {
        name: 'Tickets',
        href: '/tickets',
        page: 'tickets',
        icon: Ticket,
        current: currentPage === 'tickets' || currentPage === 'ticket-details',
        roles: ['student', 'counselor', 'advisor', 'admin'],
        // REMOVED: badge property completely
      },
      {
        name: 'Submit Ticket',
        href: '/submit-ticket',
        page: 'submit-ticket',
        icon: Plus,
        current: currentPage === 'submit-ticket',
        roles: ['student', 'admin'],
      },
      {
        name: 'Appointments',
        href: '/appointments',
        page: 'appointments',
        icon: Calendar,
        current: currentPage === 'appointments',
        roles: ['student', 'counselor', 'advisor', 'admin'],
      },
      {
        name: 'Resources',
        href: '/resources',
        page: 'resources',
        icon: BookOpen,
        current: currentPage === 'resources',
        roles: ['student', 'counselor', 'advisor', 'admin'],
      },
      {
        name: 'Counseling',
        href: '/counseling',
        page: 'counseling',
        icon: Heart,
        current: currentPage === 'counseling',
        roles: ['student', 'counselor', 'advisor', 'admin'],
      },
      {
        name: 'Help Center',
        href: '/help',
        page: 'help',
        icon: HelpCircle,
        current: currentPage === 'help',
        roles: ['student', 'counselor', 'advisor', 'admin'],
      },
      {
        name: 'Notifications',
        href: '/notifications',
        page: 'notifications',
        icon: Bell,
        current: currentPage === 'notifications',
        roles: ['student', 'counselor', 'advisor', 'admin'],
        badge: unreadCount > 0 ? unreadCount : undefined,
      },
    ];

    // Add admin-only items
    if (user?.role === 'admin') {
      baseItems.push(
        // SEPARATOR
        {
          name: 'separator',
          href: '#',
          page: 'separator',
          icon: null,
          current: false,
          roles: ['admin'],
          isSeparator: true,
          label: 'Administration',
        },
        // Admin items with proper typing
        {
          name: 'Ticket Management',
          href: '/admin-tickets',
          page: 'admin-tickets',
          icon: Settings,
          current: currentPage === 'admin-tickets',
          roles: ['admin'],
          description: 'Manage tickets and categories',
        },
        {
          name: 'Resource Management',
          href: '/admin-resources',
          page: 'admin-resources',
          icon: FolderOpen,
          current: currentPage === 'admin-resources',
          roles: ['admin'],
          description: 'Manage resources and content',
        },
        {
          name: 'User Management',
          href: '/admin-users',
          page: 'admin-users',
          icon: Users,
          current: currentPage === 'admin-users',
          roles: ['admin'],
        },
        {
          name: 'Reports & Analytics',
          href: '/admin-reports',
          page: 'admin-reports',
          icon: BarChart3,
          current: currentPage === 'admin-reports',
          roles: ['admin'],
        },
        {
          name: 'System Settings',
          href: '/admin-settings',
          page: 'admin-settings',
          icon: Cog,
          current: currentPage === 'admin-settings',
          roles: ['admin'],
        },
        {
          name: 'Admin Help',
          href: '/admin-help',
          page: 'admin-help',
          icon: Shield,
          current: currentPage === 'admin-help',
          roles: ['admin'],
        }
      );
    }

    return baseItems.filter((item) => item.roles.includes(user?.role || 'student'));
  }, [currentPage, user?.role, unreadCount]);

  const handleNavigation = (page: string) => {
    // Close mobile menu when navigating
    setMobileMenuOpen(false);

    // Refresh unread count when navigating to notifications
    if (page === 'notifications') {
      refreshUnreadCount();
    }
    onNavigate(page);
  };

  const handleMobileNotificationClick = () => {
    console.log('🔔 Mobile notification button clicked');
    refreshUnreadCount();
    setShowNotifications(true);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-2 sm:px-3 py-2 sm:py-3 flex items-center justify-between lg:hidden sticky top-0 z-50 shadow-sm">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg hover:bg-gray-100">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-white">
            <div className="flex h-full flex-col">
              {/* Header in Mobile Menu */}
              <div className="px-4 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center space-x-3">
                  <img
                    src="/favicon.png"
                    alt="Logo"
                    className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1"
                  />
                  <div className="text-white">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-blue-100 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                <nav className="px-2 space-y-1">
                  {navigationItems.map((item) => {
                    // Handle separator items
                    if (item.isSeparator) {
                      return (
                        <div key={item.name} className="pt-4 pb-2 px-2">
                          <div className="flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {item.label}
                            </span>
                            <div className="flex-1 border-t border-gray-300"></div>
                          </div>
                        </div>
                      );
                    }

                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.page}
                        onClick={() => handleNavigation(item.page)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150',
                          item.current
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <div className="flex items-center">
                          <IconComponent
                            className={cn(
                              'mr-3 h-4 w-4 flex-shrink-0',
                              item.current ? 'text-blue-600' : 'text-gray-500'
                            )}
                          />
                          <div className="flex flex-col items-start">
                            <span>{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.badge && (
                          <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex justify-center items-center w-full h-full m-0 p-0">
          <img src="/logo-dark.png" alt="Logo" className="w-[180px] h-auto object-contain" />
        </div>

        {/* Action Buttons - FIXED: Only notification bell, no duplicate chat icon */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileNotificationClick}
            className="rounded-lg relative hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 animate-pulse">
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
            'fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 shadow-sm',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col h-full">
            {/* Header - Logo */}
            <div className="flex items-center justify-between flex-shrink-0 px-4 py-6 border-b border-gray-200 relative">
              {/* Logo - Always Centered */}
              <div
                className={cn(
                  'flex items-center',
                  sidebarCollapsed ? 'justify-center w-full' : 'flex-1 justify-center'
                )}
              >
                <img
                  src={sidebarCollapsed ? '/favicon.png' : '/logo-dark.png'}
                  alt="Logo"
                  className={cn(
                    'object-contain rounded-lg transition-transform duration-300',
                    sidebarCollapsed ? 'h-10 w-10 scale-100' : 'h-10 w-10 scale-[5]'
                  )}
                />
              </div>

              {/* Expand Button - Overlaid on right edge when collapsed */}
              {sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(false)}
                  className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-12 w-6 rounded-r-xl rounded-l-lg bg-white hover:bg-gray-50 shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105 z-10"
                  title="Expand Sidebar"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </Button>
              )}

              {/* Collapse Button - Only when expanded */}
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-9 w-9 rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-sm border border-gray-200"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  // Handle separator items
                  if (item.isSeparator) {
                    return (
                      <div key={item.name} className="pt-4 pb-2">
                        {!sidebarCollapsed ? (
                          <div className="flex items-center px-1">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {item.label}
                            </span>
                            <div className="flex-1 border-t border-gray-300"></div>
                          </div>
                        ) : (
                          <div className="border-t border-gray-300 mx-2"></div>
                        )}
                      </div>
                    );
                  }

                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleNavigation(item.page)}
                      className={cn(
                        'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 relative',
                        sidebarCollapsed ? 'justify-center' : '',
                        item.current
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 ml-0 pl-3'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <IconComponent
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          !sidebarCollapsed && 'mr-3',
                          item.current ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <div className="flex flex-col items-start flex-1">
                          <span>{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
                          )}
                        </div>
                      )}
                      {item.badge && (
                        <Badge
                          className={cn(
                            'h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white animate-pulse',
                            sidebarCollapsed ? 'absolute -top-1 -right-1' : ''
                          )}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Section */}
            {!sidebarCollapsed && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>

                  <NotificationBell className="mr-1" />
                </div>

                <Button
                  variant="ghost"
                  onClick={onLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Bot */}
      <ChatBot
        open={showChatBot}
        onClose={() => setShowChatBot(!showChatBot)}
        isMobile={isMobile}
      />

      {/* Notification Center */}
      <NotificationCenter open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Chat Bot Toggle - FIXED: Only one chat bot toggle for both mobile and desktop */}
      <Button
        className={cn(
          'fixed z-50 h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105',
          isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'
        )}
        onClick={() => setShowChatBot(!showChatBot)}
        size="icon"
      >
        {showChatBot ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <MessageCircle className="h-5 w-5 text-white" />
        )}
      </Button>

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen bg-gray-50 transition-all duration-300',
          isMobile
            ? 'px-2 sm:px-3 pt-2 sm:pt-3'
            : sidebarCollapsed
            ? 'ml-16 px-4 sm:px-6 lg:px-8 pt-6'
            : 'ml-64 px-4 sm:px-6 lg:px-8 pt-6'
        )}
      >
        <div className={cn('w-full mx-auto', isMobile ? 'max-w-none' : 'max-w-7xl')}>
          {children}
        </div>
      </main>
    </div>
  );
}
