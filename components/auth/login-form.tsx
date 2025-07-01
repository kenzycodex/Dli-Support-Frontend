"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, Heart, Users, LogIn, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"

export function LoginForm() {
  const { login, demoLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await login(formData.email, formData.password)
      
      if (!result.success) {
        setError(result.message || "Login failed")
      }
      // Success case is handled by the AuthContext and will redirect automatically
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: "student" | "counselor" | "advisor" | "admin") => {
    setLoading(true)
    setError("")

    try {
      const result = await demoLogin(role)
      
      if (!result.success) {
        setError(result.message || "Demo login failed")
      }
      // Success case is handled by the AuthContext and will redirect automatically
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
      console.error("Demo login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Left Side - Background Image with Content */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="w-full bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3)), url('/students-studying.jpg')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-700/80"></div>
          <div className="relative z-10 flex flex-col justify-center items-center h-full p-12 text-white">
            <div className="max-w-md text-center space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-3">Student Support Hub</h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Your comprehensive platform for academic and personal wellbeing
                </p>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <span className="text-lg">Secure & Confidential Support</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="text-lg">Professional Counselors</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Heart className="h-6 w-6" />
                  </div>
                  <span className="text-lg">24/7 Crisis Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img 
              src="/logo-dark.png" 
              alt="University Logo" 
              className="h-16 w-auto mx-auto mb-6"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    className="h-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost" 
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  Forgot your password?
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-gray-500 bg-white">Quick access</span>
              </div>
            </div>

            {/* Demo Access Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto py-2.5 border-gray-200 hover:bg-gray-50"
                onClick={() => handleDemoLogin("student")}
                disabled={loading}
              >
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Student</div>
                  <div className="text-xs text-gray-500">Access services</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2.5 border-gray-200 hover:bg-gray-50"
                onClick={() => handleDemoLogin("counselor")}
                disabled={loading}
              >
                <Heart className="h-4 w-4 mr-2 text-rose-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Counselor</div>
                  <div className="text-xs text-gray-500">Manage sessions</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2.5 border-gray-200 hover:bg-gray-50"
                onClick={() => handleDemoLogin("advisor")}
                disabled={loading}
              >
                <Users className="h-4 w-4 mr-2 text-green-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Advisor</div>
                  <div className="text-xs text-gray-500">Guide students</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2.5 border-gray-200 hover:bg-gray-50"
                onClick={() => handleDemoLogin("admin")}
                disabled={loading}
              >
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                <div className="text-left">
                  <div className="text-sm font-medium">Admin</div>
                  <div className="text-xs text-gray-500">System access</div>
                </div>
              </Button>
            </div>

            {/* Demo Credentials Info */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Email: admin@schoolsupport.com</p>
                <p>Password: admin123</p>
                <p className="pt-1 font-medium">Or use quick access buttons above</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}