// components/pages/admin-help-page.tsx - FIXED: HTML nesting issues in dialogs

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Target,
  MessageSquare,
  Settings,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminHelpData } from '@/hooks/admin-help/useAdminHelpData';

// Components
import { AdminHelpHeader } from '@/components/admin-help/AdminHelpHeader';
import { FAQManagementTab } from '@/components/admin-help/tabs/FAQManagementTab';
import { CategoryManagementTab } from '@/components/admin-help/tabs/CategoryManagementTab';
import { SuggestionsTab } from '@/components/admin-help/tabs/SuggestionsTab';
import { AnalyticsTab } from '@/components/admin-help/tabs/AnalyticsTab';
import { CreateFAQDialog } from '@/components/admin-help/dialogs/CreateFAQDialog';
import { EditFAQDialog } from '@/components/admin-help/dialogs/EditFAQDialog';
import { CreateCategoryDialog } from '@/components/admin-help/dialogs/CreateCategoryDialog';
import { EditCategoryDialog } from '@/components/admin-help/dialogs/EditCategoryDialog';

// Types
import type { HelpFAQ } from '@/stores/help-store';
import type { HelpCategory } from '@/services/help.service';

// Form data interfaces with proper optional properties
interface FAQFormData {
  question: string;
  answer: string;
  category_id: string;
  tags: string[]; // Required array
  is_published?: boolean; // Optional
  is_featured?: boolean; // Optional
  sort_order?: number; // Optional
}

interface CategoryFormData {
  name: string;
  description?: string; // Optional
  icon?: string; // Optional
  color?: string; // Optional
  sort_order?: number; // Optional
  is_active?: boolean; // Optional
}

// Dialog states
interface DialogStates {
  showCreateFAQDialog: boolean;
  showEditFAQDialog: boolean;
  showDeleteFAQDialog: boolean;
  showCreateCategoryDialog: boolean;
  showEditCategoryDialog: boolean;
  showDeleteCategoryDialog: boolean;
}

// Tab type
type TabType = 'faqs' | 'categories' | 'suggestions' | 'analytics';

// Props
interface AdminHelpPageProps {
  onNavigate?: (path: string) => void;
}

