"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Save, Lock, EyeOff, AlertTriangle, Shield, Flag, Calendar } from "lucide-react"

interface SessionNotesProps {
  open: boolean
  onClose: () => void
  session: {
    id: string
    student: string
    date: string
    time: string
    duration: number
    type: string
    isAnonymous?: boolean
  } | null
}

export function SessionNotes({ open, onClose, session }: SessionNotesProps) {
  const [notes, setNotes] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(session?.isAnonymous || false)
  const [riskLevel, setRiskLevel] = useState("low")
  const [needsFollowUp, setNeedsFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState("")
  const [sessionRating, setSessionRating] = useState("")

  const handleSave = () => {
    // Save session notes logic
    console.log("Saving session notes:", {
      sessionId: session?.id,
      notes,
      isAnonymous,
      riskLevel,
      needsFollowUp,
      followUpDate,
      sessionRating,
    })
    onClose()
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Session Notes</span>
            {isAnonymous && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                <EyeOff className="h-3 w-3 mr-1" />
                Anonymous
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="text-lg">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Student</Label>
                  <p className="font-medium">{isAnonymous ? "Anonymous" : session.student}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                  <p className="font-medium">
                    {session.date} at {session.time}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Duration</Label>
                  <p className="font-medium">{session.duration} minutes</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <p className="font-medium capitalize">{session.type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Privacy & Confidentiality</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="font-medium">Anonymous Session</Label>
                    <p className="text-sm text-gray-600">Hide student identity in notes for privacy</p>
                  </div>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </CardContent>
          </Card>

          {/* Session Notes */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
              <CardTitle className="text-lg">Session Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Confidential Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter your session notes here... (encrypted and confidential)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    Notes are encrypted and only visible to counselors and authorized staff
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Risk Level</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Low Risk</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Medium Risk</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>High Risk - Requires Immediate Attention</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {riskLevel === "high" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">High Risk Alert</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This assessment will trigger immediate supervisor notification and safety protocol activation.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Planning */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-cyan-600" />
                <span>Follow-up Planning</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Flag className="h-5 w-5 text-cyan-600" />
                    <div>
                      <Label className="font-medium">Requires Follow-up</Label>
                      <p className="text-sm text-gray-600">Schedule future check-in with this student</p>
                    </div>
                  </div>
                  <Switch checked={needsFollowUp} onCheckedChange={setNeedsFollowUp} />
                </div>

                {needsFollowUp && (
                  <div className="space-y-3 pl-8">
                    <div>
                      <Label className="text-sm font-medium">Follow-up Date</Label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Rating */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-lg">Session Outcome</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div>
                <Label className="text-sm font-medium">Session Effectiveness</Label>
                <Select value={sessionRating} onValueChange={setSessionRating}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Rate session outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent - Significant progress made</SelectItem>
                    <SelectItem value="good">Good - Positive engagement</SelectItem>
                    <SelectItem value="fair">Fair - Some progress</SelectItem>
                    <SelectItem value="challenging">Challenging - Limited progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
