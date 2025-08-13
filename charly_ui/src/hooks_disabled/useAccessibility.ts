// Apple-Standard Accessibility Hook
import { useEffect, useRef } from 'react'

interface UseAccessibilityOptions {
  trapFocus?: boolean
  announceOnMount?: string
  announceOnUnmount?: string
  returnFocusOnCleanup?: boolean
}

export function useAccessibility({
  trapFocus = false,
  announceOnMount,
  announceOnUnmount,
  returnFocusOnCleanup = true
}: UseAccessibilityOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  // Create live region for announcements
  useEffect(() => {
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.id = 'accessibility-announcements'
    document.body.appendChild(liveRegion)
    liveRegionRef.current = liveRegion

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  // Announce messages to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
      
      // Clear after announcement to allow for repeat announcements
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  // Focus management
  useEffect(() => {
    if (returnFocusOnCleanup) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    if (announceOnMount) {
      announce(announceOnMount)
    }

    return () => {
      if (announceOnUnmount) {
        announce(announceOnUnmount)
      }

      if (returnFocusOnCleanup && previousFocusRef.current) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          previousFocusRef.current?.focus()
        }, 100)
      }
    }
  }, [announceOnMount, announceOnUnmount, returnFocusOnCleanup])

  // Focus trap implementation
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus the first element when component mounts
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [trapFocus])

  // Get focusable elements within container
  const getFocusableElements = () => {
    if (!containerRef.current) return []
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]
  }

  // Focus first element
  const focusFirst = () => {
    const elements = getFocusableElements()
    elements[0]?.focus()
  }

  // Focus last element
  const focusLast = () => {
    const elements = getFocusableElements()
    elements[elements.length - 1]?.focus()
  }

  // Move focus to next element
  const focusNext = () => {
    const elements = getFocusableElements()
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement)
    const nextIndex = (currentIndex + 1) % elements.length
    elements[nextIndex]?.focus()
  }

  // Move focus to previous element
  const focusPrevious = () => {
    const elements = getFocusableElements()
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement)
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1
    elements[prevIndex]?.focus()
  }

  return {
    containerRef,
    announce,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  }
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void,
  onSpace?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.()
          break
        case 'Enter':
          onEnter?.()
          break
        case ' ':
          if (onSpace) {
            e.preventDefault()
            onSpace()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, onEnter, onSpace])
}

// Reduced motion detection
export function usePrefersReducedMotion() {
  const mediaQuery = useRef<MediaQueryList | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      mediaQuery.current = window.matchMedia('(prefers-reduced-motion: reduce)')
    }
  }, [])

  return mediaQuery.current?.matches ?? false
}

// High contrast detection
export function usePrefersHighContrast() {
  const mediaQuery = useRef<MediaQueryList | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      mediaQuery.current = window.matchMedia('(prefers-contrast: high)')
    }
  }, [])

  return mediaQuery.current?.matches ?? false
}