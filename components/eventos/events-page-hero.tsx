'use client'

import { useState } from 'react'
import { Search, CalendarDays, MapPin, Ticket } from 'lucide-react'

interface EventsPageHeroProps {
  totalEvents?: number
  totalCities?: number
  totalModalities?: number
  onSearch?: (query: string) => void
}

export function EventsPageHero({ totalEvents, totalCities, totalModalities, onSearch }: EventsPageHeroProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      // Default behavior: update URL search params
      const params = new URLSearchParams(window.location.search)
      if (searchQuery) {
        params.set('q', searchQuery)
      } else {
        params.delete('q')
      }
      window.location.href = `/eventos?${params.toString()}`
    }
  }

  return (
    <section className="pt-20 pb-12 border-t border-white/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-4xl font-semibold tracking-tight font-geist text-white">
            Encontre seus próximos eventos
          </h1>
          <p className="text-lg sm:text-xl font-geist mt-4 text-white/90">
            Competições, workshops e encontros da comunidade. Busque por cidade, data ou categoria.
          </p>

          <form role="search" className="mt-6" onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor="search-events" className="sr-only">
                  Buscar eventos
                </label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="search-events"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cidade, evento ou categoria..."
                  className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-white font-semibold font-geist transition-all hover:opacity-90"
                style={{ backgroundImage: 'linear-gradient(to right, rgb(138, 55, 10), rgb(82, 32, 3))' }}
              >
                Buscar
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-6 mt-8 pt-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-white/90" />
              <span className="text-sm font-geist text-white/90">
                {totalEvents ? `${totalEvents} eventos ativos` : '0 eventos ativos'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white/90" />
              <span className="text-sm font-geist text-white/90">
                {totalCities ? `${totalCities} cidades` : '0 cidades'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-white/90" />
              <span className="text-sm font-geist text-white/90">
                {totalModalities ? `${totalModalities} modalidades` : '0 modalidades'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
