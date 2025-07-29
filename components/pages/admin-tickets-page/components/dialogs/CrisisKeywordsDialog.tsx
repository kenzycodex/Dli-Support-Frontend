// components/dialogs/CrisisKeywordsDialog.tsx
"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { CrisisKeywordFormData } from "../../types/form-types"
import { CrisisKeywordsDialogState } from "../../types/admin-types"
import { TicketCategory } from "@/services/ticketCategories.service"

interface CrisisKeywordsDialogProps {
  dialogState: CrisisKeywordsDialogState
  formData: CrisisKeywordFormData
  categories: TicketCategory[]
  onFormChange: (data: Partial<CrisisKeywordFormData>) => void
  onClose: () => void
  onSave: () => void
}

export function CrisisKeywordsDialog({
  dialogState,
  formData,
  categories,
  onFormChange,
  onClose,
  onSave
}: CrisisKeywordsDialogProps) {
  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {dialogState.mode === 'create' ? 'Add Crisis Keyword' : 'Edit Crisis Keyword'}
          </DialogTitle>
          <DialogDescription>
            {dialogState.mode === 'create' 
              ? 'Define keywords that trigger crisis detection in tickets.'
              : 'Update the crisis keyword settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword-text">Keyword *</Label>
            <Input
              id="keyword-text"
              value={formData.keyword}
              onChange={(e) => onFormChange({ keyword: e.target.value })}
              placeholder="Enter crisis keyword..."
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword-severity">Severity Level</Label>
              <Select
                value={formData.severity_level}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  onFormChange({ severity_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword-weight">Severity Weight</Label>
              <Input
                id="keyword-weight"
                type="number"
                value={formData.severity_weight}
                onChange={(e) => onFormChange({ severity_weight: parseInt(e.target.value) || 50 })}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Apply to Categories</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cat-${category.id}`}
                    checked={formData.category_ids.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFormChange({
                          category_ids: [...formData.category_ids, category.id]
                        })
                      } else {
                        onFormChange({
                          category_ids: formData.category_ids.filter(id => id !== category.id)
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="keyword-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => onFormChange({ is_active: checked })}
            />
            <Label htmlFor="keyword-active">Active Keyword</Label>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {dialogState.mode === 'create' ? 'Add Keyword' : 'Update Keyword'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}