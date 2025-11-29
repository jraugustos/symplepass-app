import { MapPin, Calendar, Clock, Activity, Monitor, CheckCircle2, Users } from 'lucide-react'
import { formatEventDate, formatTime, extractLocationString, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventAboutProps {
  event: Pick<Event, 'description' | 'location' | 'start_date' | 'sport_type' | 'event_format' | 'banner_url' | 'event_type' | 'solidarity_message' | 'allows_pair_registration'>
  minPrice: number | null
}

export default function EventAbout({ event, minPrice }: EventAboutProps) {
  const location = extractLocationString(event.location)
  const city = event.location?.city || ''
  const state = event.location?.state || ''
  const venue = event.location?.venue || ''
  const address = event.location?.address || ''
  const date = formatEventDate(event.start_date)
  const time = formatTime(event.start_date)

  const sportLabels: Record<string, string> = {
    corrida: 'Corrida',
    ciclismo: 'Ciclismo',
    triatlo: 'Triatlo',
    natacao: 'Natação',
    caminhada: 'Caminhada',
    crossfit: 'CrossFit',
    beach_sports: 'Esportes de Praia',
    trail_running: 'Trail Running',
    beach_tenis: 'Beach Tennis',
    futevolei: 'Futevôlei',
    volei_praia: 'Vôlei de Praia',
    stand_up_paddle: 'Stand Up Paddle',
    outro: 'Outro',
  }

  const eventFormatLabels: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    workshop: 'Workshop',
    hibrido: 'Híbrido',
  }

  return (
    <section id="sobre" className="pt-6 pb-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        {/* Event Image */}
        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-neutral-200 mb-6">
          <img
            src={event.banner_url || '/placeholder.jpg'}
            alt="Arte oficial de divulgação do evento"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Description + Info Cards + Buttons */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="text-neutral-700 leading-relaxed space-y-4 font-geist">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Info cards inline - 3 columns */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Local */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-neutral-600" />
                  <p className="font-medium tracking-tight font-geist">Local</p>
                </div>
                <p className="text-sm mt-1 text-neutral-600 font-geist">
                  {location || 'A definir'}
                </p>
              </div>

              {/* Data */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                  <p className="font-medium tracking-tight font-geist">Data</p>
                </div>
                <p className="text-sm mt-1 text-neutral-600 font-geist">{date}</p>
              </div>

              {/* Horário */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-neutral-600" />
                  <p className="font-medium tracking-tight font-geist">Horário</p>
                </div>
                <p className="text-sm mt-1 text-neutral-600 font-geist">{time}</p>
              </div>
            </div>

            {/* Grid 2 columns - Modalidade and Tipo */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Modalidade */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500 font-geist">Modalidade</p>
                <p className="font-medium mt-0.5 font-geist">
                  {sportLabels[event.sport_type] || event.sport_type}
                </p>
              </div>

              {/* Tipo */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-sm text-neutral-500 font-geist">Tipo</p>
                <p className="font-medium mt-0.5 font-geist">
                  {event.event_format && eventFormatLabels[event.event_format]
                    ? eventFormatLabels[event.event_format]
                    : event.event_format || 'A definir'}
                </p>
              </div>
            </div>

            {/* Tipo de Inscrição - Sempre exibir */}
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-neutral-600" />
                  <p className="text-sm text-neutral-500 font-geist">Tipo de Inscrição</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="info" size="sm">Individual</Badge>
                  {event.allows_pair_registration && (
                    <Badge variant="info" size="sm">Dupla</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons - Ver no mapa, Largada inicial */}
            <div className="mt-4 flex flex-wrap gap-2">
              {((venue && city) || (address && city)) && (
                <button
                  onClick={() => {
                    const query = encodeURIComponent(`${city}, ${state}`)
                    window.open(`https://maps.google.com/?q=${query}`, '_blank')
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-geist"
                >
                  <MapPin className="h-4 w-4" />
                  Ver no mapa
                </button>
              )}
            </div>
          </div>

          {/* Right column: Price card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              {/* Price info */}
              <p className="text-sm text-neutral-500 font-geist">Inscrições a partir de</p>
              <p className="text-3xl font-bold mt-1 font-geist">
                {event.event_type === 'free'
                  ? 'Evento Gratuito'
                  : event.event_type === 'solidarity'
                  ? event.solidarity_message || 'Evento Solidário'
                  : minPrice !== null
                  ? formatCurrency(minPrice)
                  : 'Consulte valores'}
              </p>

              {/* CTA Button */}
              <a
                href="#categorias"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-medium rounded-full px-4 py-2.5 text-white hover:opacity-95 font-geist"
                style={{ backgroundImage: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))' }}
              >
                Selecionar categoria
              </a>

              {/* Features list */}
              <ul className="mt-5 space-y-2">
                {event.event_type === 'paid' && (
                  <li className="flex items-start gap-2 text-sm text-neutral-600 font-geist">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    Pagamento seguro
                  </li>
                )}
                <li className="flex items-start gap-2 text-sm text-neutral-600 font-geist">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  Evento verificado
                </li>
                <li className="flex items-start gap-2 text-sm text-neutral-600 font-geist">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  Confirmação imediata
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
