import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, PhotoOrder, PhotoOrderItem } from '@/types/database.types'

type PhotoOrderResult<T> = {
  data: T | null
  error: string | null
}

type SupabaseServerClient = SupabaseClient<Database>

function getClient(providedClient?: SupabaseServerClient) {
  return providedClient ?? createClient()
}

export interface PhotoOrderWithDetails extends PhotoOrder {
  event?: {
    id: string
    title: string
    slug: string
    banner_url: string | null
    start_date: string
    location: { city: string; state: string } | null
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
  package?: {
    id: string
    name: string
    quantity: number
    price: number
  } | null
  items?: Array<{
    id: string
    photo_id: string
    photo?: {
      id: string
      file_name: string
      original_path: string
      watermarked_path: string
      thumbnail_path: string
    }
  }>
}

/**
 * Creates a pending photo order with order items in a single operation.
 * @returns Created order or error description
 */
export async function createPhotoOrder(
  userId: string,
  eventId: string,
  photoIds: string[],
  totalAmount: number,
  packageId?: string | null,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrder>> {
  try {
    const supabase = getClient(supabaseClient)

    // Validate that all photos belong to the event
    const { data: photos, error: photosError } = await supabase
      .from('event_photos')
      .select('id, event_id')
      .in('id', photoIds)

    if (photosError) {
      console.error('Error validating photos:', photosError)
      return { data: null, error: 'Erro ao validar fotos selecionadas.' }
    }

    if (!photos || photos.length !== photoIds.length) {
      return { data: null, error: 'Uma ou mais fotos selecionadas não foram encontradas.' }
    }

    const invalidPhotos = photos.filter((p) => p.event_id !== eventId)
    if (invalidPhotos.length > 0) {
      return { data: null, error: 'Uma ou mais fotos não pertencem a este evento.' }
    }

    // Check for existing pending order for same user/event
    const { data: existingOrder, error: existingError } = await supabase
      .from('photo_orders')
      .select('id, status')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing order:', existingError)
      return { data: null, error: existingError.message }
    }

    // If pending order exists, delete it and its items to allow new order
    if (existingOrder) {
      await supabase.from('photo_order_items').delete().eq('order_id', existingOrder.id)
      await supabase.from('photo_orders').delete().eq('id', existingOrder.id)
    }

    // Create new order
    const { data: order, error: orderError } = await supabase
      .from('photo_orders')
      .insert({
        user_id: userId,
        event_id: eventId,
        status: 'pending',
        payment_status: 'pending',
        total_amount: totalAmount,
        package_id: packageId || null,
      })
      .select('*')
      .single()

    if (orderError || !order) {
      console.error('Error creating photo order:', orderError)
      return { data: null, error: orderError?.message || 'Erro ao criar pedido.' }
    }

    // Create order items
    const orderItems = photoIds.map((photoId) => ({
      order_id: order.id,
      photo_id: photoId,
    }))

    const { error: itemsError } = await supabase.from('photo_order_items').insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback: delete the order if items failed
      await supabase.from('photo_orders').delete().eq('id', order.id)
      return { data: null, error: 'Erro ao adicionar fotos ao pedido.' }
    }

    return { data: order, error: null }
  } catch (error) {
    console.error('Unexpected error creating photo order:', error)
    return { data: null, error: 'Não foi possível criar o pedido.' }
  }
}

/**
 * Updates the Stripe session ID for an existing photo order.
 * @returns Updated order or error description
 */
export async function updatePhotoOrderStripeSession(
  orderId: string,
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrder>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .update({
        stripe_session_id: stripeSessionId,
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating photo order Stripe session:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating photo order Stripe session:', error)
    return { data: null, error: 'Não foi possível atualizar o pedido.' }
  }
}

/**
 * Retrieves a photo order by its Stripe session ID.
 * @returns Order linked to session or null if not found
 */
export async function getPhotoOrderByStripeSession(
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrder>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching photo order by Stripe session:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching photo order by Stripe session:', error)
    return { data: null, error: 'Não foi possível buscar o pedido.' }
  }
}

