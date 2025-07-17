// components/admin-help/tabs/FAQManagementTab.tsx
"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { SearchAndFilters } from "../shared/SearchAndFilters"
import { FAQTable } from "../shared/FAQTable"
import type { HelpFAQ } from "@/stores/help-store"
import type { HelpCategory } from "@/services/help.service"
import { FilterOptions } from "@/types/admin-help"

interface FAQManagementTabProps {
  faqs: HelpFAQ[]
  categories: HelpCategory[]
  filters: FilterOptions
  hasActiveFilters: boolean
  loading: {
    faqs: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  onSearchChange: (value: string) => void
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  onCreateFAQ: () => void
  onEditFAQ: (faq: HelpFAQ) => void
  onDeleteFAQ: (faq: HelpFAQ) => void
  onTogglePublish: (faq: HelpFAQ) => void
  onToggleFeature: (faq: HelpFAQ) => void
  setFilters: (filters: Partial<FilterOptions>, immediate?: boolean) => void
}

export function FAQManagementTab({
  faqs,
  categories,
  filters,
  hasActiveFilters,
  loading,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onCreateFAQ,
  onEditFAQ,
  onDeleteFAQ,
  onTogglePublish,
  onToggleFeature,
  setFilters
}: FAQManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    onSearchChange(value)
  }, [onSearchChange])

  // Apply client-side filtering for better UX
  const filteredFAQs = faqs.filter(faq => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'published':
          if (!faq.is_published) return false
          break
        case 'unpublished':
          if (faq.is_published) return false
          break
        case 'featured':
          if (!faq.is_featured) return false
          break
      }
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
      const category = categories.find(c => c.slug === filters.category)
      if (category && faq.category_id !== category.id) return false
    }
    
    return true
  })

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>FAQ Management</CardTitle>
            <CardDescription>Create, edit, and manage help articles</CardDescription>
          </div>
          <Button onClick={onCreateFAQ} disabled={loading.create}>
            {loading.create ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create FAQ
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <SearchAndFilters
          searchTerm={searchTerm}
          filters={filters}
          categories={categories}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={handleSearchChange}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />

        <FAQTable
          faqs={filteredFAQs}
          isLoading={loading.faqs}
          hasActiveFilters={hasActiveFilters}
          searchTerm={searchTerm}
          loadingStates={{
            update: loading.update,
            delete: loading.delete
          }}
          onEditFAQ={onEditFAQ}
          onDeleteFAQ={onDeleteFAQ}
          onTogglePublish={onTogglePublish}
          onToggleFeature={onToggleFeature}
          onCreateFAQ={onCreateFAQ}
          onClearFilters={onClearFilters}
        />
      </CardContent>
    </Card>
  )
}