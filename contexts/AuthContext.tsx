"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, User } from '@/services/auth.service'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  demoLogin: (role: "student" | "counselor" | "advisor" | "admin") => Promise<{ success: boolean; message?: string }>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!(user && token)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getStoredToken()
        const storedUser = authService.getStoredUser()

        if (storedToken && storedUser) {
          // Verify token is still valid by fetching current user
          const response = await authService.getCurrentUser()
          
          if (response.success && response.data) {
            setUser(response.data.user)
            setToken(storedToken)
          } else {
            // Token is invalid, clear stored data
            authService.clearAuthData()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        authService.clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      
      if (response.success && response.data) {
        setUser(response.data.user)
        setToken(response.data.token)
        return { success: true }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const demoLogin = async (role: "student" | "counselor" | "advisor" | "admin") => {
    try {
      const response = await authService.demoLogin({ role })
      
      if (response.success && response.data) {
        setUser(response.data.user)
        setToken(response.data.token)
        return { success: true }
      } else {
        return { success: false, message: response.message || 'Demo login failed' }
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  const refreshAuth = async () => {
    try {
      const response = await authService.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    demoLogin,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}