// components/admin-help/shared/FAQTable.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  MessageSquare,
  Plus,
  Target,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { HelpFAQ } from "@/stores/help-store"

interface FAQTableProps {
  faqs: HelpFAQ[]
  isLoading: boolean
  hasActiveFilters: boolean
  searchTerm: string
  loadingStates: {
    update: boolean
    delete: boolean
  }
  onEditFAQ: (faq: HelpFAQ) => void
  onDeleteFAQ: (faq: HelpFAQ) => void
  onTogglePublish: (faq: HelpFAQ) => void
  onToggleFeature: (faq: HelpFAQ) => void
  onCreateFAQ: () => void
  onClearFilters: () => void
}

export function FAQTable({
  faqs,
  isLoading,
  hasActiveFilters,
  searchTerm,
  loadingStates,
  onEditFAQ,
  onDeleteFAQ,
  onTogglePublish,
  onToggleFeature,
  onCreateFAQ,
  onClearFilters
}: FAQTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
        <p className="text-gray-600 mb-4">
          {hasActiveFilters || searchTerm 
            ? 'Try adjusting your search or filters' 
            : 'Get started by creating your first FAQ'
          }
        </p>
        <div className="flex justify-center space-x-2">
          {(hasActiveFilters || searchTerm) && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
          <Button onClick={onCreateFAQ}>
            <Plus className="h-4 w-4 mr-2" />
            Create FAQ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Question</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faqs.map((faq: HelpFAQ) => (
            <TableRow key={faq.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium line-clamp-1">{faq.question}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">
                    {faq.answer?.substring(0, 100)}...
                  </div>
                  {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {faq.tags.slice(0, 2).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {faq.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{faq.tags.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: faq.category?.color || '#gray' }}
                  />
                  <span className="text-sm">{faq.category?.name || 'Unknown'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={faq.is_published ? "default" : "secondary"}
                      className={cn(
                        faq.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {faq.is_published ? "Published" : "Draft"}
                    </Badge>
                    {faq.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {!faq.is_published && faq.created_by && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Suggested
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>
                      {Math.round((faq.helpful_count / Math.max(faq.helpful_count + faq.not_helpful_count, 1)) * 100) || 0}% helpful
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">
                  {new Date(faq.updated_at).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEditFAQ(faq)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onTogglePublish(faq)}
                      disabled={loadingStates.update}
                    >
                      {faq.is_published ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onToggleFeature(faq)}
                      disabled={loadingStates.update}
                    >
                      {faq.is_featured ? (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Feature
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteFAQ(faq)}
                      className="text-red-600"
                      disabled={loadingStates.delete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}