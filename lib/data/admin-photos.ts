import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { EventPhoto, PhotoPackage, PhotoOrder } from '@/types/database.types'

/**
 * Interface for creating a new photo record
 */
export interface CreatePhotoData {
  event_id: string
  original_path: string
  watermarked_path: string
  thumbnail_path: string
  file_name: string
  file_size: number
  width: number | null
  height: number | null
}

/**
 * Interface for creating a new photo package
 */
export interface CreatePhotoPackageData {
  event_id: string
  name: string
  quantity: number
  price: number
}

/**
 * Admin photo order with related data (distinct from user-facing PhotoOrderWithDetails in photo-orders.ts)
 */
export interface AdminPhotoOrderWithDetails extends PhotoOrder {
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  events?: {
    id: string
    title: string
    slug: string
  }
  photo_order_items?: Array<{
    id: string
    photo_id: string
    event_photos?: EventPhoto
  }>
  photo_packages?: PhotoPackage | null
}

/**
 * Filters for photo orders queries
 */
export interface PhotoOrderFilters {
  event_id?: string
  organizer_id?: string
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  search?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

/**
 * Export data format for photo orders CSV
 */
export interface PhotoOrderExportData {
  codigo_pedido: string
  evento: string
  cliente_nome: string
  cliente_email: string
  pacote: string
  quantidade_fotos: number
  valor_total: string
  status_pagamento: string
  data_pedido: string
}

/**
 * Paginated result for photo orders
 */
export interface PaginatedPhotoOrdersResult {
  orders: AdminPhotoOrderWithDetails[]
  total: number
  page: number
  pageSize: number
}

/**
 * Get all photos for an event
 * @param eventId - The event ID
 * @returns Array of event photos ordered by display_order
 */
export async function getPhotosByEventId(eventId: string): Promise<EventPhoto[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching photos:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPhotosByEventId:', error)
    return []
  }
}

/**
 * Get all photo packages for an event
 * @param eventId - The event ID
 * @returns Array of photo packages ordered by display_order
 */
export async function getPhotoPackagesByEventId(eventId: string): Promise<PhotoPackage[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photo_packages')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching photo packages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPhotoPackagesByEventId:', error)
    return []
  }
}

/**
 * Get all photo orders for an event
 * @param eventId - The event ID
 * @returns Array of photo orders with user and items details
 */
export async function getPhotoOrdersByEventId(eventId: string): Promise<AdminPhotoOrderWithDetails[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photo_orders')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        photo_order_items (
          id,
          photo_id,
          event_photos (*)
        ),
        photo_packages (*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photo orders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPhotoOrdersByEventId:', error)
    return []
  }
}

/**
 * Create a new photo record
 * @param photoData - Photo data
 * @returns Created photo or error
 */
