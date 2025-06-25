"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Shield,
  Bell,
  Mail,
  Database,
  Globe,
  Lock,
  Users,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

interface AdminSettingsPageProps {
  onNavigate?: (page: string) => void
}

export function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const [settings, setSettings] = useState({
    siteName: "Student Support Hub",
    siteDescription: "Your wellbeing is our priority",
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    autoAssignTickets: true,
    sessionRecording: false,
    dataRetention: "365",
    backupFrequency: "daily",
    maxFileSize: "10",
    allowedFileTypes: "pdf,doc,docx,jpg,png",
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving settings:", settings)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Settings className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Settings className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">System Configuration</h1>
                <p className="text-slate-100 text-lg">Manage platform settings and preferences</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} className="bg-white text-slate-700 hover:bg-slate-100">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Active</div>
              <div className="text-sm text-slate-100">System Status</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm text-slate-100">Uptime</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">v2.1.0</div>
              <div className="text-sm text-slate-100">Version</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Secure</div>
              <div className="text-sm text-slate-100">SSL Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg font-medium">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg font-medium">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg font-medium">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg font-medium">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-lg font-medium">
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>Site Configuration</span>
                </CardTitle>
                <CardDescription>Basic site information and branding</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-slate-700 font-medium">
                    Site Name
                  </Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription" className="text-slate-700 font-medium">
                    Site Description
                  </Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                    className="border-slate-200 focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-slate-600">Temporarily disable site access</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span>User Settings</span>
                </CardTitle>
                <CardDescription>User registration and access controls</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 font-medium">User Registration</Label>
                    <p className="text-sm text-slate-600">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={settings.userRegistration}
                    onCheckedChange={(checked) => handleSettingChange("userRegistration", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 font-medium">Auto-assign Tickets</Label>
                    <p className="text-sm text-slate-600">Automatically assign tickets to counselors</p>
                  </div>
                  <Switch
                    checked={settings.autoAssignTickets}
                    onCheckedChange={(checked) => handleSettingChange("autoAssignTickets", checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetention" className="text-slate-700 font-medium">
                    Data Retention (days)
                  </Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingChange("dataRetention", e.target.value)}
                    className="border-slate-200 focus:border-emerald-400"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>Configure security and privacy options</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 font-medium">Session Recording</Label>
                    <p className="text-sm text-slate-600">Record counseling sessions for quality assurance</p>
                  </div>
                  <Switch
                    checked={settings.sessionRecording}
                    onCheckedChange={(checked) => handleSettingChange("sessionRecording", checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize" className="text-slate-700 font-medium">
                    Max File Size (MB)
                  </Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange("maxFileSize", e.target.value)}
                    className="border-slate-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes" className="text-slate-700 font-medium">
                    Allowed File Types
                  </Label>
                  <Input
                    id="allowedFileTypes"
                    value={settings.allowedFileTypes}
                    onChange={(e) => handleSettingChange("allowedFileTypes", e.target.value)}
                    placeholder="pdf,doc,docx,jpg,png"
                    className="border-slate-200 focus:border-red-400"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  <span>Access Control</span>
                </CardTitle>
                <CardDescription>Manage user permissions and access levels</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Two-Factor Authentication</span>
                    </div>
                    <p className="text-sm text-amber-700">Enabled for all admin accounts</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-emerald-800">SSL Certificate</span>
                    </div>
                    <p className="text-sm text-emerald-700">Valid until March 2025</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Data Encryption</span>
                    </div>
                    <p className="text-sm text-blue-700">AES-256 encryption enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-violet-600" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label className="text-slate-700 font-medium">Email Notifications</Label>
                        <p className="text-sm text-slate-600">Send notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-emerald-600" />
                      <div>
                        <Label className="text-slate-700 font-medium">SMS Notifications</Label>
                        <p className="text-sm text-slate-600">Send notifications via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">New user registrations</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">Appointment bookings</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">Support ticket updates</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm">System alerts</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-cyan-600" />
                <span>Third-party Integrations</span>
              </CardTitle>
              <CardDescription>Connect with external services and APIs</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-800">Email Service</h4>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Connected</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">SendGrid integration for email notifications</p>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="p-6 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-800">Video Calling</h4>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Connected</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Zoom integration for video sessions</p>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="p-6 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-800">Analytics</h4>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Google Analytics for usage tracking</p>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
                <div className="p-6 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-800">Payment Gateway</h4>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Stripe for payment processing</p>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-slate-600" />
                <span>Advanced Configuration</span>
              </CardTitle>
              <CardDescription>Database, backup, and system maintenance settings</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Database Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency" className="text-slate-700 font-medium">
                      Backup Frequency
                    </Label>
                    <Select
                      value={settings.backupFrequency}
                      onValueChange={(value) => handleSettingChange("backupFrequency", value)}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-slate-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-slate-800">Last Backup</span>
                    </div>
                    <p className="text-sm text-slate-600">January 15, 2024 at 3:00 AM</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">System Maintenance</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset System
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
