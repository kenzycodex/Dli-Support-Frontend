// components/common/search-with-suggestions.tsx (FIXED - No focus loss, proper typing)
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  Clock,
  TrendingUp,
  X,
  Loader2,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchWithSuggestionsProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  recentSearches?: string[]
  popularSearches?: string[]
  onRecentSearchRemove?: (search: string) => void
  onClearRecentSearches?: () => void
  isLoading?: boolean
  className?: string
  showSuggestions?: boolean
  maxSuggestions?: number
}

export function SearchWithSuggestions({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  recentSearches = [],
  popularSearches = [],
  onRecentSearchRemove,
  onClearRecentSearches,
  isLoading = false,
  className,
  showSuggestions = true,
  maxSuggestions = 5
}: SearchWithSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [debouncedValue, setDebouncedValue] = useState(value)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedValue && debouncedValue.length >= 2) {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, onSearch])

  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue)
    if (newValue.length >= 1 && showSuggestions) {
      setIsOpen(true)
    } else if (newValue.length === 0) {
      setIsOpen(false)
    }
  }, [onChange, showSuggestions])

  const handleSearchSubmit = useCallback((searchQuery?: string) => {
    const query = searchQuery || value
    if (query.trim()) {
      onSearch(query.trim())
      setIsOpen(false)
    }
  }, [value, onSearch])

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    onChange(suggestion)
    handleSearchSubmit(suggestion)
  }, [onChange, handleSearchSubmit])

  const handleRecentSearchRemove = useCallback((e: React.MouseEvent, search: string) => {
    e.stopPropagation()
    e.preventDefault()
    onRecentSearchRemove?.(search)
  }, [onRecentSearchRemove])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchSubmit()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }, [handleSearchSubmit])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if ((value.length >= 1 || recentSearches.length > 0 || popularSearches.length > 0) && showSuggestions) {
      setIsOpen(true)
    }
  }, [value, showSuggestions, recentSearches.length, popularSearches.length])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if focus is moving to the popover
    if (popoverRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    
    setIsFocused(false)
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      if (!popoverRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
      }
    }, 150)
  }, [])

  const clearSearch = useCallback(() => {
    onChange('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange])

  // Filter and limit suggestions
  const filteredRecentSearches = recentSearches
    .filter(search => 
      search.toLowerCase().includes(value.toLowerCase()) ||
      value.length === 0
    )
    .slice(0, maxSuggestions)

  const filteredPopularSearches = popularSearches
    .filter(search => 
      search.toLowerCase().includes(value.toLowerCase()) &&
      !recentSearches.includes(search)
    )
    .slice(0, maxSuggestions)

  const hasAnySuggestions = filteredRecentSearches.length > 0 || filteredPopularSearches.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen && showSuggestions} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={cn(
                "pl-10 pr-20 h-12 text-base transition-all duration-200",
                isFocused && "ring-2 ring-blue-500 border-blue-500",
                className
              )}
              autoComplete="off"
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                type="button"
                size="sm"
                onClick={() => handleSearchSubmit()}
                disabled={!value.trim() || isLoading}
                className="h-8 transition-colors"
                tabIndex={-1}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 border-0 shadow-lg"
          align="start"
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Don't close on input interaction
            if (inputRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Card className="border shadow-lg" ref={popoverRef}>
            <CardContent className="p-0">
              <Command className="rounded-lg border-0">
                <CommandList className="max-h-80 overflow-y-auto">
                  {/* Recent Searches */}
                  {filteredRecentSearches.length > 0 && (
                    <CommandGroup>
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <div className="flex items-center space-x-2 text-xs font-medium text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Recent searches</span>
                        </div>
                        {recentSearches.length > 0 && onClearRecentSearches && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              onClearRecentSearches()
                            }}
                            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                            tabIndex={-1}
                          >
                            Clear all
                          </Button>
                        )}
                      </div>
                      
                      {filteredRecentSearches.map((search, index) => (
                        <CommandItem
                          key={`recent-${index}`}
                          onSelect={() => handleSuggestionSelect(search)}
                          className="flex items-center justify-between group cursor-pointer px-2 py-2"
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{search}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onRecentSearchRemove && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleRecentSearchRemove(e, search)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                tabIndex={-1}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Popular Searches */}
                  {filteredPopularSearches.length > 0 && (
                    <CommandGroup>
                      <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>Popular searches</span>
                      </div>
                      
                      {filteredPopularSearches.map((search, index) => (
                        <CommandItem
                          key={`popular-${index}`}
                          onSelect={() => handleSuggestionSelect(search)}
                          className="flex items-center justify-between group cursor-pointer px-2 py-2"
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <TrendingUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{search}</span>
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* No suggestions message */}
                  {!hasAnySuggestions && value.length > 0 && (
                    <CommandEmpty className="py-6 text-center text-sm">
                      <div className="space-y-2">
                        <Search className="h-8 w-8 mx-auto text-gray-300" />
                        <div>
                          <div className="font-medium text-gray-700">No suggestions found</div>
                          <div className="text-gray-500">Try a different search term</div>
                        </div>
                      </div>
                    </CommandEmpty>
                  )}

                  {/* Search prompt when no input */}
                  {!hasAnySuggestions && value.length === 0 && (recentSearches.length > 0 || popularSearches.length > 0) && (
                    <div className="py-6 text-center text-sm text-gray-500">
                      <div className="space-y-2">
                        <Search className="h-8 w-8 mx-auto text-gray-300" />
                        <div>Start typing to see suggestions</div>
                      </div>
                    </div>
                  )}

                  {/* Quick search tips */}
                  {value.length === 0 && recentSearches.length === 0 && popularSearches.length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-500">
                      <div className="space-y-3">
                        <Search className="h-8 w-8 mx-auto text-gray-300" />
                        <div>
                          <div className="font-medium text-gray-700">Search Tips</div>
                          <div className="space-y-1 mt-2">
                            <div>• Try specific keywords</div>
                            <div>• Use common terms</div>
                            <div>• Check spelling</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current search action */}
                  {value.trim() && (
                    <CommandGroup>
                      <div className="border-t border-gray-100">
                        <CommandItem
                          onSelect={() => handleSearchSubmit()}
                          className="flex items-center space-x-2 font-medium text-blue-600 cursor-pointer px-2 py-3"
                        >
                          <Search className="h-4 w-4" />
                          <span className="flex-1">Search for "{value.trim()}"</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Enter
                          </Badge>
                        </CommandItem>
                      </div>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Search shortcuts/hints */}
      {isFocused && !isOpen && value.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border rounded">⌘</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border rounded">K</kbd>
                    <span>to focus search</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border rounded">↵</kbd>
                    <span>to search</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border rounded">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Keyboard shortcut hook for global search
export function useSearchShortcut(onFocus: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onFocus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onFocus])
}

// Search history management utilities
export class SearchHistory {
  private static readonly STORAGE_KEY = 'search_history'
  private static readonly MAX_HISTORY = 10

  static addSearch(query: string, userId?: string): void {
    if (!query.trim()) return

    const key = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY
    
    try {
      const history = this.getHistory(userId)
      const filtered = history.filter(item => item.toLowerCase() !== query.toLowerCase())
      const newHistory = [query, ...filtered].slice(0, this.MAX_HISTORY)
      
      localStorage.setItem(key, JSON.stringify(newHistory))
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }

  static getHistory(userId?: string): string[] {
    const key = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY
    
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load search history:', error)
      return []
    }
  }

  static removeSearch(query: string, userId?: string): void {
    const key = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY
    
    try {
      const history = this.getHistory(userId)
      const filtered = history.filter(item => item !== query)
      localStorage.setItem(key, JSON.stringify(filtered))
    } catch (error) {
      console.warn('Failed to remove search history:', error)
    }
  }

  static clearHistory(userId?: string): void {
    const key = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }
}