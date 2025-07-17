// components/admin-help/dialogs/EditCategoryDialog.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Loader2 } from "lucide-react"
import { CategoryFormData } from "@/types/admin-help"

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CategoryFormData
  setFormData: (data: CategoryFormData) => void
  isLoading: boolean
  onSubmit: () => void
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  isLoading,
  onSubmit
}: EditCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Category Name *</Label>
            <Input
              id="edit-category-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name..."
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category-description">Description</Label>
            <Textarea
              id="edit-category-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-color">Color</Label>
              <Input
                id="edit-category-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-sort">Sort Order</Label>
              <Input
                id="edit-category-sort"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-category-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="edit-category-active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            Update Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}