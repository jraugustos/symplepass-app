import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/env'
import { createPhotoOrder, updatePhotoOrderStripeSession } from '@/lib/data/photo-orders'
import { getBestPackageForQuantity } from '@/lib/photos/photo-utils'
import type { PhotoCheckoutRequest } from '@/types'

export const runtime = 'nodejs'

const PRICE_TOLERANCE = 0.01

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PhotoCheckoutRequest
    const { eventId, photoIds, totalAmount, packageId } = body || {}

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

    // Fetch packages to validate pricing
    const { data: packages } = await supabase
      .from('photo_packages')
      .select('id, name, quantity, price')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })

    const packagesData = packages || []

    // Recalculate price server-side
    const { package: serverBestPackage, totalPrice: serverTotalPrice } = getBestPackageForQuantity(
      packagesData as any,
      photoIds.length
    )

    // Validate price matches (with tolerance for floating point)
    if (Math.abs(totalAmount - serverTotalPrice) > PRICE_TOLERANCE) {
      console.error('Price mismatch:', { clientPrice: totalAmount, serverPrice: serverTotalPrice })
      return NextResponse.json(
        { error: 'Os valores informados não conferem. Recarregue a página e tente novamente.' },
        { status: 400 }
      )
    }

    // Validate packageId if provided
    if (packageId && serverBestPackage?.id !== packageId) {
      console.warn('Package ID mismatch, using server-calculated package')
    }

    const finalPackageId = serverBestPackage?.id || null

    // Create pending order
    const orderResult = await createPhotoOrder(
      user.id,
      eventId,
      photoIds,
      serverTotalPrice,
      finalPackageId,
      supabase
    )

    if (!orderResult.data || orderResult.error) {
      console.error('Error creating photo order:', orderResult.error)
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
    console.error('Error creating photo checkout session:', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout. Tente novamente.' },
      { status: 500 }
    )
  }
}