/**
 * Retrieves a photo order by its Stripe payment intent ID.
 * @returns Order linked to payment intent or null if not found
 */
export async function getPhotoOrderByPaymentIntent(
  paymentIntentId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrder>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching photo order by payment intent:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error fetching photo order by payment intent:', error)
    return { data: null, error: 'Não foi possível buscar o pedido.' }
  }
}

/**
 * Updates photo order payment and status fields (e.g. after webhook confirmation).
 * Uses admin client to bypass RLS since webhooks don't have user context.
 * @returns Updated order or error description
 */
export async function updatePhotoOrderPaymentStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'cancelled',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  stripePaymentIntentId?: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrder>> {
  try {
    // Use admin client to bypass RLS - webhooks don't have user authentication context
    const supabase = supabaseClient ?? createAdminClient()

    const { data, error } = await (supabase
      .from('photo_orders') as any)
      .update({
        status,
        payment_status: paymentStatus,
        stripe_payment_intent_id: stripePaymentIntentId || null,
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating photo order payment status:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error updating photo order payment status:', error)
    return { data: null, error: 'Não foi possível atualizar o pedido.' }
  }
}

/**
 * Get photo order by ID with all details (event, user, package, items with photos)
 */
export async function getPhotoOrderByIdWithDetails(
  orderId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrderWithDetails>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .select(
        `
        *,
        event:events(id, title, slug, banner_url, start_date, location),
        user:profiles(id, full_name, email),
        package:photo_packages(id, name, quantity, price),
        items:photo_order_items(
          id,
          photo_id,
          photo:event_photos(id, file_name, original_path, watermarked_path, thumbnail_path)
        )
      `
      )
      .eq('id', orderId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching photo order by ID with details:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PhotoOrderWithDetails | null, error: null }
  } catch (error) {
    console.error('Unexpected error fetching photo order by ID with details:', error)
    return { data: null, error: 'Não foi possível buscar o pedido.' }
  }
}

/**
 * Get photo order by Stripe session with all details
 */
export async function getPhotoOrderByStripeSessionWithDetails(
  stripeSessionId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrderWithDetails>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .select(
        `
        *,
        event:events(id, title, slug, banner_url, start_date, location),
        user:profiles(id, full_name, email),
        package:photo_packages(id, name, quantity, price),
        items:photo_order_items(
          id,
          photo_id,
          photo:event_photos(id, file_name, original_path, watermarked_path, thumbnail_path)
        )
      `
      )
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching photo order with details:', error)
      return { data: null, error: error.message }
    }

    return { data: data as PhotoOrderWithDetails | null, error: null }
  } catch (error) {
    console.error('Unexpected error fetching photo order with details:', error)
    return { data: null, error: 'Não foi possível buscar o pedido.' }
  }
}

/**
 * Lists photo orders for a user with event and package details.
 * @returns Array of orders with related data or error description
 */
export async function getUserPhotoOrders(
  userId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrderWithDetails[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_orders')
      .select(
        `
        *,
        event:events(id, title, slug, banner_url, start_date, location),
        package:photo_packages(id, name, quantity, price),
        items:photo_order_items(
          id,
          photo_id,
          photo:event_photos(id, file_name, thumbnail_path)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user photo orders:', error)
      return { data: null, error: error.message }
    }

    return { data: (data as PhotoOrderWithDetails[]) || [], error: null }
  } catch (error) {
    console.error('Unexpected error fetching user photo orders:', error)
    return { data: null, error: 'Não foi possível buscar os pedidos.' }
  }
}

/**
 * Get order items (photos) for a specific order
 */
export async function getPhotoOrderItems(
  orderId: string,
  supabaseClient?: SupabaseServerClient
): Promise<PhotoOrderResult<PhotoOrderItem[]>> {
  try {
    const supabase = getClient(supabaseClient)

    const { data, error } = await supabase
      .from('photo_order_items')
      .select('*')
      .eq('order_id', orderId)

    if (error) {
      console.error('Error fetching photo order items:', error)
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Unexpected error fetching photo order items:', error)
    return { data: null, error: 'Não foi possível buscar os itens do pedido.' }
  }
}
