'use client'

import { useState, useEffect, useCallback, useRef, RefObject } from 'react'

interface UseStickyTabsOptions {
  headerOffset?: number
  tabsOffset?: number
  /** Optional ref to tabs container for precise sticky detection based on viewport position */
  tabsRef?: RefObject<HTMLElement>
}

export interface UseStickyTabsReturn {
  activeTab: string
  isSticky: boolean
  scrollToSection: (sectionId: string) => void
  setActiveTab: (id: string) => void
}

export function useStickyTabs(
  sectionIds: string[],
  options: UseStickyTabsOptions = {}
): UseStickyTabsReturn {
  const { headerOffset = 80, tabsOffset = 60, tabsRef } = options

  const [activeTab, setActiveTab] = useState<string>(sectionIds[0] || '')
  const [isSticky, setIsSticky] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (!element) return

    const offsetTotal = headerOffset + tabsOffset
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - offsetTotal

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })

    setActiveTab(sectionId)
  }, [headerOffset, tabsOffset])

  // Set up IntersectionObserver for scroll spy
  useEffect(() => {
    const observerOptions = {
      rootMargin: `-${headerOffset + tabsOffset + 20}px 0px -40% 0px`,
      threshold: 0.01
    }

    observerRef.current = new IntersectionObserver((entries) => {
      // Find the topmost visible section
      const visibleSections = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top
        })

      if (visibleSections.length > 0) {
        const topSection = visibleSections[0]
        setActiveTab(topSection.target.id)
      }
    }, observerOptions)

    // Observe all sections
    sectionIds.forEach(id => {
      const element = document.getElementById(id)
      if (element && observerRef.current) {
        observerRef.current.observe(element)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sectionIds, headerOffset, tabsOffset])

  // Set up scroll listener for sticky tabs
  useEffect(() => {
    let rafId: number | null = null
    let initialTabsPosition: number | null = null

    const handleScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        // Use tabsRef for precise detection if available
        if (tabsRef?.current) {
          const rect = tabsRef.current.getBoundingClientRect()

          // Store initial position on first run
          if (initialTabsPosition === null && window.scrollY === 0) {
            initialTabsPosition = rect.top
          }

          // Check if tabs have scrolled to the top
          // If we're at the top of page and tabs are in their initial position, not sticky
          const shouldBeSticky = window.scrollY > 0 && rect.top <= 0
          setIsSticky(shouldBeSticky)
        } else {
          // Fallback: use first section position
          const firstSection = document.getElementById(sectionIds[0])
          if (!firstSection) return

          const firstSectionTop = firstSection.getBoundingClientRect().top
          const shouldBeSticky = firstSectionTop <= headerOffset

          setIsSticky(shouldBeSticky)
        }

        rafId = null
      })
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [sectionIds, headerOffset, tabsRef])

  return {
    activeTab,
    isSticky,
    scrollToSection,
    setActiveTab
  }
}
