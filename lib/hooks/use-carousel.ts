'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseCarouselOptions {
  itemCount: number
  slidesToShow?: {
    mobile: number
    tablet: number
    desktop: number
  }
  autoPlay?: boolean
  autoPlayInterval?: number
}

/**
 * Custom hook for carousel functionality with scroll-snap
 * Provides navigation, touch/swipe support, and responsive behavior
 */
export function useCarousel(options: UseCarouselOptions) {
  const {
    itemCount,
    slidesToShow = { mobile: 1, tablet: 2, desktop: 3 },
    autoPlay = false,
    autoPlayInterval = 5000,
  } = options

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Get current slides to show based on viewport
  const getSlidesToShow = useCallback(() => {
    if (typeof window === 'undefined') return slidesToShow.desktop

    const width = window.innerWidth
    if (width < 768) return slidesToShow.mobile
    if (width < 1024) return slidesToShow.tablet
    return slidesToShow.desktop
  }, [slidesToShow])

  // Calculate max index based on current viewport
  const getMaxIndex = useCallback(() => {
    const slides = getSlidesToShow()
    return Math.max(0, itemCount - slides)
  }, [itemCount, getSlidesToShow])

  // Update scroll buttons state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const maxScroll = container.scrollWidth - container.clientWidth

    setCanScrollPrev(scrollLeft > 10)
    setCanScrollNext(scrollLeft < maxScroll - 10)

    // Calculate current index based on scroll position
    const itemWidth = container.scrollWidth / itemCount
    const newIndex = Math.round(scrollLeft / itemWidth)
    setCurrentIndex(newIndex)
  }, [itemCount])

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current
      if (!container) return

      const maxIndex = getMaxIndex()
      const targetIndex = Math.max(0, Math.min(index, maxIndex))

      const itemWidth = container.scrollWidth / itemCount
      const scrollPosition = targetIndex * itemWidth

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      })

      setCurrentIndex(targetIndex)
    },
    [itemCount, getMaxIndex]
  )

  // Navigation functions
  const scrollNext = useCallback(() => {
    const slides = getSlidesToShow()
    scrollToIndex(currentIndex + slides)
  }, [currentIndex, scrollToIndex, getSlidesToShow])

  const scrollPrev = useCallback(() => {
    const slides = getSlidesToShow()
    scrollToIndex(currentIndex - slides)
  }, [currentIndex, scrollToIndex, getSlidesToShow])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return

    const startAutoPlay = () => {
      autoPlayTimerRef.current = setInterval(() => {
        const maxIndex = getMaxIndex()
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next > maxIndex) {
            scrollToIndex(0)
            return 0
          }
          scrollToIndex(next)
          return next
        })
      }, autoPlayInterval)
    }

    startAutoPlay()

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, autoPlayInterval, getMaxIndex, scrollToIndex])

  // Pause auto-play on user interaction
  const pauseAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
  }, [])

  // Listen to scroll events
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        updateScrollState()
      }, 100)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    updateScrollState()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [updateScrollState])

  // Update on resize
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      updateScrollState()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateScrollState])

  return {
    scrollContainerRef,
    currentIndex,
    canScrollPrev,
    canScrollNext,
    scrollNext,
    scrollPrev,
    scrollToIndex,
    pauseAutoPlay,
    maxIndex: getMaxIndex(),
  }
}
