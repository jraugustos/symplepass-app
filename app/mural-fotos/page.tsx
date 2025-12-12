import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  MuralHero,
  PhotoEventsGrid,
  MuralEmptyState,
  PhotoPurchaseSteps,
} from '@/components/mural-fotos'
import { LoadMoreButton } from '@/components/eventos'
import {
  getCompletedEventsWithPhotos,
  getEventPhotoPreview,
  getMuralFotosStats,
} from '@/lib/data/events'

export const metadata: Metadata = {
  title: 'Mural de Fotos - Reviva os Melhores Momentos | Symplepass',
  description:
    'Veja e adquira fotos dos eventos encerrados. Reviva os melhores momentos das suas competições!',
  openGraph: {
    title: 'Mural de Fotos | Symplepass',
    description: 'Reviva os melhores momentos dos eventos. Encontre e adquira suas fotos favoritas.',
  },
}

export const revalidate = 1800 // Revalidate every 30 minutes

interface MuralFotosPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function MuralFotosPage({ searchParams }: MuralFotosPageProps) {
  // Validate and sanitize page parameter to avoid NaN or invalid values
  const rawPage = Number(searchParams.page)
  const page = !rawPage || rawPage < 1 || !Number.isFinite(rawPage) ? 1 : Math.floor(rawPage)
  const pageSize = 12

  // Fetch events and stats in parallel
  const [eventsData, stats] = await Promise.all([
    getCompletedEventsWithPhotos(page, pageSize),
    getMuralFotosStats(),
  ])

  // Fetch preview thumbnails for each event
  const eventsWithPreviews = await Promise.all(
    eventsData.events.map(async (event) => {
      const previews = await getEventPhotoPreview(event.id)
      return {
        ...event,
        preview_thumbnails: previews,
      }
    })
  )

  const { total, hasMore } = eventsData

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header variant="transparent" className="absolute top-0 left-0 right-0 z-50 border-b-0" />
      <MuralHero stats={stats} />
      <PhotoPurchaseSteps />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-8">
          {eventsWithPreviews.length > 0 ? (
            <>
              <PhotoEventsGrid events={eventsWithPreviews} />

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <LoadMoreButton
                    currentPage={page}
                    hasMore={hasMore}
                    totalEvents={total}
                    currentCount={eventsWithPreviews.length}
                  />
                </div>
              )}
            </>
          ) : (
            <MuralEmptyState />
          )}
        </section>
      </main>

      <Footer variant="light" />
    </div>
  )
}
