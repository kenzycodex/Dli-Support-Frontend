// components/admin-help/dialogs/EditFAQDialog.tsx
"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Loader2 } from "lucide-react"
import type { HelpCategory } from "@/services/help.service"
import { FAQFormData } from "@/types/admin-help"

interface EditFAQDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: HelpCategory[]
  formData: FAQFormData
  setFormData: (data: FAQFormData) => void
  isLoading: boolean
  onSubmit: () => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function EditFAQDialog({
  open,
  onOpenChange,
  categories,
  formData,
  setFormData,
  isLoading,
  onSubmit,
  onAddTag,
  onRemoveTag
}: EditFAQDialogProps) {
  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 10) {
      onAddTag(trimmedTag)
    }
  }, [formData.tags, onAddTag])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
          <DialogDescription>
            Update the FAQ content and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category *</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter((cat: HelpCategory) => cat.is_active).map((category: HelpCategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-question">Question *</Label>
            <Input
              id="edit-question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter the frequently asked question..."
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.question.length}/500 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-answer">Answer *</Label>
            <Textarea
              id="edit-answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Provide a comprehensive answer..."
              className="min-h-[120px] resize-none"
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.answer.length}/5000 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-red-100 hover:text-red-800" 
                  onClick={() => onRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tags (press Enter to add)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  handleAddTag(target.value)
                  target.value = ''
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sort_order">Sort Order</Label>
              <Input
                id="edit-sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="edit-is_published">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="edit-is_featured">Featured</Label>
              </div>
            </div>
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
            Update FAQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}