// components/help/admin/admin-category-manager.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  ArrowUp,
  ArrowDown,
  Palette,
  BarChart3,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useHelpCategories } from '@/hooks/use-help';
import { CategorySkeleton } from '@/components/common/loading-skeleton';
import { cn } from '@/lib/utils';
import type { HelpCategory } from '@/services/help.service';

export function AdminCategoryManager() {
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'order' | 'faqs'>('order');

  const { data: categories, isLoading, error, refetch } = useHelpCategories();

  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];

    return [...categories].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'order':
          return a.sort_order - b.sort_order;
        case 'faqs':
          return (b.faqs_count || 0) - (a.faqs_count || 0);
        default:
          return 0;
      }
    });
  }, [categories, sortBy]);

  const handleToggleActive = (category: HelpCategory) => {
    console.log('Toggling category active status:', category.id, !category.is_active);
    // Implement toggle active logic here
    refetch();
  };

  const handleReorderCategory = (category: HelpCategory, direction: 'up' | 'down') => {
    console.log('Reordering category:', category.id, direction);
    // Implement reorder logic here
    refetch();
  };

  const handleDeleteCategory = (category: HelpCategory) => {
    if (
      confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)
    ) {
      console.log('Deleting category:', category.id);
      // Implement delete logic here
      refetch();
    }
  };

  if (isLoading) return <CategorySkeleton count={8} />;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load categories</h3>
          <p className="text-gray-600 mb-4">Unable to fetch category data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-gray-600">Organize and manage FAQ categories</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="order">Sort by Order</option>
            <option value="name">Sort by Name</option>
            <option value="faqs">Sort by FAQ Count</option>
          </select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category to organize your FAQ content
                </DialogDescription>
              </DialogHeader>
              <CreateCategoryForm
                onClose={() => setShowCreateDialog(false)}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories?.length || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories?.filter((c) => c.is_active).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total FAQs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories?.reduce((sum, cat) => sum + (cat.faqs_count || 0), 0) || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg FAQs/Category</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories && categories.length > 0
                    ? Math.round(
                        categories.reduce((sum, cat) => sum + (cat.faqs_count || 0), 0) /
                          categories.length
                      )
                    : 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Categories</span>
            <Badge variant="secondary">{sortedCategories.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCategories.length > 0 ? (
            <div className="space-y-3">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg transition-all duration-200',
                    category.is_active ? 'bg-white hover:shadow-md' : 'bg-gray-50 opacity-75'
                  )}
                >
                  {/* Category Info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category Metadata */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm font-medium">{category.faqs_count || 0}</div>
                      <div className="text-xs text-gray-500">FAQs</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium">#{category.sort_order}</div>
                      <div className="text-xs text-gray-500">Order</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {category.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorderCategory(category, 'up')}
                      disabled={sortBy !== 'order'}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorderCategory(category, 'down')}
                      disabled={sortBy !== 'order'}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(category)}>
                      {category.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-700"
                      disabled={Boolean(category.faqs_count && category.faqs_count > 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-4">
                Create your first category to organize FAQ content
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      {selectedCategory && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update category information and settings</DialogDescription>
            </DialogHeader>
            <EditCategoryForm
              category={selectedCategory}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedCategory(null);
              }}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedCategory(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Category Form Component
function CreateCategoryForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'HelpCircle',
    color: '#3B82F6',
    sort_order: 0,
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
    '#F43F5E',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Creating category:', formData);
      // Implement create category API call here
      // await helpService.createCategory(formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess();
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Mental Health, Academic Support"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this category..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color">Category Color</Label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  formData.color === color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-200 hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
        <Label>Active (visible to users)</Label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Edit Category Form Component
function EditCategoryForm({
  category,
  onClose,
  onSuccess,
}: {
  category: HelpCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    icon: category.icon,
    color: category.color,
    sort_order: category.sort_order,
    is_active: category.is_active,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = [
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
    '#F43F5E',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Updating category:', category.id, formData);
      // Implement update category API call here
      // await helpService.updateCategory(category.id, formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess();
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Category Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color">Category Color</Label>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  formData.color === color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-200 hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          />
          <Label>Active</Label>
        </div>

        <div className="text-sm text-gray-500">
          {category.faqs_count || 0} FAQs in this category
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Update Category
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
