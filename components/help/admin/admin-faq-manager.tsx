// components/help/admin/admin-faq-manager.tsx
"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Star,
  Search,
  Filter,
  MoreHorizontal,
  CheckSquare,
  Square,
  ChevronDown,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useFAQs, useFAQFilters, useHelpCategories } from '@/hooks/use-help'
import { FAQSkeleton } from '@/components/common/loading-skeleton'
import { cn } from '@/lib/utils'
import type { FAQ } from '@/services/help.service'

export function AdminFAQManager() {
  const [selectedFAQs, setSelectedFAQs] = useState<number[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [bulkAction, setBulkAction] = useState('')

  const { filters, updateFilter, clearFilters } = useFAQFilters()
  const { data: faqsData, isLoading, error } = useFAQs(filters)
  const { data: categories } = useHelpCategories()

  const faqs = faqsData?.faqs || []

  const handleSelectFAQ = (faqId: number) => {
    setSelectedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    )
  }

  const handleSelectAll = () => {
    setSelectedFAQs(
      selectedFAQs.length === faqs.length 
        ? [] 
        : faqs.map(faq => faq.id)
    )
  }

  const handleBulkAction = () => {
    if (!bulkAction || selectedFAQs.length === 0) return
    
    console.log(`Performing ${bulkAction} on FAQs:`, selectedFAQs)
    // Implement bulk action logic here
    setSelectedFAQs([])
    setBulkAction('')
  }

  const getStatusBadge = (faq: FAQ) => {
    if (!faq.is_published) {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (faq.is_featured) {
      return <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
    }
    return <Badge variant="default">Published</Badge>
  }

  const getHelpfulnessRate = (faq: FAQ) => {
    const total = faq.helpful_count + faq.not_helpful_count
    if (total === 0) return 0
    return Math.round((faq.helpful_count / total) * 100)
  }

  if (isLoading) return <FAQSkeleton count={5} />

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-gray-600">Create, edit, and organize frequently asked questions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New FAQ</DialogTitle>
              <DialogDescription>
                Add a new frequently asked question to help your users
              </DialogDescription>
            </DialogHeader>
            <CreateFAQForm onClose={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sort_by || 'newest'} onValueChange={(value) => updateFilter('sort_by', value)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="featured">Featured First</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search || filters.category) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedFAQs.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{selectedFAQs.length} FAQs selected</span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publish</SelectItem>
                    <SelectItem value="unpublish">Unpublish</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="unfeature">Remove Featured</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAction} 
                  disabled={!bulkAction}
                  size="sm"
                >
                  Apply Action
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFAQs([])}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>All FAQs</span>
              <Badge variant="secondary">{faqs.length}</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center space-x-2"
              >
                {selectedFAQs.length === faqs.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select All</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors",
                    selectedFAQs.includes(faq.id) && "bg-blue-50 border-blue-200"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleSelectFAQ(faq.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedFAQs.includes(faq.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg line-clamp-1">{faq.question}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                          {faq.answer.substring(0, 150)}...
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        {getStatusBadge(faq)}
                        {faq.category && (
                          <Badge variant="outline">{faq.category.name}</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{faq.view_count} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{getHelpfulnessRate(faq)}% helpful</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Updated {new Date(faq.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingFAQ(faq)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {faq.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.category 
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first FAQ"
                }
              </p>
              {!filters.search && !filters.category && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First FAQ
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit FAQ Dialog */}
      {editingFAQ && (
        <Dialog open={!!editingFAQ} onOpenChange={() => setEditingFAQ(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit FAQ</DialogTitle>
              <DialogDescription>
                Update the question and answer content
              </DialogDescription>
            </DialogHeader>
            <EditFAQForm 
              faq={editingFAQ} 
              onClose={() => setEditingFAQ(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Create FAQ Form Component
function CreateFAQForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    sort_order: 0
  })

  const { data: categories } = useHelpCategories()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating FAQ:', formData)
    // Implement create FAQ logic
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          placeholder="Enter the frequently asked question"
          required
        />
      </div>

      <div>
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          value={formData.answer}
          onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          placeholder="Provide a comprehensive answer to the question"
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
          }))}
          placeholder="e.g., appointments, booking, schedule"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
            />
            <Label>Publish immediately</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
            />
            <Label>Feature this FAQ</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create FAQ
        </Button>
      </div>
    </form>
  )
}

// Edit FAQ Form Component
function EditFAQForm({ faq, onClose }: { faq: FAQ; onClose: () => void }) {
  const [formData, setFormData] = useState({
    category_id: faq.category_id.toString(),
    question: faq.question,
    answer: faq.answer,
    tags: (faq.tags || []) as string[],
    is_published: faq.is_published,
    is_featured: faq.is_featured,
    sort_order: faq.sort_order
  })

  const { data: categories } = useHelpCategories()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Updating FAQ:', faq.id, formData)
    // Implement update FAQ logic
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          value={formData.answer}
          onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
          }))}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
            />
            <Label>Published</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
            />
            <Label>Featured</Label>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Views: {faq.view_count} • Helpful: {faq.helpful_count}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Update FAQ
        </Button>
      </div>
    </form>
  )
}