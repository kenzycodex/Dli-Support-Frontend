"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Heart, Phone, Users, AlertTriangle, CheckCircle, Plus, X, Download, Edit } from "lucide-react"

interface SafetyPlanningProps {
  open?: boolean
  onClose?: () => void
}

interface SafetyPlan {
  warningSignsPersonal: string[]
  warningSignsCrisis: string[]
  copingStrategies: string[]
  socialContacts: Array<{ name: string; phone: string; relationship: string }>
  professionalContacts: Array<{ name: string; phone: string; role: string }>
  environmentSafety: string[]
  reasonsForLiving: string[]
}

export function SafetyPlanning({ open, onClose }: SafetyPlanningProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>({
    warningSignsPersonal: ["Feeling overwhelmed", "Difficulty sleeping", "Isolating from friends"],
    warningSignsCrisis: ["Thoughts of self-harm", "Feeling hopeless", "Unable to cope"],
    copingStrategies: ["Deep breathing exercises", "Call a friend", "Go for a walk", "Listen to music"],
    socialContacts: [
      { name: "Sarah (Best Friend)", phone: "(555) 123-4567", relationship: "Best Friend" },
      { name: "Mom", phone: "(555) 987-6543", relationship: "Mother" },
    ],
    professionalContacts: [
      { name: "Dr. Sarah Wilson", phone: "(555) 111-2222", role: "Counselor" },
      { name: "Crisis Hotline", phone: "988", role: "Crisis Support" },
    ],
    environmentSafety: ["Remove harmful objects", "Stay in public spaces", "Avoid alcohol"],
    reasonsForLiving: ["My family", "My goals and dreams", "My pets", "Future experiences"],
  })

  const [newItem, setNewItem] = useState("")
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" })

  const addItem = (category: keyof SafetyPlan, item: string) => {
    if (item.trim()) {
      setSafetyPlan((prev) => ({
        ...prev,
        [category]: [...(prev[category] as string[]), item.trim()],
      }))
      setNewItem("")
    }
  }

  const removeItem = (category: keyof SafetyPlan, index: number) => {
    setSafetyPlan((prev) => ({
      ...prev,
      [category]: (prev[category] as string[]).filter((_, i) => i !== index),
    }))
  }

  const addContact = (category: "socialContacts" | "professionalContacts") => {
    if (newContact.name && newContact.phone) {
      setSafetyPlan((prev) => ({
        ...prev,
        [category]: [...prev[category], { ...newContact }],
      }))
      setNewContact({ name: "", phone: "", relationship: "" })
    }
  }

  const removeContact = (category: "socialContacts" | "professionalContacts", index: number) => {
    setSafetyPlan((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }))
  }

  const renderEditableList = (
    items: string[],
    category: keyof SafetyPlan,
    placeholder: string,
    addButtonText: string,
  ) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="flex-1">{item}</span>
          {isEditing && (
            <Button variant="ghost" size="sm" onClick={() => removeItem(category, index)} className="hover:bg-red-50">
              <X className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ))}
      {isEditing && (
        <div className="flex space-x-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addItem(category, newItem)
              }
            }}
          />
          <Button
            onClick={() => addItem(category, newItem)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  const renderContactList = (
    contacts: Array<{ name: string; phone: string; relationship?: string; role?: string }>,
    category: "socialContacts" | "professionalContacts",
  ) => (
    <div className="space-y-3">
      {contacts.map((contact, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="font-medium">{contact.name}</div>
            <div className="text-sm text-gray-600">{contact.phone}</div>
            <Badge variant="outline" className="mt-1 text-xs">
              {contact.relationship || contact.role}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-200">
              <Phone className="h-4 w-4" />
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeContact(category, index)}
                className="hover:bg-red-50"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {isEditing && (
        <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <Input
            placeholder={category === "socialContacts" ? "Relationship" : "Role"}
            value={newContact.relationship}
            onChange={(e) => setNewContact((prev) => ({ ...prev, relationship: e.target.value }))}
          />
          <Button
            onClick={() => addContact(category)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="absolute top-4 right-4 opacity-20">
          <Shield className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Safety Planning</h1>
                <p className="text-rose-100 text-lg">Your personalized crisis prevention plan</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Save Changes" : "Edit Plan"}
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Personal</div>
              <div className="text-sm text-rose-100">Customized for You</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">Confidential</div>
              <div className="text-sm text-rose-100">Private & Secure</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-rose-100">Always Accessible</div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Plan Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-gray-100 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg font-medium">
            Overview
          </TabsTrigger>
          <TabsTrigger value="warning-signs" className="rounded-lg font-medium">
            Warning Signs
          </TabsTrigger>
          <TabsTrigger value="coping" className="rounded-lg font-medium">
            Coping Strategies
          </TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-lg font-medium">
            Support Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Plan Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span>Warning Signs</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Coping Strategies</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Support Contacts</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safety Environment</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  <span>Quick Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-red-50 hover:border-red-200"
                >
                  <Phone className="h-5 w-5 mr-3 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Crisis Hotline</div>
                    <div className="text-sm text-gray-600">Call 988 - Available 24/7</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200"
                >
                  <Users className="h-5 w-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Emergency Contact</div>
                    <div className="text-sm text-gray-600">Sarah (Best Friend)</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-green-50 hover:border-green-200"
                >
                  <Heart className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">My Counselor</div>
                    <div className="text-sm text-gray-600">Dr. Sarah Wilson</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-purple-600" />
                <span>Reasons for Living</span>
              </CardTitle>
              <CardDescription>Remember what matters most to you</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {renderEditableList(
                safetyPlan.reasonsForLiving,
                "reasonsForLiving",
                "Add a reason for living...",
                "Add Reason",
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warning-signs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Personal Warning Signs</span>
                </CardTitle>
                <CardDescription>Early signs that you might be struggling</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderEditableList(
                  safetyPlan.warningSignsPersonal,
                  "warningSignsPersonal",
                  "Add a personal warning sign...",
                  "Add Sign",
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Crisis Warning Signs</span>
                </CardTitle>
                <CardDescription>Signs that indicate immediate danger</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderEditableList(
                  safetyPlan.warningSignsCrisis,
                  "warningSignsCrisis",
                  "Add a crisis warning sign...",
                  "Add Sign",
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coping" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <span>Coping Strategies</span>
                </CardTitle>
                <CardDescription>Healthy ways to manage difficult feelings</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderEditableList(
                  safetyPlan.copingStrategies,
                  "copingStrategies",
                  "Add a coping strategy...",
                  "Add Strategy",
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Environment Safety</span>
                </CardTitle>
                <CardDescription>Steps to make your environment safer</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderEditableList(
                  safetyPlan.environmentSafety,
                  "environmentSafety",
                  "Add a safety step...",
                  "Add Step",
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Social Support</span>
                </CardTitle>
                <CardDescription>Friends and family you can reach out to</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderContactList(safetyPlan.socialContacts, "socialContacts")}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-emerald-600" />
                  <span>Professional Support</span>
                </CardTitle>
                <CardDescription>Mental health professionals and crisis services</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderContactList(safetyPlan.professionalContacts, "professionalContacts")}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