export async function createPhoto(photoData: CreatePhotoData) {
  try {
    const supabase = await createClient()

    // Get the next display_order for this event
    const { data: existingPhotos } = await supabase
      .from('event_photos')
      .select('display_order')
      .eq('event_id', photoData.event_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextDisplayOrder = existingPhotos && existingPhotos.length > 0
      ? (existingPhotos[0].display_order || 0) + 1
      : 0

    const { data, error } = await supabase
      .from('event_photos')
      .insert({
        ...photoData,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating photo:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createPhoto:', error)
    return { data: null, error: 'Failed to create photo' }
  }
}

/**
 * Delete a photo
 * @param photoId - Photo ID (database record ID)
 * @returns Success with original_path for storage deletion, or error
 */
export async function deletePhoto(photoId: string) {
  try {
    const supabase = await createClient()

    // First, get the photo to retrieve the original_path
    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('id, original_path')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      console.error('Error fetching photo:', fetchError)
      return { data: null, error: 'Photo not found' }
    }

    // Check if photo is in any paid orders
    const { data: orderItems, error: checkError } = await supabase
      .from('photo_order_items')
      .select(`
        id,
        photo_orders!inner (
          payment_status
        )
      `)
      .eq('photo_id', photoId)

    if (checkError) {
      console.error('Error checking order items:', checkError)
      return { data: null, error: 'Failed to check order items' }
    }

    const hasPaidOrders = orderItems?.some(
      (item: any) => item.photo_orders?.payment_status === 'paid'
    )

    if (hasPaidOrders) {
      return {
        data: null,
        error: 'Não é possível deletar uma foto que está em pedidos pagos',
      }
    }

    const { error } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', photoId)

    if (error) {
      console.error('Error deleting photo:', error)
      return { data: null, error: error.message }
    }

    // Return original_path so the API can delete storage files
    return { data: { original_path: photo.original_path }, error: null }
  } catch (error) {
    console.error('Error in deletePhoto:', error)
    return { data: null, error: 'Failed to delete photo' }
  }
}

/**
 * Reorder photos by updating their display_order
 * @param items - Array of photo IDs with their new display_order
 * @returns Success or error
 */
export async function reorderPhotos(items: { id: string; display_order: number }[]) {
  try {
    const supabase = await createClient()

    // Update all items in parallel
    const updates = items.map((item) =>
      supabase
        .from('event_photos')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    if (errors.length > 0) {
      return { error: errors.join(', ') }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in reorderPhotos:', error)
    return { error: 'Failed to reorder photos' }
  }
}

/**
 * Create a new photo package
 * @param packageData - Package data
 * @returns Created package or error
 */
export async function createPhotoPackage(packageData: CreatePhotoPackageData) {
  try {
    const supabase = await createClient()

    // Validate data
    if (packageData.quantity <= 0) {
      return { data: null, error: 'Quantity must be greater than 0' }
    }

    if (packageData.price < 0) {
      return { data: null, error: 'Price must be greater than or equal to 0' }
    }

    // Get the next display_order for this event
    const { data: existingPackages } = await supabase
      .from('photo_packages')
      .select('display_order')
      .eq('event_id', packageData.event_id)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextDisplayOrder = existingPackages && existingPackages.length > 0
      ? (existingPackages[0].display_order || 0) + 1
      : 0

    const { data, error } = await supabase
      .from('photo_packages')
      .insert({
        ...packageData,
        display_order: nextDisplayOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating photo package:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createPhotoPackage:', error)
    return { data: null, error: 'Failed to create photo package' }
  }
}

/**
 * Update an existing photo package
 * @param packageId - Package ID
 * @param packageData - Updated package data
 * @param eventId - Event ID to verify package belongs to event
 * @returns Updated package or error
 */
export async function updatePhotoPackage(
  packageId: string,
  packageData: Partial<CreatePhotoPackageData>,
  eventId: string
) {
  try {
    const supabase = await createClient()

    // Verify package belongs to event
    const { data: existing } = await supabase
      .from('photo_packages')
      .select('event_id')
      .eq('id', packageId)
      .single()

    if (!existing || existing.event_id !== eventId) {
      return { data: null, error: 'Package not found or does not belong to this event' }
    }

    // Validate data
    if (packageData.quantity !== undefined && packageData.quantity <= 0) {
      return { data: null, error: 'Quantity must be greater than 0' }
    }

    if (packageData.price !== undefined && packageData.price < 0) {
      return { data: null, error: 'Price must be greater than or equal to 0' }
    }

    const { data, error } = await supabase
      .from('photo_packages')
      .update(packageData)
      .eq('id', packageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating photo package:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updatePhotoPackage:', error)
    return { data: null, error: 'Failed to update photo package' }
  }
}

/**
 * Delete a photo package
 * @param packageId - Package ID
 * @returns Success or error
 */
export async function deletePhotoPackage(packageId: string) {
  try {
    const supabase = await createClient()

    // Check if package is used in any paid orders
    const { data: orders, error: checkError } = await supabase
      .from('photo_orders')
      .select('id')
      .eq('package_id', packageId)
      .eq('payment_status', 'paid')
      .limit(1)

    if (checkError) {
      console.error('Error checking orders:', checkError)
      return { data: null, error: 'Failed to check orders' }
    }

    if (orders && orders.length > 0) {
      return {
        data: null,
        error: 'Não é possível deletar um pacote que foi usado em pedidos pagos',
      }
    }

    const { error } = await supabase
      .from('photo_packages')
      .delete()
      .eq('id', packageId)

    if (error) {
      console.error('Error deleting photo package:', error)
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (error) {
    console.error('Error in deletePhotoPackage:', error)
    return { data: null, error: 'Failed to delete photo package' }
  }
}

/**
 * Reorder photo packages by updating their display_order
 * @param items - Array of package IDs with their new display_order
 * @returns Success or error
 */
export async function reorderPhotoPackages(items: { id: string; display_order: number }[]) {
  try {
    const supabase = await createClient()

    // Update all items in parallel
    const updates = items.map((item) =>
      supabase
        .from('photo_packages')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error?.message)

    if (errors.length > 0) {
      return { error: errors.join(', ') }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in reorderPhotoPackages:', error)
    return { error: 'Failed to reorder photo packages' }
  }
}

/**
 * Get photo order statistics for an event
 * @param eventId - The event ID
 * @returns Statistics about photo orders with clear naming for paid vs total
 */
export async function getPhotoOrderStats(eventId: string) {
  try {
    const supabase = await createClient()

    const { data: orders, error } = await supabase
      .from('photo_orders')
      .select('status, payment_status, total_amount')
      .eq('event_id', eventId)

    if (error) {
      console.error('Error fetching photo order stats:', error)
      return null
    }

    const stats = {
      totalOrders: orders?.length || 0,
      confirmedOrders: orders?.filter((o) => o.status === 'confirmed').length || 0,
      pendingOrders: orders?.filter((o) => o.payment_status === 'pending').length || 0,
      paidOrders: orders?.filter((o) => o.payment_status === 'paid').length || 0,
      cancelledOrders: orders?.filter((o) => o.status === 'cancelled').length || 0,
      refundedOrders: orders?.filter((o) => o.payment_status === 'refunded').length || 0,
      // Renamed for clarity: this is revenue from paid orders only
      paidRevenue: orders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    }

    return stats
  } catch (error) {
    console.error('Error in getPhotoOrderStats:', error)
    return null
  }
}

/**
 * Get photo orders with filters and pagination
 * @param eventId - The event ID
 * @param filters - Filter options (payment_status, search, dates, pagination)
 * @returns Paginated list of photo orders
 *
 * Note: When search filter is present, we fetch all matching records and apply
 * client-side filtering to ensure total count and pagination remain consistent.
 */
export async function getPhotoOrdersByEventIdWithFilters(
  eventId: string,
  filters: PhotoOrderFilters = {}
): Promise<PaginatedPhotoOrdersResult> {
  try {
    const supabase = await createClient()
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const hasSearch = filters.search && filters.search.trim()

    // Build base query - don't use count or pagination when search is present
    let query = supabase
      .from('photo_orders')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        photo_order_items (
          id,
          photo_id,
          event_photos (*)
        ),
        photo_packages (*)
      `, hasSearch ? undefined : { count: 'exact' })
      .eq('event_id', eventId)

    // Apply payment_status filter
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    // Apply date filters
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      // Add time to include the full end date
      query = query.lte('created_at', `${filters.end_date}T23:59:59.999Z`)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    // Only apply server-side pagination when no search filter
    if (!hasSearch) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching photo orders with filters:', error)
      return { orders: [], total: 0, page, pageSize }
    }

    let orders = (data as AdminPhotoOrderWithDetails[]) || []

    // Apply search filter client-side (search in name or email)
    if (hasSearch) {
      const searchLower = filters.search!.toLowerCase().trim()
      orders = orders.filter((order) => {
        const name = order.profiles?.full_name?.toLowerCase() || ''
        const email = order.profiles?.email?.toLowerCase() || ''
        return name.includes(searchLower) || email.includes(searchLower)
      })

      // When search is applied, compute total from filtered results and slice for pagination
      const total = orders.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      orders = orders.slice(from, to)

      return {
        orders,
        total,
        page,
        pageSize,
      }
    }

    return {
      orders,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error in getPhotoOrdersByEventIdWithFilters:', error)
    return { orders: [], total: 0, page: 1, pageSize: 20 }
  }
}

/**
 * Helper to translate payment status to Portuguese
 */
function translatePaymentStatus(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'pending':
      return 'Pendente'
    case 'failed':
      return 'Falhou'
    case 'refunded':
      return 'Reembolsado'
    default:
      return status
  }
}

/**
 * Export photo orders to CSV format
 * @param eventId - The event ID (optional - if not provided, exports all orders)
 * @param filters - Optional filters (without pagination)
 * @returns Array of export data objects
 */
export async function exportPhotoOrdersToCSV(
  eventId: string | null,
  filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'> = {}
): Promise<PhotoOrderExportData[]> {
  try {
    const supabase = await createClient()

    // Build base query without pagination
    let query = supabase
      .from('photo_orders')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        events (
          id,
          title,
          slug
        ),
        photo_order_items (
          id,
          photo_id
        ),
        photo_packages (name)
      `)

    // Apply event filter if provided
    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    // Apply payment_status filter
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    // Apply date filters
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('created_at', `${filters.end_date}T23:59:59.999Z`)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching photo orders for export:', error)
      return []
    }

    let orders = (data as AdminPhotoOrderWithDetails[]) || []

    // Apply search filter client-side
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim()
      orders = orders.filter((order) => {
        const name = order.profiles?.full_name?.toLowerCase() || ''
        const email = order.profiles?.email?.toLowerCase() || ''
        const eventTitle = order.events?.title?.toLowerCase() || ''
        return name.includes(searchLower) || email.includes(searchLower) || eventTitle.includes(searchLower)
      })
    }

    // Map to export format
    return orders.map((order) => ({
      codigo_pedido: order.id.slice(0, 8).toUpperCase(),
      evento: order.events?.title || 'N/A',
      cliente_nome: order.profiles?.full_name || 'N/A',
      cliente_email: order.profiles?.email || 'N/A',
      pacote: order.photo_packages?.name || 'Personalizado',
      quantidade_fotos: order.photo_order_items?.length || 0,
      valor_total: formatCurrency(order.total_amount),
      status_pagamento: translatePaymentStatus(order.payment_status),
      data_pedido: formatDate(order.created_at),
    }))
  } catch (error) {
    console.error('Error in exportPhotoOrdersToCSV:', error)
    return []
  }
}

/**
 * Get all photo orders with filters and pagination (across all events)
 * @param filters - Filter options (event_id, payment_status, search, dates, pagination)
 * @returns Paginated list of photo orders
 */
export async function getAllPhotoOrders(
  filters: PhotoOrderFilters = {}
): Promise<PaginatedPhotoOrdersResult> {
  try {
    const supabase = await createClient()
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const hasSearch = filters.search && filters.search.trim()

    // Build base query
    let query = supabase
      .from('photo_orders')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        ),
        events!inner (
          id,
          title,
          slug,
          organizer_id
        ),
        photo_order_items (
          id,
          photo_id,
          event_photos (*)
        ),
        photo_packages (*)
      `, hasSearch ? undefined : { count: 'exact' })

    // Apply event_id filter if provided
    if (filters.event_id) {
      query = query.eq('event_id', filters.event_id)
    }

    // Apply organizer_id filter if provided
    if (filters.organizer_id) {
      query = query.eq('events.organizer_id', filters.organizer_id)
    }

    // Apply payment_status filter
    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status)
    }

    // Apply date filters
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters.end_date) {
      query = query.lte('created_at', `${filters.end_date}T23:59:59.999Z`)
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    // Only apply server-side pagination when no search filter
    if (!hasSearch) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching all photo orders:', error)
      return { orders: [], total: 0, page, pageSize }
    }

    let orders = (data as AdminPhotoOrderWithDetails[]) || []

    // Apply search filter client-side (search in name, email, or event title)
    if (hasSearch) {
      const searchLower = filters.search!.toLowerCase().trim()
      orders = orders.filter((order) => {
        const name = order.profiles?.full_name?.toLowerCase() || ''
        const email = order.profiles?.email?.toLowerCase() || ''
        const eventTitle = order.events?.title?.toLowerCase() || ''
        return name.includes(searchLower) || email.includes(searchLower) || eventTitle.includes(searchLower)
      })

      // When search is applied, compute total from filtered results and slice for pagination
      const total = orders.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      orders = orders.slice(from, to)

      return {
        orders,
        total,
        page,
        pageSize,
      }
    }

    return {
      orders,
      total: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error in getAllPhotoOrders:', error)
    return { orders: [], total: 0, page: 1, pageSize: 20 }
  }
}

/**
 * Get all photo orders statistics (across all events)
 * @returns Statistics about all photo orders
 */
export async function getAllPhotoOrderStats(organizerId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('photo_orders')
      .select(`
        status, 
        payment_status, 
        total_amount,
        events!inner(organizer_id)
      `)

    if (organizerId) {
      query = query.eq('events.organizer_id', organizerId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching all photo order stats:', error)
      return null
    }

    const stats = {
      totalOrders: orders?.length || 0,
      confirmedOrders: orders?.filter((o) => o.status === 'confirmed').length || 0,
      pendingOrders: orders?.filter((o) => o.payment_status === 'pending').length || 0,
      paidOrders: orders?.filter((o) => o.payment_status === 'paid').length || 0,
      cancelledOrders: orders?.filter((o) => o.status === 'cancelled').length || 0,
      refundedOrders: orders?.filter((o) => o.payment_status === 'refunded').length || 0,
      paidRevenue: orders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    }

    return stats
  } catch (error) {
    console.error('Error in getAllPhotoOrderStats:', error)
    return null
  }
}
