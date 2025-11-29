import { Trophy, Mail, Globe } from 'lucide-react'
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

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {organizer.logo_url ? (
                  <img
                    src={organizer.logo_url}
                    alt={organizer.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="h-6 w-6 text-neutral-400" />
                )}
              </div>
              <div>
                <p className="font-medium font-geist">{organizer.company_name}</p>
                {organizer.cnpj && (
                  <p className="text-sm text-neutral-600">CNPJ: {organizer.cnpj}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {organizer.contact_email && (
                <a
                  href={`mailto:${organizer.contact_email}`}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
              {organizer.website && (
                <a
                  href={organizer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Site
                </a>
              )}
            </div>
          </div>

          {organizer.description && (
            <p className="text-sm text-neutral-600 mt-3">{organizer.description}</p>
          )}
        </div>
      </div>
    </section>
  )
}
