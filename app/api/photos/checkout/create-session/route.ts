import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/env'
import { createPhotoOrder, updatePhotoOrderStripeSession } from '@/lib/data/photo-orders'
import { getBestPackageForQuantity, calculatePriceForQuantity } from '@/lib/photos/photo-utils'
import type { PhotoCheckoutRequest, PhotoPricingTier, PhotoPackage } from '@/types'

export const runtime = 'nodejs'

const PRICE_TOLERANCE = 0.01

export async function POST(request: Request) {
  console.log('[Photo Checkout] Starting checkout session creation...')
  try {
    const body = (await request.json()) as PhotoCheckoutRequest
    const { eventId, photoIds, totalAmount, packageId } = body || {}
    console.log('[Photo Checkout] Request body:', { eventId, photoCount: photoIds?.length, totalAmount, packageId })

    // Validate required fields
    if (!eventId || !photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'Dados obrigatórios ausentes. Verifique o evento e as fotos selecionadas.' },
        { status: 400 }
      )
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor total inválido.' },
        { status: 400 }
      )
    }

    if (photoIds.length > 50) {
      return NextResponse.json(
        { error: 'Limite de 50 fotos por pedido excedido.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Validate authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para comprar fotos.' },
        { status: 401 }
      )
    }

    // Validate event exists and is completed
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug, status')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Event not found:', eventError)
      return NextResponse.json(
        { error: 'Evento não encontrado.' },
        { status: 404 }
      )
    }

    if (event.status !== 'completed') {
      return NextResponse.json(
        { error: 'As fotos deste evento não estão disponíveis para compra.' },
        { status: 400 }
      )
    }

    // Validate all photos exist and belong to the event
    const { data: photos, error: photosError } = await supabase
      .from('event_photos')
      .select('id, event_id, file_name')
      .in('id', photoIds)

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return NextResponse.json(
        { error: 'Erro ao validar fotos selecionadas.' },
        { status: 500 }
      )
    }

    if (!photos || photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: 'Uma ou mais fotos selecionadas não foram encontradas.' },
        { status: 404 }
      )
    }

    const invalidPhotos = photos.filter((p) => p.event_id !== eventId)
    if (invalidPhotos.length > 0) {
      return NextResponse.json(
        { error: 'Uma ou mais fotos não pertencem a este evento.' },
        { status: 400 }
      )
    }

    // Fetch pricing tiers and packages in parallel
    console.log('[Photo Checkout] Fetching pricing tiers and packages for event:', eventId)
    const [tiersResult, packagesResult] = await Promise.all([
      supabase
        .from('photo_pricing_tiers')
        .select('id, min_quantity, price_per_photo')
        .eq('event_id', eventId)
        .order('min_quantity', { ascending: true }),
      supabase
        .from('photo_packages')
        .select('id, name, quantity, price')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true }),
    ])

    console.log('[Photo Checkout] Tiers result:', tiersResult.error ? tiersResult.error : tiersResult.data?.length)
    console.log('[Photo Checkout] Packages result:', packagesResult.error ? packagesResult.error : packagesResult.data?.length)

    const pricingTiers = (tiersResult.data || []) as PhotoPricingTier[]
    const packagesData = (packagesResult.data || []) as PhotoPackage[]
    const hasPricingTiers = pricingTiers.length > 0

    // Recalculate price server-side using the appropriate pricing model
    let serverTotalPrice: number
    let serverAppliedTierId: string | null = null
    let serverPricePerPhoto: number | null = null
    let serverPackageId: string | null = null

    if (hasPricingTiers) {
      // Use progressive pricing tiers
      const pricingResult = calculatePriceForQuantity(pricingTiers, photoIds.length)
      serverTotalPrice = pricingResult.totalPrice
      serverAppliedTierId = pricingResult.tier?.id || null
      serverPricePerPhoto = pricingResult.pricePerPhoto
    } else {
      // Fallback to legacy package-based pricing
      const { package: serverBestPackage, totalPrice } = getBestPackageForQuantity(
        packagesData as any,
        photoIds.length
      )
      serverTotalPrice = totalPrice
      serverPackageId = serverBestPackage?.id || null
    }

    // Validate price matches (with tolerance for floating point)
    if (Math.abs(totalAmount - serverTotalPrice) > PRICE_TOLERANCE) {
      console.error('Price mismatch:', {
        clientPrice: totalAmount,
        serverPrice: serverTotalPrice,
        hasPricingTiers,
        photoCount: photoIds.length
      })
      return NextResponse.json(
        { error: 'Os valores informados não conferem. Recarregue a página e tente novamente.' },
        { status: 400 }
      )
    }

    // Validate packageId if provided (legacy support)
    if (packageId && serverPackageId && serverPackageId !== packageId) {
      console.warn('Package ID mismatch, using server-calculated package')
    }

    const finalPackageId = serverPackageId

    // Create pending order with pricing tier info
    console.log('[Photo Checkout] Creating order with:', {
      userId: user.id,
      eventId,
      photoCount: photoIds.length,
      serverTotalPrice,
      appliedTierId: serverAppliedTierId,
      pricePerPhoto: serverPricePerPhoto
    })
    const orderResult = await createPhotoOrder({
      userId: user.id,
      eventId,
      photoIds,
      totalAmount: serverTotalPrice,
      packageId: finalPackageId,
      appliedTierId: serverAppliedTierId,
      pricePerPhotoApplied: serverPricePerPhoto,
      supabaseClient: supabase,
    })

    if (!orderResult.data || orderResult.error) {
      console.error('[Photo Checkout] Error creating photo order:', orderResult.error)
      return NextResponse.json(
        { error: orderResult.error || 'Não foi possível criar seu pedido. Tente novamente.' },
        { status: 500 }
      )
    }

    const env = getEnv()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      payment_intent_data: {
        metadata: {
          orderId: orderResult.data.id,
          type: 'photo_order',
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(serverTotalPrice * 100),
            product_data: {
              name: `Fotos - ${event.title}`,
              description: `${photoIds.length} ${photoIds.length === 1 ? 'foto' : 'fotos'} do evento`,
            },
          },
        },
      ],
      metadata: {
        orderId: orderResult.data.id,
        eventId: event.id,
        userId: user.id,
        photoIds: JSON.stringify(photoIds),
        packageId: finalPackageId || '',
        appliedTierId: serverAppliedTierId || '',
        pricePerPhoto: serverPricePerPhoto?.toString() || '',
        type: 'photo_order',
      },
      success_url: `${env.app.baseUrl}/fotos/download/${orderResult.data.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.app.baseUrl}/eventos/${event.slug}#fotos`,
    })

    if (!session.url) {
      console.error('Stripe session created without URL')
      return NextResponse.json(
        { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
        { status: 500 }
      )
    }

    // Update order with Stripe session ID
    await updatePhotoOrderStripeSession(orderResult.data.id, session.id, supabase)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: orderResult.data.id,
    })
  } catch (error) {
    console.error('[Photo Checkout] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Photo Checkout] Error details:', errorMessage)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout. Tente novamente.' },
      { status: 500 }
    )
  }
}
