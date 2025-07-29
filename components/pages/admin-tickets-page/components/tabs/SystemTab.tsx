// components/tabs/SystemTab.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Workflow,
  Shield,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"

export function SystemTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-600" />
            <span>System Operations</span>
          </CardTitle>
          <CardDescription>
            System maintenance and data management tools
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Sync Workload Counters</h4>
              <p className="text-sm text-gray-600">Update counselor workload statistics</p>
            </div>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Test Auto-Assignment</h4>
              <p className="text-sm text-gray-600">Verify assignment algorithm functionality</p>
            </div>
            <Workflow className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">System Health Check</h4>
              <p className="text-sm text-gray-600">Comprehensive system diagnostics</p>
            </div>
            <Shield className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Cache Management</h4>
              <p className="text-sm text-gray-600">Clear and refresh system caches</p>
            </div>
            <Database className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-6 w-6 text-green-600" />
            <span>Export & Import</span>
          </CardTitle>
          <CardDescription>
            Data export and import operations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Export All Tickets</h4>
              <p className="text-sm text-gray-600">Download complete ticket database</p>
            </div>
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Export Categories</h4>
              <p className="text-sm text-gray-600">Download category structure and settings</p>
            </div>
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between h-auto p-4">
            <div className="text-left">
              <h4 className="font-medium">Import Data</h4>
              <p className="text-sm text-gray-600">Bulk import from CSV or JSON files</p>
            </div>
            <Upload className="h-4 w-4" />
          </Button>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Import Guidelines</h4>
                <p className="text-sm text-yellow-700">
                  Ensure your files follow the required format. Large imports may take time to process.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Status */}
      <Card className="border-0 shadow-lg lg:col-span-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-purple-600" />
            <span>System Health Status</span>
          </CardTitle>
          <CardDescription>
            Real-time system health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Database</span>
              </div>
              <p className="text-sm text-green-700 mt-1">Connected & Healthy</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">API Services</span>
              </div>
              <p className="text-sm text-green-700 mt-1">All Services Running</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Queue</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">3 Jobs Pending</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Storage</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">15.2GB / 100GB Used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}