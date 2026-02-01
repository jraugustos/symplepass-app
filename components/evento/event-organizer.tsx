import { Trophy, Mail, Globe, ChevronRight, MapPin, Calendar } from 'lucide-react'
import type { EventOrganizer } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventOrganizerProps {
  organizer: EventOrganizer | null
}

export default function EventOrganizer({ organizer }: EventOrganizerProps) {
  if (!organizer) {
    return (
      <section id="organizador" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Organizador</h2>
          <p className="text-neutral-600">
            O organizador ainda não configurou suas informações públicas.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="organizador" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Organizador</h2>

        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-20 relative">
            {/* Logo positioned at bottom */}
            <div className="absolute -bottom-10 left-6">
              <div className="h-20 w-20 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {organizer.logo_url ? (
                  <img
                    src={organizer.logo_url}
                    alt={organizer.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-orange-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-14 pb-6 px-6">
            {/* Name and CNPJ */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold font-geist text-neutral-900">
                {organizer.company_name}
              </h3>
              {organizer.cnpj && (
                <p className="text-sm text-neutral-500 mt-1">
                  CNPJ: {organizer.cnpj}
                </p>
              )}
            </div>

            {/* Description */}
            {organizer.description && (
              <div className="mb-6">
                <p className="text-neutral-600 leading-relaxed">
                  {organizer.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {organizer.contact_email && (
                <a
                  href={`mailto:${organizer.contact_email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                >
                  <Mail className="h-4 w-4 text-orange-500" />
                  Entrar em contato
                </a>
              )}
              {organizer.website && (
                <a
                  href={organizer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                >
                  <Globe className="h-4 w-4 text-orange-500" />
                  Visitar site
                  <ChevronRight className="h-3 w-3 text-neutral-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
