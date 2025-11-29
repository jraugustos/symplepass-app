'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  selector?: string
  once?: boolean
}

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver
 * Observes elements with data-animate attribute and adds 'animate' class when they enter viewport
 *
 * @param options - Configuration options
 * @param options.threshold - Percentage of element visibility to trigger animation (default: 0.1)
 * @param options.rootMargin - Margin around root element (default: '0px')
 * @param options.selector - Custom selector for elements to observe (default: '[data-animate]')
 * @param options.once - Whether to animate only once (default: true)
 * @returns Ref callback to attach to container element
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    selector = '[data-animate]',
    once = true,
  } = options

  const observerRef = useRef<IntersectionObserver | null>(null)

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      // Check if IntersectionObserver is available (SSR safety)
      if (!node || typeof window === 'undefined' || !window.IntersectionObserver) {
        return
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Add animate class when element enters viewport
              entry.target.classList.add('animate')

              // Unobserve if once option is true
              if (once && observerRef.current) {
                observerRef.current.unobserve(entry.target)
              }
            } else if (!once) {
              // Remove animate class when element leaves viewport (if not once)
              entry.target.classList.remove('animate')
            }
          })
        },
        {
          threshold,
          rootMargin,
        }
      )

      // Observe all matching elements
      const elements = node.querySelectorAll(selector)
      elements.forEach((element) => {
        // Add animate-on-scroll class to pause animations initially
        element.classList.add('animate-on-scroll')
        observerRef.current?.observe(element)
      })
    },
    [threshold, rootMargin, selector, once]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return containerRef
}
