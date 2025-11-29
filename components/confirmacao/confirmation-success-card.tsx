'use client'

import { Check } from 'lucide-react'
import { ScrollAnimationWrapper } from '@/components/home/scroll-animation-wrapper'

export function ConfirmationSuccessCard() {
  return (
    <ScrollAnimationWrapper>
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white/90 p-8 text-center shadow-lg shadow-emerald-100"
        data-animate
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
          <Check className="h-12 w-12" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-geist text-3xl font-semibold text-slate-900">Inscrição confirmada!</h2>
          <p className="mt-2 text-base text-slate-500">Você receberá um e-mail com o comprovante e QR Code.</p>
        </div>
      </div>
    </ScrollAnimationWrapper>
  )
}
