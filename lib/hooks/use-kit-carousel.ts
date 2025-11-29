'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseKitCarouselOptions {
  autoPlay?: boolean
  interval?: number
}

export function useKitCarousel(itemCount: number, options: UseKitCarouselOptions = {}) {
  const { autoPlay = false, interval = 5000 } = options

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const userInteractedRef = useRef(false)

  const goToSlide = useCallback((index: number) => {
    if (itemCount === 0) return

    // Ensure index is within bounds
    const boundedIndex = ((index % itemCount) + itemCount) % itemCount

    setIsTransitioning(true)
    setCurrentIndex(boundedIndex)

    // Reset transitioning state after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)

    // Mark that user has interacted (pause auto-play)
    userInteractedRef.current = true
  }, [itemCount])

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1)
  }, [currentIndex, goToSlide])

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1)
  }, [currentIndex, goToSlide])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || userInteractedRef.current || itemCount === 0) {
      return
    }

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % itemCount)
    }, interval)

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, interval, itemCount])

  return {
    currentIndex,
    isTransitioning,
    goToSlide,
    goToNext,
    goToPrevious,
    canGoNext: true, // Carousel wraps
    canGoPrevious: true // Carousel wraps
  }
}