// Error fallback
function AdminHelpErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Failed to Load Help Admin</h3>
          <p className="text-gray-600">
            {error.message.includes('network') || error.message.includes('fetch')
              ? 'Network connection problem. Please check your internet connection.'
              : 'There was an error loading the admin interface. Please try again.'}
          </p>
          <Button onClick={retry} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export function AdminHelpPage({ onNavigate }: AdminHelpPageProps) {
  const { user } = useAuth();

  // Simple tab state
  const [selectedTab, setSelectedTab] = useState<TabType>('faqs');

  // Use the simplified hook
  const {
    faqs,
    categories,
    suggestedFAQs,
    adminStats,
    loading,
    errors,
    isLoading,
    hasError,
    filters,
    actions,
    enhancedActions,
    helpers,
    isInitialized,
    hasActiveFilters,
  } = useAdminHelpData();

  // Simple dialog states
  const [dialogStates, setDialogStates] = useState<DialogStates>({
    showCreateFAQDialog: false,
    showEditFAQDialog: false,
    showDeleteFAQDialog: false,
    showCreateCategoryDialog: false,
    showEditCategoryDialog: false,
    showDeleteCategoryDialog: false,
  });

  // Selected items for editing/deleting
  const [selectedFAQ, setSelectedFAQ] = useState<HelpFAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);

  // Form states with proper defaults
  const [faqForm, setFAQForm] = useState<FAQFormData>({
    question: '',
    answer: '',
    category_id: '',
    tags: [], // Always an array
    is_published: false,
    is_featured: false,
    sort_order: 0,
  });

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '', // Always a string
    icon: 'HelpCircle',
    color: '#3B82F6',
    is_active: true,
    sort_order: 0,
  });

  // Simple permission check
  const isAdmin = user?.role === 'admin';

  // Permission check effect
  useEffect(() => {
    if (!user) return;

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      onNavigate?.('help');
    }
  }, [user, isAdmin, onNavigate]);

  // Navigation handler
  const handleBackToHelp = useCallback(() => {
    onNavigate?.('help');
  }, [onNavigate]);

  // Refresh handler
  const handleRefreshAll = useCallback(async () => {
    try {
      console.log('🔄 AdminHelpPage: Refreshing all data');
      await helpers.refresh();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      toast.error('Failed to refresh data');
    }
  }, [helpers]);

  // Dialog handlers
  const openDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: true }));
  }, []);

  const closeDialog = useCallback((dialogName: keyof DialogStates) => {
    setDialogStates((prev) => ({ ...prev, [dialogName]: false }));
  }, []);

  const closeAllDialogs = useCallback(() => {
    setDialogStates({
      showCreateFAQDialog: false,
      showEditFAQDialog: false,
      showDeleteFAQDialog: false,
      showCreateCategoryDialog: false,
      showEditCategoryDialog: false,
      showDeleteCategoryDialog: false,
    });
    setSelectedFAQ(null);
    setSelectedCategory(null);
  }, []);

  // Form reset handlers
  const resetFAQForm = useCallback(() => {
    setFAQForm({
      question: '',
      answer: '',
      category_id: '',
      tags: [],
      is_published: false,
      is_featured: false,
      sort_order: 0,
    });
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({
      name: '',
      description: '',
      icon: 'HelpCircle',
      color: '#3B82F6',
      is_active: true,
      sort_order: 0,
    });
  }, []);

  // FAQ operations
  const handleCreateFAQ = useCallback(async () => {
    try {
      const success = await enhancedActions.handleCreateFAQ(faqForm);
      if (success) {
        closeDialog('showCreateFAQDialog');
        resetFAQForm();
        toast.success('FAQ created successfully!');
      }
    } catch (error) {
      console.error('❌ Create FAQ failed:', error);
    }
  }, [faqForm, enhancedActions, closeDialog, resetFAQForm]);

  const handleEditFAQ = useCallback(
    (faq: HelpFAQ) => {
      if (!faq) return;

      setSelectedFAQ(faq);
      setFAQForm({
        question: faq.question || '',
        answer: faq.answer || '',
        category_id: faq.category_id?.toString() || '',
        tags: Array.isArray(faq.tags) ? faq.tags : [], // Ensure array
        is_published: faq.is_published || false,
        is_featured: faq.is_featured || false,
        sort_order: faq.sort_order || 0,
      });
      openDialog('showEditFAQDialog');
    },
    [openDialog]
  );

  const handleUpdateFAQ = useCallback(async () => {
    if (!selectedFAQ) return;

    try {
      const success = await enhancedActions.handleUpdateFAQ(selectedFAQ, faqForm);
      if (success) {
        closeDialog('showEditFAQDialog');
        setSelectedFAQ(null);
        toast.success('FAQ updated successfully!');
      }
    } catch (error) {
      console.error('❌ Update FAQ failed:', error);
    }
  }, [selectedFAQ, faqForm, enhancedActions, closeDialog]);

  const handleDeleteFAQ = useCallback(async () => {
    if (!selectedFAQ) return;

    try {
      const success = await enhancedActions.handleDeleteFAQ(selectedFAQ);
      if (success) {
        closeDialog('showDeleteFAQDialog');
        setSelectedFAQ(null);
        toast.success('FAQ deleted successfully!');
      }
    } catch (error) {
      console.error('❌ Delete FAQ failed:', error);
    }
  }, [selectedFAQ, enhancedActions, closeDialog]);

  // Quick actions
  const handleTogglePublish = useCallback(
    async (faq: HelpFAQ) => {
      try {
        await enhancedActions.handleTogglePublish(faq);
        const status = faq.is_published ? 'unpublished' : 'published';
        toast.success(`FAQ ${status} successfully!`);
      } catch (error) {
        console.error('❌ Toggle publish failed:', error);
      }
    },
    [enhancedActions]
  );

  const handleToggleFeature = useCallback(
    async (faq: HelpFAQ) => {
      try {
        await enhancedActions.handleToggleFeature(faq);
        const status = faq.is_featured ? 'unfeatured' : 'featured';
        toast.success(`FAQ ${status} successfully!`);
      } catch (error) {
        console.error('❌ Toggle feature failed:', error);
      }
    },
    [enhancedActions]
  );

  // Category operations
  const handleCreateCategory = useCallback(async () => {
    try {
      const success = await enhancedActions.handleCreateCategory(categoryForm);
      if (success) {
        closeDialog('showCreateCategoryDialog');
        resetCategoryForm();
        toast.success('Category created successfully!');
      }
    } catch (error) {
      console.error('❌ Create category failed:', error);
    }
  }, [categoryForm, enhancedActions, closeDialog, resetCategoryForm]);

  const handleEditCategory = useCallback(
    (category: HelpCategory) => {
      if (!category) return;

      setSelectedCategory(category);
      setCategoryForm({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || 'HelpCircle',
        color: category.color || '#3B82F6',
        is_active: category.is_active !== undefined ? category.is_active : true,
        sort_order: category.sort_order || 0,
      });
      openDialog('showEditCategoryDialog');
    },
    [openDialog]
  );

  const handleUpdateCategory = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      const success = await enhancedActions.handleUpdateCategory(selectedCategory, categoryForm);
      if (success) {
        closeDialog('showEditCategoryDialog');
        setSelectedCategory(null);
        toast.success('Category updated successfully!');
      }
    } catch (error) {
      console.error('❌ Update category failed:', error);
    }
  }, [selectedCategory, categoryForm, enhancedActions, closeDialog]);

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return;

    try {
      const success = await enhancedActions.handleDeleteCategory(selectedCategory);
      if (success) {
        closeDialog('showDeleteCategoryDialog');
        setSelectedCategory(null);
        toast.success('Category deleted successfully!');
      }
    } catch (error) {
      console.error('❌ Delete category failed:', error);
    }
  }, [selectedCategory, enhancedActions, closeDialog]);

  // Suggestion management
  const handleApproveSuggestion = useCallback(
    async (faq: HelpFAQ) => {
      try {
        await enhancedActions.handleApproveSuggestion(faq);
        toast.success('Suggestion approved and published!');
      } catch (error) {
        console.error('❌ Approve suggestion failed:', error);
      }
    },
    [enhancedActions]
  );

  const handleRejectSuggestion = useCallback(
    async (faq: HelpFAQ) => {
      try {
        await enhancedActions.handleRejectSuggestion(faq);
        toast.success('Suggestion rejected successfully!');
      } catch (error) {
        console.error('❌ Reject suggestion failed:', error);
      }
    },
    [enhancedActions]
  );

  // Tag handlers
  const handleAddTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !faqForm.tags.includes(trimmedTag) && faqForm.tags.length < 10) {
        setFAQForm((prev) => ({
          ...prev,
          tags: [...prev.tags, trimmedTag],
        }));
      }
    },
    [faqForm.tags]
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFAQForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  // Filter handlers
  const handleSearchChange = useCallback(
    (value: string) => {
      actions.setFilters({ search: value }, true);
    },
    [actions]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      actions.setFilters({ [key]: value === 'all' ? undefined : value }, true);
    },
    [actions]
  );

  const handleClearFilters = useCallback(() => {
    actions.clearFilters(true);
  }, [actions]);

  // Early returns
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">Administrator privileges required.</p>
            <Button onClick={handleBackToHelp}>Back to Help Center</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <AdminHelpHeader
          adminStats={adminStats}
          isLoading={isLoading}
          isInitialized={isInitialized}
          onBackToHelp={handleBackToHelp}
          onRefreshAll={handleRefreshAll}
        />

        {/* Error Display */}
        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    {errors.faqs || errors.categories || errors.stats || 'An error occurred'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Status */}
        {isInitialized && !isLoading && !hasError && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Help system ready - {adminStats.total_faqs} FAQs, {adminStats.categories_count}{' '}
                  categories
                  {adminStats.suggested_faqs > 0 &&
                    `, ${adminStats.suggested_faqs} pending suggestions`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TabType)}>
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="faqs">
              <Target className="h-4 w-4 mr-2" />
              FAQs ({adminStats.total_faqs})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Settings className="h-4 w-4 mr-2" />
              Categories ({adminStats.categories_count})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <MessageSquare className="h-4 w-4 mr-2" />
              Suggestions
              {adminStats.suggested_faqs > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {adminStats.suggested_faqs}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* FAQ Management Tab */}
          <TabsContent value="faqs">
            <FAQManagementTab
              faqs={faqs}
              categories={categories}
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              loading={loading}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onCreateFAQ={() => openDialog('showCreateFAQDialog')}
              onEditFAQ={handleEditFAQ}
              onDeleteFAQ={(faq) => {
                setSelectedFAQ(faq);
                openDialog('showDeleteFAQDialog');
              }}
              onTogglePublish={handleTogglePublish}
              onToggleFeature={handleToggleFeature}
              setFilters={actions.setFilters}
            />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManagementTab
              categories={categories}
              loading={loading}
              onCreateCategory={() => openDialog('showCreateCategoryDialog')}
              onEditCategory={handleEditCategory}
              onDeleteCategory={(category) => {
                setSelectedCategory(category);
                openDialog('showDeleteCategoryDialog');
              }}
            />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <SuggestionsTab
              suggestedFAQs={suggestedFAQs}
              adminStats={adminStats}
              loading={loading}
              isApproving={loading.approve}
              isRejecting={loading.reject}
              onEditFAQ={handleEditFAQ}
              onApproveSuggestion={handleApproveSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab faqs={faqs} categories={categories} adminStats={adminStats} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}

      {/* Create FAQ Dialog */}
      <CreateFAQDialog
        open={dialogStates.showCreateFAQDialog}
        onOpenChange={(open) => !open && closeDialog('showCreateFAQDialog')}
        categories={categories}
        formData={faqForm}
        setFormData={setFAQForm}
        isLoading={loading.create}
        onSubmit={handleCreateFAQ}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Edit FAQ Dialog */}
      <EditFAQDialog
        open={dialogStates.showEditFAQDialog}
        onOpenChange={(open) => !open && closeDialog('showEditFAQDialog')}
        categories={categories}
        formData={faqForm}
        setFormData={setFAQForm}
        isLoading={loading.update}
        onSubmit={handleUpdateFAQ}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* FIXED: Delete FAQ Dialog with proper HTML structure */}
      <AlertDialog
        open={dialogStates.showDeleteFAQDialog}
        onOpenChange={(open) => !open && closeDialog('showDeleteFAQDialog')}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to delete this FAQ? This action cannot be undone.</p>
                {selectedFAQ && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <p>
                      <strong>Question:</strong> {selectedFAQ.question}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFAQ}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading.delete}
            >
              {loading.delete ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete FAQ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={dialogStates.showCreateCategoryDialog}
        onOpenChange={(open) => !open && closeDialog('showCreateCategoryDialog')}
        formData={categoryForm}
        setFormData={setCategoryForm}
        isLoading={loading.create}
        onSubmit={handleCreateCategory}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={dialogStates.showEditCategoryDialog}
        onOpenChange={(open) => !open && closeDialog('showEditCategoryDialog')}
        formData={categoryForm}
        setFormData={setCategoryForm}
        isLoading={loading.update}
        onSubmit={handleUpdateCategory}
      />

      {/* FIXED: Delete Category Dialog with proper HTML structure */}
      <AlertDialog
        open={dialogStates.showDeleteCategoryDialog}
        onOpenChange={(open) => !open && closeDialog('showDeleteCategoryDialog')}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to delete this category? This action cannot be undone.</p>
                {selectedCategory && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border">
                    <p>
                      <strong>Category:</strong> {selectedCategory.name}
                    </p>
                    <p>
                      <strong>FAQs in category:</strong> {selectedCategory.faqs_count || 0}
                    </p>
                    {(selectedCategory.faqs_count || 0) > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-amber-800">
                          <strong>Warning:</strong> This category contains FAQs. Please move them
                          first.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading.delete || (selectedCategory?.faqs_count || 0) > 0}
            >
              {loading.delete ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
