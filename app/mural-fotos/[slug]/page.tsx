import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import EventPhotos from '@/components/evento/event-photos'
import { getEventDetailBySlug } from '@/lib/data/events'
import { getEventPhotosData } from '@/lib/data/event-photos'
import { eventHasProcessedFaces } from '@/lib/data/face-embeddings'
import { truncateText, formatEventDate, extractLocationString } from '@/lib/utils'
import { getSportLabel } from '@/lib/constants/sports'
import { MapPin, Calendar, Activity, Images } from 'lucide-react'

interface MuralEventPageProps {
  params: { slug: string }
}

export const revalidate = 1800 // Revalidate every 30 minutes

export async function generateMetadata({ params }: MuralEventPageProps): Promise<Metadata> {
  const event = await getEventDetailBySlug(params.slug)

  if (!event || event.status !== 'completed') {
    return {
      title: 'Fotos não encontradas | Symplepass',
    }
  }

  const description = truncateText(
    `Veja e adquira as fotos do evento ${event.title}. Reviva os melhores momentos!`,
    160
  )

  return {
    title: `${event.title} - Fotos | Symplepass`,
    description,
    openGraph: {
      title: `Fotos: ${event.title}`,
      description,
      images: event.banner_url ? [event.banner_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Fotos: ${event.title}`,
      description,
      images: event.banner_url ? [event.banner_url] : [],
    },
  }
}

export default async function MuralEventPage({ params }: MuralEventPageProps) {
  // Fetch event details
  const event = await getEventDetailBySlug(params.slug)

  // Event must exist and be completed
  if (!event || event.status !== 'completed') {
    notFound()
  }

  // Fetch photos and packages
  const [photosData, faceSearchAvailable] = await Promise.all([
    getEventPhotosData(event.id),
    eventHasProcessedFaces(event.id),
  ])

  // Must have at least one photo
  if (photosData.photos.length === 0) {
    notFound()
  }

  const location = extractLocationString(event.location)
  const date = formatEventDate(event.start_date)

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header + Hero with gradient background - same as event page */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500">
        <Header variant="transparent" className="border-b-0" sticky={false} />
        <div className="border-b border-white/20" />

        {/* Hero content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-geist">
                {event.title}
              </h1>

              {/* Info Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {location && (
                  <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}

                <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                </div>

                <div className="inline-flex items-center gap-2 sm:text-sm text-xs text-white/90 font-geist bg-white/10 border-white/20 border rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                  <Activity className="h-4 w-4" />
                  <span>{getSportLabel(event.sport_type) || event.sport_type}</span>
                </div>

                <div className="inline-flex items-center gap-2 sm:text-sm text-xs font-medium font-geist bg-white text-orange-600 rounded-full pt-1.5 pr-3 pb-1.5 pl-3">
                  <Images className="h-4 w-4" />
                  <span>{photosData.photos.length} fotos disponíveis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Event banner image - same as event page */}
        <section className="pt-6 pb-6">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-neutral-200">
              <img
                src={event.banner_url || '/placeholder.jpg'}
                alt={`Arte oficial do evento ${event.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Photos section */}
        <section className="py-8">
          <EventPhotos
            eventId={event.id}
            photos={photosData.photos}
            packages={photosData.packages}
            pricingTiers={photosData.pricingTiers}
            faceSearchAvailable={faceSearchAvailable}
          />
        </section>
      </main>

      <Footer variant="light" />
    </div>
  )
}
