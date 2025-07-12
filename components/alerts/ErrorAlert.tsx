// components/alerts/ErrorAlert.tsx
"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorAlertProps {
  error: string | null
  onDismiss: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) {
    return null
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-red-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-red-600 hover:text-red-700 hover:bg-red-100 w-full sm:w-auto"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  )
}