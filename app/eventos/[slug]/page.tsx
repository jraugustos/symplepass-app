import { notFound } from 'next/navigation'
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

  const minPrice = getEventMinPriceFromCategories(eventDetail.categories)

  const kitPickupInfo = eventDetail.kit_pickup_info
    ? {
        dates: eventDetail.kit_pickup_info.dates || '',
        hours: eventDetail.kit_pickup_info.hours || '',
        location: eventDetail.kit_pickup_info.location || '',
        notes: eventDetail.kit_pickup_info.notes || '',
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
