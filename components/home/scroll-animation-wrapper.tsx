'use client'

import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation'

interface ScrollAnimationWrapperProps {
  children: React.ReactNode
}

/**
 * Client component wrapper that initializes scroll animations
 * Uses the useScrollAnimation hook to observe elements with data-animate attributes
 * and adds the 'animate' class when they enter the viewport
 */
export function ScrollAnimationWrapper({ children }: ScrollAnimationWrapperProps) {
  const containerRef = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    once: true,
  })

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}
