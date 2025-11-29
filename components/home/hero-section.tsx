'use client'

import type { CSSProperties } from 'react'
import { SearchBar } from '@/components/molecules/search-bar'
import { Trophy, Users, MapPin } from 'lucide-react'
import type { EventStats } from '@/types'

interface HeroSectionProps {
  eventStats: EventStats
  activeSportTypes?: string[]
}

export function HeroSection({ eventStats, activeSportTypes = [] }: HeroSectionProps) {
  // Map sport type slugs to display labels
  const sportTypeLabels: Record<string, string> = {
    corrida: 'Corrida',
    ciclismo: 'Ciclismo',
    triatlo: 'Triathlon',
    natacao: 'Natação',
    caminhada: 'Caminhada',
    crossfit: 'CrossFit',
    beach_sports: 'Beach Sports',
    trail_running: 'Trail',
    beach_tenis: 'Beach Tennis',
    futevolei: 'Futevôlei',
    volei_praia: 'Vôlei de Praia',
    stand_up_paddle: 'Stand Up Paddle',
    outro: 'Outro',
  }

  // Convert active sport types to display labels
  const popularTags = activeSportTypes
    .map(slug => sportTypeLabels[slug] || slug)
    .slice(0, 4) // Limit to 4 tags

  const stats = [
    { icon: Trophy, label: 'Eventos ativos', value: eventStats.totalEvents.toString() },
    { icon: Users, label: 'Participantes', value: eventStats.totalParticipants.toLocaleString('pt-BR') },
    { icon: MapPin, label: 'Cidades', value: eventStats.totalCities.toString() },
  ]

  const handleSearch = (query: string) => {
    window.location.href = `/eventos?q=${encodeURIComponent(query)}`
  }

  const handleTagClick = (tag: string) => {
    window.location.href = `/eventos?tag=${encodeURIComponent(tag)}`
  }

  const backgroundAnimationStyles = {
    animation: 'scrollBlur linear both',
    animationTimeline: 'view()',
    animationRange: 'entry 100% entry 200%',
  } as CSSProperties

  return (
    <section className="relative min-h-[700px] md:min-h-[100vh] flex items-center justify-center overflow-hidden border-b border-white/10">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-[url('/assets/hero-image.jpeg')] bg-cover bg-center"
          style={backgroundAnimationStyles}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div data-animate style={{ animation: 'fadeInUp 1.0s ease-out 0.2s both' }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white mb-4 leading-tight">
              encontre seu próximo desafio
            </h1>
            <p className="text-lg sm:text-xl text-white/85 leading-relaxed">
              Descubra e participe dos melhores eventos esportivos próximo de você.            </p>
          </div>

          <div data-animate style={{ animation: 'fadeInUp 1.0s ease-out 0.4s both' }}>
            <SearchBar
              variant="hero"
              placeholder="Ex.: São Paulo, corrida 10k, amanhã"
              onSearch={handleSearch}
              suggestions={popularTags}
              onSuggestionClick={handleTagClick}
              className="max-w-3xl"
              activeEventsCount={eventStats.totalEvents}
            />
          </div>

          <div className="border-t border-white/20 pt-6" data-animate style={{ animation: 'fadeInUp 1.0s ease-out 0.7s both' }}>
            <p className="text-sm text-white/80">
              Encontre corridas de rua, futebol, beach tennis e muito mais — perto de você.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
