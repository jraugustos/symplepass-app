'use client'

import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const defaultOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px',
      ...options
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsIntersecting(entry.isIntersecting)

        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      })
    }, defaultOptions)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options, hasIntersected])

  return { ref, isIntersecting, hasIntersected }
}
