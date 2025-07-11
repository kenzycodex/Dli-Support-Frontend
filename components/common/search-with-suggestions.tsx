// components/common/search-with-suggestions.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchSuggestion {
  text: string
  type: 'recent' | 'popular' | 'suggestion'
  count?: number
}

interface SearchWithSuggestionsProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  recentSearches?: string[]
  popularSearches?: string[]
  suggestions?: string[]
  isLoading?: boolean
  showRecentSearches?: boolean
  showPopularSearches?: boolean
  showSuggestions?: boolean
  maxSuggestions?: number
  onRecentSearchRemove?: (search: string) => void
  onClearRecentSearches?: () => void
}

export function SearchWithSuggestions({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className,
  recentSearches = [],
  popularSearches = [],
  suggestions = [],
  isLoading = false,
  showRecentSearches = true,
  showPopularSearches = true,
  showSuggestions = true,
  maxSuggestions = 8,
  onRecentSearchRemove,
  onClearRecentSearches
}: SearchWithSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const debouncedValue = useDebounce(value, 300)

  // Build combined suggestions list
  const allSuggestions: SearchSuggestion[] = React.useMemo(() => {
    const items: SearchSuggestion[] = []
    
    // Add recent searches first (filtered by current input)
    if (showRecentSearches && recentSearches.length > 0) {
      const filteredRecent = value.trim() 
        ? recentSearches.filter(search => 
            search.toLowerCase().includes(value.toLowerCase()) && 
            search.toLowerCase() !== value.toLowerCase()
          )
        : recentSearches
      
      filteredRecent.slice(0, 5).forEach(search => {
        items.push({ text: search, type: 'recent' })
      })
    }
    
    // Add popular searches (filtered by current input)
    if (showPopularSearches && popularSearches.length > 0) {
      const filteredPopular = value.trim()
        ? popularSearches.filter(search => 
            search.toLowerCase().includes(value.toLowerCase()) && 
            search.toLowerCase() !== value.toLowerCase() &&
            !items.some(item => item.text.toLowerCase() === search.toLowerCase())
          )
        : popularSearches.filter(search => 
            !items.some(item => item.text.toLowerCase() === search.toLowerCase())
          )
      
      filteredPopular.slice(0, 3).forEach(search => {
        items.push({ text: search, type: 'popular' })
      })
    }
    
    // Add dynamic suggestions (filtered by current input)
    if (showSuggestions && suggestions.length > 0 && value.trim()) {
      const filteredSuggestions = suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase()) && 
        suggestion.toLowerCase() !== value.toLowerCase() &&
        !items.some(item => item.text.toLowerCase() === suggestion.toLowerCase())
      )
      
      filteredSuggestions.slice(0, 5).forEach(suggestion => {
        items.push({ text: suggestion, type: 'suggestion' })
      })
    }
    
    return items.slice(0, maxSuggestions)
  }, [value, recentSearches, popularSearches, suggestions, showRecentSearches, showPopularSearches, showSuggestions, maxSuggestions])

  // Handle search submission
  const handleSearch = useCallback((query: string = value) => {
    if (query.trim()) {
      onSearch(query.trim())
      setIsOpen(false)
      setHighlightedIndex(-1)
      inputRef.current?.blur()
    }
  }, [value, onSearch])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onChange(suggestion.text)
    handleSearch(suggestion.text)
  }, [onChange, handleSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        )
        e.preventDefault()
        break
        
      case 'ArrowUp':
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        e.preventDefault()
        break
        
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && allSuggestions[highlightedIndex]) {
          handleSuggestionClick(allSuggestions[highlightedIndex])
        } else {
          handleSearch()
        }
        break
        
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, highlightedIndex, allSuggestions, handleSuggestionClick, handleSearch])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      case 'suggestion':
        return <Search className="h-4 w-4 text-blue-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getSuggestionBadge = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Badge variant="secondary" className="text-xs">Recent</Badge>
      case 'popular':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Popular</Badge>
      case 'suggestion':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Suggested</Badge>
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-12 h-12 text-lg border-2 transition-colors",
            isOpen ? "border-blue-500" : "border-gray-200 focus:border-blue-500"
          )}
        />
        
        {/* Loading/Clear Button */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          {value && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('')
                inputRef.current?.focus()
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch()}
            className="h-8 w-8 p-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-2 border-gray-200 shadow-lg">
          <CardContent className="p-0">
            {allSuggestions.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {allSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.text}`}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0",
                      index === highlightedIndex 
                        ? "bg-blue-50 text-blue-900" 
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="font-medium truncate">{suggestion.text}</span>
                      {getSuggestionBadge(suggestion.type)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {suggestion.type === 'recent' && onRecentSearchRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRecentSearchRemove(suggestion.text)
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {/* Clear Recent Searches */}
                {showRecentSearches && recentSearches.length > 0 && onClearRecentSearches && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearRecentSearches}
                      className="w-full text-gray-600 hover:text-red-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear recent searches
                    </Button>
                  </div>
                )}
              </div>
            ) : value.trim() ? (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No suggestions found</p>
                <p className="text-sm">Press Enter to search for "{value}"</p>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Start typing to see suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}