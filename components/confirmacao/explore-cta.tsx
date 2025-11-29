'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollAnimationWrapper } from '@/components/home/scroll-animation-wrapper'

export function ExploreCTA() {
  const router = useRouter()

  return (
    <ScrollAnimationWrapper>
      <div className="mt-8 text-center" data-animate>
        <Button
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-6 text-base font-semibold text-white shadow-lg shadow-orange-200"
          onClick={() => router.push('/eventos')}
        >
          Explorar mais eventos
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="mt-3 text-xs text-slate-500">Obrigado por escolher a Symplepass!</p>
      </div>
    </ScrollAnimationWrapper>
  )
}
