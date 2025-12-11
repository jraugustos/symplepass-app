import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getEventDetailBySlug, getEventMinPriceFromCategories } from '@/lib/data/events'
import { truncateText } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth/actions'
import EventPageClient from './event-page-client'

interface EventPageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export const revalidate = 3600 // 1 hour ISR

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const eventDetail = await getEventDetailBySlug(params.slug)

  if (!eventDetail) {
    return {
      title: 'Evento não encontrado | Symplepass',
    }
  }

  const description = truncateText(eventDetail.description, 160)

  return {
    title: `${eventDetail.title} | Symplepass`,
    description,
    openGraph: {
      title: eventDetail.title,
      description,
      images: eventDetail.banner_url ? [eventDetail.banner_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: eventDetail.title,
      description,
      images: eventDetail.banner_url ? [eventDetail.banner_url] : [],
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const eventDetail = await getEventDetailBySlug(params.slug)

  if (!eventDetail) {
    notFound()
  }

  // Completed events redirect to mural de fotos page
  if (eventDetail.status === 'completed') {
    redirect(`/mural-fotos/${params.slug}`)
  }

  const minPrice = getEventMinPriceFromCategories(eventDetail.categories)

  // Only create kitPickupInfo if there's at least some meaningful content
  const rawPickupInfo = eventDetail.kit_pickup_info
  const hasPickupContent = rawPickupInfo && (
    rawPickupInfo.dates?.trim() ||
    rawPickupInfo.hours?.trim() ||
    rawPickupInfo.location?.trim()
  )
  const kitPickupInfo = hasPickupContent
    ? {
        dates: rawPickupInfo.dates || '',
        hours: rawPickupInfo.hours || '',
        location: rawPickupInfo.location || '',
        notes: rawPickupInfo.notes || '',
        google_maps_url: rawPickupInfo.google_maps_url || '',
      }
    : null

  // Get user authentication data
  const userData = await getCurrentUser()
  const user = userData?.user || null
  const profile = userData?.profile || null
  const userName = user?.user_metadata?.full_name || profile?.full_name || user?.email?.split('@')[0]
  const userEmail = user?.email || profile?.email
  const userRole = profile?.role || 'user'

  return (
    <EventPageClient
      event={eventDetail}
      minPrice={minPrice}
      kitPickupInfo={kitPickupInfo}
      eventSlug={params.slug}
      isAuthenticated={!!user}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
    />
  )
}
