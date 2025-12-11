import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPhotoOrderByIdWithDetails, updatePhotoOrderPaymentStatus } from '@/lib/data/photo-orders'
import { stripe } from '@/lib/stripe/client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PhotoDownloadClient } from './download-client'
import type { PhotoDownloadPageData } from '@/types'

export const metadata: Metadata = {
  title: 'Download de fotos - Symplepass',
  description: 'Faça o download das suas fotos compradas.',
}

export const revalidate = 0

interface PhotoDownloadPageProps {
  params: { orderId: string }
}

export default async function PhotoDownloadPage({ params }: PhotoDownloadPageProps) {
  const { orderId } = params

  if (!orderId) {
    notFound()
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch order with all details
  const { data: orderData, error } = await getPhotoOrderByIdWithDetails(orderId)

  if (error || !orderData) {
    notFound()
  }

  // Validate payment status - only allow download if paid
  // If payment is pending but we have a stripe_session_id, verify payment status with Stripe
  // This handles the case where webhook hasn't arrived yet (common in local dev)
  let paymentStatus = orderData.payment_status

  if (paymentStatus !== 'paid' && orderData.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(orderData.stripe_session_id)

      if (session.payment_status === 'paid') {
        // Update order status in database
        await updatePhotoOrderPaymentStatus(
          orderData.id,
          'confirmed',
          'paid',
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id
        )
        paymentStatus = 'paid'
        console.log('[PhotoDownload] Payment verified via Stripe API for order:', orderData.id)
      }
    } catch (stripeError) {
      console.error('[PhotoDownload] Error verifying payment with Stripe:', stripeError)
    }
  }

  if (paymentStatus !== 'paid') {
    redirect(`/fotos/checkout?eventId=${orderData.event_id}`)
  }

  // SECURITY: Verify user owns this order or has privileged access
  if (user) {
    const isOwner = orderData.user_id === user.id

    let hasPrivilegedAccess = false
    if (!isOwner) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        hasPrivilegedAccess = true
      } else if (profile?.role === 'organizer') {
        // Check if organizer owns this event
        const { data: event } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', orderData.event_id)
          .single()

        hasPrivilegedAccess = event?.organizer_id === user.id
      }
    }

    if (!isOwner && !hasPrivilegedAccess) {
      redirect('/conta')
    }
  } else {
    // Non-authenticated users cannot access download page
    redirect('/auth/login?redirect=' + encodeURIComponent(`/fotos/download/${orderId}`))
  }

  // Build thumbnail URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  // Safe fallback values for user data
  const fallbackUserId = orderData.user?.id ?? user?.id ?? ''
  const fallbackEmail = orderData.user?.email ?? user?.email ?? ''

  // Validate we have at least some user identification
  if (!fallbackUserId) {
    console.error('No user identification available for order:', orderId)
    notFound()
  }

  // Prepare page data for client component
  const pageData: PhotoDownloadPageData = {
    order: {
      id: orderData.id,
      total_amount: Number(orderData.total_amount),
      payment_status: orderData.payment_status,
      created_at: orderData.created_at,
      package: orderData.package || null,
    },
    event: {
      id: orderData.event?.id || '',
      title: orderData.event?.title || 'Evento',
      slug: orderData.event?.slug || '',
      start_date: orderData.event?.start_date || '',
      location: orderData.event?.location || null,
    },
    photos: (orderData.items || [])
      .filter((item) => item.photo)
      .map((item) => ({
        id: item.photo!.id,
        file_name: item.photo!.file_name,
        original_path: item.photo!.original_path,
        thumbnail_path: item.photo!.thumbnail_path,
        thumbnailUrl: supabaseUrl
          ? `${supabaseUrl}/storage/v1/object/public/event-photos-watermarked/${item.photo!.thumbnail_path}`
          : '',
      })),
    user: {
      id: fallbackUserId,
      email: fallbackEmail,
      full_name: orderData.user?.full_name || null,
    },
  }

  const photoCount = pageData.photos.length

  // Handle edge case where order has no photos
  if (photoCount === 0) {
    console.warn('Order has no photos:', orderId)
  }

  return (
    <>
      {/* Hero with transparent header */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500">
        <Header variant="transparent" />
        <div className="container mx-auto px-4 pb-32 pt-8 text-center text-white">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Suas fotos estão prontas!</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Faça o download das {photoCount} {photoCount === 1 ? 'foto' : 'fotos'} do evento{' '}
            <strong>{pageData.event.title}</strong>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold tracking-wide text-white backdrop-blur-sm">
              Pedido #{orderId.slice(0, 8).toUpperCase()}
            </span>
            <span className="rounded-full bg-white/20 px-4 py-2 text-sm tracking-wide text-white/90 backdrop-blur-sm">
              {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
            </span>
          </div>
        </div>
      </div>
      <main className="-mt-16 bg-neutral-50 pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <PhotoDownloadClient data={pageData} />
        </div>
      </main>
      <Footer variant="light" />
    </>
  )
}
