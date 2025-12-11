'use client'

import { Camera, Images, Calendar } from 'lucide-react'
import type { MuralFotosStats } from '@/types'

interface MuralHeroProps {
  stats: MuralFotosStats
}

export function MuralHero({ stats }: MuralHeroProps) {
  return (
    <section
      className="relative text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FF7A00 0%, #FFB347 100%)' }}
    >
      <div className="absolute inset-0 bg-[url('/assets/hero-pattern.svg')] opacity-10" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Camera className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Galeria de Fotos</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-geist mb-4 tracking-tight">
            Mural de Fotos
          </h1>

          {/* Description */}
          <p className="text-white/90 font-inter text-lg md:text-xl leading-relaxed mb-8">
            Reviva os melhores momentos dos eventos. Encontre e adquira suas fotos favoritas em alta qualidade.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {stats.totalEvents} {stats.totalEvents === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Images className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {stats.totalPhotos.toLocaleString('pt-BR')} fotos
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
