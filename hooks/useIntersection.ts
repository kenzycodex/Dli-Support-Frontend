// hooks/useIntersection.ts - Intersection Observer Hook for Infinite Scroll

import { useEffect, useState } from 'react'

interface UseIntersectionOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

export function useIntersection(
  elementRef: React.RefObject<Element | null>,
  options: UseIntersectionOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        root: options.root || null,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options.root, options.rootMargin, options.threshold])

  return isIntersecting
}