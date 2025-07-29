// components/dialogs/CategoryDialog.tsx
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Loader2 } from "lucide-react"
import { CategoryFormData } from "../../types/form-types"
import { CategoryDialogState } from "../../types/admin-types"
import { TicketCategory } from "@/services/ticketCategories.service"

interface CategoryDialogProps {
  dialogState: CategoryDialogState
  formData: CategoryFormData
  onFormChange: (data: Partial<CategoryFormData>) => void
  onClose: () => void
  onSave: () => void
  isLoading: boolean
}

export function CategoryDialog({
  dialogState,
  formData,
  onFormChange,
  onClose,
  onSave,
  isLoading
}: CategoryDialogProps) {
  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {dialogState.mode === 'create' ? 'Create New Category' : 'Edit Category'}
          </DialogTitle>
          <DialogDescription>
            {dialogState.mode === 'create' 
              ? 'Add a new category to organize tickets effectively.'
              : 'Update the category information and settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                placeholder="Category name..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="category-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => onFormChange({ color: e.target.value })}
                  className="w-12 h-10 p-1 rounded border"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => onFormChange({ color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={formData.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              placeholder="Brief description of this category..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-sla">SLA Response Hours</Label>
              <Input
                id="category-sla"
                type="number"
                value={formData.sla_response_hours}
                onChange={(e) => onFormChange({ sla_response_hours: parseInt(e.target.value) || 24 })}
                min="1"
                max="168"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-priority">Max Priority Level</Label>
              <Select
                value={formData.max_priority_level.toString()}
                onValueChange={(value) => onFormChange({ max_priority_level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low Only</SelectItem>
                  <SelectItem value="2">2 - Low to Medium</SelectItem>
                  <SelectItem value="3">3 - Low to High</SelectItem>
                  <SelectItem value="4">4 - All Priorities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-sort">Sort Order</Label>
              <Input
                id="category-sort"
                type="number"
                value={formData.sort_order}
                onChange={(e) => onFormChange({ sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => onFormChange({ is_active: checked })}
              />
              <Label htmlFor="category-active" className="flex flex-col">
                <span>Active Category</span>
                <span className="text-xs text-gray-600">Allow new tickets in this category</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="category-auto-assign"
                checked={formData.auto_assign}
                onCheckedChange={(checked) => onFormChange({ auto_assign: checked })}
              />
              <Label htmlFor="category-auto-assign" className="flex flex-col">
                <span>Auto-Assignment</span>
                <span className="text-xs text-gray-600">Automatically assign to available counselors</span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="category-crisis"
                checked={formData.crisis_detection_enabled}
                onCheckedChange={(checked) => onFormChange({ crisis_detection_enabled: checked })}
              />
              <Label htmlFor="category-crisis" className="flex flex-col">
                <span>Crisis Detection</span>
                <span className="text-xs text-gray-600">Enable automatic crisis keyword detection</span>
              </Label>
            </div>
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
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              dialogState.mode === 'create' ? (
                <Plus className="h-4 w-4 mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )
            )}
            {dialogState.mode === 'create' ? 'Create Category' : 'Update Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}